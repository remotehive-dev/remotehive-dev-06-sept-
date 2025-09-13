"""MongoDB models using Beanie ODM for RemoteHive application"""

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
# from bson import ObjectId  # Removed to fix Pydantic schema generation

# Enums
class UserRole(str, Enum):
    JOB_SEEKER = "job_seeker"
    EMPLOYER = "employer"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class JobStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"
    EXPIRED = "expired"

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    INTERVIEWED = "interviewed"
    REJECTED = "rejected"
    HIRED = "hired"

class ContactStatus(str, Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

# Base Document with common fields
class BaseDocument(Document):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        use_state_management = True

# User Management Models
class User(BaseDocument):
    clerk_user_id: Optional[str] = Field(None, unique=True)
    email: Indexed(EmailStr, unique=True)
    password_hash: Optional[str] = None
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: UserRole = Field(default=UserRole.JOB_SEEKER)
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    last_login: Optional[datetime] = None
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin or super_admin role"""
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "clerk_user_id",
            "role",
            "is_active"
        ]

class JobSeeker(BaseDocument):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    user_id: PydanticObjectId = Field(..., description="Reference to User document")
    current_title: Optional[str] = None
    experience_level: Optional[str] = None
    years_of_experience: Optional[int] = None
    skills: List[str] = Field(default_factory=list)
    preferred_job_types: List[str] = Field(default_factory=list)
    preferred_locations: List[str] = Field(default_factory=list)
    remote_work_preference: bool = Field(default=False)
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    salary_currency: str = Field(default="USD")
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    cover_letter_template: Optional[str] = None
    is_actively_looking: bool = Field(default=True)
    education_level: Optional[str] = None
    field_of_study: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[int] = None
    
    class Settings:
        name = "job_seekers"
        indexes = [
            "user_id",
            "experience_level",
            "is_actively_looking"
        ]

class Employer(BaseDocument):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    user_id: PydanticObjectId = Field(..., description="Reference to User document")
    employer_number: Optional[str] = Field(None, unique=True)
    company_name: str
    company_email: Indexed(EmailStr, unique=True)
    company_phone: Optional[str] = None
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    company_logo_url: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    is_verified: bool = Field(default=False)
    verification_documents: List[str] = Field(default_factory=list)
    
    class Settings:
        name = "employers"
        indexes = [
            "user_id",
            "company_email",
            "employer_number",
            "is_verified"
        ]

# Job Management Models
class JobPost(BaseDocument):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    employer_id: PydanticObjectId = Field(..., description="Reference to Employer document")
    title: str
    description: str
    requirements: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    skills_required: List[str] = Field(default_factory=list)
    job_type: str  # full-time, part-time, contract, freelance
    experience_level: str  # entry, mid, senior, executive
    location: Optional[str] = None
    is_remote: bool = Field(default=False)
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = Field(default="USD")
    benefits: List[str] = Field(default_factory=list)
    status: JobStatus = Field(default=JobStatus.DRAFT)
    application_deadline: Optional[datetime] = None
    external_url: Optional[str] = None
    views_count: int = Field(default=0)
    applications_count: int = Field(default=0)
    featured: bool = Field(default=False)
    
    class Settings:
        name = "job_posts"
        indexes = [
            "employer_id",
            "status",
            "job_type",
            "experience_level",
            "is_remote",
            "featured",
            "created_at"
        ]

class JobApplication(BaseDocument):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    job_post_id: PydanticObjectId = Field(..., description="Reference to JobPost document")
    job_seeker_id: PydanticObjectId = Field(..., description="Reference to JobSeeker document")
    status: ApplicationStatus = Field(default=ApplicationStatus.PENDING)
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    additional_documents: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    interview_scheduled: Optional[datetime] = None
    feedback: Optional[str] = None
    
    class Settings:
        name = "job_applications"
        indexes = [
            "job_post_id",
            "job_seeker_id",
            "status",
            "created_at"
        ]

# Contact Management Models
class ContactSubmission(BaseDocument):
    name: str
    email: EmailStr
    subject: str
    message: str
    inquiry_type: str = Field(default="general")
    phone: Optional[str] = None
    company_name: Optional[str] = None
    status: ContactStatus = Field(default=ContactStatus.NEW)
    priority: Priority = Field(default=Priority.MEDIUM)
    assigned_to: Optional[str] = None
    admin_notes: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    source: str = Field(default="website_contact_form")
    resolved_at: Optional[datetime] = None
    
    class Settings:
        name = "contact_submissions"
        indexes = [
            "email",
            "status",
            "priority",
            "inquiry_type",
            "created_at"
        ]

class ContactInformation(BaseDocument):
    category: str
    label: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[Dict[str, str]] = None
    office_hours: Optional[str] = None
    timezone: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = Field(default=True)
    is_primary: bool = Field(default=False)
    display_order: int = Field(default=0)
    meta_data: Optional[Dict[str, Any]] = None
    
    class Settings:
        name = "contact_information"
        indexes = [
            "category",
            "is_active",
            "is_primary",
            "display_order"
        ]

# CMS Models
class SeoSettings(BaseDocument):
    site_title: Optional[str] = None
    site_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    og_type: str = Field(default="website")
    twitter_card: str = Field(default="summary_large_image")
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
    
    class Settings:
        name = "seo_settings"

class Review(BaseDocument):
    author: str
    email: Optional[EmailStr] = None
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = None
    content: str
    company: Optional[str] = None
    position: Optional[str] = None
    status: str = Field(default="pending")
    featured: bool = Field(default=False)
    helpful_count: int = Field(default=0)
    verified: bool = Field(default=False)
    
    class Settings:
        name = "reviews"
        indexes = [
            "status",
            "featured",
            "rating",
            "verified",
            "created_at"
        ]

class Ad(BaseDocument):
    name: str
    type: str
    position: str
    status: str = Field(default="active")
    content: Optional[str] = None
    script_code: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    clicks: int = Field(default=0)
    impressions: int = Field(default=0)
    revenue: float = Field(default=0.0)
    
    class Settings:
        name = "ads"
        indexes = [
            "status",
            "type",
            "position",
            "start_date",
            "end_date"
        ]

# Payment Models
class PaymentGateway(BaseDocument):
    name: str
    provider: str  # stripe, paypal, razorpay, etc.
    is_active: bool = Field(default=True)
    configuration: Dict[str, Any] = Field(default_factory=dict)
    supported_currencies: List[str] = Field(default_factory=list)
    transaction_fee_percentage: Optional[float] = None
    
    class Settings:
        name = "payment_gateways"
        indexes = ["provider", "is_active"]

class Transaction(BaseDocument):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    user_id: PydanticObjectId = Field(..., description="Reference to User document")
    gateway_id: PydanticObjectId = Field(..., description="Reference to PaymentGateway document")
    transaction_id: str = Field(..., unique=True)
    amount: float
    currency: str = Field(default="USD")
    status: str  # pending, completed, failed, refunded
    payment_method: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Settings:
        name = "transactions"
        indexes = [
            "user_id",
            "transaction_id",
            "status",
            "created_at"
        ]

class Refund(BaseDocument):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    transaction_id: PydanticObjectId = Field(..., description="Reference to Transaction document")
    amount: float
    reason: str
    status: str = Field(default="pending")
    processed_at: Optional[datetime] = None
    refund_id: Optional[str] = None
    
    class Settings:
        name = "refunds"
        indexes = [
            "transaction_id",
            "status",
            "created_at"
        ]

# Export all models
__all__ = [
    "User",
    "JobSeeker", 
    "Employer",
    "JobPost",
    "JobApplication",
    "ContactSubmission",
    "ContactInformation",
    "SeoSettings",
    "Review",
    "Ad",
    "PaymentGateway",
    "Transaction",
    "Refund",
    "UserRole",
    "JobStatus",
    "ApplicationStatus",
    "ContactStatus",
    "Priority"
]