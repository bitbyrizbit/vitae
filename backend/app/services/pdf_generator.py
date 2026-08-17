import io
import time
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT

def build_appraisal_pdf(faculty, appraisal, publications, activities) -> bytes:
    buffer = io.BytesIO()
    
    # Modern, official margins
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=20*mm, 
        leftMargin=20*mm, 
        topMargin=20*mm, 
        bottomMargin=20*mm
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles for Official Form
    title_style = ParagraphStyle(
        "title", parent=styles["Heading1"], fontSize=14, spaceAfter=10, 
        alignment=TA_CENTER, fontName="Helvetica-Bold"
    )
    subtitle_style = ParagraphStyle(
        "subtitle", parent=styles["Normal"], fontSize=11, spaceAfter=20, 
        alignment=TA_CENTER, fontName="Helvetica-Bold", textColor=colors.darkgrey
    )
    part_heading_style = ParagraphStyle(
        "part_heading", parent=styles["Heading2"], fontSize=12, spaceBefore=20, 
        spaceAfter=10, alignment=TA_CENTER, fontName="Helvetica-Bold", 
        backColor=colors.HexColor("#f4f4f4"), borderPadding=6
    )
    section_style = ParagraphStyle(
        "section", parent=styles["Heading3"], fontSize=11, spaceBefore=15, 
        spaceAfter=8, fontName="Helvetica-Bold"
    )
    normal_style = ParagraphStyle(
        "normal", parent=styles["Normal"], fontSize=10, spaceAfter=6, 
        alignment=TA_JUSTIFY, fontName="Helvetica"
    )
    bold_normal_style = ParagraphStyle(
        "bold_normal", parent=styles["Normal"], fontSize=10, spaceAfter=6, 
        fontName="Helvetica-Bold"
    )

    elements = []

    # --- COVER / HEADER ---
    elements.append(Paragraph("UNIVERSITY GRANTS COMMISSION (UGC)", title_style))
    elements.append(Paragraph("PERFORMANCE BASED APPRAISAL SYSTEM (PBAS)", title_style))
    elements.append(Paragraph(f"Annual Self-Assessment for the Academic Year {appraisal.academic_year}", subtitle_style))
    
    # --- PART A: GENERAL INFORMATION ---
    elements.append(Paragraph("PART A: GENERAL INFORMATION AND ACADEMIC BACKGROUND", part_heading_style))
    
    faculty_level = getattr(faculty, 'academic_level', 'Level 10')
    faculty_doj = getattr(faculty, 'date_of_joining', 'Not Provided')
    
    info_data = [
        ["1.", "Name (in Block Letters)", f": {faculty.name.upper()}"],
        ["2.", "Father's/Mother's/Husband's Name", ": -"],
        ["3.", "Department", f": {faculty.department}"],
        ["4.", "Current Designation & Academic Level", f": {faculty.designation} ({faculty_level})"],
        ["5.", "Date of Last Promotion", ": -"],
        ["6.", "Which position and grade pay are you an applicant under CAS?", f": Promotion from {faculty_level}"],
        ["7.", "Date of Eligibility for promotion", ": -"],
        ["8.", "Date and Place of Birth", ": -"],
        ["9.", "Sex", ": -"],
        ["10.", "Marital Status", ": -"],
        ["11.", "Nationality", ": Indian"],
        ["12.", "Indicate whether belongs to SC/ST/OBC category", ": -"],
        ["13.", "Address for correspondence (with Pin code)", ": -"],
        ["14.", "Permanent Address (with Pin code)", ": -"],
        ["15.", "Telephone No", ": -"],
        ["16.", "Email", f": {faculty.email}"],
        ["17.", "Employee Code", f": {faculty.employee_code}"],
        ["18.", "Date of Joining", f": {faculty_doj}"],
    ]
    
    info_table = Table(info_data, colWidths=[10*mm, 80*mm, 80*mm], hAlign='LEFT')
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'), # Bold questions
    ]))
    elements.append(info_table)
    
    elements.append(PageBreak())

    # --- PART B: ACADEMIC PERFORMANCE INDICATORS ---
    elements.append(Paragraph("PART B: ACADEMIC PERFORMANCE INDICATORS", part_heading_style))
    elements.append(Paragraph("CATEGORY: I. TEACHING, LEARNING AND EVALUATION RELATED ACTIVITIES", section_style))
    
    elements.append(Paragraph(f"Score Claimed: {appraisal.category_i_score}", bold_normal_style))
    elements.append(Paragraph("(Details to be attached as Annexure I)", normal_style))
    
    elements.append(Spacer(1, 15))
    
    elements.append(Paragraph("CATEGORY: II. CO-CURRICULAR, EXTENSION, PROFESSIONAL DEVELOPMENT RELATED ACTIVITIES", section_style))
    
    elements.append(Paragraph(f"Score Claimed: {appraisal.category_ii_score}", bold_normal_style))
    elements.append(Paragraph("(Details to be attached as Annexure II)", normal_style))
    
    if activities:
        act_rows = [["S.No.", "Type of Activity", "Title / Detail", "Date", "API Score"]]
        for idx, a in enumerate(activities):
            act_rows.append([
                str(idx+1),
                a.activity_type.replace("_", " ").title(),
                Paragraph(a.title, normal_style),
                str(a.activity_date or "-"),
                f"{a.api_score}"
            ])
        act_table = Table(act_rows, colWidths=[10*mm, 40*mm, 80*mm, 20*mm, 20*mm])
        act_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e0e0e0")),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(act_table)
        
    elements.append(PageBreak())
    
    # --- PART C: RESEARCH AND ACADEMIC CONTRIBUTIONS ---
    elements.append(Paragraph("PART C: RESEARCH, PUBLICATIONS AND ACADEMIC CONTRIBUTIONS", part_heading_style))
    elements.append(Paragraph(f"Total Score Claimed in Category III: {appraisal.category_iii_score}", bold_normal_style))
    
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("III A. Research Papers Published in Journals / Conferences", section_style))
    
    if publications:
        pub_rows = [["S.No.", "Title with page nos.", "Journal / Conference", "ISSN/ISBN", "Peer Reviewed/UGC", "Score"]]
        for idx, p in enumerate(publications):
            is_ugc = "Yes" if p.is_ugc_care or p.is_scopus_or_wos else "No"
            pub_rows.append([
                str(idx+1),
                Paragraph(p.title, normal_style),
                Paragraph(p.journal_or_conference or "-", normal_style),
                "-",
                is_ugc,
                f"{p.api_score}"
            ])
        pub_table = Table(pub_rows, colWidths=[10*mm, 60*mm, 50*mm, 20*mm, 20*mm, 15*mm])
        pub_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e0e0e0")),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(pub_table)
    else:
        elements.append(Paragraph("No publications recorded for this assessment period.", normal_style))
        
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("SUMMARY OF API SCORES", part_heading_style))
    
    sum_rows = [
        ["Category", "Criteria", "API Score Claimed"],
        ["I", "Teaching, Learning and Evaluation", f"{appraisal.category_i_score}"],
        ["II", "Co-curricular, Extension, Professional Development", f"{appraisal.category_ii_score}"],
        ["III", "Research and Academic Contributions", f"{appraisal.category_iii_score}"],
        ["", "TOTAL API SCORE", f"{appraisal.total_api_score}"]
    ]
    
    sum_table = Table(sum_rows, colWidths=[20*mm, 110*mm, 40*mm])
    sum_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#333333")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(sum_table)

    elements.append(Spacer(1, 30))
    
    # --- PART D: DECLARATION ---
    elements.append(Paragraph("PART D: DECLARATION", part_heading_style))
    
    declaration_text = """
    I certify that the information provided is correct as per records available with the University and/or documents enclosed along with the duly filled PBAS proforma. 
    I understand that any false information will result in disciplinary action against me.
    """
    elements.append(Paragraph(declaration_text, normal_style))
    
    elements.append(Spacer(1, 40))
    
    sig_data = [
        [f"Place: _________________", f"Signature of the Faculty: _________________"],
        [f"Date: {time.strftime('%Y-%m-%d')}", f"Designation: {faculty.designation}"]
    ]
    sig_table = Table(sig_data, colWidths=[85*mm, 85*mm])
    sig_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(sig_table)
    
    elements.append(Spacer(1, 50))
    
    # --- PART E: FORWARDING ---
    elements.append(Paragraph("FORWARDING REMARKS", part_heading_style))
    
    forward_text = f"""
    The statements made by {faculty.name}, {faculty.designation} in the Department of {faculty.department} 
    are verified from the records of the institution and found to be correct.
    """
    elements.append(Paragraph(forward_text, normal_style))
    
    elements.append(Spacer(1, 50))
    
    hod_data = [
        ["Signature of HOD / Chairperson", "Signature of the Principal / Director"],
        ["Date: ______________", "Date: ______________"]
    ]
    hod_table = Table(hod_data, colWidths=[85*mm, 85*mm])
    hod_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(hod_table)

    doc.build(elements)
    return buffer.getvalue()