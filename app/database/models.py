from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, Float, JSON, UniqueConstraint, Table, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from enum import Enum as PyEnum
import uuid
from app.core.enums import ScraperStatus, ScraperSource, CSVImportStatus

Base = declarative_base()

class UserRole(PyEnum):
    JOB_SEEKER = "job_seeker"
    EMPLOYER = "employer"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"



class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id = Column(String(255), unique=True, nullable=True)  # Clerk user ID for external auth
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # Made nullable for Clerk users
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.JOB_SEEKER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    job_seeker = relationship("JobSeeker", back_populates="user", uselist=False)
    employer_profile = relationship("Employer", back_populates="user", uselist=False)
    scraper_configs = relationship("ScraperConfig", back_populates="user")
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin or super_admin role"""
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]

# Contact Management Models
class ContactSubmission(Base):
    __tablename__ = 'contact_submissions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    inquiry_type = Column(String(50), nullable=False, default='general')
    phone = Column(String(50))
    company_name = Column(String(255))
    status = Column(String(50), default='new')
    priority = Column(String(20), default='medium')
    assigned_to = Column(String(255))
    admin_notes = Column(Text)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    source = Column(String(100), default='website_contact_form')
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    resolved_at = Column(DateTime)

class ContactInformation(Base):
    __tablename__ = 'contact_information'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(100), nullable=False)
    label = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    office_hours = Column(String(255))
    timezone = Column(String(50))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    meta_data = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

# CMS Models
class SeoSettings(Base):
    __tablename__ = 'seo_settings'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    site_title = Column(String(255))
    site_description = Column(Text)
    meta_keywords = Column(Text)
    og_title = Column(String(255))
    og_description = Column(Text)
    og_image = Column(String(500))
    og_type = Column(String(50), default='website')
    twitter_card = Column(String(50), default='summary_large_image')
    twitter_site = Column(String(100))
    twitter_creator = Column(String(100))
    canonical_url = Column(String(500))
    robots_txt = Column(Text)
    sitemap_url = Column(String(500))
    google_analytics_id = Column(String(100))
    google_tag_manager_id = Column(String(100))
    facebook_pixel_id = Column(String(100))
    google_site_verification = Column(String(100))
    bing_site_verification = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Review(Base):
    __tablename__ = 'reviews'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    author = Column(String(100), nullable=False)
    email = Column(String(255))
    rating = Column(Integer, nullable=False)
    title = Column(String(200))
    content = Column(Text, nullable=False)
    company = Column(String(100))
    position = Column(String(100))
    status = Column(String(50), default='pending')
    featured = Column(Boolean, default=False)
    helpful_count = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Ad(Base):
    __tablename__ = 'ads'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False)
    position = Column(String(50), nullable=False)
    status = Column(String(50), default='active')
    content = Column(Text)
    script_code = Column(Text)
    image_url = Column(String(500))
    link_url = Column(String(500))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    budget = Column(Float)
    clicks = Column(Integer, default=0)
    impressions = Column(Integer, default=0)
    revenue = Column(Float, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships - Ad model doesn't need these relationships
    # Removed incorrect relationships to JobSeeker and Employer

class JobSeeker(Base):
    __tablename__ = 'job_seekers'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    current_title = Column(String(255))
    experience_level = Column(String(50))
    years_of_experience = Column(Integer)
    skills = Column(Text)  # JSON string for skills array
    preferred_job_types = Column(Text)  # JSON string for job types array
    preferred_locations = Column(Text)  # JSON string for locations array
    remote_work_preference = Column(Boolean, default=False)
    min_salary = Column(Integer)
    max_salary = Column(Integer)
    salary_currency = Column(String(10), default='USD')
    resume_url = Column(String(500))
    portfolio_url = Column(String(500))
    cover_letter_template = Column(Text)
    is_actively_looking = Column(Boolean, default=True)
    education_level = Column(String(100))
    field_of_study = Column(String(100))
    university = Column(String(255))
    graduation_year = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="job_seeker")
    applications = relationship("JobApplication", back_populates="job_seeker")

class Employer(Base):
    __tablename__ = "employers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    employer_number = Column(String(20), unique=True, nullable=True)  # RH00 series
    company_name = Column(String(255), nullable=False)
    company_email = Column(String(255), unique=True, nullable=False)
    company_phone = Column(String(20), nullable=True)
    company_website = Column(String(255), nullable=True)
    company_description = Column(Text, nullable=True)
    company_logo = Column(String(500), nullable=True)
    industry = Column(String(100), nullable=True)
    company_size = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="employer_profile")
    job_posts = relationship("JobPost", back_populates="employer")

class JobPost(Base):
    __tablename__ = 'job_posts'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_id = Column(UUID(as_uuid=True), ForeignKey('employers.id'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    responsibilities = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    job_type = Column(String(50), nullable=False)
    work_location = Column(String(50), nullable=False)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String(10), default='USD')
    experience_level = Column(String(50), nullable=True)
    education_level = Column(String(100), nullable=True)
    skills_required = Column(JSON, nullable=True)  # JSON array for skills
    application_deadline = Column(DateTime, nullable=True)
    is_remote = Column(Boolean, default=False)
    location_city = Column(String(100), nullable=True)
    location_state = Column(String(100), nullable=True)
    location_country = Column(String(100), nullable=True)
    
    # Job Status and Workflow
    status = Column(String(50), default='draft')
    priority = Column(String(20), default='normal')
    
    # Enhanced workflow and approval fields
    workflow_stage = Column(String(50), default='draft')  # Enhanced workflow tracking
    employer_number = Column(String(20), nullable=True)  # RH00 series reference
    auto_publish = Column(Boolean, default=False)
    scheduled_publish_date = Column(DateTime)
    expiry_date = Column(DateTime)
    last_workflow_action = Column(String(50))
    workflow_notes = Column(Text)
    admin_priority = Column(Integer, default=0)
    requires_review = Column(Boolean, default=False)
    review_completed_at = Column(DateTime)
    review_completed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Approval Workflow
    submitted_for_approval_at = Column(DateTime, nullable=True)
    submitted_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    rejected_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    rejection_reason = Column(String(100), nullable=True)
    rejection_notes = Column(Text, nullable=True)
    
    # Publishing Workflow
    published_at = Column(DateTime, nullable=True)
    published_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    unpublished_at = Column(DateTime, nullable=True)
    unpublished_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    unpublish_reason = Column(Text)
    
    # Job Features
    is_featured = Column(Boolean, default=False)
    is_urgent = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)
    flagged_at = Column(DateTime, nullable=True)
    flagged_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    flagged_reason = Column(Text, nullable=True)
    
    # Analytics
    views_count = Column(Integer, default=0)
    applications_count = Column(Integer, default=0)
    
    # External Integration
    external_apply_url = Column(String(500), nullable=True)
    external_id = Column(String(255), nullable=True)
    external_source = Column(String(100), nullable=True)
    
    # Denormalized Data
    company_name = Column(String(255), nullable=True)  # Denormalized for easier queries
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    employer = relationship("Employer", back_populates="job_posts")
    applications = relationship("JobApplication", back_populates="job_post")
    workflow_logs = relationship("JobWorkflowLog", back_populates="job_post")

class JobWorkflowLog(Base):
    __tablename__ = 'job_workflow_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    job_post_id = Column(UUID(as_uuid=True), ForeignKey('job_posts.id'), nullable=False)
    action = Column(String(50), nullable=False)  # JobAction enum values
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=True)
    performed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    additional_data = Column(JSON, nullable=True)  # Additional data like rejection reason, etc.
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    job_post = relationship("JobPost", back_populates="workflow_logs")
    performed_by_user = relationship("User", foreign_keys=[performed_by])

class JobApplication(Base):
    __tablename__ = 'job_applications'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_post_id = Column(UUID(as_uuid=True), ForeignKey('job_posts.id'), nullable=False)
    job_seeker_id = Column(Integer, ForeignKey('job_seekers.id'), nullable=False)
    cover_letter = Column(Text)
    resume_url = Column(String(500))
    portfolio_url = Column(String(500))
    expected_salary = Column(Integer)
    salary_currency = Column(String(10), default='USD')
    available_start_date = Column(DateTime, nullable=True)
    applicant_email = Column(String(255), nullable=True)
    applicant_phone = Column(String(50), nullable=True)
    status = Column(String(50), default='pending')
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    job_post = relationship("JobPost", back_populates="applications")
    job_seeker = relationship("JobSeeker", back_populates="applications")


class SavedJob(Base):
    __tablename__ = 'saved_jobs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    job_post_id = Column(UUID(as_uuid=True), ForeignKey('job_posts.id', ondelete='CASCADE'), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User")
    job_post = relationship("JobPost")
    
    # Unique constraint
    __table_args__ = (UniqueConstraint('user_id', 'job_post_id', name='unique_user_job_bookmark'),)


class Interview(Base):
    __tablename__ = 'interviews'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_application_id = Column(UUID(as_uuid=True), ForeignKey('job_applications.id', ondelete='CASCADE'), nullable=False)
    interviewer_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scheduled_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    interview_type = Column(String(50), default='video')  # video, phone, in-person
    meeting_link = Column(String(500), nullable=True)
    location = Column(String(255), nullable=True)
    status = Column(String(50), default='scheduled')  # scheduled, completed, cancelled, rescheduled
    feedback = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5 scale
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    job_application = relationship("JobApplication")
    interviewer = relationship("User", foreign_keys=[interviewer_id])
    candidate = relationship("User", foreign_keys=[candidate_id])


class AutoApplySettings(Base):
    __tablename__ = 'auto_apply_settings'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    is_enabled = Column(Boolean, default=False)
    max_applications_per_day = Column(Integer, default=5)
    preferred_job_types = Column(Text, nullable=True)  # JSON string
    preferred_locations = Column(Text, nullable=True)  # JSON string
    min_salary = Column(Integer, nullable=True)
    max_salary = Column(Integer, nullable=True)
    salary_currency = Column(String(10), default='USD')
    keywords_include = Column(Text, nullable=True)  # JSON string
    keywords_exclude = Column(Text, nullable=True)  # JSON string
    company_size_preference = Column(String(50), nullable=True)
    remote_only = Column(Boolean, default=False)
    cover_letter_template = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")

class JobCategory(Base):
    __tablename__ = 'job_categories'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    icon = Column(String(100))
    color = Column(String(20))
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

class EmailVerificationToken(Base):
    __tablename__ = 'email_verification_tokens'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User")

class EmailTemplate(Base):
    __tablename__ = 'email_templates'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    subject = Column(String(255), nullable=False)
    html_content = Column(Text, nullable=False)
    text_content = Column(Text, nullable=True)
    template_type = Column(String(50), nullable=False)  # verification, welcome, newsletter, support
    category = Column(String(50), default='general', nullable=False)  # general, onboarding, verification, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class EmailLog(Base):
    __tablename__ = 'email_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    template_name = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False)  # sent, failed, pending
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User")

class SystemSettings(Base):
    __tablename__ = 'system_settings'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text)
    data_type = Column(String(20), default='string')
    description = Column(Text)
    is_public = Column(Boolean, default=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class AdminLog(Base):
    __tablename__ = 'admin_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    admin_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'))
    action = Column(String(100), nullable=False)
    target_table = Column(String(50))
    target_id = Column(String(50))
    old_values = Column(Text)  # JSON string
    new_values = Column(Text)  # JSON string
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

class ScraperConfig(Base):
    __tablename__ = 'scraper_configs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    source = Column(Enum(ScraperSource), nullable=False)
    scraper_name = Column(String(255), nullable=False)
    base_url = Column(String(500), nullable=False)
    search_queries = Column(JSON)  # List of search queries
    search_locations = Column(JSON)  # List of search locations
    max_pages = Column(Integer, default=5)
    delay_between_requests = Column(Integer, default=2)
    min_salary = Column(Integer)
    max_salary = Column(Integer)
    job_types = Column(JSON)  # List of job types
    experience_levels = Column(JSON)  # List of experience levels
    remote_only = Column(Boolean, default=False)
    auto_publish = Column(Boolean, default=False)
    duplicate_check_enabled = Column(Boolean, default=True)
    content_validation_enabled = Column(Boolean, default=True)
    schedule_enabled = Column(Boolean, default=False)
    schedule_interval_minutes = Column(Integer, default=60)
    is_enabled = Column(Boolean, default=True)
    is_active = Column(Boolean, default=False)
    last_run_at = Column(DateTime)
    last_run = Column(DateTime)  # Alternative field name used by API
    next_run_at = Column(DateTime)
    total_runs = Column(Integer, default=0)
    successful_runs = Column(Integer, default=0)
    failed_runs = Column(Integer, default=0)
    total_jobs_found = Column(Integer, default=0)
    total_jobs_created = Column(Integer, default=0)
    total_jobs_updated = Column(Integer, default=0)
    
    # ML and Performance Enhancement Columns
    ml_parsing_enabled = Column(Boolean, default=False)
    ml_confidence_threshold = Column(Float, default=0.80)
    ml_fallback_enabled = Column(Boolean, default=True)
    performance_mode = Column(String(50), default='standard')
    concurrent_requests = Column(Integer, default=1)
    request_timeout = Column(Integer, default=30)
    retry_attempts = Column(Integer, default=3)
    retry_delay = Column(Integer, default=1)
    success_rate_threshold = Column(Float, default=0.80)
    auto_optimization_enabled = Column(Boolean, default=False)
    last_optimization_date = Column(DateTime)
    optimization_score = Column(Float)
    dynamic_scheduling = Column(Boolean, default=False)
    peak_hours_start = Column(Integer, default=9)
    peak_hours_end = Column(Integer, default=17)
    off_peak_interval_hours = Column(Integer, default=2)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="scraper_configs")
    logs = relationship("ScraperLog", back_populates="config")
    state = relationship("ScraperState", back_populates="config", uselist=False)
    ml_config = relationship("MLParsingConfig", back_populates="config", uselist=False)
    scheduler_jobs = relationship("SchedulerJob", back_populates="config")
    # New relationship for dynamic website management
    managed_websites = relationship("ManagedWebsite", secondary="scraper_website_mapping", back_populates="scraper_configs")

class ScraperLog(Base):
    __tablename__ = 'scraper_logs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scraper_config_id = Column(Integer, ForeignKey('scraper_configs.id'), nullable=True)
    source = Column(Enum(ScraperSource), nullable=False)
    scraper_name = Column(String(255), nullable=False)
    search_query = Column(String(500))
    search_location = Column(String(255))
    status = Column(Enum(ScraperStatus), default=ScraperStatus.PENDING)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    duration_seconds = Column(Integer)
    pages_scraped = Column(Integer, default=0)
    jobs_found = Column(Integer, default=0)
    jobs_created = Column(Integer, default=0)
    jobs_updated = Column(Integer, default=0)
    jobs_skipped = Column(Integer, default=0)
    jobs_failed = Column(Integer, default=0)
    error_message = Column(Text)
    error_details = Column(JSON)
    config_snapshot = Column(JSON)  # Snapshot of config at time of run
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    config = relationship("ScraperConfig", back_populates="logs")
    metrics = relationship("AnalyticsMetrics", back_populates="log")

class ScraperMemory(Base):
    __tablename__ = 'scraper_memory'
    
    id = Column(Integer, primary_key=True, index=True)
    scraper_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    usage_count = Column(Integer, default=0, nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ScraperState(Base):
    """Enhanced scraper state management for Redis backup and persistence"""
    __tablename__ = 'scraper_state'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    scraper_config_id = Column(Integer, ForeignKey('scraper_configs.id', ondelete='CASCADE'), nullable=False)
    current_state = Column(String(50), nullable=False, default='idle')
    state_data = Column(JSON, default={})
    redis_key = Column(String(255), unique=True)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_paused = Column(Boolean, default=False)
    current_page = Column(Integer, default=0)
    processed_urls = Column(JSON, default=[])
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    config = relationship("ScraperConfig", back_populates="state")


class MLParsingConfig(Base):
    """ML parsing configuration for Gemini API integration"""
    __tablename__ = 'ml_parsing_config'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    scraper_config_id = Column(Integer, ForeignKey('scraper_configs.id', ondelete='CASCADE'), nullable=False)
    gemini_model_version = Column(String(50), default='gemini-pro')
    confidence_threshold = Column(Float, default=0.80)
    field_mapping_rules = Column(JSON, default={})
    fallback_enabled = Column(Boolean, default=True)
    validation_rules = Column(JSON, default={})
    api_usage_quota = Column(Integer, default=1000)
    api_usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    config = relationship("ScraperConfig", back_populates="ml_config")


class AnalyticsMetrics(Base):
    """Analytics metrics for scraper performance tracking"""
    __tablename__ = 'analytics_metrics'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    scraper_log_id = Column(UUID(as_uuid=True), ForeignKey('scraper_logs.id', ondelete='CASCADE'), nullable=False)
    metric_type = Column(String(50), nullable=False)
    metric_data = Column(JSON, default={})
    recorded_at = Column(DateTime, server_default=func.now())
    execution_time = Column(Float)
    success_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    parsing_accuracy = Column(Float)
    gemini_api_calls = Column(Integer, default=0)
    
    # Relationships
    log = relationship("ScraperLog", back_populates="metrics")


class SchedulerJob(Base):
    """Scheduler jobs for automated scraper execution"""
    __tablename__ = 'scheduler_jobs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    scraper_config_id = Column(Integer, ForeignKey('scraper_configs.id', ondelete='CASCADE'), nullable=False)
    job_id = Column(String(255), unique=True, nullable=False)
    cron_expression = Column(String(100))
    next_run_time = Column(DateTime)
    is_active = Column(Boolean, default=True)
    job_config = Column(JSON, default={})
    max_retries = Column(Integer, default=3)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    last_run_at = Column(DateTime)
    last_success_at = Column(DateTime)
    
    # Relationships
    config = relationship("ScraperConfig", back_populates="scheduler_jobs")


class CSVImport(Base):
    """Main CSV import tracking table"""
    __tablename__ = 'csv_imports'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    total_rows = Column(Integer, nullable=False)
    valid_rows = Column(Integer, default=0)
    invalid_rows = Column(Integer, default=0)
    processed_rows = Column(Integer, default=0)
    successful_imports = Column(Integer, default=0)
    failed_imports = Column(Integer, default=0)
    status = Column(Enum(CSVImportStatus), default=CSVImportStatus.PENDING)
    progress = Column(Float, default=0.0)
    config = Column(JSON)  # Import configuration
    error_message = Column(Text)
    file_size_bytes = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Relationships
    user = relationship("User")
    logs = relationship("CSVImportLog", back_populates="csv_import", cascade="all, delete-orphan")

class CSVImportLog(Base):
    """Detailed log for each row processed during CSV import"""
    __tablename__ = 'csv_import_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    upload_id = Column(UUID(as_uuid=True), ForeignKey('csv_imports.id', ondelete='CASCADE'), nullable=False)
    row_number = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False)  # success, validation_failed, error
    job_id = Column(UUID(as_uuid=True), ForeignKey('job_posts.id'), nullable=True)
    error_message = Column(Text)
    data = Column(JSON)  # Original row data
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    csv_import = relationship("CSVImport", back_populates="logs")
    job = relationship("JobPost")


# Association table for ScraperConfig and ManagedWebsite many-to-many relationship
scraper_website_mapping = Table(
    'scraper_website_mapping',
    Base.metadata,
    Column('scraper_config_id', Integer, ForeignKey('scraper_configs.id'), primary_key=True),
    Column('managed_website_id', String, ForeignKey('managed_websites.id'), primary_key=True),
    Column('created_at', DateTime, server_default=func.now())
)


# Website Management Models
class ManagedWebsite(Base):
    """Dynamic website management"""
    __tablename__ = 'managed_websites'
    
    id = Column(String, primary_key=True)  # UUID as string for SQLite
    name = Column(String(255), nullable=False)
    base_url = Column(String(500), nullable=False)
    website_type = Column(String(100), nullable=False)  # job_board, company_site, etc.
    scraping_config = Column(Text)  # JSON config as text
    selectors = Column(Text)  # JSON selectors as text
    rate_limit_delay = Column(Integer, default=2)
    max_pages = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    success_rate = Column(Float, default=0.0)
    last_scraped_at = Column(DateTime)
    total_scrapes = Column(Integer, default=0)
    successful_scrapes = Column(Integer, default=0)
    failed_scrapes = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    scraper_configs = relationship("ScraperConfig", secondary="scraper_website_mapping", back_populates="managed_websites")
    # scraping_sessions relationship removed to avoid circular import issues


class MemoryUpload(Base):
    """CSV memory upload tracking"""
    __tablename__ = 'memory_uploads'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    uploaded_by = Column(String, nullable=True)
    upload_status = Column(String(50), nullable=True)
    total_rows = Column(Integer, nullable=True)
    processed_rows = Column(Integer, nullable=True)
    valid_rows = Column(Integer, nullable=True)
    invalid_rows = Column(Integer, nullable=True)
    progress_percentage = Column(Float, nullable=True)
    validation_errors = Column(Text, nullable=True)
    validation_warnings = Column(Text, nullable=True)
    memory_type = Column(String(100), nullable=False)
    memory_data = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=True, default=True)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)
    started_processing_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)


# ScrapingSession model moved to app.models.scraping_session to avoid conflicts


class MLTrainingData(Base):
    """ML training data collection"""
    __tablename__ = 'ml_training_data'
    
    id = Column(String, primary_key=True)  # UUID as string for SQLite
    session_id = Column(String, ForeignKey('scraping_sessions.id'), nullable=False)
    data_type = Column(String(100), nullable=False)  # success_pattern, failure_pattern, selector_performance
    input_data = Column(Text, nullable=False)  # JSON as text
    expected_output = Column(Text)  # JSON as text
    actual_output = Column(Text)  # JSON as text
    confidence_score = Column(Float)
    is_validated = Column(Boolean, default=False)
    validation_source = Column(String(100))  # manual, automated, ml_model
    feature_vector = Column(Text)  # JSON as text
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    # session = relationship("ScrapingSession", back_populates="ml_training_data")  # Avoiding circular import


class ScrapingMetrics(Base):
    """Detailed scraping performance metrics"""
    __tablename__ = 'scraping_metrics'
    
    id = Column(String, primary_key=True)  # UUID as string for SQLite
    session_id = Column(String, ForeignKey('scraping_sessions.id'), nullable=False)
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    metric_unit = Column(String(50))  # seconds, percentage, count, etc.
    measurement_time = Column(DateTime, server_default=func.now())
    additional_data = Column(Text)  # JSON as text
    
    # Relationships
    # session = relationship("ScrapingSession", back_populates="metrics")  # Avoiding circular import


# ============================================================================
# AUTOSCRAPER MODELS
# ============================================================================

class JobBoardType(PyEnum):
    RSS = "rss"
    HTML = "html"
    API = "api"

class ScrapeJobStatus(PyEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"

class ScrapeJobMode(PyEnum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"
    TRIGGERED = "triggered"

class EngineStatus(PyEnum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"


class JobBoard(Base):
    """Job board configuration for autoscraper"""
    __tablename__ = 'autoscraper_job_boards'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    type = Column(Enum(JobBoardType), nullable=False)
    base_url = Column(String(500), nullable=False)
    rss_url = Column(String(500), nullable=True)
    
    # HTML scraping configuration
    selectors = Column(JSON, nullable=True)  # CSS selectors for HTML scraping
    pagination_config = Column(JSON, nullable=True)  # Pagination settings
    rate_limit_delay = Column(Integer, default=2)  # Seconds between requests
    max_pages = Column(Integer, default=10)
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    last_scraped_at = Column(DateTime, nullable=True)
    success_rate = Column(Float, default=0.0)
    total_jobs_scraped = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    scrape_jobs = relationship("AutoScrapeScrapeJob", back_populates="job_board")
    raw_jobs = relationship("AutoScrapeRawJob", back_populates="job_board")


class ScheduleConfig(Base):
    """Schedule configuration for automated scraping"""
    __tablename__ = 'autoscraper_schedule_configs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    cron_expression = Column(String(100), nullable=False)
    timezone = Column(String(50), default='UTC')
    
    # Configuration
    job_board_ids = Column(JSON, nullable=False)  # List of job board IDs to scrape
    max_concurrent_jobs = Column(Integer, default=3)
    retry_failed_jobs = Column(Boolean, default=True)
    max_retries = Column(Integer, default=3)
    
    # Status
    is_active = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    scrape_jobs = relationship("AutoScrapeScrapeJob", back_populates="schedule_config")


class AutoScrapeScrapeJob(Base):
    """Individual scrape job execution"""
    __tablename__ = 'autoscraper_scrape_jobs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_board_id = Column(UUID(as_uuid=True), ForeignKey('autoscraper_job_boards.id'), nullable=False)
    schedule_config_id = Column(UUID(as_uuid=True), ForeignKey('autoscraper_schedule_configs.id'), nullable=True)
    
    # Job configuration
    mode = Column(Enum(ScrapeJobMode), nullable=False)
    status = Column(Enum(ScrapeJobStatus), default=ScrapeJobStatus.PENDING)
    priority = Column(Integer, default=5)  # 1-10, higher is more priority
    
    # Execution details
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Results
    items_found = Column(Integer, default=0)
    items_processed = Column(Integer, default=0)
    items_saved = Column(Integer, default=0)
    items_duplicated = Column(Integer, default=0)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    # Configuration snapshot
    config_snapshot = Column(JSON, nullable=True)  # Snapshot of job board config at execution time
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    job_board = relationship("JobBoard", back_populates="scrape_jobs")
    schedule_config = relationship("ScheduleConfig", back_populates="scrape_jobs")
    scrape_runs = relationship("AutoScrapeScrapeRun", back_populates="scrape_job")


class AutoScrapeScrapeRun(Base):
    """Individual scrape run within a job"""
    __tablename__ = 'autoscraper_scrape_runs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scrape_job_id = Column(UUID(as_uuid=True), ForeignKey('autoscraper_scrape_jobs.id'), nullable=False)
    
    # Run details
    target_url = Column(String(1000), nullable=False)
    status = Column(Enum(ScrapeJobStatus), default=ScrapeJobStatus.PENDING)
    
    # Execution timing
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    
    # Results
    items_found = Column(Integer, default=0)
    items_saved = Column(Integer, default=0)
    http_status_code = Column(Integer, nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    logs = Column(JSON, nullable=True)  # Detailed execution logs
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    scrape_job = relationship("AutoScrapeScrapeJob", back_populates="scrape_runs")
    raw_jobs = relationship("AutoScrapeRawJob", back_populates="scrape_run")


class AutoScrapeRawJob(Base):
    """Raw scraped job data before normalization"""
    __tablename__ = 'autoscraper_raw_jobs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_url = Column(String(1000), nullable=False, unique=True)
    job_board_id = Column(UUID(as_uuid=True), ForeignKey('autoscraper_job_boards.id'), nullable=True)
    scrape_run_id = Column(UUID(as_uuid=True), ForeignKey('autoscraper_scrape_runs.id'), nullable=True)
    
    # Raw data
    raw_data = Column(JSON, nullable=False)  # Complete raw scraped data
    checksum = Column(String(64), nullable=False, unique=True)  # SHA256 hash for deduplication
    
    # Extracted basic fields
    source_title = Column(String(500), nullable=True)
    source_company = Column(String(255), nullable=True)
    posted_at = Column(DateTime, nullable=True)
    
    # Processing status
    is_processed = Column(Boolean, default=False)
    processing_attempts = Column(Integer, default=0)
    processing_error = Column(Text, nullable=True)
    
    # Timestamps
    fetched_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    job_board = relationship("JobBoard", back_populates="raw_jobs")
    scrape_run = relationship("AutoScrapeScrapeRun", back_populates="raw_jobs")
    normalized_job = relationship("AutoScrapeNormalizedJob", back_populates="raw_job", uselist=False)
    
    # Indexes
    __table_args__ = (
        Index('idx_autoscraper_raw_jobs_checksum', 'checksum'),
        Index('idx_autoscraper_raw_jobs_posted_at', 'posted_at'),
        Index('idx_autoscraper_raw_jobs_company', 'source_company'),
    )


class AutoScrapeNormalizedJob(Base):
    """Normalized job data ready for publication"""
    __tablename__ = 'autoscraper_normalized_jobs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    raw_job_id = Column(UUID(as_uuid=True), ForeignKey('autoscraper_raw_jobs.id'), nullable=False, unique=True)
    
    # Normalized job fields
    title = Column(String(500), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    remote_work = Column(Boolean, nullable=True)
    employment_type = Column(String(50), nullable=True)  # full-time, part-time, contract, etc.
    
    # Job details
    description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)  # Array of skill/technology tags
    
    # Compensation
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String(10), default='USD')
    salary_period = Column(String(20), nullable=True)  # hourly, monthly, yearly
    
    # Application details
    apply_url = Column(String(1000), nullable=False)
    external_id = Column(String(255), nullable=True)  # Job ID from source
    
    # Metadata
    posted_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    region = Column(String(100), nullable=True)  # Geographic region
    
    # Quality and processing
    quality_score = Column(Float, default=0.0)  # 0.0 to 1.0
    confidence_score = Column(Float, default=0.0)  # ML confidence in normalization
    normalization_method = Column(String(50), nullable=True)  # 'rule_based', 'ml', 'hybrid'
    
    # Integration status
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime, nullable=True)
    job_post_id = Column(UUID(as_uuid=True), ForeignKey('job_posts.id', ondelete='SET NULL'), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    raw_job = relationship("AutoScrapeRawJob", back_populates="normalized_job")
    job_post = relationship("JobPost")
    
    # Indexes
    __table_args__ = (
        Index('idx_autoscraper_normalized_jobs_title', 'title'),
        Index('idx_autoscraper_normalized_jobs_company', 'company'),
        Index('idx_autoscraper_normalized_jobs_location', 'location'),
        Index('idx_autoscraper_normalized_jobs_posted_at', 'posted_at'),
        Index('idx_autoscraper_normalized_jobs_quality_score', 'quality_score'),
    )


class AutoScrapeEngineState(Base):
    """Singleton table to track autoscraper engine state"""
    __tablename__ = 'autoscraper_engine_state'
    
    key = Column(String(50), primary_key=True, default='autoscraper')  # Singleton key
    status = Column(Enum(EngineStatus), default=EngineStatus.IDLE)
    
    # Engine metrics
    last_heartbeat = Column(DateTime, nullable=True)
    worker_count = Column(Integer, default=0)
    queue_depth = Column(Integer, default=0)
    active_jobs = Column(Integer, default=0)
    
    # Performance metrics
    total_jobs_processed = Column(Integer, default=0)
    total_items_scraped = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    
    # Configuration
    max_concurrent_jobs = Column(Integer, default=5)
    rate_limit_global = Column(Integer, default=1)  # Seconds between any requests
    
    # Error tracking
    last_error = Column(Text, nullable=True)
    error_count = Column(Integer, default=0)
    last_error_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())