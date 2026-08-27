import io
import json
import logging
import os
import re
from datetime import date
import pdfplumber

from app.schemas import ResumeParseResult, PublicationCreate, ActivityCreate

logger = logging.getLogger(__name__)

VALID_PUB_TYPES = {
    "journal", "conference", "book_chapter", "book_authored",
    "book_edited", "patent_national", "patent_international",
}

VALID_ACT_TYPES = {
    "seminar_attended", "seminar_organized", "workshop_attended",
    "workshop_organized", "fdp_attended", "fdp_organized",
    "guest_lecture", "invited_talk", "project_pi_major",
    "project_pi_minor", "project_coinvestigator", "committee_member",
    "committee_chair", "teaching_course",
}


def is_section_header(line: str) -> bool:
    s = line.strip()
    if re.match(r"^(?:\[\d+\]|\d+[\.\)]|[\-\*\•\–])", s):
        return False
    if len(s) > 55:
        return False
    if s.endswith(":") or s.isupper() or len(s.split()) <= 4:
        return True
    return False


def _heuristic_parse_resume(text: str) -> ResumeParseResult:
    """
    Fast rule-based extractor that parses publications and academic activities
    when Gemini API key is not configured or offline.
    """
    publications: list[PublicationCreate] = []
    activities: list[ActivityCreate] = []

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    current_section = None

    for line in lines:
        line_lower = line.lower()
        if is_section_header(line):
            if any(h in line_lower for h in ["publication", "research paper", "journal article", "conference proceeding", "patent", "book"]):
                current_section = "publications"
                continue
            elif any(h in line_lower for h in ["activity", "activities", "project", "fdp", "workshop", "seminar", "invited talk", "guest lecture", "course taught", "committee"]):
                current_section = "activities"
                continue

        if len(line) < 12:
            continue

        cleaned = re.sub(r"^(?:\[\d+\]|\d+[\.\)]|[\-\*\•\–])\s*", "", line).strip()
        if not cleaned:
            continue

        year_match = re.search(r"\b(19\d\d|20[0-2]\d)\b", cleaned)
        year = int(year_match.group(1)) if year_match else None

        cit_match = re.search(r"(?:citation[s]?|cited by)[:\s]+(\d+)", cleaned, re.IGNORECASE)
        citations = int(cit_match.group(1)) if cit_match else 0

        is_pub_hint = current_section == "publications" or any(
            kw in line_lower for kw in ["journal", "ieee", "springer", "acm", "elsevier", "conference", "proceedings", "transactions", "doi:", "issn", "isbn"]
        )

        if is_pub_hint and current_section != "activities":
            pub_type = "journal"
            if any(w in line_lower for w in ["conference", "proceedings", "symposium", "workshop"]):
                pub_type = "conference"
            elif "chapter" in line_lower:
                pub_type = "book_chapter"
            elif "patent" in line_lower:
                pub_type = "patent_international" if "international" in line_lower or "us" in line_lower else "patent_national"
            elif "book" in line_lower:
                pub_type = "book_authored"

            parts = re.split(r"\.|\,|\;|\-", cleaned)
            title = parts[0].strip() if len(parts) > 0 and len(parts[0].strip()) > 8 else cleaned
            venue = ". ".join(p.strip() for p in parts[1:]) if len(parts) > 1 else "Academic Publication"

            publications.append(PublicationCreate(
                title=title[:250],
                journal_or_conference=venue[:200] if venue else None,
                year=year,
                citation_count=citations,
                pub_type=pub_type,
                is_scopus_or_wos=any(w in line_lower for w in ["ieee", "springer", "acm", "elsevier", "nature", "science", "transactions", "scopus"]),
                is_ugc_care=True,
            ))

        elif current_section == "activities" or any(kw in line_lower for kw in ["attended", "fdp", "faculty development", "organized", "project", "principal investigator", "invited talk", "keynote", "lecture", "taught", "committee"]):
            act_type = "seminar_attended"
            role = "Participant"

            if "fdp" in line_lower or "faculty development" in line_lower:
                act_type = "fdp_organized" if "organized" in line_lower else "fdp_attended"
                role = "Coordinator" if "organized" in line_lower else "Attendee"
            elif "workshop" in line_lower:
                act_type = "workshop_organized" if "organized" in line_lower else "workshop_attended"
                role = "Coordinator" if "organized" in line_lower else "Attendee"
            elif "seminar" in line_lower:
                act_type = "seminar_organized" if "organized" in line_lower else "seminar_attended"
                role = "Organizer" if "organized" in line_lower else "Attendee"
            elif any(w in line_lower for w in ["investigator", "project", "grant"]):
                if "co-pi" in line_lower or "co-investigator" in line_lower or "coinvestigator" in line_lower:
                    act_type = "project_coinvestigator"
                    role = "Co-Investigator"
                elif any(w in line_lower for w in ["lakh", "crore", "major", "dst", "serb", "drdo", "icmr", "ugc"]):
                    act_type = "project_pi_major"
                    role = "Principal Investigator"
                else:
                    act_type = "project_pi_minor"
                    role = "Principal Investigator"
            elif any(w in line_lower for w in ["keynote", "invited talk", "invited lecture", "guest lecture", "expert talk"]):
                act_type = "invited_talk" if "invited" in line_lower or "keynote" in line_lower else "guest_lecture"
                role = "Speaker"
            elif "committee" in line_lower:
                act_type = "committee_chair" if any(w in line_lower for w in ["chair", "head", "lead", "convenor"]) else "committee_member"
                role = "Chairperson" if "committee_chair" in act_type else "Member"
            elif "teach" in line_lower or "course" in line_lower:
                act_type = "teaching_course"
                role = "Instructor"

            activities.append(ActivityCreate(
                activity_type=act_type,
                title=cleaned[:250],
                description=cleaned,
                role=role,
            ))

    return ResumeParseResult(publications=publications, activities=activities)


def extract_data_from_resume(file_bytes: bytes) -> ResumeParseResult:
    # 1. Extract text from PDF
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        raise ValueError(f"Could not read PDF file: {str(e)}")

    if not text.strip():
        raise ValueError("No readable text found in PDF. Please ensure the PDF is not an image-only scan.")

    # 2. Try Gemini structured extraction if API key is provided
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)

            prompt = f"""
            You are an elite academic resume parser for an Indian university appraisal system.
            Extract all publications and academic activities from the following resume text.
            Return valid JSON adhering to the target schema.

            Guidelines for Publications:
            - pub_type MUST be one of: "journal", "conference", "book_chapter", "book_authored", "book_edited", "patent_national", "patent_international"
            - is_scopus_or_wos: true if published in IEEE, ACM, Springer, Elsevier, Nature, Science, or major international index, else false.
            - is_ugc_care: true if academic peer-reviewed journal/conference, else false.
            - citation_count: integer count if mentioned, else 0.

            Guidelines for Activities:
            - activity_type MUST be one of: "seminar_attended", "seminar_organized", "workshop_attended", "workshop_organized", "fdp_attended", "fdp_organized", "guest_lecture", "invited_talk", "project_pi_major", "project_pi_minor", "project_coinvestigator", "committee_member", "committee_chair", "teaching_course"
            - role: e.g. "Principal Investigator", "Speaker", "Attendee", "Chairperson", "Instructor".

            Resume Text:
            {text}
            """

            for model_name in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=ResumeParseResult,
                        ),
                    )
                    data = json.loads(response.text)
                    result = ResumeParseResult(**data)
                    if result.publications or result.activities:
                        return result
                except Exception as model_err:
                    logger.warning(f"Gemini model {model_name} failed: {model_err}")
                    continue

        except Exception as e:
            logger.warning(f"Gemini extraction failed: {e}. Falling back to heuristic parser.")

    # 3. Fallback to heuristic parser
    return _heuristic_parse_resume(text)
