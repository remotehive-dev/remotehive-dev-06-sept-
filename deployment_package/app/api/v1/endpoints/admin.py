from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from loguru import logger
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.services.admin_service import AdminService
from app.core.auth import get_current_active_user, get_admin, get_super_admin, require_roles
from app.database.services import JobPostService, EmployerService
from app.database.models import User, JobPost, JobApplication, AdminLog
import re
from app.schemas.admin import (
    DashboardStats, AdminLog, AdminLogCreate, SystemSetting, SystemSettingUpdate,
    UserSuspensionCreate, UserSuspension, AnnouncementCreate, Announcement,
    ReportCreate, Report, ReportUpdate, AnalyticsFilter, DailyStats,
    SystemHealthCheck, BulkActionRequest, BulkActionResult, PaginatedResponse,
    AdminNotificationCreate, AdminNotification
)
from app.schemas.user import User, UserUpdate
from app.schemas.job_post import JobPost as JobPostSchema, JobPostCreate
from app.api.v1.endpoints.slack_admin import router as slack_router
from app.autoscraper import endpoints as autoscraper_endpoints

router = APIRouter()

# Include Slack admin routes
router.include_router(slack_router, prefix="/slack", tags=["admin-slack"])

# Include AutoScraper admin routes
router.include_router(autoscraper_endpoints.router, prefix="/autoscraper", tags=["admin-autoscraper"])

@router.get("/dashboard", response_model=DashboardStats)
async def get_admin_dashboard(
    current_user: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    try:
        admin_service = AdminService(db)
        stats = await admin_service.get_dashboard_stats()
        await admin_service.log_admin_action(
            admin_user_id=current_user["id"],
            log_data=AdminLogCreate(
                action="view_dashboard",
                target_table="dashboard",
                target_id=None
            )
        )
        return stats
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard statistics"
        )

@router.get("/system-health", response_model=SystemHealthCheck)
async def get_system_health(
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get system health status"""
    try:
        admin_service = AdminService(db)
        health = await admin_service.check_system_health()
        return health
    except Exception as e:
        logger.error(f"Failed to get system health: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve system health"
        )

# User Management Endpoints
@router.get("/users", response_model=PaginatedResponse)
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    user_status: Optional[str] = Query(None),
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get paginated list of users with filtering"""
    try:
        offset = (page - 1) * limit
        
        # Build MongoDB query
        query_filter = {}
        
        if search:
            query_filter["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"full_name": {"$regex": search, "$options": "i"}}
            ]
        if role:
            query_filter["role"] = role
        if user_status:
            query_filter["is_active"] = user_status == "active"
            
        # Get total count
        total = await User.count(query_filter)
        
        # Get paginated data
        users = await User.find(query_filter).sort("-created_at").skip(offset).limit(limit).to_list()
        
        # Convert to dict format for response
        users_data = [user.dict() for user in users]
        
        return PaginatedResponse(
            items=users_data,
            total=total,
            page=page,
            limit=limit,
            pages=(total + limit - 1) // limit
        )
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch users"
        )

@router.get("/users/{user_id}", response_model=User)
async def get_user_by_id(
    user_id: str,
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get user details by ID"""
    try:
        user = await User.find_one({"_id": user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user.dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user"
        )

@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Update user details"""
    try:
        # Check if user exists
        user = await User.find_one({"_id": user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update user
        update_data = user_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        await User.find_one_and_update({"_id": user_id}, {"$set": update_data})
        updated_user = await User.find_one({"_id": user_id})
        
        # Log admin action
        admin_service = AdminService(db)
        await admin_service.log_admin_action(
            admin_user_id=current_admin["id"],
            log_data=AdminLogCreate(
                action="user_update",
                target_table="users",
                target_id=user_id,
                notes=f"Updated user {user_id}: {list(update_data.keys())}"
            )
        )
        
        return updated_user.dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )

@router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    suspension_data: UserSuspensionCreate,
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Suspend a user account"""
    try:
        admin_service = AdminService(db)
        suspension = await admin_service.suspend_user(
            user_id, suspension_data, current_admin["id"]
        )
        return suspension
    except Exception as e:
        logger.error(f"Error suspending user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to suspend user"
        )

@router.post("/users/{user_id}/unsuspend")
async def unsuspend_user(
    user_id: str,
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Unsuspend a user account"""
    try:
        admin_service = AdminService(db)
        await admin_service.unsuspend_user(user_id, current_admin["id"])
        return {"message": "User unsuspended successfully"}
    except Exception as e:
        logger.error(f"Error unsuspending user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unsuspend user"
        )

@router.post("/users/bulk-action", response_model=BulkActionResult)
async def bulk_user_action(
    bulk_request: BulkActionRequest,
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Perform bulk actions on users"""
    try:
        admin_service = AdminService(db)
        result = await admin_service.bulk_user_action(
            bulk_request.user_ids, bulk_request.action, current_admin["id"]
        )
        return result
    except Exception as e:
        logger.error(f"Error performing bulk action: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform bulk action"
        )

# System Settings Endpoints
@router.get("/settings", response_model=List[SystemSetting])
async def get_system_settings(
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get all system settings"""
    try:
        settings = await SystemSettings.find().to_list()
        return [setting.dict() for setting in settings]
    except Exception as e:
        logger.error(f"Error fetching system settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch system settings"
        )

@router.put("/settings/{setting_key}", response_model=SystemSetting)
async def update_system_setting(
    setting_key: str,
    setting_update: SystemSettingUpdate,
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Update a system setting"""
    try:
        # Check if setting exists
        setting = await SystemSettings.find_one({"key": setting_key})
        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found"
            )
        
        # Update setting
        update_data = {
            "value": setting_update.value,
            "updated_at": datetime.utcnow()
        }
        
        await SystemSettings.find_one_and_update({"key": setting_key}, {"$set": update_data})
        updated_setting = await SystemSettings.find_one({"key": setting_key})
        
        # Log admin action
        admin_service = AdminService(db)
        await admin_service.log_admin_action(
            admin_user_id=current_admin["id"],
            log_data=AdminLogCreate(
                action="setting_update",
                target_table="system_settings",
                target_id=setting_key,
                notes=f"Updated setting {setting_key} to {setting_update.value}"
            )
        )
        
        return updated_setting.dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating setting {setting_key}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update setting"
        )

# Announcements Endpoints
@router.get("/announcements", response_model=List[Announcement])
async def get_announcements(
    active_only: bool = Query(False),
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get announcements"""
    try:
        query_filter = {}
        
        if active_only:
            now = datetime.utcnow()
            query_filter = {
                "is_active": True,
                "start_date": {"$lte": now},
                "end_date": {"$gte": now}
            }
            
        announcements = await Announcement.find(query_filter).sort("-created_at").to_list()
        return [announcement.dict() for announcement in announcements]
    except Exception as e:
        logger.error(f"Error fetching announcements: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch announcements"
        )

@router.post("/announcements", response_model=Announcement)
async def create_announcement(
    announcement_data: AnnouncementCreate,
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Create a new announcement"""
    try:
        admin_service = AdminService(db)
        announcement = await admin_service.create_announcement(
            announcement_data, current_admin["id"]
        )
        return announcement
    except Exception as e:
        logger.error(f"Error creating announcement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create announcement"
        )

# Analytics Endpoints
@router.get("/analytics/platform")
async def get_platform_analytics(
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get platform analytics overview"""
    try:
        admin_service = AdminService(db)
        stats = await admin_service.get_dashboard_stats()
        
        # Calculate real employer and job seeker counts
        from app.database.models import User
        total_employers = db.query(User).filter(User.role == 'employer').count()
        total_job_seekers = db.query(User).filter(User.role == 'job_seeker').count()
        
        # Calculate growth rates based on previous week
        from datetime import datetime, timedelta
        two_weeks_ago = datetime.now() - timedelta(days=14)
        one_week_ago = datetime.now() - timedelta(days=7)
        
        prev_week_employers = db.query(User).filter(
            User.role == 'employer',
            User.created_at >= two_weeks_ago,
            User.created_at < one_week_ago
        ).count()
        
        current_week_employers = db.query(User).filter(
            User.role == 'employer',
            User.created_at >= one_week_ago
        ).count()
        
        prev_week_applications = db.query(JobApplication).filter(
            JobApplication.created_at >= two_weeks_ago,
            JobApplication.created_at < one_week_ago
        ).count()
        
        current_week_applications = db.query(JobApplication).filter(
            JobApplication.created_at >= one_week_ago
        ).count()
        
        # Calculate growth rates
        employer_growth_rate = ((current_week_employers - prev_week_employers) / prev_week_employers * 100) if prev_week_employers > 0 else 0
        application_growth_rate = ((current_week_applications - prev_week_applications) / prev_week_applications * 100) if prev_week_applications > 0 else 0
        
        # Transform dashboard stats to match frontend expectations
        analytics_data = {
            "totalUsers": stats.total_users,
            "totalEmployers": total_employers,
            "totalJobSeekers": total_job_seekers,
            "totalJobPosts": stats.total_jobs,
            "activeJobPosts": stats.active_jobs,
            "pendingJobPosts": stats.pending_applications,
            "totalApplications": stats.total_applications,
            "monthlyRevenue": stats.revenue_this_month,
            "userGrowthRate": stats.new_users_this_week,
            "employerGrowthRate": round(employer_growth_rate, 2),
            "jobPostGrowthRate": stats.new_jobs_this_week,
            "applicationGrowthRate": round(application_growth_rate, 2),
            "revenueGrowthRate": 0,  # TODO: Implement when payment system is available
            "topPerformingEmployers": [],  # TODO: Implement based on job post metrics
            "topPerformingJobSeekers": [],  # TODO: Implement based on application success
            "industryDistribution": {},  # TODO: Implement based on job categories
            "locationDistribution": {},  # TODO: Implement based on job locations
            "skillsDistribution": {},  # TODO: Implement based on job requirements
            "remoteJobsPercentage": 0,  # TODO: Implement based on job type analysis
            "averageSalary": 0,  # TODO: Implement based on salary data
            "conversionRate": stats.conversion_rate
        }
        
        return analytics_data
    except Exception as e:
        logger.error(f"Error fetching platform analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch platform analytics"
        )

@router.get("/jobposts")
async def get_admin_job_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    job_status: str = Query(None),
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get all job posts for admin panel"""
    try:
        from app.database.services import JobPostService
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get job posts with filters
        # If no status specified, show all statuses (pass None to bypass default 'active' filter)
        status_filter = job_status if job_status is not None else None
        job_posts = JobPostService.get_job_posts(
            db,
            search=search,
            status=status_filter,
            skip=offset,
            limit=limit
        )
        
        # Get total count (simplified for now)
        total = len(job_posts) if job_posts else 0
        
        return {
            "data": job_posts,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error fetching job posts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch job posts"
        )

@router.post("/jobposts", response_model=JobPostSchema)
async def create_admin_job_post(
    job_data: JobPostCreate,
    current_user: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Create a new job post (admin only)"""
    try:
        # Admin users must specify employer_id when creating jobs
        if not job_data.employer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin users must specify employer_id when creating jobs"
            )
        
        # Verify employer exists
        employer = EmployerService.get_employer_by_id(db, job_data.employer_id)
        if not employer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employer not found"
            )
        
        # Prepare job post data
        job_post_data = job_data.dict(exclude_unset=True)
        # Remove employer_id from job_post_data since it's passed separately to create_job_post
        job_post_data.pop("employer_id", None)
        
        # Slug generation removed - not needed for JobPost model
        
        # Set initial status for admin-created jobs (can be approved immediately)
        job_post_data["status"] = "approved"
        job_post_data["approved_at"] = datetime.utcnow()
        job_post_data["approved_by"] = current_user["id"]
        
        # Create job post
        job_post_service = JobPostService()
        job_post = job_post_service.create_job_post(db, employer.id, job_post_data)
        
        logger.info(f"Job post created and approved by admin: {job_post.id} for employer {employer.id}")
        return JobPostSchema.from_orm(job_post)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating job post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job post"
        )

@router.get("/jobposts/{job_id}", response_model=JobPostSchema)
async def get_admin_job_post(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get a specific job post by ID (admin only)"""
    try:
        job_post = JobPostService.get_job_post_by_id(db, job_id)
        if not job_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job post not found"
            )
        return JobPostSchema.from_orm(job_post)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job post {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch job post"
        )

@router.put("/jobposts/{job_id}", response_model=JobPostSchema)
async def update_admin_job_post(
    job_id: str,
    job_data: JobPostCreate,
    current_user: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Update a job post (admin only)"""
    try:
        # Check if job post exists
        existing_job = JobPostService.get_job_post_by_id(db, job_id)
        if not existing_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job post not found"
            )
        
        # Prepare update data
        update_data = job_data.dict(exclude_unset=True)
        update_data.pop("employer_id", None)  # Don't allow changing employer
        update_data["updated_at"] = datetime.utcnow()
        
        # Update job post
        job_post_service = JobPostService()
        updated_job = job_post_service.update_job_post(db, job_id, update_data)
        
        logger.info(f"Job post updated by admin: {job_id}")
        return JobPostSchema.from_orm(updated_job)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating job post {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update job post"
        )

@router.delete("/jobposts/{job_id}")
async def delete_admin_job_post(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Delete a job post (admin only)"""
    try:
        # Check if job post exists
        existing_job = JobPostService.get_job_post_by_id(db, job_id)
        if not existing_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job post not found"
            )
        
        # Delete job post
        job_post_service = JobPostService()
        job_post_service.delete_job_post(db, job_id)
        
        logger.info(f"Job post deleted by admin: {job_id}")
        return {"message": "Job post deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting job post {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete job post"
        )

@router.patch("/jobposts/{job_id}/status")
async def update_job_post_status(
    job_id: str,
    status_data: dict,
    current_user: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Update job post status (admin only)"""
    try:
        # Check if job post exists
        existing_job = JobPostService.get_job_post_by_id(db, job_id)
        if not existing_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job post not found"
            )
        
        new_status = status_data.get("status")
        if not new_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status is required"
            )
        
        # Update status
        update_data = {
            "status": new_status,
            "updated_at": datetime.utcnow()
        }
        
        if new_status == "approved":
            update_data["approved_at"] = datetime.utcnow()
            update_data["approved_by"] = current_user["id"]
        
        job_post_service = JobPostService()
        updated_job = job_post_service.update_job_post(db, job_id, update_data)
        
        logger.info(f"Job post status updated by admin: {job_id} -> {new_status}")
        return JobPostSchema.from_orm(updated_job)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating job post status {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update job post status"
        )

@router.get("/jobposts/stats")
async def get_job_posts_stats(
    current_user: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get job posts statistics (admin only)"""
    try:
        # Get basic stats
        total_jobs = len(JobPostService.get_job_posts(db, status=None))
        active_jobs = len(JobPostService.get_job_posts(db, status="active"))
        approved_jobs = len(JobPostService.get_job_posts(db, status="approved"))
        draft_jobs = len(JobPostService.get_job_posts(db, status="draft"))
        
        return {
            "total": total_jobs,
            "active": active_jobs,
            "approved": approved_jobs,
            "draft": draft_jobs,
            "pending": 0  # Add if you have pending status
        }
        
    except Exception as e:
        logger.error(f"Error fetching job posts stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch job posts statistics"
        )

@router.get("/employers")
async def get_admin_employers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get all employers for admin panel"""
    try:
        from app.database.services import EmployerService
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get employers with filters
        employers = EmployerService.get_employers(
            db,
            search=search,
            skip=offset,
            limit=limit
        )
        
        # Get total count (simplified for now)
        total = len(employers) if employers else 0
        
        return {
            "data": employers,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error fetching employers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch employers"
        )

@router.get("/job-seekers")
async def get_admin_job_seekers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get all job seekers for admin panel"""
    try:
        from app.database.services import JobSeekerService
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get job seekers with filters
        job_seekers = JobSeekerService.get_job_seekers(
            db=db,
            search=search,
            skip=offset,
            limit=limit
        )
        
        # Get total count (simplified for now)
        total = len(job_seekers) if job_seekers else 0
        
        return {
            "data": job_seekers,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error fetching job seekers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch job seekers"
        )

@router.get("/analytics/daily", response_model=List[DailyStats])
async def get_daily_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """Get daily analytics data"""
    try:
        admin_service = AdminService(db)
        analytics = await admin_service.get_daily_analytics(start_date, end_date)
        return analytics
    except Exception as e:
        logger.error(f"Error fetching daily analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analytics data"
        )

# Admin Logs Endpoints
@router.get("/logs", response_model=List[AdminLog])
async def get_admin_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    action: Optional[str] = Query(None),
    admin_user_id: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_admin: Dict[str, Any] = Depends(get_super_admin),
    db: Session = Depends(get_db)
):
    """Get admin activity logs"""
    try:
        offset = (page - 1) * per_page
        
        # Build MongoDB query
        query_filter = {}
        
        if action:
            query_filter["action"] = action
        if admin_user_id:
            query_filter["admin_user_id"] = admin_user_id
        if start_date:
            query_filter["created_at"] = {"$gte": start_date}
        if end_date:
            if "created_at" in query_filter:
                query_filter["created_at"]["$lte"] = end_date
            else:
                query_filter["created_at"] = {"$lte": end_date}
            
        # Get total count
        total = await AdminLog.count(query_filter)
        
        # Get paginated data
        logs = await AdminLog.find(query_filter).sort("-created_at").skip(offset).limit(per_page).to_list()
        
        return PaginatedResponse(
            items=[log.dict() for log in logs],
            total=total,
            page=page,
            limit=per_page,
            pages=(total + per_page - 1) // per_page
        )
    except Exception as e:
        logger.error(f"Error fetching admin logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch admin logs"
        )