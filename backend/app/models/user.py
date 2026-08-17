from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    employee_code = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    department = Column(String, nullable=False)
    designation = Column(String, default="Assistant Professor")
    academic_level = Column(String, default="Level 10")
    date_of_joining = Column(String, nullable=True)
    role = Column(String, default="faculty")  # faculty | hod | iqac | admin
    scholar_profile_id = Column(String, nullable=True)
    joined_at = Column(DateTime, default=func.now())

    publications = relationship("Publication", back_populates="faculty", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="faculty", cascade="all, delete-orphan")
    appraisals = relationship("Appraisal", back_populates="faculty", cascade="all, delete-orphan")