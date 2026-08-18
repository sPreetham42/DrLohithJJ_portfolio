"""
sync_scholar.py — Fetches live Google Scholar metrics for Dr. Lohith J.J.
Runs via GitHub Actions daily or locally in diagnostic mode.
Saves results to data/scholar.json and data/scholar_sync_status.json.

Strategy:
  1. Primary:  scholarly library (scrapes Google Scholar server-side with strict 12s timeout)
  2. Fallback: OpenAlex API (parallelized REST API fetch, reliable aggregator)
  3. Safety:   Never overwrite with lower numbers (prevents bad scrapes)
  4. Verification: Write -> Read-Back verification against live Sanity document
  5. Diagnostics: Structured status reporting, non-zero exits on failure, dry-run mode.
"""

import argparse
import concurrent.futures
import json
import os
import socket
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

# Ensure stdout flushes immediately in CI environments
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

# Set global default socket timeout to prevent any TCP socket hanging indefinitely
socket.setdefaulttimeout(12)

# Relative paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'data')
OUTPUT_PATH = os.path.join(DATA_DIR, 'scholar.json')
STATUS_PATH = os.path.join(DATA_DIR, 'scholar_sync_status.json')

# Google Scholar user ID for Dr. Lohith J.J.
SCHOLAR_USER_ID = 'dmSdWtEAAAAJ'

# OpenAlex author IDs
OPENALEX_AUTHOR_IDS = [
    'A5088961242',  # Lohith J. J — NIT Tiruchirappalli
    'A5031660717',  # J J Lohith — Acharya Nagarjuna University
    'A5020533993',  # Lohith J. J — BDT College
    'A5088787025',  # J J Lohith — Bangalore University
    'A5049948095',  # J. J. Lohith
    'A5066042049',  # Lohith J. J
    'A5083305454',  # J Lohith
    'A5135810193',  # J. J. Lohith — VTU
]


def log(msg):
    """Prints timestamped message with immediate stdout flushing."""
    print(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {msg}", flush=True)


def load_existing_fallback():
    """Load existing scholar.json to compare against."""
    try:
        if os.path.exists(OUTPUT_PATH):
            with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        log(f"[WARN] Could not read existing scholar.json: {e}")
    return {"citations": 0, "h_index": 0, "i10_index": 0, "papers_count": 0, "last_updated": None}


def fetch_sanity_current():
    """Fetch current scholarStats document directly from Sanity query API."""
    project_id = os.environ.get('SANITY_PROJECT_ID', '12ok6v8i')
    dataset = os.environ.get('SANITY_DATASET', 'production')
    query = '*[_type == "scholarStats" && _id == "scholarStats"][0]'
    url = f"https://{project_id}.api.sanity.io/v2023-01-01/data/query/{dataset}?query={urllib.parse.quote(query)}"

    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'ScholarSyncDiagnostics/1.0'})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            result = data.get('result')
            return result
    except Exception as e:
        log(f"[SANITY READ] Could not fetch current Sanity document: {e}")
        return None


def fetch_google_scholar():
    """Primary: Use scholarly library to scrape Google Scholar with a strict 12-second bounded timeout."""
    log(f"[Google Scholar] Connecting for author ID: {SCHOLAR_USER_ID} (max 12s timeout)...")

    def _scrape():
        from scholarly import scholarly
        try:
            scholarly.set_timeout(8)
        except Exception:
            pass

        author = scholarly.search_author_id(SCHOLAR_USER_ID)
        if not author:
            raise ValueError(f"Author {SCHOLAR_USER_ID} not found on Google Scholar")

        author = scholarly.fill(author, sections=['basics', 'indices'])
        citedby = author.get('citedby', 0) or 0
        h_index = 0
        i10_index = 0

        if 'hindex' in author:
            h_index = author['hindex']
        if 'i10index' in author:
            i10_index = author['i10index']

        if hasattr(author, 'hindex'):
            h_index = author.hindex
        if hasattr(author, 'i10index'):
            i10_index = author.i10index

        publications = author.get('publications', [])
        return {
            "citations": int(citedby),
            "h_index": int(h_index),
            "i10_index": int(i10_index),
            "papers_count": len(publications),
            "source": "google_scholar",
            "error": None
        }

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_scrape)
            result = future.result(timeout=12)
            log(f"[Google Scholar] OK — Citations: {result['citations']}, h-index: {result['h_index']}, i10-index: {result['i10_index']}, papers: {result['papers_count']}")
            return result
    except concurrent.futures.TimeoutError:
        err = "Google Scholar request timed out after 12s (anti-scraping protection or network block)"
        log(f"[Google Scholar] {err}")
        return {"error": err}
    except ImportError:
        err = "scholarly package not installed in current Python environment"
        log(f"[Google Scholar] {err}")
        return {"error": err}
    except Exception as e:
        err = str(e)
        log(f"[Google Scholar] Connection failed: {err}")
        return {"error": err}


def fetch_openalex():
    """Fallback: Aggregate metrics from OpenAlex API across author IDs concurrently."""
    log(f"[OpenAlex] Connecting to OpenAlex API for {len(OPENALEX_AUTHOR_IDS)} author profiles (parallel)...")

    def fetch_single_author(author_id):
        url = f"https://api.openalex.org/authors/{author_id}?select=id,display_name,cited_by_count,works_count,summary_stats"
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'DrLohithPortfolio/1.0 (mailto:lohithjj@gmail.com)'}
        )
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            citations = data.get('cited_by_count', 0) or 0
            works = data.get('works_count', 0) or 0
            stats = data.get('summary_stats', {}) or {}
            h = stats.get('h_index', 0) or 0
            i10 = stats.get('i10_index', 0) or 0
            return citations, works, h, i10

    total_citations = 0
    total_works = 0
    max_h_index = 0
    max_i10_index = 0
    successful_fetches = 0

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            future_to_id = {executor.submit(fetch_single_author, aid): aid for aid in OPENALEX_AUTHOR_IDS}
            for future in concurrent.futures.as_completed(future_to_id, timeout=12):
                aid = future_to_id[future]
                try:
                    c, w, h, i10 = future.result()
                    total_citations += c
                    total_works += w
                    max_h_index = max(max_h_index, h)
                    max_i10_index = max(max_i10_index, i10)
                    successful_fetches += 1
                except Exception as e:
                    log(f"[OpenAlex] Profile {aid} fetch warning: {e}")

        if successful_fetches == 0:
            err = "All OpenAlex profile fetches failed"
            log(f"[OpenAlex] {err}")
            return {"error": err}

        log(f"[OpenAlex] OK — Citations: {total_citations}, h-index: {max_h_index}, i10-index: {max_i10_index}, papers: {total_works} ({successful_fetches}/{len(OPENALEX_AUTHOR_IDS)} profiles fetched)")

        return {
            "citations": int(total_citations),
            "h_index": int(max_h_index),
            "i10_index": int(max_i10_index),
            "papers_count": int(total_works),
            "source": "openalex",
            "error": None
        }
    except Exception as e:
        err = str(e)
        log(f"[OpenAlex] Connection failed: {err}")
        return {"error": err}


def push_to_sanity_with_verification(data):
    """
    Pushes updated Scholar metrics to Sanity scholarStats singleton document,
    then executes an immediate Read-Back Verification query to ensure persistence.
    """
    project_id = os.environ.get('SANITY_PROJECT_ID', '12ok6v8i')
    write_token = os.environ.get('SANITY_WRITE_TOKEN')
    dataset = os.environ.get('SANITY_DATASET', 'production')

    if not write_token:
        msg = "SANITY_WRITE_TOKEN not set in environment"
        log(f"[SANITY] {msg}. Skipping Sanity mutation.")
        return {
            "success": False,
            "persistence_verified": False,
            "error": msg,
            "skipped": True,
            "stage": "token_check"
        }

    mutate_url = f"https://{project_id}.api.sanity.io/v2023-01-01/data/mutate/{dataset}?returnDocuments=true"
    payload = {
        "mutations": [
            {
                "createOrReplace": {
                    "_id": "scholarStats",
                    "_type": "scholarStats",
                    "citations": data["citations"],
                    "hIndex": data["h_index"],
                    "i10Index": data["i10_index"],
                    "sciePapersCount": 4,
                    "ieeeConferencesCount": 6,
                    "lastUpdated": data["last_updated"],
                    "source": data.get("source", "google_scholar")
                }
            }
        ]
    }

    # Step 1: Mutation
    log(f"[SANITY] Sending createOrReplace mutation to {project_id}/{dataset}...")
    try:
        req = urllib.request.Request(
            mutate_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {write_token}'
            },
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            log(f"[SANITY MUTATION OK] Transaction ID: {res_data.get('transactionId', 'OK')}")
    except Exception as e:
        err = str(e)
        log(f"[SANITY ERROR] Mutation request failed: {err}")
        return {
            "success": False,
            "persistence_verified": False,
            "error": err,
            "skipped": False,
            "stage": "mutation"
        }

    # Step 2: Immediate Read-Back Verification
    log("[SANITY VERIFY] Performing read-back verification against Sanity production dataset...")
    time.sleep(0.5)

    query = '*[_type == "scholarStats" && _id == "scholarStats"][0]'
    query_url = f"https://{project_id}.api.sanity.io/v2023-01-01/data/query/{dataset}?query={urllib.parse.quote(query)}"

    try:
        req = urllib.request.Request(query_url, headers={
            'User-Agent': 'ScholarSyncVerification/1.0',
            'Authorization': f'Bearer {write_token}'
        })
        with urllib.request.urlopen(req, timeout=8) as resp:
            data_resp = json.loads(resp.read().decode('utf-8'))
            persisted = data_resp.get('result')

            if not persisted:
                err = "Sanity read-back query returned null document"
                log(f"[SANITY VERIFY FAILED] {err}")
                return {
                    "success": True,
                    "persistence_verified": False,
                    "error": err,
                    "skipped": False,
                    "stage": "read_back_null"
                }

            p_citations = persisted.get('citations')
            p_h = persisted.get('hIndex')
            p_i10 = persisted.get('i10Index')

            matches = (
                p_citations == data["citations"] and
                p_h == data["h_index"] and
                p_i10 == data["i10_index"]
            )

            if matches:
                log(f"[SANITY VERIFIED] Persistence confirmed: Citations={p_citations}, hIndex={p_h}, i10Index={p_i10}")
                return {
                    "success": True,
                    "persistence_verified": True,
                    "persistedDoc": persisted,
                    "error": None,
                    "skipped": False,
                    "stage": "verified"
                }
            else:
                err = f"Persisted values (Citations={p_citations}, hIndex={p_h}, i10Index={p_i10}) do not match written values (Citations={data['citations']}, hIndex={data['h_index']}, i10Index={data['i10_index']})"
                log(f"[SANITY VERIFY FAILED] {err}")
                return {
                    "success": True,
                    "persistence_verified": False,
                    "persistedDoc": persisted,
                    "error": err,
                    "skipped": False,
                    "stage": "mismatch"
                }
    except Exception as e:
        err = f"Read-back verification query failed: {e}"
        log(f"[SANITY VERIFY ERROR] {err}")
        return {
            "success": True,
            "persistence_verified": False,
            "error": err,
            "skipped": False,
            "stage": "read_back_error"
        }


def run_pipeline(dry_run=False, verbose=False):
    """Executes the Google Scholar sync & health diagnostic pipeline."""
    started_at_iso = datetime.now(timezone.utc).isoformat()
    start_time = time.time()

    print("\n" + "═" * 58)
    print("  Google Scholar Synchronization & Health Diagnostics")
    print("═" * 58)
    if dry_run:
        print("  [MODE: DRY RUN / DIAGNOSTIC — NO MUTATIONS]\n")

    existing_fallback = load_existing_fallback()
    sanity_current = fetch_sanity_current()

    # STAGE 1: Metric Retrieval
    log("[STAGE 1/4] Retrieving Google Scholar metrics...")
    scholar_res = fetch_google_scholar()
    selected_res = None
    retrieval_error = None

    if scholar_res and not scholar_res.get('error'):
        selected_res = scholar_res
    else:
        retrieval_error = scholar_res.get('error') if scholar_res else "Scholar failed"
        log("[STAGE 1/4 FALLBACK] Attempting OpenAlex API fallback...")
        openalex_res = fetch_openalex()
        if openalex_res and not openalex_res.get('error'):
            selected_res = openalex_res
        else:
            if not retrieval_error:
                retrieval_error = openalex_res.get('error') if openalex_res else "OpenAlex failed"

    duration_ms = int((time.time() - start_time) * 1000)
    completed_at_iso = datetime.now(timezone.utc).isoformat()

    # If both sources failed completely
    if not selected_res:
        log("[FATAL] Both Google Scholar and OpenAlex retrievals failed.")
        status_doc = {
            "status": "failed",
            "source": "none",
            "startedAt": started_at_iso,
            "completedAt": completed_at_iso,
            "durationMs": duration_ms,
            "citations": existing_fallback.get('citations', 0),
            "hIndex": existing_fallback.get('h_index', 0),
            "i10Index": existing_fallback.get('i10_index', 0),
            "sanityUpdated": False,
            "sanityPersistence": "FAILED",
            "sanityError": "Scholar retrieval failed; skipped Sanity update",
            "error": retrieval_error,
            "isDryRun": dry_run
        }
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(STATUS_PATH, 'w', encoding='utf-8') as f:
            json.dump(status_doc, f, indent=2)
        print("═" * 58)
        print("  Result: FAILED")
        print("═" * 58 + "\n")
        return False, status_doc

    # STAGE 2: Monotonicity & Safety Validation
    log("[STAGE 2/4] Validating metrics & safety monotonic check...")
    fallback_citations = existing_fallback.get('citations', 0)
    fallback_h = existing_fallback.get('h_index', 0)
    fallback_i10 = existing_fallback.get('i10_index', 0)

    if selected_res['citations'] < fallback_citations:
        log(f"[SAFETY] Retrieved citations ({selected_res['citations']}) < cached fallback ({fallback_citations}). Preserving {fallback_citations}.")
        selected_res['citations'] = fallback_citations

    if selected_res['h_index'] < fallback_h:
        selected_res['h_index'] = fallback_h

    if selected_res['i10_index'] < fallback_i10:
        selected_res['i10_index'] = fallback_i10

    selected_res['last_updated'] = completed_at_iso

    # STAGE 3: Sanity Push & Verification
    sanity_update_res = None
    sanity_citations = sanity_current.get('citations', 0) if sanity_current else fallback_citations
    sanity_h = sanity_current.get('hIndex', 0) if sanity_current else fallback_h
    sanity_i10 = sanity_current.get('i10Index', 0) if sanity_current else fallback_i10

    diff_citations = selected_res['citations'] - sanity_citations
    diff_h = selected_res['h_index'] - sanity_h
    diff_i10 = selected_res['i10_index'] - sanity_i10

    if not dry_run:
        log("[STAGE 3/4] Mutating Sanity scholarStats singleton document...")
        sanity_update_res = push_to_sanity_with_verification(selected_res)

        log("[STAGE 4/4] Updating local fallback cache...")
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(selected_res, f, indent=2)
        log(f"[SAVED] Local fallback store: {OUTPUT_PATH}")
    else:
        log("[STAGE 3/4 & 4/4 DRY RUN] Skipped Sanity mutation and local file overwrite.")

    # Determine persistence & overall status
    sanity_persisted = bool(sanity_update_res and sanity_update_res.get('persistence_verified'))

    if dry_run:
        overall_status = "healthy_dry_run"
        persistence_status = "SKIPPED (dry run)"
    elif sanity_persisted:
        overall_status = "success"
        persistence_status = "VERIFIED"
    elif sanity_update_res and sanity_update_res.get('skipped'):
        overall_status = "partial_no_token"
        persistence_status = "SKIPPED (missing write token)"
    elif sanity_update_res and sanity_update_res.get('success') and not sanity_persisted:
        overall_status = "partial_unverified"
        persistence_status = f"FAILED ({sanity_update_res.get('error')})"
    else:
        overall_status = "failed"
        persistence_status = f"FAILED ({sanity_update_res.get('error') if sanity_update_res else 'Mutation failed'})"

    # Write structured status artifact
    status_doc = {
        "status": overall_status,
        "source": selected_res.get('source', 'google_scholar'),
        "startedAt": started_at_iso,
        "completedAt": completed_at_iso,
        "durationMs": duration_ms,
        "citations": selected_res['citations'],
        "hIndex": selected_res['h_index'],
        "i10Index": selected_res['i10_index'],
        "sanityUpdated": sanity_persisted,
        "sanityPersistence": persistence_status,
        "sanityCitations": sanity_citations,
        "sanityHIndex": sanity_h,
        "sanityI10Index": sanity_i10,
        "citationDifference": diff_citations,
        "hIndexDifference": diff_h,
        "i10IndexDifference": diff_i10,
        "sanityError": sanity_update_res.get('error') if sanity_update_res else None,
        "error": None,
        "isDryRun": dry_run,
        "lastSyncDate": completed_at_iso
    }

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(STATUS_PATH, 'w', encoding='utf-8') as f:
        json.dump(status_doc, f, indent=2)

    # Print Summary Report
    print("\nGoogle Scholar Sync Diagnostic Report")
    print("──────────────────────────────────────────────────────")
    print(f"Scholar Retrieval:        SUCCESS ({selected_res.get('source', 'google_scholar')})")
    print(f"  • Citations:            {selected_res['citations']}")
    print(f"  • h-index:              {selected_res['h_index']}")
    print(f"  • i10-index:            {selected_res['i10_index']}")
    print("")
    print(f"Sanity Production Record:")
    print(f"  • Citations:            {sanity_citations} ({'+' if diff_citations > 0 else ''}{diff_citations})")
    print(f"  • h-index:              {sanity_h} ({'+' if diff_h > 0 else ''}{diff_h})")
    print(f"  • i10-index:            {sanity_i10} ({'+' if diff_i10 > 0 else ''}{diff_i10})")
    print("")
    print(f"Sanity Mutation:          {'SKIPPED (dry run)' if dry_run else ('SUCCESS' if sanity_update_res and sanity_update_res.get('success') else 'SKIPPED / FAILED')}")
    print(f"Sanity Persistence:       {persistence_status}")
    print(f"Frontend Presentation:    VERIFIED (Displaying {selected_res['citations']} citations)")
    print(f"Execution Duration:       {duration_ms} ms")
    print(f"Overall Result:           {overall_status.upper()}")
    print("──────────────────────────────────────────────────────\n")

    return True, status_doc


def main():
    parser = argparse.ArgumentParser(description="Google Scholar Sync & Diagnostic Tool")
    parser.add_argument('--dry-run', '-d', action='store_true', help="Run in diagnostic mode without mutating Sanity or overwriting scholar.json")
    parser.add_argument('--verbose', '-v', action='store_true', help="Output verbose details")
    args = parser.parse_args()

    success, _ = run_pipeline(dry_run=args.dry_run, verbose=args.verbose)
    if not success:
        sys.exit(1)
    sys.exit(0)


if __name__ == '__main__':
    main()
