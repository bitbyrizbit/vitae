import io

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def build_appraisal_pdf(faculty, appraisal, publications, activities) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", parent=styles["Heading1"], fontSize=16, spaceAfter=4)
    sub_style = ParagraphStyle("sub", parent=styles["Normal"], fontSize=10, textColor=colors.grey)
    section_style = ParagraphStyle("section", parent=styles["Heading2"], fontSize=12, spaceBefore=14, spaceAfter=6)

    elements = []
    elements.append(Paragraph("Faculty Self-Appraisal Report", title_style))
    elements.append(Paragraph(f"Academic Year {appraisal.academic_year}", sub_style))
    elements.append(Spacer(1, 10))

    info_table = Table([
        ["Name", faculty.name, "Employee Code", faculty.employee_code],
        ["Department", faculty.department, "Designation", faculty.designation],
    ], colWidths=[45 * mm, 55 * mm, 35 * mm, 35 * mm])
    info_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.grey),
        ("TEXTCOLOR", (2, 0), (2, -1), colors.grey),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)

    elements.append(Paragraph("Academic Performance Indicator Summary", section_style))
    score_table = Table([
        ["Category", "Description", "Score"],
        ["I", "Teaching, learning and evaluation", f"{appraisal.category_i_score}"],
        ["II", "Co-curricular, extension and professional development", f"{appraisal.category_ii_score}"],
        ["III", "Research, publications and academic contributions", f"{appraisal.category_iii_score}"],
        ["", "Total API score", f"{appraisal.total_api_score}"],
    ], colWidths=[15 * mm, 110 * mm, 25 * mm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a1a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#dddddd")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(score_table)

    eligibility_label = "eligible for CAS review" if appraisal.eligible_for_cas == "eligible" else "below CAS threshold"
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(f"CAS status: {eligibility_label}", sub_style))

    if publications:
        elements.append(Paragraph("Research Publications", section_style))
        pub_rows = [["Title", "Venue", "Year", "Score"]]
        for p in publications:
            pub_rows.append([p.title, p.journal_or_conference or "-", str(p.year or "-"), f"{p.api_score}"])
        pub_table = Table(pub_rows, colWidths=[65 * mm, 50 * mm, 15 * mm, 20 * mm])
        pub_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e5e5e5")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        elements.append(pub_table)

    if activities:
        elements.append(Paragraph("Events, Seminars, Projects and Lectures", section_style))
        act_rows = [["Title", "Type", "Date", "Score"]]
        for a in activities:
            act_rows.append([a.title, a.activity_type.replace("_", " "), str(a.activity_date or "-"), f"{a.api_score}"])
        act_table = Table(act_rows, colWidths=[65 * mm, 40 * mm, 25 * mm, 20 * mm])
        act_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e5e5e5")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        elements.append(act_table)

    doc.build(elements)
    return buffer.getvalue()