from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
from loguru import logger
from sqlalchemy.orm import Session

from .config import settings
from app.database.database import get_db_session as get_db
from app.database.services import UserService
from app.database.models import User
from app.utils.jwt_auth import get_jwt_manager, JWTError, TokenExpiredError, TokenInvalidError

security = HTTPBearer()

def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token using centralized JWT manager"""
    try:
        jwt_manager = get_jwt_manager()
        payload = jwt_manager.decode_token(token)
        
        # Extract user information from JWT payload
        sub: str = payload.get("sub")  # JWT standard subject field
        email: str = payload.get("email") or sub  # Use sub as email if email field is not present
        
        if sub is None:
            logger.warning("Token missing subject field")
            return None
            
        return {
            "user_id": payload.get("user_id"),  # May be present in additional claims
            "email": email,
            "role": payload.get("role", "JOB_SEEKER"),
            "token_type": payload.get("type"),
            "service_name": payload.get("service")  # For service tokens
        }
        
    except (TokenExpiredError, TokenInvalidError, JWTError) as e:
        logger.warning(f"JWT verification failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {e}")
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    token_data = verify_token(token)
    
    if token_data is None:
        raise credentials_exception
    
    # Get user from database
    try:
        user_service = UserService(db)
        user = None
        
        # Try to get user by email (primary method for JWT tokens)
        if token_data.get("email"):
            user = await user_service.get_user_by_email(token_data["email"])
        
        # Fallback: try by ID if email lookup failed and user_id is available
        if not user and token_data.get("user_id"):
            user = await user_service.get_user_by_id(token_data["user_id"])
        
        if not user:
            raise credentials_exception
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        # Convert SQLAlchemy model to dict
        return {
            "id": user.id,
            "email": user.email,
            "full_name": f"{user.first_name} {user.last_name}".strip(),
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "last_login": getattr(user, 'last_login', None),
            "phone": user.phone
        }
        
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise credentials_exception

async def get_current_active_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Get current active user"""
    if not current_user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def require_roles(allowed_roles: List[str]):
    """Decorator to require specific roles"""
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_active_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "JOB_SEEKER")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

# Role-based dependencies
get_super_admin = require_roles(["super_admin"])
get_admin = require_roles(["super_admin", "admin"])
get_current_admin_user = require_roles(["super_admin", "admin"])  # Alias for backward compatibility
get_employer = require_roles(["super_admin", "admin", "employer"])
get_job_seeker_only = require_roles(["job_seeker"])
get_job_seeker = require_roles(["super_admin", "admin", "employer", "job_seeker"])