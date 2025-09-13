from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from loguru import logger
# from sqlalchemy.orm import Session  # Removed for MongoDB migration

# from app.core.database import get_db  # Removed for MongoDB migration
from app.core.auth import get_current_user
from app.database.services import EmployerService
from app.models.mongodb_models import User, Employer, UserRole

router = APIRouter()

@router.get("/profile")
async def get_employer_profile(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get current employer's profile"""
    # Check if user is an employer
    if current_user.get("role") != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employer role required."
        )
    
    employer_service = EmployerService()
    employer = await employer_service.get_employer_by_user_id(current_user.get("id"))
    
    if not employer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found"
        )
    
    return {
        "id": employer.id,
        "user_id": employer.user_id,
        "company_name": employer.company_name,
        "company_description": employer.company_description,
        "company_website": employer.company_website,
        "company_size": employer.company_size,
        "industry": employer.industry,
        "location": employer.location,
        "logo_url": employer.logo_url,
        "verified": employer.verified,
        "created_at": employer.created_at,
        "updated_at": employer.updated_at
    }

@router.post("/profile")
async def create_employer_profile(
    profile_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create employer profile"""
    # Check if user is an employer
    if current_user.get("role") != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employer role required."
        )
    
    employer_service = EmployerService(db)
    
    # Check if employer profile already exists
    existing_employer = employer_service.get_employer_by_user_id(current_user.get("id"))
    if existing_employer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employer profile already exists"
        )
    
    try:
        # Create employer profile
        employer_data = {
            "user_id": current_user.get("id"),
            "company_name": profile_data.get("company_name"),
            "company_description": profile_data.get("company_description"),
            "company_website": profile_data.get("company_website"),
            "company_size": profile_data.get("company_size"),
            "industry": profile_data.get("industry"),
            "location": profile_data.get("location"),
            "logo_url": profile_data.get("logo_url")
        }
        
        employer = employer_service.create_employer(employer_data)
        
        return {
            "id": employer.id,
            "user_id": employer.user_id,
            "company_name": employer.company_name,
            "company_description": employer.company_description,
            "company_website": employer.company_website,
            "company_size": employer.company_size,
            "industry": employer.industry,
            "location": employer.location,
            "logo_url": employer.logo_url,
            "verified": employer.verified,
            "created_at": employer.created_at,
            "updated_at": employer.updated_at
        }
        
    except Exception as e:
        logger.error(f"Error creating employer profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create employer profile"
        )

@router.get("/")
async def get_employers(
    page: int = 1,
    limit: int = 50,
    search: str = None,
    employer_status: str = None,
    industry: str = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all employers with pagination and filters (admin only)"""
    # Check if user is admin
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin role required."
        )
    
    try:
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get employers with filters
        employers = EmployerService.get_employers(
            db,
            search=search,
            skip=offset,
            limit=limit
        )
        
        # Get total count (simplified for now)
        total = len(employers) if employers else 0
        
        return {
            "employers": employers,
            "total": total,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Error fetching employers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch employers"
        )

@router.put("/profile")
async def update_employer_profile(
    profile_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update employer profile"""
    # Check if user is an employer
    if current_user.get("role") != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employer role required."
        )
    
    employer_service = EmployerService()
    employer = await employer_service.get_employer_by_user_id(current_user.get("id"))
    
    if not employer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found"
        )
    
    try:
        # Update employer profile
        update_data = {}
        if "company_name" in profile_data:
            update_data["company_name"] = profile_data["company_name"]
        if "company_description" in profile_data:
            update_data["company_description"] = profile_data["company_description"]
        if "company_website" in profile_data:
            update_data["company_website"] = profile_data["company_website"]
        if "company_size" in profile_data:
            update_data["company_size"] = profile_data["company_size"]
        if "industry" in profile_data:
            update_data["industry"] = profile_data["industry"]
        if "location" in profile_data:
            update_data["location"] = profile_data["location"]
        if "logo_url" in profile_data:
            update_data["logo_url"] = profile_data["logo_url"]
        
        updated_employer = await employer_service.update_employer(employer.id, update_data)
        
        return {
            "id": updated_employer.id,
            "user_id": updated_employer.user_id,
            "company_name": updated_employer.company_name,
            "company_description": updated_employer.company_description,
            "company_website": updated_employer.company_website,
            "company_size": updated_employer.company_size,
            "industry": updated_employer.industry,
            "location": updated_employer.location,
            "logo_url": updated_employer.logo_url,
            "verified": updated_employer.verified,
            "created_at": updated_employer.created_at,
            "updated_at": updated_employer.updated_at
        }
        
    except Exception as e:
        logger.error(f"Error updating employer profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update employer profile"
        )