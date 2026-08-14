from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Publication(Base):
    __tablename__ = "publications"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    journal_or_conference = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    citation_count = Column(Integer, default=0)
    pub_type = Column(String, default="journal")  # journal | conference | book_chapter | patent | book
    is_scopus_or_wos = Column(Boolean, default=False)
    is_ugc_care = Column(Boolean, default=False)
    source = Column(String, default="manual")  # manual | google_scholar
    scholar_pub_id = Column(String, nullable=True)

    api_score = Column(Float, default=0.0)

    created_at = Column(DateTime, default=func.now())

    faculty = relationship("User", back_populates="publications")