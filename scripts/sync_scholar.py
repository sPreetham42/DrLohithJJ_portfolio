"""
sync_scholar.py — Fetches live Google Scholar metrics for Dr. Lohith J.J.
Runs via GitHub Actions daily. Saves results to data/scholar.json.

Strategy:
  1. Primary:  scholarly library (scrapes Google Scholar server-side)
  2. Fallback: OpenAlex API (free, always works, slightly lower counts)
  3. Safety:   Never overwrite with lower numbers (prevents bad scrapes)
"""

import json
import os
import sys
from datetime import datetime, timezone

# Path to output JSON (relative to repo root)
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'scholar.json')

# Google Scholar user ID for Dr. Lohith J.J.
SCHOLAR_USER_ID = 'dmSdWtEAAAAJ'

# OpenAlex author IDs (Dr. Lohith's papers are split across profiles)
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


def load_existing():
    """Load existing scholar.json to compare against."""
    try:
        with open(OUTPUT_PATH, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"citations": 0, "h_index": 0, "i10_index": 0, "papers_count": 0}


def fetch_google_scholar():
    """Primary: Use scholarly library to scrape Google Scholar."""
    try:
        from scholarly import scholarly
        author = scholarly.search_author_id(SCHOLAR_USER_ID)
        author = scholarly.fill(author, sections=['basics', 'indices'])

        citedby = author.get('citedby', 0) or 0
        h_index = 0
        i10_index = 0

        indices = author.get('cites_per_year', {})
        if 'hindex' in author:
            h_index = author['hindex']
        if 'i10index' in author:
            i10_index = author['i10index']

        # scholarly stores indices differently in some versions
        if hasattr(author, 'hindex'):
            h_index = author.hindex
        if hasattr(author, 'i10index'):
            i10_index = author.i10index

        publications = author.get('publications', [])

        print(f"[Google Scholar] Citations: {citedby}, h-index: {h_index}, papers: {len(publications)}")

        return {
            "citations": citedby,
            "h_index": h_index,
            "i10_index": i10_index,
            "papers_count": len(publications),
            "source": "google_scholar"
        }
    except Exception as e:
        print(f"[Google Scholar] Failed: {e}")
        return None


def fetch_openalex():
    """Fallback: Aggregate metrics from OpenAlex API."""
    try:
        import urllib.request

        total_citations = 0
        total_works = 0
        max_h_index = 0
        max_i10_index = 0

        for author_id in OPENALEX_AUTHOR_IDS:
            url = f"https://api.openalex.org/authors/{author_id}?select=id,display_name,cited_by_count,works_count,summary_stats"
            req = urllib.request.Request(url, headers={'User-Agent': 'DrLohithPortfolio/1.0 (mailto:lohithjj@gmail.com)'})

            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
                citations = data.get('cited_by_count', 0)
                works = data.get('works_count', 0)
                stats = data.get('summary_stats', {})
                h = stats.get('h_index', 0)
                i10 = stats.get('i10_index', 0)

                total_citations += citations
                total_works += works
                max_h_index = max(max_h_index, h)
                max_i10_index = max(max_i10_index, i10)

        print(f"[OpenAlex] Citations: {total_citations}, h-index: {max_h_index}, papers: {total_works}")

        return {
            "citations": total_citations,
            "h_index": max_h_index,
            "i10_index": max_i10_index,
            "papers_count": total_works,
            "source": "openalex"
        }
    except Exception as e:
        print(f"[OpenAlex] Failed: {e}")
        return None


def main():
    existing = load_existing()
    print(f"[Existing] Citations: {existing.get('citations', 0)}")

    # Try Google Scholar first, then OpenAlex
    result = fetch_google_scholar()
    if result is None:
        result = fetch_openalex()
    if result is None:
        print("[ERROR] Both sources failed. Keeping existing data.")
        sys.exit(1)

    # Safety: never write lower citation count (prevents bad scrape data)
    if result['citations'] < existing.get('citations', 0):
        print(f"[SAFETY] New count ({result['citations']}) < existing ({existing['citations']}). Keeping existing citations.")
        result['citations'] = existing['citations']

    if result['h_index'] < existing.get('h_index', 0):
        result['h_index'] = existing['h_index']

    # Add timestamp
    result['last_updated'] = datetime.now(timezone.utc).isoformat()

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"[SUCCESS] Saved to {OUTPUT_PATH}")
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
