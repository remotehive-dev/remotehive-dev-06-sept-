from datetime import datetime, timedelta
from typing import Optional, Union, Dict, Any
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import warnings

from app.core.config import settings
from app.core.database import get_db
from app.database.mongodb_models import User, UserRole
from app.utils.jwt_auth import get_jwt_manager, JWTError, TokenExpiredError, TokenInvalidError

# Suppress bcrypt version warnings
warnings.filterwarnings("ignore", message=".*__about__.*")
warnings.filterwarnings("ignore", category=UserWarning, module="passlib")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token security
security = HTTPBearer()

class AuthenticationError(Exception):
    """Custom authentication error"""
    pass

class AuthorizationError(Exception):
    """Custom authorization error"""
    pass

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token using centralized JWT manager"""
    jwt_manager = get_jwt_manager()
    
    # Extract subject from data (email or user_id)
    subject = data.get("sub") or data.get("email") or data.get("user_id")
    if not subject:
        raise ValueError("Token data must contain subject (sub, email, or user_id)")
    
    # Prepare additional claims (exclude standard JWT fields)
    additional_claims = {
        k: v for k, v in data.items() 
        if k not in ["sub", "email", "user_id", "exp", "iat", "type"]
    }
    
    return jwt_manager.create_access_token(
        subject=str(subject),
        user_data=additional_claims,
        expires_delta=expires_delta
    )

def verify_token(token: str) -> dict:
    """Verify and decode a JWT token using centralized JWT manager"""
    try:
        jwt_manager = get_jwt_manager()
        payload = jwt_manager.decode_token(token)
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise AuthenticationError("Invalid token - missing subject")
        return payload
        
    except (TokenExpiredError, TokenInvalidError, JWTError) as e:
        raise AuthenticationError(f"Invalid token: {e}")
    except Exception as e:
        raise AuthenticationError(f"Token verification failed: {e}")

async def authenticate_user(db: AsyncIOMotorDatabase, email: str, password: str) -> Optional[User]:
    """Authenticate a user with email and password"""
    user = await User.find_one(User.email == email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncIOMotorDatabase = Depends(get_db)) -> User:
    """Get the current authenticated user"""
    try:
        token = credentials.credentials
        print(f"DEBUG: Received token: {token[:20]}...")
        payload = verify_token(token)
        print(f"DEBUG: Token payload: {payload}")
        user_id = payload.get("sub")
        print(f"DEBUG: Extracted user_id: {user_id}")
        
        if user_id is None:
            print("DEBUG: user_id is None")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"DEBUG: Querying user with email: {user_id}")
        user = await User.find_one(User.email == user_id)
        print(f"DEBUG: Found user: {user}")
        if user is None:
            print("DEBUG: User not found in database")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            print("DEBUG: User is inactive")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"DEBUG: Returning user: {user.email}")
        return user
    
    except AuthenticationError as e:
        print(f"DEBUG: Authentication Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_active_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Get the current active user"""
    if not current_user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def require_role(required_roles: Union[str, list[str]]):
    """Decorator to require specific user roles"""
    if isinstance(required_roles, str):
        required_roles = [required_roles]
    
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_active_user)) -> Dict[str, Any]:
        if current_user.get("role") not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    
    return role_checker

def require_admin(current_user: Dict[str, Any] = Depends(get_current_active_user)) -> Dict[str, Any]:
    """Require admin or super_admin role"""
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_super_admin(current_user: Dict[str, Any] = Depends(get_current_active_user)) -> Dict[str, Any]:
    """Require super_admin role"""
    if current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user

async def create_user(db: AsyncIOMotorDatabase, email: str, password: str, first_name: str, last_name: str, 
               role: Union[str, UserRole] = UserRole.JOB_SEEKER, phone: Optional[str] = None) -> User:
    """Create a new user"""
    # Check if user already exists
    existing_user = await User.find_one(User.email == email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Convert string role to UserRole enum if needed
    if isinstance(role, str):
        try:
            role = UserRole(role)
        except ValueError:
            # If string doesn't match enum values, try uppercase
            role = UserRole(role.upper())
    
    print(f"DEBUG: Creating user with role: {role} (type: {type(role)})")
    
    # Create new user
    hashed_password = get_password_hash(password)
    user = User(
        email=email,
        password_hash=hashed_password,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        role=role,
        is_active=True,
        is_verified=False
    )
    
    print(f"DEBUG: User object created: {user.dict()}")
    
    try:
        await user.insert()
        print("DEBUG: User inserted to MongoDB")
        return user
    except Exception as e:
        print(f"DEBUG: Error during database operation: {e}")
        raise e