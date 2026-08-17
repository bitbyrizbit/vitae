from datetime import datetime
from pydantic import BaseModel

class CasReadinessResponse(BaseModel):
    current_level: str
    target_level: str
    years_of_service_required: int
    years_of_service_completed: int
    publications_required: int
    publications_completed: int
    activities_required: int
    activities_completed: int
    is_ready: bool
    progress_percentage: int

def evaluate_cas_readiness(user, publications, activities) -> CasReadinessResponse:
    # Default assumptions if missing
    current_level = user.academic_level if hasattr(user, "academic_level") and user.academic_level else "Level 10"
    
    # Calculate years of service
    years_completed = 0
    if hasattr(user, "date_of_joining") and user.date_of_joining:
        try:
            # Assuming YYYY-MM-DD
            doj = datetime.strptime(user.date_of_joining, "%Y-%m-%d")
            years_completed = (datetime.now() - doj).days // 365
        except:
            years_completed = 2 # fallback guess
            
    pub_count = len(publications)
    act_count = len(activities)
    
    # Rules based on UGC 2018
    # AL 10 to AL 11: 4 years (PhD), 1 Pub, 1 Activity
    # AL 11 to AL 12: 5 years, 2 Pubs, 1 Activity
    # AL 12 to AL 13A: 3 years, 3 Pubs, 1 Activity
    
    if current_level == "Level 10":
        target = "Level 11"
        req_years = 4
        req_pubs = 1
        req_acts = 1
    elif current_level == "Level 11":
        target = "Level 12"
        req_years = 5
        req_pubs = 2
        req_acts = 1
    elif current_level == "Level 12":
        target = "Level 13A"
        req_years = 3
        req_pubs = 3
        req_acts = 1
    else:
        # Default/Max level reached
        return CasReadinessResponse(
            current_level=current_level,
            target_level="Maximum Level Reached",
            years_of_service_required=0,
            years_of_service_completed=years_completed,
            publications_required=0,
            publications_completed=pub_count,
            activities_required=0,
            activities_completed=act_count,
            is_ready=True,
            progress_percentage=100
        )
        
    y_progress = min(1.0, years_completed / req_years)
    p_progress = min(1.0, pub_count / req_pubs)
    a_progress = min(1.0, act_count / req_acts)
    
    progress = int(((y_progress + p_progress + a_progress) / 3) * 100)
    is_ready = progress >= 100
    
    return CasReadinessResponse(
        current_level=current_level,
        target_level=target,
        years_of_service_required=req_years,
        years_of_service_completed=years_completed,
        publications_required=req_pubs,
        publications_completed=pub_count,
        activities_required=req_acts,
        activities_completed=act_count,
        is_ready=is_ready,
        progress_percentage=progress
    )
