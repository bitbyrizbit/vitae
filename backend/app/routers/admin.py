from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.models.publication import Publication
from app.models.activity import Activity
from app.models.appraisal import Appraisal
from app.schemas import AppraisalOut, UserOut
from app.services.pdf_generator import build_appraisal_pdf

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_ROLES = ("admin", "hod", "iqac")


@router.get("/appraisals", response_model=list[AppraisalOut])
def list_all_appraisals(
    sort_by: str = Query("submitted_at", pattern="^(name|employee_code|submitted_at|total_api_score)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    department: str | None = None,
    user=Depends(require_role(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    query = db.query(Appraisal).join(User, Appraisal.faculty_id == User.id)

    if department:
        query = query.filter(User.department == department)

    if sort_by == "name":
        column = User.name
    elif sort_by == "employee_code":
        column = User.employee_code
    elif sort_by == "total_api_score":
        column = Appraisal.total_api_score
    else:
        column = Appraisal.submitted_at

    query = query.order_by(column.desc() if order == "desc" else column.asc())
    return query.all()


@router.get("/faculty", response_model=list[UserOut])
def list_faculty(user=Depends(require_role(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == "faculty").order_by(User.name.asc()).all()


@router.get("/appraisals/{appraisal_id}/pdf")
def download_appraisal_pdf(appraisal_id: int, user=Depends(require_role(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    appraisal = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not appraisal:
        raise HTTPException(status_code=404, detail="appraisal not found")

    faculty = db.query(User).filter(User.id == appraisal.faculty_id).first()
    publications = db.query(Publication).filter(Publication.faculty_id == faculty.id).all()
    activities = db.query(Activity).filter(Activity.faculty_id == faculty.id).all()

    pdf_bytes = build_appraisal_pdf(faculty, appraisal, publications, activities)
    filename = f"{faculty.employee_code}_{appraisal.academic_year}_appraisal.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.patch("/appraisals/{appraisal_id}/review")
def review_appraisal(appraisal_id: int, decision: str, note: str | None = None,
                      user=Depends(require_role(*ADMIN_ROLES)), db: Session = Depends(get_db)):
    if decision not in ("hod_approved", "iqac_approved", "rejected"):
        raise HTTPException(status_code=400, detail="invalid decision")

    appraisal = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not appraisal:
        raise HTTPException(status_code=404, detail="appraisal not found")

    appraisal.status = decision
    appraisal.reviewer_note = note
    db.commit()
    db.refresh(appraisal)
    return {"updated": True, "status": appraisal.status}