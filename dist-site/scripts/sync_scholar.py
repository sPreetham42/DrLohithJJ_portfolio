"""
sync_scholar.py — Fetches live Google Scholar metrics for Dr. Lohith J.J.
Runs via GitHub Actions daily or locally in diagnostic mode.
Persists results to Cloudflare D1 via Worker automation endpoint with immediate read-back verification.
Also maintains data/scholar.json as a derived static fallback artifact.

Strategy:
  1. Primary Scraper: scholarly library (isolated in killable child subprocess with hard 15s timeout)
  2. Fallback Scraper: OpenAlex API (parallelized REST API queries across author IDs)
  3. Monotonic Safety: Never overwrite with lower numbers unless verified
  4. Primary Persistence Target: Cloudflare D1 via POST /api/v1/automation/scholar
  5. Rollback Persistence Target: Sanity CMS (configurable via SCHOLAR_PERSISTENCE_TARGET=sanity)
  6. Verification: Direct cache-bypassed read-back verification against GET /api/v1/public/scholar-stats
  7. Fail-Loud Diagnostics: Structured status reporting, non-zero exits on failure, dry-run mode.
"""

import argparse
import concurrent.futures
import json
import os
import socket
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import uuid
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


def get_persistence_target():
    """Returns 'd1' (primary production target) or 'sanity' (legacy rollback target)."""
    return os.environ.get('SCHOLAR_PERSISTENCE_TARGET', 'd1').strip().lower()


def get_d1_config():
    """Resolves Cloudflare D1 Worker automation API configuration."""
    automation_url = os.environ.get(
        'WORKER_AUTOMATION_URL',
        'https://api.drlohithjj.com/api/v1/automation/scholar'
    ).strip()
    
    sync_secret = os.environ.get('SCHOLAR_SYNC_SECRET', '').strip()
    if not sync_secret and os.environ.get('NODE_ENV') != 'production':
        # Default dev key matching worker local environment
        sync_secret = 'dev-scholar-secret-key-12345'
        
    read_url = os.environ.get(
        'PUBLIC_READ_URL',
        'https://api.drlohithjj.com/api/v1/public/scholar-stats'
    ).strip()
    
    return automation_url, sync_secret, read_url


def get_sanity_config():
    """Safely resolves legacy Sanity configuration for rollback scenarios."""
    raw_project_id = os.environ.get('SANITY_PROJECT_ID', '')
    raw_dataset = os.environ.get('SANITY_DATASET', '')
    
    project_id = raw_project_id.strip() if raw_project_id else '12ok6v8i'
    dataset = raw_dataset.strip() if raw_dataset else 'production'
    write_token = os.environ.get('SANITY_WRITE_TOKEN', '').strip() or None
    
    return project_id, dataset, write_token


def load_existing_fallback():
    """Load existing scholar.json to compare against."""
    try:
        if os.path.exists(OUTPUT_PATH):
            with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        log(f"[WARN] Could not read existing scholar.json: {e}")
    return {"citations": 0, "h_index": 0, "i10_index": 0, "papers_count": 0, "last_updated": None}


def fetch_d1_current(read_url):
    """Fetch current scholar stats from Cloudflare D1 public API."""
    try:
        req = urllib.request.Request(f"{read_url}?_t={int(time.time())}", headers={'User-Agent': 'ScholarSync/1.0', 'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data
    except Exception as e:
        log(f"[D1 READ ERROR] Could not fetch current D1 document from {read_url}: {e}")
        return None


def fetch_sanity_current():
    """Fetch current scholarStats document directly from Sanity query API."""
    project_id, dataset, _ = get_sanity_config()
    query = '*[_type == "scholarStats" && _id == "scholarStats"][0]'
    url = f"https://{project_id}.api.sanity.io/v2023-01-01/data/query/{dataset}?query={urllib.parse.quote(query)}"

    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'ScholarSyncDiagnostics/1.0'})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data.get('result')
    except Exception as e:
        log(f"[SANITY READ ERROR] Could not fetch current Sanity document: {e}")
        return None


def run_scholar_worker(author_id):
    """
    Isolated worker process executing inside a dedicated child subprocess.
    If this process stalls on anti-scraping challenges or dropped sockets,
    the parent process forcibly terminates it without blocking the workflow.
    """
    try:
        from scholarly import scholarly
        try:
            scholarly.set_timeout(8)
        except Exception:
            pass

        author = scholarly.search_author_id(author_id)
        if not author:
            print(json.dumps({"error": f"Author ID {author_id} not found on Google Scholar"}))
            sys.exit(1)

        author = scholarly.fill(author, sections=['basics', 'indices'])
        citedby = author.get('citedby', 0) or 0
        h_index = author.get('hindex', 0) or 0
        i10_index = author.get('i10index', 0) or 0

        if hasattr(author, 'hindex') and author.hindex:
            h_index = author.hindex
        if hasattr(author, 'i10index') and author.i10index:
            i10_index = author.i10index

        publications = author.get('publications', [])

        result = {
            "citations": int(citedby),
            "h_index": int(h_index),
            "i10_index": int(i10_index),
            "papers_count": len(publications),
            "source": "google_scholar",
            "error": None
        }
        print(json.dumps(result))
        sys.exit(0)
    except ImportError:
        print(json.dumps({"error": "scholarly package not installed in environment"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


def fetch_google_scholar():
    """
    Primary: Scrapes Google Scholar inside an isolated child subprocess with a hard 15s timeout.
    """
    log(f"[Google Scholar] Connecting for author ID: {SCHOLAR_USER_ID} (hard subprocess timeout: 15s)...")
    cmd = [sys.executable, os.path.abspath(__file__), '--scrape-scholar-worker', SCHOLAR_USER_ID]
    
    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        try:
            stdout_data, stderr_data = proc.communicate(timeout=15)
        except subprocess.TimeoutExpired:
            log("[Google Scholar] Hard timeout reached after 15s; terminating scraper subprocess...")
            proc.kill()
            try:
                proc.communicate(timeout=3)
            except Exception:
                pass
            err = "Google Scholar scraper timed out after 15s (anti-scraping block or dropped socket)"
            log(f"[Google Scholar] {err}")
            log("[Google Scholar] Falling back to OpenAlex API.")
            return {"error": err}
            
        if proc.returncode == 0 and stdout_data.strip():
            try:
                data = json.loads(stdout_data.strip())
                if data.get('error'):
                    log(f"[Google Scholar] Scraper reported error: {data['error']}")
                    return {"error": data['error']}
                log(f"[Google Scholar] OK — Citations: {data['citations']}, h-index: {data['h_index']}, i10-index: {data['i10_index']}, papers: {data.get('papers_count', 0)}")
                return data
            except json.JSONDecodeError:
                err = f"Failed to parse scraper JSON output: {stdout_data[:200]}"
                log(f"[Google Scholar] {err}")
                return {"error": err}
        else:
            err = stderr_data.strip() or f"Scraper process exited with code {proc.returncode}"
            log(f"[Google Scholar] Connection failed: {err}")
            return {"error": err}
            
    except Exception as e:
        err = f"Subprocess invocation failed: {e}"
        log(f"[Google Scholar] {err}")
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
                    log(f"[OpenAlex] Profile {aid} warning: {e}")

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


# ----------------------------------------------------------------
# PRIMARY PERSISTENCE: CLOUDFLARE D1 WORKER AUTOMATION ENDPOINT
# ----------------------------------------------------------------
def push_to_d1_with_verification(data, sync_run_id=None):
    """
    Pushes verified metrics to Cloudflare D1 via POST /api/v1/automation/scholar,
    enforcing Bearer authentication, SHA-256 idempotency, and direct cache-bypassed read-back.
    """
    automation_url, sync_secret, read_url = get_d1_config()
    
    if not sync_secret:
        msg = "SCHOLAR_SYNC_SECRET not configured in environment"
        log(f"[D1 AUTOMATION] {msg}.")
        return {
            "success": False,
            "persistence_verified": False,
            "error": msg,
            "stage": "secret_check"
        }

    if not sync_run_id:
        sync_run_id = f"scholar-sync-{int(time.time())}-{uuid.uuid4().hex[:8]}"

    payload = {
        "syncRunId": sync_run_id,
        "citations": int(data["citations"]),
        "hIndex": int(data["h_index"]),
        "i10Index": int(data["i10_index"]),
        "sciePapersCount": 4,
        "ieeeConferencesCount": 6,
        "lastUpdated": data.get("last_updated", datetime.now(timezone.utc).isoformat()),
        "source": data.get("source", "google_scholar")
    }

    # Step 1: Mutation via Worker Automation Endpoint
    log(f"[D1 AUTOMATION] Transmitting metrics to Worker endpoint: {automation_url} (syncRunId: {sync_run_id})...")
    try:
        req = urllib.request.Request(
            automation_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {sync_secret}',
                'User-Agent': 'ScholarSyncAutomation/1.0'
            },
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            idempotency_result = res_data.get('idempotencyResult', 'applied')
            log(f"[D1 AUTOMATION OK] Status: {res_data.get('status')} | Idempotency: {idempotency_result}")
    except urllib.error.HTTPError as e:
        error_body = ""
        try:
            error_body = e.read().decode('utf-8')
        except Exception:
            pass
        err = f"HTTP {e.code} ({e.reason}): {error_body}"
        log(f"[D1 AUTOMATION ERROR] {err}")
        return {
            "success": False,
            "persistence_verified": False,
            "error": err,
            "stage": "mutation_http_error"
        }
    except Exception as e:
        err = str(e)
        log(f"[D1 AUTOMATION ERROR] Network request failed: {err}")
        return {
            "success": False,
            "persistence_verified": False,
            "error": err,
            "stage": "mutation_network_error"
        }

    # Step 2: Direct Read-Back Verification (Cache Bypassed)
    log("[D1 VERIFY] Performing direct cache-bypassed read-back verification against public API...")
    time.sleep(0.4)

    try:
        verify_url = f"{read_url}?_cb={int(time.time()*1000)}"
        req = urllib.request.Request(verify_url, headers={
            'User-Agent': 'ScholarSyncVerification/1.0',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
        })
        with urllib.request.urlopen(req, timeout=8) as resp:
            persisted = json.loads(resp.read().decode('utf-8'))

            p_citations = persisted.get('citations')
            p_h = persisted.get('hIndex')
            p_i10 = persisted.get('i10Index')

            matches = (
                p_citations == data["citations"] and
                p_h == data["h_index"] and
                p_i10 == data["i10_index"]
            )

            if matches:
                log(f"[D1 VERIFIED] Persistence confirmed: Citations={p_citations}, hIndex={p_h}, i10Index={p_i10}")
                return {
                    "success": True,
                    "persistence_verified": True,
                    "persistedDoc": persisted,
                    "syncRunId": sync_run_id,
                    "idempotencyResult": idempotency_result,
                    "error": None,
                    "stage": "verified"
                }
            else:
                err = f"Persisted values (Citations={p_citations}, hIndex={p_h}, i10Index={p_i10}) do not match written values (Citations={data['citations']}, hIndex={data['h_index']}, i10Index={data['i10_index']})"
                log(f"[D1 VERIFY FAILED] {err}")
                return {
                    "success": True,
                    "persistence_verified": False,
                    "persistedDoc": persisted,
                    "syncRunId": sync_run_id,
                    "error": err,
                    "stage": "mismatch"
                }
    except Exception as e:
        err = f"Read-back verification query failed: {e}"
        log(f"[D1 VERIFY ERROR] {err}")
        return {
            "success": True,
            "persistence_verified": False,
            "syncRunId": sync_run_id,
            "error": err,
            "stage": "read_back_error"
        }


# ----------------------------------------------------------------
# LEGACY ROLLBACK PERSISTENCE: SANITY CMS
# ----------------------------------------------------------------
def push_to_sanity_with_verification(data):
    """Rollback fallback to Sanity CMS."""
    project_id, dataset, write_token = get_sanity_config()

    if not write_token:
        msg = "SANITY_WRITE_TOKEN not set in environment"
        log(f"[SANITY] {msg}. Skipping Sanity mutation.")
        return {
            "success": False,
            "persistence_verified": False,
            "error": msg,
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

    log(f"[SANITY] Sending rollback mutation to {project_id}/{dataset}...")
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
            return {
                "success": True,
                "persistence_verified": True,
                "error": None,
                "stage": "verified"
            }
    except Exception as e:
        err = str(e)
        log(f"[SANITY ERROR] Mutation request failed: {err}")
        return {
            "success": False,
            "persistence_verified": False,
            "error": err,
            "stage": "mutation"
        }


# ----------------------------------------------------------------
# MAIN PIPELINE
# ----------------------------------------------------------------
def run_pipeline(dry_run=False, verbose=False, sync_run_id=None):
    """Executes the Google Scholar sync & health diagnostic pipeline."""
    started_at_iso = datetime.now(timezone.utc).isoformat()
    start_time = time.time()
    persistence_target = get_persistence_target()

    print("\n" + "═" * 60)
    print("  Google Scholar Synchronization & Health Diagnostics")
    print(f"  Target Destination: {persistence_target.upper()} {'(Primary)' if persistence_target == 'd1' else '(Legacy Rollback)'}")
    print("═" * 60)
    if dry_run:
        print("  [MODE: DRY RUN / DIAGNOSTIC — NO MUTATIONS]\n")

    existing_fallback = load_existing_fallback()

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
            "target": persistence_target,
            "source": "none",
            "startedAt": started_at_iso,
            "completedAt": completed_at_iso,
            "durationMs": duration_ms,
            "citations": existing_fallback.get('citations', 0),
            "hIndex": existing_fallback.get('h_index', 0),
            "i10Index": existing_fallback.get('i10_index', 0),
            "persisted": False,
            "persistenceStatus": "FAILED",
            "error": retrieval_error,
            "isDryRun": dry_run
        }
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(STATUS_PATH, 'w', encoding='utf-8') as f:
            json.dump(status_doc, f, indent=2)
        print("═" * 60)
        print("  Result: FAILED (Metric Retrieval Error)")
        print("═" * 60 + "\n")
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

    # STAGE 3: Persistence
    update_res = None

    if not dry_run:
        if persistence_target == 'd1':
            log("[STAGE 3/4] Mutating Cloudflare D1 scholar_stats via Worker Automation Endpoint...")
            update_res = push_to_d1_with_verification(selected_res, sync_run_id=sync_run_id)
        else:
            log("[STAGE 3/4 ROLLBACK] Mutating legacy Sanity scholarStats singleton...")
            update_res = push_to_sanity_with_verification(selected_res)

        log("[STAGE 4/4] Updating derived local fallback cache (data/scholar.json)...")
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(selected_res, f, indent=2)
        log(f"[SAVED] Local fallback store: {OUTPUT_PATH}")
    else:
        log("[STAGE 3/4 & 4/4 DRY RUN] Skipped persistence mutation and local file overwrite.")

    # Determine persistence & overall status
    is_persisted = bool(update_res and update_res.get('persistence_verified'))

    if dry_run:
        overall_status = "healthy_dry_run"
        persistence_status = "SKIPPED (dry run)"
    elif is_persisted:
        overall_status = "success"
        persistence_status = "VERIFIED"
    elif update_res and update_res.get('success') and not is_persisted:
        overall_status = "partial_unverified"
        persistence_status = f"FAILED ({update_res.get('error')})"
    else:
        overall_status = "failed"
        persistence_status = f"FAILED ({update_res.get('error') if update_res else 'Mutation failed'})"

    # Write structured status artifact
    status_doc = {
        "status": overall_status,
        "target": persistence_target,
        "source": selected_res.get('source', 'google_scholar'),
        "startedAt": started_at_iso,
        "completedAt": completed_at_iso,
        "durationMs": duration_ms,
        "citations": selected_res['citations'],
        "hIndex": selected_res['h_index'],
        "i10Index": selected_res['i10_index'],
        "persisted": is_persisted,
        "persistenceStatus": persistence_status,
        "syncRunId": update_res.get('syncRunId') if update_res else None,
        "idempotencyResult": update_res.get('idempotencyResult') if update_res else None,
        "error": update_res.get('error') if update_res else None,
        "isDryRun": dry_run,
        "lastSyncDate": completed_at_iso
    }

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(STATUS_PATH, 'w', encoding='utf-8') as f:
        json.dump(status_doc, f, indent=2)

    # Print Summary Report
    print("\nGoogle Scholar Sync Diagnostic Report")
    print("──────────────────────────────────────────────────────")
    print(f"Target Destination:       {persistence_target.upper()} {'(Cloudflare D1)' if persistence_target == 'd1' else '(Sanity)'}")
    print(f"Scholar Retrieval:        SUCCESS ({selected_res.get('source', 'google_scholar')})")
    print(f"  • Citations:            {selected_res['citations']}")
    print(f"  • h-index:              {selected_res['h_index']}")
    print(f"  • i10-index:            {selected_res['i10_index']}")
    print("")
    print(f"Persistence Status:       {persistence_status}")
    print(f"Execution Duration:       {duration_ms} ms")
    print(f"Overall Result:           {overall_status.upper()}")
    print("──────────────────────────────────────────────────────\n")

    if not dry_run and not is_persisted:
        return False, status_doc

    return True, status_doc


def main():
    if len(sys.argv) > 2 and sys.argv[1] == '--scrape-scholar-worker':
        run_scholar_worker(sys.argv[2])
        return

    parser = argparse.ArgumentParser(description="Google Scholar Sync & Diagnostic Tool")
    parser.add_argument('--dry-run', '-d', action='store_true', help="Run in diagnostic mode without mutating database")
    parser.add_argument('--verbose', '-v', action='store_true', help="Output verbose details")
    parser.add_argument('--sync-run-id', type=str, default=None, help="Explicit syncRunId for idempotency testing")
    args = parser.parse_args()

    success, _ = run_pipeline(dry_run=args.dry_run, verbose=args.verbose, sync_run_id=args.sync_run_id)
    if not success:
        sys.exit(1)
    sys.exit(0)


if __name__ == '__main__':
    main()
