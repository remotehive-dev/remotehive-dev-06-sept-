from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class EmailStatus(str, Enum):
    """Email status enumeration"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"
    OPENED = "opened"
    CLICKED = "clicked"

class EmailTemplateCategory(str, Enum):
    """Email template category enumeration"""
    GENERAL = "general"
    ONBOARDING = "onboarding"
    VERIFICATION = "verification"
    NOTIFICATION = "notification"
    MARKETING = "marketing"
    SUPPORT = "support"
    SYSTEM = "system"

# Email Template Schemas
class EmailTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    subject: str = Field(..., min_length=1, max_length=255)
    html_content: str = Field(..., min_length=1)
    text_content: Optional[str] = None
    template_type: str = Field(..., min_length=1, max_length=50)
    category: EmailTemplateCategory = EmailTemplateCategory.GENERAL
    variables: Optional[Dict[str, Any]] = None
    is_active: bool = True

    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Template name cannot be empty')
        return v.strip()

    @validator('subject')
    def validate_subject(cls, v):
        if not v or not v.strip():
            raise ValueError('Subject cannot be empty')
        return v.strip()

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    html_content: Optional[str] = Field(None, min_length=1)
    text_content: Optional[str] = None
    template_type: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[EmailTemplateCategory] = None
    variables: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class EmailTemplate(EmailTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Email Log Schemas
class EmailLogBase(BaseModel):
    recipient_email: EmailStr
    subject: str = Field(..., min_length=1, max_length=255)
    template_name: Optional[str] = Field(None, max_length=100)
    status: EmailStatus = EmailStatus.PENDING
    error_message: Optional[str] = None

class EmailLogCreate(EmailLogBase):
    user_id: Optional[str] = None
    template_id: Optional[int] = None

class EmailLog(EmailLogBase):
    id: int
    user_id: Optional[str] = None
    template_id: Optional[int] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# SMTP Settings Schemas
class SMTPSettingsBase(BaseModel):
    email_host: str = Field(..., min_length=1)
    email_port: int = Field(..., ge=1, le=65535)
    email_username: str = Field(..., min_length=1)
    email_password: str = Field(..., min_length=1)
    email_from: EmailStr
    email_use_tls: bool = True
    email_use_ssl: bool = False

    @validator('email_port')
    def validate_port(cls, v):
        if v not in [25, 465, 587, 993, 995]:
            raise ValueError('Port must be a valid email port (25, 465, 587, 993, 995)')
        return v

class SMTPSettingsCreate(SMTPSettingsBase):
    pass

class SMTPSettingsUpdate(BaseModel):
    email_host: Optional[str] = Field(None, min_length=1)
    email_port: Optional[int] = Field(None, ge=1, le=65535)
    email_username: Optional[str] = Field(None, min_length=1)
    email_password: Optional[str] = Field(None, min_length=1)
    email_from: Optional[EmailStr] = None
    email_use_tls: Optional[bool] = None
    email_use_ssl: Optional[bool] = None

class SMTPSettings(SMTPSettingsBase):
    pass

# Email Queue Schemas
class EmailQueueItem(BaseModel):
    id: str
    recipient: EmailStr
    subject: str
    template: str
    status: EmailStatus
    attempts: int = 0
    scheduled_at: datetime
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None

# Email Statistics Schemas
class EmailStats(BaseModel):
    total_sent: int = 0
    total_failed: int = 0
    total_pending: int = 0
    delivery_rate: float = 0.0
    avg_delivery_time: float = 0.0

# Email Test Schemas
class EmailTestRequest(BaseModel):
    recipient_email: EmailStr
    template_id: Optional[int] = None
    subject: Optional[str] = None
    html_content: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None

class EmailTestResponse(BaseModel):
    success: bool
    message: str
    email_log_id: Optional[int] = None

# Email Preview Schemas
class EmailPreviewRequest(BaseModel):
    template_data: Optional[Dict[str, Any]] = None

class EmailPreviewResponse(BaseModel):
    subject: str
    html_content: str
    text_content: Optional[str] = None
    variables_used: List[str] = []

# Bulk Email Schemas
class BulkEmailRequest(BaseModel):
    template_id: int
    recipients: List[EmailStr] = Field(..., min_items=1, max_items=1000)
    template_data: Optional[Dict[str, Any]] = None
    schedule_at: Optional[datetime] = None

class BulkEmailResponse(BaseModel):
    success: bool
    message: str
    queued_count: int
    failed_count: int = 0
    errors: List[str] = []

# Paginated Response Schemas
class PaginatedEmailTemplates(BaseModel):
    items: List[EmailTemplate]
    total: int
    page: int
    size: int
    pages: int

class PaginatedEmailLogs(BaseModel):
    items: List[EmailLog]
    total: int
    page: int
    size: int
    pages: int

class PaginatedEmailQueue(BaseModel):
    items: List[EmailQueueItem]
    total: int
    page: int
    size: int
    pages: int