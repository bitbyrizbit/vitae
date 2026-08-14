from sqlalchemy import Column, Integer, String, Float, Text, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    activity_type = Column(String, nullable=False)  # seminar_attended, workshop_organized, project_pi_major, etc
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    role = Column(String, nullable=True)
    activity_date = Column(Date, nullable=True)
    proof_url = Column(String, nullable=True)

    api_score = Column(Float, default=0.0)

    created_at = Column(DateTime, default=func.now())

    faculty = relationship("User", back_populates="activities")