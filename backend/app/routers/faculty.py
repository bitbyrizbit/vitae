from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.publication import Publication
from app.models.activity import Activity
from app.models.appraisal import Appraisal
from app.schemas import (
    PublicationCreate, PublicationOut, ActivityCreate, ActivityOut,
    AppraisalOut, ScholarLinkRequest,
)
from app.services.pbas_engine import score_publication, score_activity, compute_appraisal_totals
from app.services.scholar_scraper import fetch_scholar_publications
from app.services.pdf_generator import build_appraisal_pdf

router = APIRouter(prefix="/faculty", tags=["faculty"])


@router.get("/me/publications", response_model=list[PublicationOut])
def list_publications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Publication).filter(Publication.faculty_id == user.id).order_by(Publication.year.desc()).all()


@router.post("/me/publications", response_model=PublicationOut)
def add_publication(payload: PublicationCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pub = Publication(
        faculty_id=user.id,
        title=payload.title,
        journal_or_conference=payload.journal_or_conference,
        year=payload.year,
        citation_count=payload.citation_count,
        pub_type=payload.pub_type,
        is_scopus_or_wos=payload.is_scopus_or_wos,
        is_ugc_care=payload.is_ugc_care,
        source="manual",
        api_score=payload.claimed_score if payload.claimed_score is not None else score_publication(payload.pub_type, payload.is_scopus_or_wos, payload.citation_count),
    )
    db.add(pub)
    db.commit()
    db.refresh(pub)
    return pub


@router.delete("/me/publications/{pub_id}")
def delete_publication(pub_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pub = db.query(Publication).filter(Publication.id == pub_id, Publication.faculty_id == user.id).first()
    if not pub:
        raise HTTPException(status_code=404, detail="publication not found")
    db.delete(pub)
    db.commit()
    return {"deleted": True}


@router.put("/me/publications/{pub_id}", response_model=PublicationOut)
def edit_publication(pub_id: int, payload: PublicationCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pub = db.query(Publication).filter(Publication.id == pub_id, Publication.faculty_id == user.id).first()
    if not pub:
        raise HTTPException(status_code=404, detail="publication not found or access denied")
    pub.title = payload.title
    pub.journal_or_conference = payload.journal_or_conference
    pub.year = payload.year
    pub.citation_count = payload.citation_count
    pub.pub_type = payload.pub_type
    pub.is_scopus_or_wos = payload.is_scopus_or_wos
    pub.is_ugc_care = payload.is_ugc_care
    pub.api_score = payload.claimed_score if payload.claimed_score is not None else score_publication(payload.pub_type, payload.is_scopus_or_wos, payload.citation_count)
    db.commit()
    db.refresh(pub)
    return pub


@router.post("/me/scholar-link")
def link_scholar_profile(payload: ScholarLinkRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.scholar_profile_id = payload.scholar_profile_id
    db.commit()
    return {"linked": True, "scholar_profile_id": payload.scholar_profile_id}


@router.post("/me/scholar-sync", response_model=list[PublicationOut])
def sync_scholar_publications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.scholar_profile_id:
        raise HTTPException(status_code=400, detail="link a google scholar profile first")

    fetched = fetch_scholar_publications(user.scholar_profile_id)
    existing_ids = {
        p.scholar_pub_id for p in
        db.query(Publication).filter(Publication.faculty_id == user.id, Publication.source == "google_scholar").all()
    }

    new_rows = []
    for pub in fetched:
        if pub["scholar_pub_id"] in existing_ids:
            continue
        row = Publication(faculty_id=user.id, **pub)
        db.add(row)
        new_rows.append(row)

    db.commit()
    for row in new_rows:
        db.refresh(row)
    return new_rows


@router.get("/me/activities", response_model=list[ActivityOut])
def list_activities(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Activity).filter(Activity.faculty_id == user.id).order_by(Activity.activity_date.desc()).all()


@router.post("/me/activities", response_model=ActivityOut)
def add_activity(payload: ActivityCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = Activity(
        faculty_id=user.id,
        activity_type=payload.activity_type,
        title=payload.title,
        description=payload.description,
        role=payload.role,
        activity_date=payload.activity_date,
        proof_url=payload.proof_url,
        api_score=payload.claimed_score if payload.claimed_score is not None else score_activity(payload.activity_type),
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/me/activities/{activity_id}")
def delete_activity(activity_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.faculty_id == user.id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="activity not found")
    db.delete(activity)
    db.commit()
    return {"deleted": True}


@router.put("/me/activities/{activity_id}", response_model=ActivityOut)
def edit_activity(activity_id: int, payload: ActivityCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.faculty_id == user.id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="activity not found or access denied")
    activity.activity_type = payload.activity_type
    activity.title = payload.title
    activity.description = payload.description
    activity.role = payload.role
    activity.activity_date = payload.activity_date
    activity.proof_url = payload.proof_url
    activity.api_score = payload.claimed_score if payload.claimed_score is not None else score_activity(payload.activity_type)
    db.commit()
    db.refresh(activity)
    return activity


@router.post("/me/appraisal/{academic_year}", response_model=AppraisalOut)
def submit_appraisal(academic_year: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    publications = db.query(Publication).filter(Publication.faculty_id == user.id).all()
    activities = db.query(Activity).filter(Activity.faculty_id == user.id).all()

    totals = compute_appraisal_totals(publications, activities)

    appraisal = db.query(Appraisal).filter(
        Appraisal.faculty_id == user.id, Appraisal.academic_year == academic_year
    ).first()

    if appraisal:
        for key, value in totals.items():
            setattr(appraisal, key, value)
        appraisal.status = "submitted"
        appraisal.submitted_at = datetime.utcnow()
    else:
        appraisal = Appraisal(
            faculty_id=user.id, academic_year=academic_year, status="submitted",
            submitted_at=datetime.utcnow(), **totals,
        )
        db.add(appraisal)

    db.commit()
    db.refresh(appraisal)
    return appraisal


@router.get("/me/appraisal/{academic_year}", response_model=AppraisalOut)
def get_my_appraisal(academic_year: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    appraisal = db.query(Appraisal).filter(
        Appraisal.faculty_id == user.id, Appraisal.academic_year == academic_year
    ).first()
    if not appraisal:
        raise HTTPException(status_code=404, detail="no appraisal submitted for this year yet")
    return appraisal


@router.get("/me/appraisal/{academic_year}/pdf")
def download_my_appraisal_pdf(academic_year: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    appraisal = db.query(Appraisal).filter(
        Appraisal.faculty_id == user.id, Appraisal.academic_year == academic_year
    ).first()
    if not appraisal:
        raise HTTPException(status_code=404, detail="no appraisal submitted for this year yet")

    publications = db.query(Publication).filter(Publication.faculty_id == user.id).all()
    activities = db.query(Activity).filter(Activity.faculty_id == user.id).all()

    pdf_bytes = build_appraisal_pdf(user, appraisal, publications, activities)
    filename = f"{user.employee_code}_{academic_year}_appraisal.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )