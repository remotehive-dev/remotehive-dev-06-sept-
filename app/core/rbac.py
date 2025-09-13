from beanie import Document
from pydantic import Field, ConfigDict
from datetime import datetime
from enum import Enum
from typing import Dict, Set, List, Optional

# Permission system
class Permission(Enum):
    # User Management
    CREATE_USER = "create_user"
    READ_USER = "read_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    MANAGE_USER_ROLES = "manage_user_roles"
    
    # Job Management
    CREATE_JOB = "create_job"
    READ_JOB = "read_job"
    UPDATE_JOB = "update_job"
    DELETE_JOB = "delete_job"
    APPROVE_JOB = "approve_job"
    FEATURE_JOB = "feature_job"
    
    # Application Management
    CREATE_APPLICATION = "create_application"
    READ_APPLICATION = "read_application"
    UPDATE_APPLICATION = "update_application"
    DELETE_APPLICATION = "delete_application"
    REVIEW_APPLICATION = "review_application"
    
    # Employer Management
    CREATE_EMPLOYER = "create_employer"
    READ_EMPLOYER = "read_employer"
    UPDATE_EMPLOYER = "update_employer"
    DELETE_EMPLOYER = "delete_employer"
    VERIFY_EMPLOYER = "verify_employer"
    
    # Job Seeker Management
    CREATE_JOB_SEEKER = "create_job_seeker"
    READ_JOB_SEEKER = "read_job_seeker"
    UPDATE_JOB_SEEKER = "update_job_seeker"
    DELETE_JOB_SEEKER = "delete_job_seeker"
    
    # Content Management
    CREATE_CONTENT = "create_content"
    READ_CONTENT = "read_content"
    UPDATE_CONTENT = "update_content"
    DELETE_CONTENT = "delete_content"
    PUBLISH_CONTENT = "publish_content"
    
    # System Management
    MANAGE_SYSTEM_SETTINGS = "manage_system_settings"
    VIEW_ADMIN_LOGS = "view_admin_logs"
    MANAGE_SCRAPER = "manage_scraper"
    VIEW_ANALYTICS = "view_analytics"
    
    # Contact Management
    READ_CONTACT_SUBMISSIONS = "read_contact_submissions"
    UPDATE_CONTACT_SUBMISSIONS = "update_contact_submissions"
    DELETE_CONTACT_SUBMISSIONS = "delete_contact_submissions"
    
    # Review Management
    CREATE_REVIEW = "create_review"
    READ_REVIEW = "read_review"
    UPDATE_REVIEW = "update_review"
    DELETE_REVIEW = "delete_review"
    MODERATE_REVIEW = "moderate_review"
    
    # Ad Management
    CREATE_AD = "create_ad"
    READ_AD = "read_ad"
    UPDATE_AD = "update_ad"
    DELETE_AD = "delete_ad"
    MANAGE_AD_REVENUE = "manage_ad_revenue"

# Role-Permission mapping
ROLE_PERMISSIONS: Dict[str, Set[Permission]] = {
    "job_seeker": {
        Permission.CREATE_JOB_SEEKER,
        Permission.READ_JOB_SEEKER,
        Permission.UPDATE_JOB_SEEKER,
        Permission.READ_JOB,
        Permission.CREATE_APPLICATION,
        Permission.READ_APPLICATION,
        Permission.UPDATE_APPLICATION,
        Permission.CREATE_REVIEW,
        Permission.READ_REVIEW,
        Permission.READ_CONTENT,
    },
    
    "employer": {
        Permission.CREATE_EMPLOYER,
        Permission.READ_EMPLOYER,
        Permission.UPDATE_EMPLOYER,
        Permission.CREATE_JOB,
        Permission.READ_JOB,
        Permission.UPDATE_JOB,
        Permission.DELETE_JOB,
        Permission.READ_APPLICATION,
        Permission.UPDATE_APPLICATION,
        Permission.REVIEW_APPLICATION,
        Permission.READ_JOB_SEEKER,
        Permission.READ_CONTENT,
        Permission.CREATE_REVIEW,
        Permission.READ_REVIEW,
    },
    
    "admin": {
        # User management (limited)
        Permission.READ_USER,
        Permission.UPDATE_USER,
        
        # Job management
        Permission.READ_JOB,
        Permission.UPDATE_JOB,
        Permission.DELETE_JOB,
        Permission.APPROVE_JOB,
        Permission.FEATURE_JOB,
        
        # Application management
        Permission.READ_APPLICATION,
        Permission.UPDATE_APPLICATION,
        Permission.DELETE_APPLICATION,
        Permission.REVIEW_APPLICATION,
        
        # Employer management
        Permission.READ_EMPLOYER,
        Permission.UPDATE_EMPLOYER,
        Permission.VERIFY_EMPLOYER,
        
        # Job seeker management
        Permission.READ_JOB_SEEKER,
        Permission.UPDATE_JOB_SEEKER,
        
        # Content management
        Permission.CREATE_CONTENT,
        Permission.READ_CONTENT,
        Permission.UPDATE_CONTENT,
        Permission.DELETE_CONTENT,
        Permission.PUBLISH_CONTENT,
        
        # Contact management
        Permission.READ_CONTACT_SUBMISSIONS,
        Permission.UPDATE_CONTACT_SUBMISSIONS,
        Permission.DELETE_CONTACT_SUBMISSIONS,
        
        # Review management
        Permission.READ_REVIEW,
        Permission.UPDATE_REVIEW,
        Permission.DELETE_REVIEW,
        Permission.MODERATE_REVIEW,
        
        # Ad management
        Permission.READ_AD,
        Permission.UPDATE_AD,
        
        # Limited system access
        Permission.VIEW_ADMIN_LOGS,
        Permission.VIEW_ANALYTICS,
    },
    
    "super_admin": {
        # All permissions - super admin has access to everything
        *[perm for perm in Permission]
    }
}

# Database models for RBAC
class RolePermission(Document):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    role: str
    permission: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "role_permissions"

class UserSession(Document):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    user_id: str
    session_token: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool = True
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "user_sessions"

class LoginAttempt(Document):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    email: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool = False
    failure_reason: Optional[str] = None
    attempted_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "login_attempts"

# Helper functions
def get_role_permissions(role: str) -> Set[Permission]:
    """Get all permissions for a given role"""
    return ROLE_PERMISSIONS.get(role, set())

def has_permission(user_role: str, permission: Permission) -> bool:
    """Check if a role has a specific permission"""
    role_perms = get_role_permissions(user_role)
    return permission in role_perms

def can_access_resource(user_role: str, required_permissions: List[Permission]) -> bool:
    """Check if a role can access a resource requiring specific permissions"""
    role_perms = get_role_permissions(user_role)
    return any(perm in role_perms for perm in required_permissions)

def get_user_permissions(user_role: str) -> List[str]:
    """Get list of permission strings for a user role"""
    permissions = get_role_permissions(user_role)
    return [perm.value for perm in permissions]

# Session Management Functions
async def create_user_session(db, user_id: str, session_token: str, ip_address: str = None, user_agent: str = None, expires_at = None):
    """Create a new user session"""
    from datetime import datetime, timedelta
    from app.core.logging import get_logger
    
    logger = get_logger("rbac")
    logger.info(f"Creating user session for user_id: {user_id}")
    
    if expires_at is None:
        expires_at = datetime.utcnow() + timedelta(hours=24)
    
    try:
        logger.info(f"Creating UserSession object with user_id={user_id}, session_token={session_token[:10]}...")
        session = UserSession(
            user_id=user_id,
            session_token=session_token,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=expires_at
        )
        logger.info("Inserting session to database")
        await session.insert()
        logger.info(f"Session created successfully with id: {session.id}")
        return session
    except Exception as e:
        logger.error(f"Error creating user session: {str(e)}")
        raise e

async def end_user_session(db, session_token: str):
    """End a user session by marking it as inactive"""
    session = await UserSession.find_one({
        "session_token": session_token,
        "is_active": True
    })
    
    if session:
        session.is_active = False
        await session.save()
        return True
    return False

async def get_active_session(db, session_token: str):
    """Get an active session by token"""
    from datetime import datetime
    return await UserSession.find_one({
        "session_token": session_token,
        "is_active": True,
        "expires_at": {"$gt": datetime.utcnow()}
    })

async def log_login_attempt(db, email: str, success: bool, ip_address: str = None, user_agent: str = None, failure_reason: str = None):
    """Log a login attempt"""
    attempt = LoginAttempt(
        email=email,
        ip_address=ip_address,
        user_agent=user_agent,
        success=success,
        failure_reason=failure_reason
    )
    await attempt.insert()
    return attempt

# FastAPI Dependencies
def require_permission(permission_string: str):
    """FastAPI dependency to require specific permission"""
    from fastapi import HTTPException, Depends
    from app.core.auth import get_current_user
    
    def permission_checker(current_user: dict = Depends(get_current_user)):
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Check if user has required permission
        user_role = current_user.get('role', 'job_seeker').lower()
        
        # Parse permission string (e.g., "admin:csv_upload" -> check admin permissions)
        if ':' in permission_string:
            required_role, action = permission_string.split(':', 1)
            if user_role != required_role.lower() and user_role != 'super_admin':
                raise HTTPException(status_code=403, detail="Insufficient permissions")
        else:
            # Direct permission check
            try:
                required_perm = Permission(permission_string)
                if not has_permission(user_role, required_perm):
                    raise HTTPException(status_code=403, detail="Insufficient permissions")
            except ValueError:
                # Permission not found in enum, check role-based access
                if user_role not in ['admin', 'super_admin']:
                    raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        return current_user
    
    return permission_checker