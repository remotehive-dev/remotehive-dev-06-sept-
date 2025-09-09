from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
import uuid
from datetime import datetime, timedelta

from app.core.database import get_db
from app.database.mongodb_models import User
from app.core.config import settings
from app.utils.jwt_auth import get_jwt_manager, TokenExpiredError, TokenInvalidError, JWTError

security = HTTPBearer()

async def get_database() -> AsyncIOMotorDatabase:
    """Get MongoDB database"""
    return get_db()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> User:
    """Get current authenticated user using centralized JWT manager"""
    try:
        token = credentials.credentials
        jwt_manager = get_jwt_manager()
        payload = jwt_manager.decode_token(token)
        
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Convert string UUID to UUID object
        try:
            user_id = uuid.UUID(user_id_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID format",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    except (TokenExpiredError, TokenInvalidError, JWTError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await User.find_one(User.id == user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current user and verify admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user