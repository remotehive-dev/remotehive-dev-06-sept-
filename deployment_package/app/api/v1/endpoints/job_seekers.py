from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from loguru import logger
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import json

from app.database.database import get_db_session as get_db
from app.core.auth import get_current_user, get_admin
from app.database.services import JobSeekerService, UserService
from app.database.models import (
    User, JobSeeker, UserRole, JobPost, JobApplication, 
    SavedJob as SavedJobModel, Interview as InterviewModel, 
    AutoApplySettings as AutoApplySettingsModel
)
from app.schemas.job_seeker import (
    JobSeeker as JobSeekerSchema,
    JobSeekerCreate,
    JobSeekerUpdate,
    JobSeekerProfile,
    JobSeekerList,
    JobSeekerStats,
    JobSeekerDashboardStats,
    JobRecommendation,
    ProfileStrength
)
from app.schemas.saved_job import SavedJobResponse as SavedJob
from app.schemas.auto_apply import AutoApplySettingsResponse as AutoApplySettings
from app.schemas.interview import InterviewResponse as Interview
from app.schemas.saved_job import SavedJobCreate, SavedJobResponse, SavedJobList
from app.schemas.interview import InterviewResponse, InterviewList, InterviewStats
from app.schemas.auto_apply import AutoApplySettingsResponse, AutoApplySettingsUpdate, AutoApplyStats
from app.services.ai_service import ai_service

router = APIRouter()

@router.get("/profile", response_model=JobSeekerProfile)
async def get_job_seeker_profile(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current job seeker's profile"""
    # Check if user is a job seeker
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Job seeker role required."
        )
    
    job_seeker_service = JobSeekerService(db)
    job_seeker = job_seeker_service.get_job_seeker_by_user_id(current_user.get("id"))
    
    if not job_seeker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job seeker profile not found"
        )
    
    # Create profile with user info
    profile_data = {
        "id": job_seeker.id,
        "user_id": job_seeker.user_id,
        "skills": job_seeker.skills,
        "experience_level": job_seeker.experience_level,
        "preferred_locations": job_seeker.preferred_locations,
        "resume_url": job_seeker.resume_url,
        "portfolio_url": job_seeker.portfolio_url,
        "linkedin_url": job_seeker.linkedin_url,
        "github_url": job_seeker.github_url,
        "bio": job_seeker.bio,
        "is_actively_looking": job_seeker.is_actively_looking,
        "salary_expectation_min": job_seeker.salary_expectation_min,
        "salary_expectation_max": job_seeker.salary_expectation_max,
        "availability_date": job_seeker.availability_date,
        "created_at": job_seeker.created_at,
        "updated_at": job_seeker.updated_at,
        "user": {
            "id": current_user.get("id"),
            "email": current_user.get("email"),
            "first_name": current_user.get("full_name", "").split(" ")[0] if current_user.get("full_name") else "",
            "last_name": " ".join(current_user.get("full_name", "").split(" ")[1:]) if current_user.get("full_name") and len(current_user.get("full_name", "").split(" ")) > 1 else "",
            "is_active": current_user.get("is_active"),
            "is_verified": current_user.get("is_verified")
        }
    }
    return JobSeekerProfile(**profile_data)

@router.get("/dashboard-stats", response_model=JobSeekerDashboardStats)
async def get_dashboard_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for job seeker"""
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Job seeker role required."
        )
    
    try:
        # Get job seeker profile
        job_seeker = db.query(JobSeeker).filter(JobSeeker.user_id == current_user.get("id")).first()
        if not job_seeker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker profile not found"
            )
        
        # Get real statistics from database
        applications_sent = db.query(JobApplication).filter(
            JobApplication.job_seeker_id == job_seeker.id
        ).count()
        
        saved_jobs_count = db.query(SavedJobModel).filter(
            SavedJobModel.job_seeker_id == job_seeker.id
        ).count()
        
        interview_requests = db.query(InterviewModel).filter(
            InterviewModel.job_seeker_id == job_seeker.id
        ).count()
        
        # Calculate response rate
        total_applications = applications_sent
        responses = db.query(JobApplication).filter(
            and_(
                JobApplication.job_seeker_id == job_seeker.id,
                JobApplication.status.in_(['interview_scheduled', 'offer_received', 'rejected'])
            )
        ).count()
        
        response_rate = responses / total_applications if total_applications > 0 else 0.0
        
        # Get last activity (most recent application or saved job)
        last_application = db.query(JobApplication).filter(
            JobApplication.job_seeker_id == job_seeker.id
        ).order_by(JobApplication.applied_at.desc()).first()
        
        last_saved = db.query(SavedJobModel).filter(
            SavedJobModel.job_seeker_id == job_seeker.id
        ).order_by(SavedJobModel.saved_at.desc()).first()
        
        last_activity = None
        if last_application and last_saved:
            last_activity = max(last_application.applied_at, last_saved.saved_at)
        elif last_application:
            last_activity = last_application.applied_at
        elif last_saved:
            last_activity = last_saved.saved_at
        else:
            last_activity = datetime.now() - timedelta(days=30)
        
        stats = JobSeekerDashboardStats(
            applications_sent=applications_sent,
            saved_jobs=saved_jobs_count,
            profile_views=getattr(job_seeker, 'profile_views', 0) or 0,
            interview_requests=interview_requests,
            response_rate=response_rate,
            last_activity=last_activity
        )
        return stats
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard statistics"
        )

@router.get("/recommendations")
async def get_job_recommendations(
    limit: int = Query(10, ge=1, le=50),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get job recommendations for job seeker"""
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Job seeker role required."
        )
    
    try:
        # Get job seeker profile
        job_seeker = db.query(JobSeeker).filter(JobSeeker.user_id == current_user.get("id")).first()
        if not job_seeker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker profile not found"
            )
        
        # Get job recommendations using AI service
        recommendations = await ai_service.get_job_recommendations(
            job_seeker_id=job_seeker.id,
            db=db,
            limit=limit
        )
        
        return {"recommendations": recommendations}
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve job recommendations"
        )

@router.get("/saved-jobs", response_model=SavedJobList)
async def get_saved_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get saved jobs for the current user"""
    # Verify user is a job seeker
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only job seekers can access saved jobs"
        )
    
    try:
        # Get job seeker profile
        job_seeker = db.query(JobSeeker).filter(JobSeeker.user_id == current_user.get("id")).first()
        if not job_seeker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker profile not found"
            )
        
        # Get saved jobs with job post details
        saved_jobs_query = db.query(SavedJobModel).join(JobPost).filter(
            SavedJobModel.job_seeker_id == job_seeker.id
        ).order_by(SavedJobModel.saved_at.desc())
        
        total = saved_jobs_query.count()
        saved_jobs = saved_jobs_query.offset(skip).limit(limit).all()
        
        # Convert to response format
        saved_jobs_data = []
        for saved_job in saved_jobs:
            job_post = saved_job.job_post
            saved_jobs_data.append(SavedJobResponse(
                id=saved_job.id,
                job_post_id=saved_job.job_post_id,
                saved_at=saved_job.saved_at,
                notes=saved_job.notes,
                job_post={
                    "id": job_post.id,
                    "title": job_post.title,
                    "company": job_post.company,
                    "location": job_post.location,
                    "salary_min": job_post.salary_min,
                    "salary_max": job_post.salary_max,
                    "job_type": job_post.job_type,
                    "posted_at": job_post.posted_at
                }
            ))
        
        return SavedJobList(
            saved_jobs=saved_jobs_data,
            total=total,
            skip=skip,
            limit=limit
        )
    except Exception as e:
        logger.error(f"Error getting saved jobs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve saved jobs"
        )

@router.post("/saved-jobs", response_model=SavedJobResponse)
async def save_job(
    saved_job_data: SavedJobCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a job for the current user"""
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only job seekers can save jobs"
        )
    
    try:
        # Get job seeker profile
        job_seeker = db.query(JobSeeker).filter(JobSeeker.user_id == current_user.get("id")).first()
        if not job_seeker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker profile not found"
            )
        
        # Check if job post exists
        job_post = db.query(JobPost).filter(JobPost.id == saved_job_data.job_post_id).first()
        if not job_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job post not found"
            )
        
        # Check if already saved
        existing_saved = db.query(SavedJobModel).filter(
            and_(
                SavedJobModel.job_seeker_id == job_seeker.id,
                SavedJobModel.job_post_id == saved_job_data.job_post_id
            )
        ).first()
        
        if existing_saved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job already saved"
            )
        
        # Create saved job
        saved_job = SavedJobModel(
            job_seeker_id=job_seeker.id,
            job_post_id=saved_job_data.job_post_id,
            notes=saved_job_data.notes,
            saved_at=datetime.now()
        )
        
        db.add(saved_job)
        db.commit()
        db.refresh(saved_job)
        
        return SavedJobResponse(
            id=saved_job.id,
            job_post_id=saved_job.job_post_id,
            saved_at=saved_job.saved_at,
            notes=saved_job.notes,
            job_post={
                "id": job_post.id,
                "title": job_post.title,
                "company": job_post.company,
                "location": job_post.location,
                "salary_min": job_post.salary_min,
                "salary_max": job_post.salary_max,
                "job_type": job_post.job_type,
                "posted_at": job_post.posted_at
            }
        )
    except Exception as e:
        logger.error(f"Error saving job: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save job"
        )

@router.delete("/saved-jobs/{saved_job_id}")
async def unsave_job(
    saved_job_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a saved job"""
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only job seekers can unsave jobs"
        )
    
    try:
        # Get job seeker profile
        job_seeker = db.query(JobSeeker).filter(JobSeeker.user_id == current_user.get("id")).first()
        if not job_seeker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker profile not found"
            )
        
        # Find and delete saved job
        saved_job = db.query(SavedJobModel).filter(
            and_(
                SavedJobModel.id == saved_job_id,
                SavedJobModel.job_seeker_id == job_seeker.id
            )
        ).first()
        
        if not saved_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved job not found"
            )
        
        db.delete(saved_job)
        db.commit()
        
        return {"message": "Job unsaved successfully"}
    except Exception as e:
        logger.error(f"Error unsaving job: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unsave job"
        )

@router.get("/auto-apply-settings", response_model=AutoApplySettingsResponse)
async def get_auto_apply_settings(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get auto-apply settings for job seeker"""
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Job seeker role required."
        )
    
    try:
        # Get job seeker profile
        job_seeker = db.query(JobSeeker).filter(JobSeeker.user_id == current_user.get("id")).first()
        if not job_seeker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker profile not found"
            )
        
        # Get auto-apply settings
        settings = db.query(AutoApplySettingsModel).filter(
            AutoApplySettingsModel.job_seeker_id == job_seeker.id
        ).first()
        
        if not settings:
            # Create default settings if none exist
            settings = AutoApplySettingsModel(
                job_seeker_id=job_seeker.id,
                enabled=False,
                max_applications_per_day=5,
                keywords=[],
                excluded_companies=[],
                salary_min=None,
                location_preferences=[],
                job_types=[],
                experience_level=None
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)
        
        return AutoApplySettingsResponse(
            id=settings.id,
            enabled=settings.enabled,
            max_applications_per_day=settings.max_applications_per_day,
            keywords=settings.keywords or [],
            excluded_companies=settings.excluded_companies or [],
            salary_min=settings.salary_min,
            location_preferences=settings.location_preferences or [],
            job_types=settings.job_types or [],
            experience_level=settings.experience_level,
            created_at=settings.created_at,
            updated_at=settings.updated_at
        )
    except Exception as e:
        logger.error(f"Error getting auto-apply settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve auto-apply settings"
        )

@router.put("/auto-apply-settings", response_model=AutoApplySettingsResponse)
async def update_auto_apply_settings(
    settings_update: AutoApplySettingsUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update auto-apply settings for job seeker"""
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Job seeker role required."
        )
    
    try:
        # Get job seeker profile
        job_seeker = db.query(JobSeeker).filter(JobSeeker.user_id == current_user.get("id")).first()
        if not job_seeker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker profile not found"
            )
        
        # Get existing settings
        settings = db.query(AutoApplySettingsModel).filter(
            AutoApplySettingsModel.job_seeker_id == job_seeker.id
        ).first()
        
        if not settings:
            # Create new settings if none exist
            settings = AutoApplySettingsModel(job_seeker_id=job_seeker.id)
            db.add(settings)
        
        # Update settings
        update_data = settings_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        
        settings.updated_at = datetime.now()
        db.commit()
        db.refresh(settings)
        
        return AutoApplySettingsResponse(
            id=settings.id,
            enabled=settings.enabled,
            max_applications_per_day=settings.max_applications_per_day,
            keywords=settings.keywords or [],
            excluded_companies=settings.excluded_companies or [],
            salary_min=settings.salary_min,
            location_preferences=settings.location_preferences or [],
            job_types=settings.job_types or [],
            experience_level=settings.experience_level,
            created_at=settings.created_at,
            updated_at=settings.updated_at
        )
    except Exception as e:
        logger.error(f"Error updating auto-apply settings: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update auto-apply settings"
        )

@router.get("/profile-strength")
async def get_profile_strength(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get profile strength analysis for job seeker"""
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Job seeker role required."
        )
    
    try:
        # Get job seeker profile
        job_seeker = db.query(JobSeeker).filter(JobSeeker.user_id == current_user.get("id")).first()
        if not job_seeker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker profile not found"
            )
        
        # Get profile strength analysis using AI service
        profile_strength = await ai_service.analyze_profile_strength(
            job_seeker_id=job_seeker.id,
            db=db
        )
        
        return profile_strength
    except Exception as e:
        logger.error(f"Error getting profile strength: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze profile strength"
        )

@router.get("/interviews", response_model=InterviewList)
async def get_interviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get interviews for job seeker"""
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Job seeker role required."
        )
    
    try:
        # Get job seeker profile
        job_seeker = db.query(JobSeeker).filter(JobSeeker.user_id == current_user.get("id")).first()
        if not job_seeker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker profile not found"
            )
        
        # Build query
        interviews_query = db.query(InterviewModel).join(JobPost).filter(
            InterviewModel.job_seeker_id == job_seeker.id
        )
        
        # Apply status filter if provided
        if status_filter:
            interviews_query = interviews_query.filter(
                InterviewModel.status == status_filter
            )
        
        interviews_query = interviews_query.order_by(InterviewModel.scheduled_at.desc())
        
        total = interviews_query.count()
        interviews = interviews_query.offset(skip).limit(limit).all()
        
        # Convert to response format
        interviews_data = []
        for interview in interviews:
            job_post = interview.job_post
            interviews_data.append(InterviewResponse(
                id=interview.id,
                job_post_id=interview.job_post_id,
                interview_type=interview.interview_type,
                status=interview.status,
                scheduled_at=interview.scheduled_at,
                duration_minutes=interview.duration_minutes,
                meeting_link=interview.meeting_link,
                notes=interview.notes,
                feedback=interview.feedback,
                created_at=interview.created_at,
                updated_at=interview.updated_at,
                job_post={
                    "id": job_post.id,
                    "title": job_post.title,
                    "company": job_post.company,
                    "location": job_post.location
                }
            ))
        
        return InterviewList(
            interviews=interviews_data,
            total=total,
            skip=skip,
            limit=limit
        )
    except Exception as e:
        logger.error(f"Error getting interviews: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve interviews"
        )

@router.get("/interviews/stats", response_model=InterviewStats)
async def get_interview_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get interview statistics for job seeker"""
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Job seeker role required."
        )
    
    try:
        # Get job seeker profile
        job_seeker = db.query(JobSeeker).filter(JobSeeker.user_id == current_user.id).first()
        if not job_seeker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker profile not found"
            )
        
        # Get interview statistics
        total_interviews = db.query(InterviewModel).filter(
            InterviewModel.job_seeker_id == job_seeker.id
        ).count()
        
        scheduled_interviews = db.query(InterviewModel).filter(
            and_(
                InterviewModel.job_seeker_id == job_seeker.id,
                InterviewModel.status == 'scheduled'
            )
        ).count()
        
        completed_interviews = db.query(InterviewModel).filter(
            and_(
                InterviewModel.job_seeker_id == job_seeker.id,
                InterviewModel.status == 'completed'
            )
        ).count()
        
        # Get upcoming interview
        upcoming_interview = db.query(InterviewModel).filter(
            and_(
                InterviewModel.job_seeker_id == job_seeker.id,
                InterviewModel.status == 'scheduled',
                InterviewModel.scheduled_at > datetime.now()
            )
        ).order_by(InterviewModel.scheduled_at.asc()).first()
        
        return InterviewStats(
            total_interviews=total_interviews,
            scheduled_interviews=scheduled_interviews,
            completed_interviews=completed_interviews,
            upcoming_interview=upcoming_interview.scheduled_at if upcoming_interview else None
        )
    except Exception as e:
        logger.error(f"Error getting interview stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve interview statistics"
        )

@router.post("/career-advice")
async def get_career_advice(
    question: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized career advice using AI"""
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Job seeker role required."
        )
    
    try:
        # Get job seeker profile
        job_seeker = db.query(JobSeeker).filter(JobSeeker.user_id == current_user.get("id")).first()
        if not job_seeker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker profile not found"
            )
        
        # Get career advice using AI service
        advice = await ai_service.get_career_advice(
            job_seeker_id=job_seeker.id,
            question=question,
            db=db
        )
        
        return {"advice": advice}
    except Exception as e:
        logger.error(f"Error getting career advice: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get career advice"
        )

@router.post("/profile", response_model=JobSeekerSchema)
async def create_job_seeker_profile(
    job_seeker_data: JobSeekerCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create job seeker profile"""
    # Check if user is a job seeker
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Job seeker role required."
        )
    
    job_seeker_service = JobSeekerService(db)
    
    # Check if profile already exists
    existing_profile = job_seeker_service.get_job_seeker_by_user_id(current_user.get("id"))
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job seeker profile already exists"
        )
    
    try:
        # Create new job seeker profile
        job_seeker_data_dict = job_seeker_data.dict()
        job_seeker_data_dict["user_id"] = current_user.get("id")
        
        job_seeker = job_seeker_service.create_job_seeker(job_seeker_data_dict)
        
        logger.info(f"Created job seeker profile for user {current_user.get('id')}")
        return JobSeekerSchema(
            id=job_seeker.id,
            user_id=job_seeker.user_id,
            skills=job_seeker.skills,
            experience_level=job_seeker.experience_level,
            preferred_locations=job_seeker.preferred_locations,
            resume_url=job_seeker.resume_url,
            portfolio_url=job_seeker.portfolio_url,
            linkedin_url=job_seeker.linkedin_url,
            github_url=job_seeker.github_url,
            bio=job_seeker.bio,
            is_actively_looking=job_seeker.is_actively_looking,
            salary_expectation_min=job_seeker.salary_expectation_min,
            salary_expectation_max=job_seeker.salary_expectation_max,
            availability_date=job_seeker.availability_date,
            created_at=job_seeker.created_at,
            updated_at=job_seeker.updated_at
        )
        
    except Exception as e:
        logger.error(f"Failed to create job seeker profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job seeker profile"
        )

@router.put("/profile", response_model=JobSeekerSchema)
async def update_job_seeker_profile(
    job_seeker_data: JobSeekerUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update job seeker profile"""
    # Check if user is a job seeker
    if current_user.get("role") != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Job seeker role required."
        )
    
    job_seeker_service = JobSeekerService(db)
    job_seeker = job_seeker_service.get_job_seeker_by_user_id(current_user.get("id"))
    
    if not job_seeker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job seeker profile not found"
        )
    
    try:
        # Update job seeker profile
        update_data = job_seeker_data.dict(exclude_unset=True)
        
        updated_job_seeker = job_seeker_service.update_job_seeker(job_seeker.id, update_data)
        
        logger.info(f"Updated job seeker profile for user {current_user.get('id')}")
        return JobSeekerSchema(
            id=updated_job_seeker.id,
            user_id=updated_job_seeker.user_id,
            skills=updated_job_seeker.skills,
            experience_level=updated_job_seeker.experience_level,
            preferred_locations=updated_job_seeker.preferred_locations,
            resume_url=updated_job_seeker.resume_url,
            portfolio_url=updated_job_seeker.portfolio_url,
            linkedin_url=updated_job_seeker.linkedin_url,
            github_url=updated_job_seeker.github_url,
            bio=updated_job_seeker.bio,
            is_actively_looking=updated_job_seeker.is_actively_looking,
            salary_expectation_min=updated_job_seeker.salary_expectation_min,
            salary_expectation_max=updated_job_seeker.salary_expectation_max,
            availability_date=updated_job_seeker.availability_date,
            created_at=updated_job_seeker.created_at,
            updated_at=updated_job_seeker.updated_at
        )
        
    except Exception as e:
        logger.error(f"Failed to update job seeker profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update job seeker profile"
        )

@router.get("/", response_model=JobSeekerList)
async def get_job_seekers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    is_actively_looking: Optional[bool] = Query(None),
    experience_level: Optional[str] = Query(None),
    skills: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get list of job seekers (admin only)"""
    try:
        job_seeker_service = JobSeekerService(db)
        
        # Build filters
        filters = {}
        if is_actively_looking is not None:
            filters["is_actively_looking"] = is_actively_looking
        if experience_level:
            filters["experience_level"] = experience_level
        if skills:
            filters["skills_contains"] = skills
        if location:
            filters["location_contains"] = location
        
        # Get job seekers with pagination
        job_seekers, total = job_seeker_service.get_job_seekers_paginated(
            page=page,
            per_page=per_page,
            filters=filters
        )
        
        # Calculate pagination info
        pages = (total + per_page - 1) // per_page
        
        return JobSeekerList(
            job_seekers=[
                JobSeekerSchema(
                    id=js.id,
                    user_id=js.user_id,
                    skills=js.skills,
                    experience_level=js.experience_level,
                    preferred_locations=js.preferred_locations,
                    resume_url=js.resume_url,
                    portfolio_url=js.portfolio_url,
                    linkedin_url=js.linkedin_url,
                    github_url=js.github_url,
                    bio=js.bio,
                    is_actively_looking=js.is_actively_looking,
                    salary_expectation_min=js.salary_expectation_min,
                    salary_expectation_max=js.salary_expectation_max,
                    availability_date=js.availability_date,
                    created_at=js.created_at,
                    updated_at=js.updated_at
                ) for js in job_seekers
            ],
            total=total,
            page=page,
            per_page=per_page,
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"Failed to get job seekers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve job seekers"
        )

@router.get("/stats", response_model=JobSeekerStats)
async def get_job_seeker_stats(
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get job seeker statistics (admin only)"""
    try:
        job_seeker_service = JobSeekerService(db)
        
        # Total job seekers
        total_job_seekers = job_seeker_service.get_total_job_seekers()
        
        # Active job seekers
        active_job_seekers = job_seeker_service.get_active_job_seekers_count()
        
        # New job seekers this month
        month_ago = datetime.utcnow() - timedelta(days=30)
        new_job_seekers_this_month = job_seeker_service.get_new_job_seekers_count(month_ago)
        
        # Average applications per seeker
        avg_applications_per_seeker = job_seeker_service.get_avg_applications_per_seeker()
        
        # Top skills
        top_skills = job_seeker_service.get_top_skills(limit=5)
        
        # Experience level distribution
        experience_level_distribution = job_seeker_service.get_experience_level_distribution()
        
        return JobSeekerStats(
            total_job_seekers=total_job_seekers,
            active_job_seekers=active_job_seekers,
            new_job_seekers_this_month=new_job_seekers_this_month,
            avg_applications_per_seeker=avg_applications_per_seeker,
            top_skills=top_skills,
            experience_level_distribution=experience_level_distribution
        )
        
    except Exception as e:
        logger.error(f"Failed to get job seeker statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve job seeker statistics"
        )

@router.get("/{job_seeker_id}", response_model=JobSeekerProfile)
async def get_job_seeker_by_id(
    job_seeker_id: int,
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get job seeker by ID (admin only)"""
    job_seeker_service = JobSeekerService(db)
    job_seeker = job_seeker_service.get_job_seeker_with_user(job_seeker_id)
    
    if not job_seeker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job seeker not found"
        )
    
    # Create profile with user info
    profile_data = {
        "id": job_seeker.id,
        "user_id": job_seeker.user_id,
        "skills": job_seeker.skills,
        "experience_level": job_seeker.experience_level,
        "preferred_locations": job_seeker.preferred_locations,
        "resume_url": job_seeker.resume_url,
        "portfolio_url": job_seeker.portfolio_url,
        "linkedin_url": job_seeker.linkedin_url,
        "github_url": job_seeker.github_url,
        "bio": job_seeker.bio,
        "is_actively_looking": job_seeker.is_actively_looking,
        "salary_expectation_min": job_seeker.salary_expectation_min,
        "salary_expectation_max": job_seeker.salary_expectation_max,
        "availability_date": job_seeker.availability_date,
        "created_at": job_seeker.created_at,
        "updated_at": job_seeker.updated_at,
        "user": {
            "id": job_seeker.user.id,
            "email": job_seeker.user.email,
            "first_name": job_seeker.user.first_name,
            "last_name": job_seeker.user.last_name,
            "is_active": job_seeker.user.is_active,
            "is_verified": job_seeker.user.is_verified
        } if job_seeker.user else {}
    }
    
    return JobSeekerProfile(**profile_data)