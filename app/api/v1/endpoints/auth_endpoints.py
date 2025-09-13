from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr
from loguru import logger

print("=== [UPDATED] AUTH_ENDPOINTS MODULE LOADED AT:", datetime.now(), "===")
logger.info("[UPDATED] AUTH_ENDPOINTS MODULE LOADED - ENHANCED LOGGING ACTIVE")

from app.core.local_auth import (
    authenticate_user, create_access_token, get_current_user,
    create_user, get_password_hash, verify_password
)
from app.core.auth_middleware import (
    require_super_admin, require_admin, require_employer, require_job_seeker,
    AuthContext, SecurityMiddleware
)
from app.core.rbac import get_role_permissions, create_user_session, end_user_session
from app.core.database import get_db
from app.database.mongodb_models import User, UserRole, EmailVerificationToken
from app.database.services import EmployerService, JobSeekerService
import requests
import json
import uuid

router = APIRouter()

@router.get("/test-logging")
async def test_logging_endpoint():
    """Test endpoint to verify logging is working"""
    print("=== [TEST] TEST LOGGING ENDPOINT CALLED ===", flush=True)
    logger.error("=== [TEST] TEST LOGGING ENDPOINT CALLED - ERROR LEVEL ===")
    logger.warning("=== [TEST] TEST LOGGING ENDPOINT CALLED - WARNING LEVEL ===")
    logger.info("=== [TEST] TEST LOGGING ENDPOINT CALLED - INFO LEVEL ===")
    
    # Write to file
    try:
        with open('D:\\Remotehive\\test_endpoint_debug.log', 'a') as f:
            f.write(f"[{datetime.now()}] Test endpoint called\n")
        print("Successfully wrote to test endpoint debug log")
    except Exception as e:
        print(f"Error writing to test endpoint debug log: {e}")
    
    return {"message": "Test logging endpoint called", "timestamp": datetime.now()}

# Request/Response Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: Dict[str, Any]
    permissions: list
    session_id: str

class PublicRegistrationRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: str  # "job_seeker" or "employer"

class AdminRegistrationRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: str  # "admin" or "super_admin"

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class EmailVerificationRequest(BaseModel):
    token: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class UserProfileResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    permissions: list

# Helper functions
def get_client_info(request: Request) -> Dict[str, str]:
    """Extract client information from request"""
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }

def create_login_response(user: User, access_token: str, expires_in: int, session_id: str) -> LoginResponse:
    """Create standardized login response"""
    user_role = user.role.value if isinstance(user.role, UserRole) else user.role
    permissions = get_role_permissions(user_role)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
        user={
            "id": str(user.id),  # Convert PydanticObjectId to string
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user_role,
            "is_active": user.is_active,
            "is_verified": user.is_verified
        },
        permissions=[p.value for p in permissions],
        session_id=session_id
    )

# Public Website Authentication Endpoints
@router.post("/public/login", response_model=LoginResponse)
async def public_login(
    login_data: LoginRequest,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Login endpoint for public website (job seekers and employers)"""
    client_info = get_client_info(request)
    
    # Check rate limiting
    if not SecurityMiddleware.check_rate_limit(
        db, login_data.email, client_info["ip_address"]
    ):
        SecurityMiddleware.log_login_attempt(
            db, login_data.email, client_info["ip_address"], 
            client_info["user_agent"], False, "Rate limit exceeded"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again later."
        )
    
    # Authenticate user
    user = await authenticate_user(db, login_data.email, login_data.password)
    if not user:
        SecurityMiddleware.log_login_attempt(
            db, login_data.email, client_info["ip_address"],
            client_info["user_agent"], False, "Invalid credentials"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user role is allowed for public login
    user_role = user.role.value if isinstance(user.role, UserRole) else user.role
    if user_role not in ["job_seeker", "employer"]:
        SecurityMiddleware.log_login_attempt(
            db, login_data.email, client_info["ip_address"],
            client_info["user_agent"], False, "Invalid role for public login"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Please use the admin panel for administrative access."
        )
    
    # Create access token
    expires_delta = timedelta(days=7) if login_data.remember_me else timedelta(hours=8)
    access_token = create_access_token(
        data={"sub": user.email, "role": user_role},
        expires_delta=expires_delta
    )
    
    # Create user session
    import secrets
    session_token = secrets.token_urlsafe(32)
    session = create_user_session(
        db, str(user.id).replace("-", ""), session_token, client_info["ip_address"], client_info["user_agent"]
    )
    session_id = session_token
    
    # Log successful login
    SecurityMiddleware.log_login_attempt(
        db, login_data.email, client_info["ip_address"],
        client_info["user_agent"], True
    )
    
    expires_in = int(expires_delta.total_seconds())
    return create_login_response(user, access_token, expires_in, session_id)

@router.post("/public/register", response_model=LoginResponse)
async def public_register(
    registration_data: PublicRegistrationRequest,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Registration endpoint for public website (job seekers and employers)"""
    import sys
    sys.stdout.flush()
    sys.stderr.flush()
    print(f"=== PUBLIC_REGISTER FUNCTION CALLED FOR: {registration_data.email} === [UPDATED]", flush=True)
    logger.error(f"=== PUBLIC_REGISTER FUNCTION CALLED FOR: {registration_data.email} === [UPDATED]")
    logger.warning(f"=== PUBLIC_REGISTER FUNCTION CALLED FOR: {registration_data.email} === [UPDATED]")
    logger.info(f"=== PUBLIC_REGISTER FUNCTION CALLED FOR: {registration_data.email} === [UPDATED]")
    
    # Also write to file for debugging with absolute path
    try:
        with open('D:\\Remotehive\\registration_debug.log', 'a') as f:
            f.write(f"[{datetime.now()}] PUBLIC_REGISTER called for: {registration_data.email}\n")
        print(f"Successfully wrote to debug log for {registration_data.email}")
    except Exception as e:
        print(f"Error writing to debug log: {e}")
    
    client_info = get_client_info(request)
    
    # Validate role
    if registration_data.role not in ["job_seeker", "employer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'job_seeker' or 'employer'"
        )
    
    # Check if user already exists
    existing_user = await User.find_one(User.email == registration_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    try:
        user = create_user(
            db=db,
            email=registration_data.email,
            password=registration_data.password,
            first_name=registration_data.first_name,
            last_name=registration_data.last_name,
            phone=registration_data.phone,
            role=registration_data.role
        )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.email, "role": registration_data.role},
            expires_delta=timedelta(hours=8)
        )
        print(f"PRINT DEBUG: Access token created successfully for {user.email}")
        
        # Create user session
        session_token = secrets.token_urlsafe(32)
        create_user_session(
            db, str(user.id).replace("-", ""), session_token, client_info["ip_address"], client_info["user_agent"]
        )
        print(f"PRINT DEBUG: User session created successfully for {user.email}")
        
        import logging
        print(f"PRINT DEBUG: About to start profile creation section for {registration_data.role}")
        logging.debug(f"DEBUG: About to start profile creation section for {registration_data.role}")
        
        # Create role-specific profile
        try:
            import logging
            logging.debug(f"DEBUG: About to create profile for role: {registration_data.role}")
            logging.info(f"Creating profile for role: {registration_data.role}")
            
            if registration_data.role == "employer":
                # Create employer profile with basic information
                employer_data = {
                    "company_name": f"{registration_data.first_name} {registration_data.last_name} Company",
                    "company_email": registration_data.email,  # Required field
                    "company_description": "New employer profile",
                    "industry": "Not specified",
                    "company_size": "startup",
                    "location": "Not specified"
                }
                logging.info(f"Creating employer profile with data: {employer_data}")
                employer_service = EmployerService()
                employer = await employer_service.create_employer(user.id, employer_data)
                logging.info(f"Employer profile created successfully: {employer.id}")
                
            elif registration_data.role == "job_seeker":
                # Create job seeker profile with basic information
                job_seeker_data = {
                    "current_title": "Job Seeker",
                    "experience_level": "entry",
                    "skills": [],
                    "preferred_job_types": ["full_time"],
                    "preferred_locations": ["Remote"],
                    "is_actively_looking": True
                }
                logging.info(f"Creating job seeker profile with data: {job_seeker_data}")
                job_seeker_service = JobSeekerService()
                job_seeker = await job_seeker_service.create_job_seeker(user.id, job_seeker_data)
                logging.info(f"Job seeker profile created successfully: {job_seeker.id}")
                
        except Exception as profile_error:
            import logging
            logging.error(f"Failed to create {registration_data.role} profile: {str(profile_error)}")
            logging.error(f"Profile error details: {type(profile_error).__name__}: {profile_error}")
            # Continue without failing the registration
        
        # Create lead in admin panel
        try:
            lead_data = {
                "user_id": user.id,
                "full_name": f"{registration_data.first_name} {registration_data.last_name}",
                "email": registration_data.email,
                "phone": registration_data.phone,
                "role": registration_data.role,
                "registration_source": "website_registration"
            }
            
            # Call the admin panel API to create lead
            admin_api_url = "http://localhost:3000/api/leads/create-from-registration"
            response = requests.post(admin_api_url, json=lead_data, timeout=5)
            
            if response.status_code != 201:
                import logging
                logging.warning(f"Failed to create lead: {response.text}")
                
        except Exception as lead_error:
            import logging
            logging.warning(f"Failed to create lead: {str(lead_error)}")
            # Continue without failing the registration
        
        # Create real-time notification for admin panel
        try:
            notification_data = {
                "user_id": user.id,
                "full_name": f"{registration_data.first_name} {registration_data.last_name}",
                "email": registration_data.email,
                "role": registration_data.role,
                "registration_source": "website_registration"
            }
            
            # Call the admin panel API to create notification
            notification_api_url = "http://localhost:3000/api/notifications/new-user-registration"
            notification_response = requests.post(notification_api_url, json=notification_data, timeout=5)
            
            if notification_response.status_code != 201:
                import logging
                logging.warning(f"Failed to create admin notification: {notification_response.text}")
                
        except Exception as notification_error:
            import logging
            logging.warning(f"Failed to create admin notification: {str(notification_error)}")
            # Continue without failing the registration
        
        # Send email verification
        try:
            verification_token = create_verification_token(db, user.id)
            user_name = f"{registration_data.first_name} {registration_data.last_name}".strip() or registration_data.email
            send_verification_email(registration_data.email, user_name, verification_token)
            logging.info(f"Verification email sent to: {registration_data.email}")
        except Exception as email_error:
            import logging
            logging.warning(f"Failed to send verification email: {str(email_error)}")
            # Continue without failing the registration
        
        return create_login_response(user, access_token, 28800, session_token)
        
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors)
        raise
    except Exception as e:
        # Only catch actual errors, not warnings
        import logging
        logging.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

# Admin Panel Authentication Endpoints
@router.post("/admin/login", response_model=LoginResponse)
async def admin_login(
    login_data: LoginRequest,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Login endpoint for admin panel (admin and super admin)"""
    client_info = get_client_info(request)
    
    # Check rate limiting (stricter for admin)
    if not SecurityMiddleware.check_rate_limit(
        db, login_data.email, client_info["ip_address"], max_attempts=3, window_minutes=30
    ):
        SecurityMiddleware.log_login_attempt(
            db, login_data.email, client_info["ip_address"],
            client_info["user_agent"], False, "Admin rate limit exceeded"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed admin login attempts. Please try again later."
        )
    
    # Authenticate user
    user = await authenticate_user(db, login_data.email, login_data.password)
    if not user:
        SecurityMiddleware.log_login_attempt(
            db, login_data.email, client_info["ip_address"],
            client_info["user_agent"], False, "Invalid admin credentials"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user role is allowed for admin login
    user_role = user.role.value if isinstance(user.role, UserRole) else user.role
    if user_role not in ["admin", "super_admin"]:
        SecurityMiddleware.log_login_attempt(
            db, login_data.email, client_info["ip_address"],
            client_info["user_agent"], False, "Invalid role for admin login"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    # Store user data in variables to avoid session issues
    user_id = user.id
    user_email = user.email
    user_first_name = user.first_name
    user_last_name = user.last_name
    user_is_active = user.is_active
    user_is_verified = user.is_verified
    
    # Create access token (shorter expiry for admin)
    expires_delta = timedelta(hours=4) if login_data.remember_me else timedelta(hours=2)
    access_token = create_access_token(
        data={"sub": user_email, "role": user_role},
        expires_delta=expires_delta
    )
    
    # Create user session
    import secrets
    session_token = secrets.token_urlsafe(32)
    
    logger.info(f"About to create user session for user_id: {user_id}")
    logger.info(f"Session token generated: {session_token[:10]}...")
    logger.info(f"Client info: {client_info}")
    
    try:
        logger.info("Calling create_user_session function")
        session = create_user_session(
            db, str(user_id), session_token, client_info["ip_address"], client_info["user_agent"]
        )
        logger.info(f"Session created successfully: {session}")
        session_id = session_token
    except Exception as e:
        logger.error(f"Failed to create user session: {e}")
        logger.error(f"Exception type: {type(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user session"
        )
    
    # Log successful admin login
    SecurityMiddleware.log_login_attempt(
        db, login_data.email, client_info["ip_address"],
        client_info["user_agent"], True
    )
    
    expires_in = int(expires_delta.total_seconds())
    
    # Create a user dict for the response instead of using the SQLAlchemy object
    user_dict = {
        "id": str(user_id),
        "email": user_email,
        "first_name": user_first_name,
        "last_name": user_last_name,
        "role": user_role,
        "is_active": user_is_active,
        "is_verified": user_is_verified
    }
    
    permissions = get_role_permissions(user_role)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
        user=user_dict,
        permissions=[p.value for p in permissions],
        session_id=session_id
    )

@router.post("/admin/create-user", response_model=UserProfileResponse)
async def admin_create_user(
    registration_data: AdminRegistrationRequest,
    current_user: Dict[str, Any] = Depends(require_super_admin()),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create admin user (super admin only)"""
    
    # Validate role
    if registration_data.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'admin' or 'super_admin'"
        )
    
    # Only super admin can create other super admins
    current_user_role = current_user.get("role")
    if registration_data.role == "super_admin" and current_user_role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admin can create super admin users"
        )
    
    # Check if user already exists
    existing_user = await User.find_one(User.email == registration_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    try:
        user = create_user(
            db=db,
            email=registration_data.email,
            password=registration_data.password,
            first_name=registration_data.first_name,
            last_name=registration_data.last_name,
            phone=registration_data.phone,
            role=registration_data.role
        )
        
        user_role = user.role.value if isinstance(user.role, UserRole) else user.role
        permissions = get_role_permissions(user_role)
        
        return UserProfileResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            role=user_role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            permissions=[p.value for p in permissions]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User creation failed: {str(e)}"
        )

# Common Endpoints
@router.post("/logout")
async def logout(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Logout endpoint for all user types"""
    try:
        end_user_session(db, session_id)
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )

@router.get("/test-debug")
async def test_debug():
    """Test endpoint for debugging"""
    print("DEBUG: Test endpoint called")
    return {"message": "Debug test successful", "timestamp": datetime.now()}

@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    try:
        print(f"DEBUG PROFILE: Got current_user: {current_user}")
        print(f"DEBUG PROFILE: User role: {current_user.role}")
        print(f"DEBUG PROFILE: User role type: {type(current_user.role)}")
        
        # Convert UserRole enum to string if needed
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        print(f"DEBUG PROFILE: Processed user_role: {user_role}")
        
        permissions = get_role_permissions(user_role)
        print(f"DEBUG PROFILE: Got permissions: {permissions}")
        
        response = UserProfileResponse(
            id=str(current_user.id),
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            phone=current_user.phone,
            role=user_role,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            created_at=current_user.created_at,
            permissions=[p.value for p in permissions]
        )
        print(f"DEBUG PROFILE: Created response successfully")
        return response
    except Exception as e:
        print(f"DEBUG PROFILE ERROR: {str(e)}")
        print(f"DEBUG PROFILE ERROR TYPE: {type(e)}")
        import traceback
        print(f"DEBUG PROFILE TRACEBACK: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile error: {str(e)}"
        )

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Change user password"""
    
    # Get user from database
    user = await User.find_one(User.id == current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not verify_password(password_data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    try:
        user.password_hash = get_password_hash(password_data.new_password)
        await user.save()
        return {"message": "Password changed successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password change failed: {str(e)}"
        )

# Context endpoints for different user types
@router.get("/context/employer")
async def get_employer_context(
    context = Depends(AuthContext.get_employer_context)
):
    """Get employer-specific context and permissions"""
    return context

@router.get("/context/job-seeker")
async def get_job_seeker_context(
    context = Depends(AuthContext.get_job_seeker_context)
):
    """Get job seeker-specific context and permissions"""
    return context

@router.get("/context/admin")
async def get_admin_context(
    context = Depends(AuthContext.get_admin_context)
):
    """Get admin-specific context and permissions"""
    return context

# ============================================================================
# EMAIL VERIFICATION ENDPOINTS
# ============================================================================

async def create_verification_token(db: AsyncIOMotorDatabase, user_id: str) -> str:
    """Create a new email verification token for a user"""
    # Invalidate any existing tokens for this user
    existing_tokens = await EmailVerificationToken.find(
        EmailVerificationToken.user_id == user_id,
        EmailVerificationToken.is_used == False
    ).to_list()
    
    for token_doc in existing_tokens:
        token_doc.is_used = True
        token_doc.used_at = datetime.utcnow()
        await token_doc.save()
    
    # Create new token
    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
    
    verification_token = EmailVerificationToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    
    await verification_token.insert()
    
    return token

def send_verification_email(user_email: str, user_name: str, token: str):
    """Send verification email to user"""
    from app.tasks.email import send_verification_email_task
    
    # Queue the email task
    send_verification_email_task.delay(
        to_email=user_email,
        user_name=user_name,
        verification_token=token
    )

@router.post("/verify-email")
async def verify_email(
    verification_data: EmailVerificationRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Verify user email with token
    """
    try:
        # Find the verification token
        token_record = await EmailVerificationToken.find_one(
            EmailVerificationToken.token == verification_data.token,
            EmailVerificationToken.is_used == False,
            EmailVerificationToken.expires_at > datetime.utcnow()
        )
        
        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )
        
        # Get the user
        user = await User.find_one(User.id == token_record.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Mark user as verified
        user.is_verified = True
        await user.save()
        
        # Mark token as used
        token_record.is_used = True
        token_record.used_at = datetime.utcnow()
        await token_record.save()
        
        logger.info(f"Email verified successfully for user: {user.email}")
        
        return {
            "message": "Email verified successfully",
            "user_id": user.id,
            "email": user.email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify email"
        )

@router.post("/resend-verification")
async def resend_verification(
    resend_data: ResendVerificationRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Resend verification email
    """
    try:
        # Find the user
        user = await User.find_one(User.email == resend_data.email)
        if not user:
            # Don't reveal if email exists or not for security
            return {"message": "If the email exists, a verification link has been sent"}
        
        # Check if already verified
        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified"
            )
        
        # Create new verification token
        token = create_verification_token(db, user.id)
        
        # Send verification email
        user_name = f"{user.first_name} {user.last_name}".strip() or user.email
        send_verification_email(user.email, user_name, token)
        
        logger.info(f"Verification email resent to: {user.email}")
        
        return {"message": "Verification email sent successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resending verification email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email"
        )