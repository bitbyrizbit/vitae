import os
import io
import json
import pdfplumber
from google import genai
from google.genai import types

from app.schemas import ResumeParseResult

def extract_data_from_resume(file_bytes: bytes) -> ResumeParseResult:
    # 1. Extract text from PDF
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    # 2. Call Gemini for structured extraction
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in the environment")

    client = genai.Client(api_key=api_key)

    prompt = """
    You are an elite academic resume parser. Your job is to extract all publications and academic activities from the following resume text.
    You must return the data strictly matching the requested JSON schema.
    
    Guidelines for Publications:
    - pub_type must be one of: "journal", "book_authored", "book_edited", "chapter", "translation", "patent_international", "patent_national"
    - is_scopus_or_wos: true if the venue is a major international journal/conference, otherwise false.
    - is_ugc_care: true if it seems like a recognized Indian journal, otherwise false.
    - citation_count: guess 0 if not explicitly mentioned.
    
    Guidelines for Activities:
    - activity_type must be one of: "phd_awarded", "mphil_awarded", "project_major", "project_minor", "consultancy", "seminar_attended", "paper_presented", "invited_lecture"
    - role: "author", "speaker", "participant", "investigator", etc.
    
    Resume Text:
    {text}
    """

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt.format(text=text),
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ResumeParseResult,
        ),
    )

    try:
        data = json.loads(response.text)
        return ResumeParseResult(**data)
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        print(f"Raw response: {response.text}")
        return ResumeParseResult(publications=[], activities=[])
