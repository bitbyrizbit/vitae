import logging
import re
import urllib.parse
import urllib.request
from bs4 import BeautifulSoup

from app.services.pbas_engine import score_publication

logger = logging.getLogger(__name__)


def extract_scholar_id(raw_input: str) -> str:
    """
    Extracts clean Google Scholar profile ID from a raw string or full URL.
    Supports formats like:
    - qc6CJjYAAAAJ
    - https://scholar.google.com/citations?user=qc6CJjYAAAAJ&hl=en
    - https://scholar.google.co.in/citations?hl=en&user=qc6CJjYAAAAJ
    - user=qc6CJjYAAAAJ
    """
    if not raw_input:
        return ""
    raw_input = raw_input.strip()

    if "user=" in raw_input:
        parsed = urllib.parse.urlparse(raw_input)
        qs = urllib.parse.parse_qs(parsed.query)
        if "user" in qs and qs["user"]:
            return qs["user"][0].strip()

    match = re.search(r'([a-zA-Z0-9_-]{12})', raw_input)
    if match:
        return match.group(1)

    return raw_input


def _fetch_direct_scholar(profile_id: str, limit: int = 50) -> list[dict]:
    url = f"https://scholar.google.com/citations?user={urllib.parse.quote(profile_id)}&hl=en&cstart=0&pagesize={limit}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise ValueError(f"Google Scholar profile '{profile_id}' not found.")
        raise

    soup = BeautifulSoup(html, "html.parser")
    rows = soup.select("tr.gsc_a_tr")
    name_el = soup.select_one("#gsc_prf_in")

    if not name_el and len(rows) == 0:
        raise ValueError(f"Google Scholar profile '{profile_id}' does not exist or has no public profile.")

    results = []
    for r in rows[:limit]:
        title_el = r.select_one("a.gsc_a_at")
        if not title_el:
            continue
        title = title_el.text.strip()
        href = title_el.get("href", "")
        pub_id = None
        if "citation_for_view=" in href:
            pub_id = href.split("citation_for_view=")[-1].split("&")[0]
        if not pub_id:
            pub_id = f"{profile_id}:{abs(hash(title))}"

        grays = r.select("div.gs_gray")
        venue = grays[1].text.strip() if len(grays) > 1 else (grays[0].text.strip() if len(grays) > 0 else "")

        cit_el = r.select_one("a.gsc_a_ac")
        cit_text = cit_el.text.strip() if cit_el else "0"
        citation_count = int(cit_text) if cit_text.isdigit() else 0

        year_el = r.select_one("span.gsc_a_h, span.gsc_a_hc")
        year_text = year_el.text.strip() if year_el else None
        year = int(year_text) if year_text and year_text.isdigit() else None

        # Determine pub_type hint
        venue_lower = venue.lower()
        pub_type = "journal"
        if any(w in venue_lower for w in ["conference", "proceedings", "symposium", "workshop", "ieee", "acm"]):
            pub_type = "conference"
        elif "chapter" in venue_lower:
            pub_type = "book_chapter"
        elif "patent" in venue_lower:
            pub_type = "patent"

        results.append({
            "scholar_pub_id": pub_id,
            "title": title,
            "journal_or_conference": venue or "Google Scholar Publication",
            "year": year,
            "citation_count": citation_count,
            "pub_type": pub_type,
            "is_scopus_or_wos": False,
            "source": "google_scholar",
            "api_score": score_publication(pub_type, is_indexed=False, citation_count=citation_count),
        })

    return results


def _fetch_scholarly_fallback(profile_id: str, limit: int = 25) -> list[dict]:
    from scholarly import scholarly

    author = scholarly.search_author_id(profile_id, filled=True, publication_limit=limit)
    if not author:
        raise ValueError(f"Could not locate author profile for ID '{profile_id}'")

    results = []
    for pub in author.get("publications", [])[:limit]:
        bib = pub.get("bib", {})
        year = bib.get("pub_year")
        citation_count = pub.get("num_citations", 0)
        pub_id = pub.get("author_pub_id") or f"{profile_id}:{abs(hash(bib.get('title', '')))}"

        venue = bib.get("citation") or bib.get("venue") or "Google Scholar Publication"
        venue_lower = venue.lower()
        pub_type = "journal"
        if any(w in venue_lower for w in ["conference", "proceedings", "symposium", "workshop"]):
            pub_type = "conference"

        results.append({
            "scholar_pub_id": pub_id,
            "title": bib.get("title", "Untitled"),
            "journal_or_conference": venue,
            "year": int(year) if year and str(year).isdigit() else None,
            "citation_count": citation_count,
            "pub_type": pub_type,
            "is_scopus_or_wos": False,
            "source": "google_scholar",
            "api_score": score_publication(pub_type, is_indexed=False, citation_count=citation_count),
        })

    return results


def fetch_scholar_publications(scholar_profile_id: str, limit: int = 50) -> list[dict]:
    """
    Pulls a faculty member's publication list from Google Scholar.
    Uses fast direct parsing first with scholarly library fallback.
    """
    clean_id = extract_scholar_id(scholar_profile_id)
    if not clean_id:
        raise ValueError("Please provide a valid Google Scholar Profile ID or URL.")

    try:
        return _fetch_direct_scholar(clean_id, limit=limit)
    except ValueError:
        raise
    except Exception as e:
        logger.warning(f"Direct Google Scholar fetch failed for {clean_id}: {e}. Trying scholarly fallback...")
        try:
            return _fetch_scholarly_fallback(clean_id, limit=limit)
        except Exception as fallback_err:
            logger.error(f"Scholar fallback also failed for {clean_id}: {fallback_err}")
            raise RuntimeError(f"Unable to fetch Google Scholar publications: {str(fallback_err)}")