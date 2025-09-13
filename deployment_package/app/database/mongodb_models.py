#!/usr/bin/env python3
"""
MongoDB Document Models using Beanie ODM
Replacement for SQLAlchemy models to work with MongoDB Atlas
"""

from beanie import Document, Indexed, Link
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
from bson import ObjectId

# Import enums from core
from app.core.enums import ScraperStatus, ScraperSource, CSVImportStatus


class UserRole(str, Enum):
    JOB_SEEKER = "job_seeker"
    EMPLOYER = "employer"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class User(Document):
    """User document model"""
    clerk_user_id: Optional[str] = Field(None, unique=True)
    email: Indexed(str, unique=True)
    password_hash: Optional[str] = None
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.JOB_SEEKER
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "clerk_user_id",
            "role",
            "is_active"
        ]


class ContactSubmission(Document):
    """Contact submission document model"""
    name: str
    email: str
    subject: str
    message: str
    inquiry_type: str = "general"
    phone: Optional[str] = None
    company_name: Optional[str] = None
    status: str = "new"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    admin_notes: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    source: str = "website_contact_form"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    
    class Settings:
        name = "contact_submissions"
        indexes = [
            "email",
            "status",
            "created_at",
            "inquiry_type"
        ]


class ContactInformation(Document):
    """Contact information document model"""
    category: str
    label: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    office_hours: Optional[str] = None
    timezone: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    is_primary: bool = False
    display_order: int = 0
    meta_data: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "contact_information"
        indexes = [
            "category",
            "is_active",
            "is_primary"
        ]


class SeoSettings(Document):
    """SEO settings document model"""
    site_title: Optional[str] = None
    site_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    og_type: str = "website"
    twitter_card: str = "summary_large_image"
    twitter_site: Optional[str] = None
    twitter_creator: Optional[str] = None
    canonical_url: Optional[str] = None
    robots_txt: Optional[str] = None
    sitemap_url: Optional[str] = None
    google_analytics_id: Optional[str] = None
    google_tag_manager_id: Optional[str] = None
    facebook_pixel_id: Optional[str] = None
    google_site_verification: Optional[str] = None
    bing_site_verification: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "seo_settings"


class Review(Document):
    """Review document model"""
    author: str
    email: Optional[str] = None
    rating: int
    title: Optional[str] = None
    content: str
    company: Optional[str] = None
    position: Optional[str] = None
    status: str = "pending"
    featured: bool = False
    helpful_count: int = 0
    verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "reviews"
        indexes = [
            "status",
            "featured",
            "rating",
            "created_at"
        ]


class CMSPage(Document):
    """CMS Page document model"""
    title: str
    slug: Indexed(str, unique=True)
    content: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    featured_image: Optional[str] = None
    status: str = "draft"
    publish_date: Optional[datetime] = None
    is_homepage: bool = False
    template: str = "default"
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    views: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "cms_pages"
        indexes = [
            "slug",
            "status",
            "is_homepage",
            "created_at"
        ]


class Ad(Document):
    """Advertisement document model"""
    name: str
    type: str
    position: str
    status: str = "active"
    content: Optional[str] = None
    script_code: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    clicks: int = 0
    impressions: int = 0
    revenue: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "ads"
        indexes = [
            "status",
            "position",
            "type"
        ]


class JobSeeker(Document):
    """Job seeker profile document model"""
    user_id: str = Field(..., unique=True)  # Reference to User document
    current_title: Optional[str] = None
    experience_level: Optional[str] = None
    years_of_experience: Optional[int] = None
    skills: Optional[str] = None  # JSON string for skills array
    preferred_job_types: Optional[str] = None  # JSON string for job types array
    preferred_locations: Optional[str] = None  # JSON string for locations array
    remote_work_preference: bool = False
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    salary_currency: str = "USD"
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    cover_letter_template: Optional[str] = None
    is_actively_looking: bool = True
    education_level: Optional[str] = None
    field_of_study: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "job_seekers"
        indexes = [
            "user_id",
            "experience_level",
            "is_actively_looking"
        ]


class Employer(Document):
    """Employer profile document model"""
    user_id: str  # Reference to User document
    employer_number: Optional[str] = Field(None, unique=True)  # RH00 series
    company_name: str
    company_email: Indexed(str, unique=True)
    company_phone: Optional[str] = None
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    company_logo: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "employers"
        indexes = [
            "user_id",
            "company_email",
            "employer_number",
            "is_verified"
        ]


class JobPost(Document):
    """Job post document model"""
    employer_id: str  # Reference to Employer document
    title: str
    description: str
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    benefits: Optional[str] = None
    job_type: str
    work_location: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "USD"
    experience_level: Optional[str] = None
    education_level: Optional[str] = None
    skills_required: Optional[List[str]] = None
    application_deadline: Optional[datetime] = None
    is_remote: bool = False
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    location_country: Optional[str] = None
    
    # Status and workflow
    status: str = "draft"
    priority: str = "normal"
    workflow_stage: str = "draft"
    employer_number: Optional[str] = None
    auto_publish: bool = False
    scheduled_publish_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    last_workflow_action: Optional[str] = None
    workflow_notes: Optional[str] = None
    admin_priority: int = 0
    requires_review: bool = False
    review_completed_at: Optional[datetime] = None
    review_completed_by: Optional[str] = None
    
    # Approval workflow
    submitted_for_approval_at: Optional[datetime] = None
    submitted_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    rejected_at: Optional[datetime] = None
    rejected_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    rejection_notes: Optional[str] = None
    
    # Publishing
    published_at: Optional[datetime] = None
    published_by: Optional[str] = None
    unpublished_at: Optional[datetime] = None
    unpublished_by: Optional[str] = None
    unpublish_reason: Optional[str] = None
    
    # Flags and features
    is_featured: bool = False
    is_urgent: bool = False
    is_flagged: bool = False
    flagged_at: Optional[datetime] = None
    flagged_by: Optional[str] = None
    flagged_reason: Optional[str] = None
    
    # Metrics
    views_count: int = 0
    applications_count: int = 0
    
    # External integration
    external_apply_url: Optional[str] = None
    external_id: Optional[str] = None
    external_source: Optional[str] = None
    
    # Denormalized data
    company_name: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "job_posts"
        indexes = [
            "employer_id",
            "status",
            "workflow_stage",
            "is_remote",
            "job_type",
            "created_at",
            "published_at",
            "application_deadline"
        ]


class JobWorkflowLog(Document):
    """Job workflow log document model"""
    job_post_id: str  # Reference to JobPost document
    action: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    performed_by: str  # Reference to User document
    reason: Optional[str] = None
    notes: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "job_workflow_logs"
        indexes = [
            "job_post_id",
            "action",
            "performed_by",
            "created_at"
        ]


class JobApplication(Document):
    """Job application document model"""
    job_post_id: str  # Reference to JobPost document
    job_seeker_id: str  # Reference to JobSeeker document
    status: str = "pending"
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    additional_documents: Optional[List[str]] = None
    application_source: str = "website"
    notes: Optional[str] = None
    employer_notes: Optional[str] = None
    interview_scheduled_at: Optional[datetime] = None
    interview_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "job_applications"
        indexes = [
            "job_post_id",
            "job_seeker_id",
            "status",
            "created_at"
        ]


# Scraper Models
class ScraperConfig(Document):
    """Scraper configuration document model"""
    user_id: str  # Reference to User document
    name: str
    target_url: str
    selectors: Dict[str, Any]
    schedule_enabled: bool = False
    schedule_interval: Optional[int] = None
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "scraper_configs"
        indexes = [
            "user_id",
            "is_active",
            "schedule_enabled"
        ]


class ScraperLog(Document):
    """Scraper log document model"""
    scraper_config_id: str  # Reference to ScraperConfig document
    status: ScraperStatus
    message: Optional[str] = None
    error_details: Optional[str] = None
    items_found: int = 0
    items_processed: int = 0
    execution_time: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "scraper_logs"
        indexes = [
            "scraper_config_id",
            "status",
            "created_at"
        ]


class ScraperState(Document):
    """Scraper state document model for Redis backup and persistence"""
    scraper_config_id: str  # Reference to ScraperConfig document
    current_state: str = "idle"
    state_data: Dict[str, Any] = Field(default_factory=dict)
    redis_key: Optional[str] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    is_paused: bool = False
    current_page: int = 0
    processed_urls: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "scraper_states"
        indexes = [
            "scraper_config_id",
            "redis_key",
            "current_state",
            "last_updated"
        ]


class EmailVerificationToken(Document):
    """Email verification token for user email verification"""
    user_id: str = Field(..., description="User ID this token belongs to")
    token: str = Field(..., description="Unique verification token")
    expires_at: datetime = Field(..., description="Token expiration timestamp")
    is_used: bool = Field(default=False, description="Whether token has been used")
    used_at: Optional[datetime] = Field(None, description="When token was used")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "email_verification_tokens"
        indexes = [
            "user_id",
            "token",
            "expires_at"
        ]


class SystemSettings(Document):
    """System settings document model"""
    key: Indexed(str, unique=True)
    value: Optional[str] = None
    description: Optional[str] = None
    category: str = "general"
    is_public: bool = False
    data_type: str = "string"  # string, number, boolean, json
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "system_settings"
        indexes = [
            "key",
            "category",
            "is_public"
        ]


class Announcement(Document):
    """Announcement document model"""
    title: str
    content: str
    type: str = "info"  # info, warning, success, error
    priority: str = "normal"  # low, normal, high, urgent
    target_audience: str = "all"  # all, admins, users, employers, job_seekers
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_by: str  # Reference to User document
    updated_by: Optional[str] = None
    views_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "announcements"
        indexes = [
            "is_active",
            "target_audience",
            "priority",
            "created_at"
        ]


class AdminLog(Document):
    """Admin log document model"""
    admin_id: str  # Reference to User document
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str = "success"  # success, failed, warning
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "admin_logs"
        indexes = [
            "admin_id",
            "action",
            "resource_type",
            "status",
            "created_at"
        ]


class Notification(Document):
    """Notification document model"""
    user_id: str  # Reference to User document
    title: str
    message: str
    type: str = "info"  # info, warning, success, error
    category: str = "general"  # general, job_alert, application, system
    is_read: bool = False
    is_archived: bool = False
    action_url: Optional[str] = None
    action_text: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "notifications"
        indexes = [
            "user_id",
            "is_read",
            "is_archived",
            "type",
            "category",
            "created_at"
        ]


class NotificationPreference(Document):
    """Notification preference document model"""
    user_id: Indexed(str, unique=True)  # Reference to User document
    email_notifications: bool = True
    push_notifications: bool = True
    sms_notifications: bool = False
    job_alerts: bool = True
    application_updates: bool = True
    system_announcements: bool = True
    marketing_emails: bool = False
    weekly_digest: bool = True
    frequency: str = "immediate"  # immediate, daily, weekly
    quiet_hours_start: Optional[str] = None  # HH:MM format
    quiet_hours_end: Optional[str] = None  # HH:MM format
    timezone: str = "UTC"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "notification_preferences"
        indexes = [
            "user_id"
        ]