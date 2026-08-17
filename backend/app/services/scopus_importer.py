import csv
import io
from app.schemas import PublicationCreate

def parse_scopus_csv(file_bytes: bytes) -> list[PublicationCreate]:
    text = file_bytes.decode('utf-8-sig', errors='replace')
    reader = csv.DictReader(io.StringIO(text))
    
    publications = []
    
    for row in reader:
        # Map Scopus standard CSV columns to our schema
        # Typical Scopus columns: "Authors", "Title", "Year", "Source title", "Volume", "Issue", "Art. No.", "Page start", "Page end", "Page count", "Cited by", "DOI", "Link", "Document Type", "Source", "EID"
        
        # Safe get with fallback
        def get_val(keys):
            for k in keys:
                if k in row and row[k]:
                    return row[k].strip()
            return ""

        title = get_val(["Title", "Article Title"])
        if not title:
            continue
            
        journal = get_val(["Source title", "Journal"])
        year_str = get_val(["Year", "Publication Year"])
        year = int(year_str) if year_str.isdigit() else None
        
        cited_str = get_val(["Cited by", "Citations"])
        citations = int(cited_str) if cited_str.isdigit() else 0
        
        doc_type = get_val(["Document Type", "Type"]).lower()
        pub_type = "journal"
        if "book" in doc_type and "chapter" not in doc_type:
            pub_type = "book_authored"
        elif "chapter" in doc_type:
            pub_type = "chapter"
        elif "conference" in doc_type:
            pub_type = "conference"
            
        # If it comes from a Scopus export, it is Scopus indexed
        is_scopus = True
        
        pub = PublicationCreate(
            title=title,
            journal_or_conference=journal,
            year=year,
            citation_count=citations,
            pub_type=pub_type,
            is_scopus_or_wos=is_scopus,
            is_ugc_care=False, # We don't know this definitively from Scopus
        )
        publications.append(pub)
        
    return publications
