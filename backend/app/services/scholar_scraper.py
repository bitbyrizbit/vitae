from scholarly import scholarly

from app.services.pbas_engine import score_publication


def fetch_scholar_publications(scholar_profile_id: str, limit: int = 25) -> list[dict]:
    """
    Pulls a faculty member's publication list straight from their Google
    Scholar profile. scholarly hits Google Scholar directly with no API key,
    so it's rate limited - results get cached in the db and only refetched
    on a manual refresh, not on every page load.
    """
    author = scholarly.search_author_id(scholar_profile_id)
    filled = scholarly.fill(author, sections=["publications"])

    results = []
    for pub in filled.get("publications", [])[:limit]:
        filled_pub = scholarly.fill(pub)
        bib = filled_pub.get("bib", {})
        year = bib.get("pub_year")
        citation_count = filled_pub.get("num_citations", 0)

        results.append({
            "scholar_pub_id": filled_pub.get("author_pub_id"),
            "title": bib.get("title", "untitled"),
            "journal_or_conference": bib.get("citation") or bib.get("venue"),
            "year": int(year) if year and str(year).isdigit() else None,
            "citation_count": citation_count,
            "pub_type": "journal",
            "is_scopus_or_wos": False,
            "source": "google_scholar",
            "api_score": score_publication("journal", is_indexed=False, citation_count=citation_count),
        })

    return results