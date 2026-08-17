from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    employee_code: str
    password: str
    department: str
    designation: str = "Assistant Professor"
    academic_level: str = "Level 10"
    date_of_joining: Optional[str] = None
    role: str = "faculty"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    employee_code: str
    department: str
    designation: str
    academic_level: str
    date_of_joining: Optional[str] = None
    role: str
    scholar_profile_id: Optional[str] = None

    class Config:
        from_attributes = True


class PublicationCreate(BaseModel):
    title: str
    journal_or_conference: Optional[str] = None
    year: Optional[int] = None
    citation_count: int = 0
    pub_type: str = "journal"
    is_scopus_or_wos: bool = False
    is_ugc_care: bool = False
    claimed_score: Optional[float] = None


class PublicationOut(PublicationCreate):
    id: int
    faculty_id: int
    source: str
    api_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityCreate(BaseModel):
    activity_type: str
    title: str
    description: Optional[str] = None
    role: Optional[str] = None
    activity_date: Optional[date] = None
    proof_url: Optional[str] = None
    claimed_score: Optional[float] = None


class ActivityOut(ActivityCreate):
    id: int
    faculty_id: int
    api_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class AppraisalOut(BaseModel):
    id: int
    faculty_id: int
    academic_year: str
    category_i_score: float
    category_ii_score: float
    category_iii_score: float
    total_api_score: float
    eligible_for_cas: str
    status: str
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminAppraisalOut(BaseModel):
    id: int
    faculty_id: int
    faculty_name: str
    employee_code: str
    department: str
    academic_year: str
    category_i_score: float
    category_ii_score: float
    category_iii_score: float
    total_api_score: float
    eligible_for_cas: str
    status: str
    submitted_at: Optional[datetime] = None

    class Config:
        
        from_attributes = True
class ScholarLinkRequest(BaseModel):
    scholar_profile_id: str


class ResumeParseResult(BaseModel):
    publications: list[PublicationCreate] = []
    activities: list[ActivityCreate] = []