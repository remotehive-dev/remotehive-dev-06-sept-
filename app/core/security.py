from datetime import datetime, timedelta
from typing import Any, Union, Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .config import settings
from .password_utils import verify_password, get_password_hash
from app.database.database import get_db_session
from app.database.services import UserService
from app.utils.jwt_auth import get_jwt_manager, TokenExpiredError, TokenInvalidError, JWTError

def create_access_token(
    subject: Union[str, Any], 
    expires_delta: timedelta = None,
    additional_claims: Dict[str, Any] = None
) -> str:
    """Create JWT access token using centralized JWT manager"""
    jwt_manager = get_jwt_manager()
    return jwt_manager.create_access_token(
        subject=str(subject),
        expires_delta=expires_delta,
        user_data=additional_claims or {}
    )



async def authenticate_user(db: Session, email: str, password: str) -> Union[Dict[str, Any], bool]:
    """Authenticate user with email and password"""
    user_service = UserService(db)
    user = await user_service.get_user_by_email(email)
    
    if not user:
        return False
    
    if not verify_password(password, user.hashed_password):
        return False
    
    if not user.is_active:
        return False
    
    # Convert to dict for consistency
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "last_login": user.last_login,
        "phone": user.phone
    }

def create_user_token(user: Dict[str, Any]) -> str:
    """Create access token for user"""
    additional_claims = {
        "email": user["email"],
        "role": user["role"],
        "full_name": user.get("full_name")
    }
    
    return create_access_token(
        subject=user["id"],
        additional_claims=additional_claims
    )

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db_session)):
    """Get current authenticated user from JWT token using centralized JWT manager"""
    try:
        token = credentials.credentials
        jwt_manager = get_jwt_manager()
        payload = jwt_manager.decode_token(token)
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except (TokenExpiredError, TokenInvalidError, JWTError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_service = UserService(db)
    # user_id contains the actual user ID from JWT 'sub' field
    user = await user_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user

def require_admin(current_user = Depends(get_current_user)):
    """Require admin or super_admin role"""
    from app.database.models import UserRole
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_super_admin(current_user = Depends(get_current_user)):
    """Require super_admin role"""
    from app.database.models import UserRole
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user