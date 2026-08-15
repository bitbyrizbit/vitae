# PBAS (Performance Based Appraisal System) scoring engine.
#
# This mirrors the point structure institutions use to calculate a faculty
# member's Academic Performance Indicator (API) score for the Career
# Advancement Scheme (CAS), based on UGC API tables. Universities calibrate
# the exact weights slightly differently in their own statutes, so all the
# numbers live in one config dict instead of being scattered through the
# codebase - a registrar's office could tune this without touching app logic.

PUBLICATION_POINTS = {
    "journal": 10,
    "journal_scopus_wos": 15,
    "conference": 5,
    "book_chapter": 5,
    "book_authored": 50,
    "book_edited": 10,
    "patent_national": 10,
    "patent_international": 15,
}

ACTIVITY_POINTS = {
    "seminar_attended": 5,
    "seminar_organized": 10,
    "workshop_attended": 5,
    "workshop_organized": 10,
    "fdp_attended": 5,
    "fdp_organized": 8,
    "guest_lecture": 3,
    "invited_talk": 5,
    "project_pi_major": 20,
    "project_pi_minor": 10,
    "project_coinvestigator": 8,
    "committee_member": 3,
    "committee_chair": 5,
}

CAS_ELIGIBILITY_THRESHOLD = 120


def score_publication(pub_type: str, is_indexed: bool, citation_count: int = 0) -> float:
    key = pub_type
    if pub_type == "journal" and is_indexed:
        key = "journal_scopus_wos"
    # fallback mappings for legacy/short pub_type values
    fallback_map = {"book": "book_authored", "patent": "patent_national"}
    if key not in PUBLICATION_POINTS and key in fallback_map:
        key = fallback_map[key]
    base = PUBLICATION_POINTS.get(key, PUBLICATION_POINTS.get(pub_type, 0))
    citation_bonus = min(citation_count * 0.1, 5)
    return round(base + citation_bonus, 2)


def score_activity(activity_type: str) -> float:
    return float(ACTIVITY_POINTS.get(activity_type, 0))


def compute_appraisal_totals(publications: list, activities: list) -> dict:
    category_iii = sum(p.api_score for p in publications)

    co_curricular_types = {
        "seminar_attended", "seminar_organized", "workshop_attended",
        "workshop_organized", "fdp_attended", "fdp_organized",
        "guest_lecture", "invited_talk", "committee_member", "committee_chair",
    }
    research_activity_types = {"project_pi_major", "project_pi_minor", "project_coinvestigator"}

    category_ii = sum(a.api_score for a in activities if a.activity_type in co_curricular_types)
    category_iii += sum(a.api_score for a in activities if a.activity_type in research_activity_types)

    category_i = 0.0  # teaching load is self declared elsewhere, not derivable from logged data

    total = round(category_i + category_ii + category_iii, 2)

    return {
        "category_i_score": category_i,
        "category_ii_score": round(category_ii, 2),
        "category_iii_score": round(category_iii, 2),
        "total_api_score": total,
        "eligible_for_cas": "eligible" if total >= CAS_ELIGIBILITY_THRESHOLD else "not_eligible",
    }