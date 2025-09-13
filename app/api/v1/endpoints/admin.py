from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from loguru import logger
from beanie import PydanticObjectId
# from app.models.mongodb_models import SystemSetting, Announcement, AdminLog  # These models don't exist yet
from datetime import datetime, timedelta
from app.services.admin_service import AdminService
from app.core.auth import get_current_active_user, get_admin, get_super_admin, require_roles
from app.database.services import JobPostService, EmployerService
from app.models.mongodb_models import User, JobPost, JobApplication
from app.database.database import get_mongodb_session as get_db
from motor.motor_asyncio import AsyncIOMotorDatabase
# AdminLog model not available in MongoDB structure
import re
# Supabase removed - using MongoDB only
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
    db: AsyncIOMotorDatabase = Depends(get_db)
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
    db: AsyncIOMotorDatabase = Depends(get_db)
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get paginated list of users with filtering"""
    try:
        # TODO: Implement MongoDB user query using User model
        # Replace with: User.find() with appropriate filters
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="User management with MongoDB not yet implemented"
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get user details by ID"""
    try:
        # TODO: Implement MongoDB user query using User.get(user_id)
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="User management with MongoDB not yet implemented"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user"
        )

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update user information"""
    try:
        # TODO: Implement MongoDB user update using User.get(user_id) and save()
        # TODO: Add admin action logging with MongoDB
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="User management with MongoDB not yet implemented"
        )
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
    db: AsyncIOMotorDatabase = Depends(get_db)
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
    db: AsyncIOMotorDatabase = Depends(get_db)
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
    db: AsyncIOMotorDatabase = Depends(get_db)
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
@router.get("/settings")
async def get_system_settings(
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all system settings"""
    try:
        # TODO: Implement MongoDB query using SystemSetting.find_all()
        settings = await SystemSetting.find_all().to_list()
        return [setting.dict() for setting in settings]
    except Exception as e:
        logger.error(f"Error fetching system settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch system settings"
        )

@router.put("/settings/{setting_key}")
async def update_system_setting(
    setting_key: str,
    setting_update: SystemSettingUpdate,
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update a system setting"""
    try:
        # TODO: Implement MongoDB update using SystemSetting.find_one({"key": setting_key})
        # TODO: Add admin action logging with MongoDB
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="System settings with MongoDB not yet implemented"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating setting {setting_key}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update setting"
        )

# Announcements Endpoints
@router.get("/announcements")
async def get_announcements(
    active_only: bool = Query(False),
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get announcements"""
    try:
        # TODO: Implement MongoDB query using Announcement.find().sort("-created_at")
        if active_only:
            now = datetime.utcnow()
            announcements = await Announcement.find(
                Announcement.is_active == True,
                Announcement.start_date <= now,
                Announcement.end_date >= now
            ).sort("-created_at").to_list()
        else:
            announcements = await Announcement.find_all().sort("-created_at").to_list()
        
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new announcement"""
    try:
        # TODO: Implement MongoDB-based announcement creation
        # TODO: Replace AdminService(supabase) with MongoDB operations
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Announcement creation with MongoDB not yet implemented"
        )
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get platform analytics overview"""
    try:
        admin_service = AdminService(db)
        stats = await admin_service.get_dashboard_stats()
        
        # Calculate real employer and job seeker counts
        # TODO: MongoDB Migration - Update imports to use MongoDB models
        # from app.database.models import User
        from app.models.mongodb_models import User
        total_employers = await User.find(User.role == 'employer').count()
        total_job_seekers = await User.find(User.role == 'job_seeker').count()
        
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all job posts for admin panel"""
    try:
        from app.database.services import JobPostService
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get job posts with filters
        # If no status specified, show all statuses (pass None to bypass default 'active' filter)
        status_filter = job_status if job_status is not None else None
        job_post_service = JobPostService()
        job_posts = await job_post_service.get_job_posts(
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
    db: AsyncIOMotorDatabase = Depends(get_db)
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
        employer_service = EmployerService()
        employer = await employer_service.get_employer_by_id(job_data.employer_id)
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
        job_post = await job_post_service.create_job_post(employer.id, job_post_data)
        
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get a specific job post by ID (admin only)"""
    try:
        job_post_service = JobPostService()
        job_post = await job_post_service.get_job_post_by_id(job_id)
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update a job post (admin only)"""
    try:
        # Check if job post exists
        job_post_service = JobPostService()
        existing_job = await job_post_service.get_job_post_by_id(job_id)
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
        updated_job = await job_post_service.update_job_post(job_id, update_data)
        
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete a job post (admin only)"""
    try:
        # Check if job post exists
        job_post_service = JobPostService()
        existing_job = await job_post_service.get_job_post_by_id(job_id)
        if not existing_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job post not found"
            )
        
        # Delete job post
        await job_post_service.delete_job_post(job_id)
        
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update job post status (admin only)"""
    try:
        # Check if job post exists
        job_post_service = JobPostService()
        existing_job = await job_post_service.get_job_post_by_id(job_id)
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
        
        updated_job = await job_post_service.update_job_post(job_id, update_data)
        
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get job posts statistics (admin only)"""
    try:
        # Get basic stats
        job_post_service = JobPostService()
        total_jobs = len(await job_post_service.get_job_posts(status=None))
        active_jobs = len(await job_post_service.get_job_posts(status="active"))
        approved_jobs = len(await job_post_service.get_job_posts(status="approved"))
        draft_jobs = len(await job_post_service.get_job_posts(status="draft"))
        
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all employers for admin panel"""
    try:
        from app.database.services import EmployerService
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get employers with filters
        employer_service = EmployerService()
        employers = await employer_service.get_employers(
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all job seekers for admin panel"""
    try:
        from app.database.services import JobSeekerService
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get job seekers with filters
        job_seeker_service = JobSeekerService()
        job_seekers = await job_seeker_service.get_job_seekers(
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

@router.get("/analytics/daily")
async def get_daily_analytics(
    date: str = Query(None, description="Date in YYYY-MM-DD format"),
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get daily analytics data"""
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date() if date else datetime.utcnow().date()
        
        # TODO: Implement MongoDB analytics using direct queries to User, JobPost, etc.
        # TODO: Replace AdminService(supabase) with MongoDB-based analytics
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Daily analytics with MongoDB not yet implemented"
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except Exception as e:
        logger.error(f"Error fetching daily analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analytics data"
        )

# Admin Logs Endpoints
@router.get("/logs")
async def get_admin_logs(
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    action: Optional[str] = Query(None),
    current_admin: Dict[str, Any] = Depends(get_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get admin action logs"""
    try:
        # TODO: Implement MongoDB query using AdminLog.find().sort("-created_at").skip(offset).limit(limit)
        # TODO: Add action filter if provided
        query = AdminLog.find().sort("-created_at").skip(offset).limit(limit)
        
        if action:
            query = AdminLog.find(AdminLog.action == action).sort("-created_at").skip(offset).limit(limit)
        
        logs = await query.to_list()
        return [log.dict() for log in logs]
    except Exception as e:
        logger.error(f"Error fetching admin logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch admin logs"
        )