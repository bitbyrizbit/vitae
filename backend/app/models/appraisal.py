from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Appraisal(Base):
    __tablename__ = "appraisals"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    academic_year = Column(String, nullable=False)
    category_i_score = Column(Float, default=0.0)
    category_ii_score = Column(Float, default=0.0)
    category_iii_score = Column(Float, default=0.0)
    total_api_score = Column(Float, default=0.0)
    eligible_for_cas = Column(String, default="pending")

    status = Column(String, default="draft")  # draft | submitted | hod_approved | iqac_approved | rejected
    reviewer_note = Column(String, nullable=True)

    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

    faculty = relationship("User", back_populates="appraisals")