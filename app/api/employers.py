from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import logging

from ..database import get_db_session
from ..database.services import EmployerService
# TODO: MongoDB Migration - Update imports to use MongoDB models
# from ..database.models import Employer, User, UserRole
from ..models.mongodb_models import Employer, User, UserRole

logger = logging.getLogger(__name__)

router = APIRouter(tags=["employers"])

# Pydantic models for request/response
class EmployerCreate(BaseModel):
    company_name: str
    company_email: EmailStr
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None

class EmployerResponse(BaseModel):
    id: str
    company_name: str
    company_email: str
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    
    class Config:
        from_attributes = True

class EmployersListResponse(BaseModel):
    employers: List[EmployerResponse]
    total: int
    page: int
    limit: int

@router.get("/", response_model=EmployersListResponse)
async def get_employers(
    search: Optional[str] = Query(None, description="Search term for company name, industry, or city"),
    limit: int = Query(50, ge=1, le=100, description="Number of employers to return"),
    skip: int = Query(0, ge=0, description="Number of employers to skip"),
    db: Session = Depends(get_db_session)
):
    """Get list of employers with optional search and pagination."""
    try:
        employers = EmployerService.get_employers(
            db=db,
            search=search,
            skip=skip,
            limit=limit
        )
        
        # Get total count for pagination
        total_query = db.query(Employer)
        if search:
            from sqlalchemy import or_
            total_query = total_query.filter(
                or_(
                    Employer.company_name.ilike(f'%{search}%'),
                    Employer.industry.ilike(f'%{search}%'),
                    Employer.location.ilike(f'%{search}%')
                )
            )
        total = total_query.count()
        
        return EmployersListResponse(
            employers=[EmployerResponse.model_validate(emp) for emp in employers],
            total=total,
            page=(skip // limit) + 1,
            limit=limit
        )
    except Exception as e:
        logger.error(f"Error fetching employers: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch employers")

@router.post("/", response_model=EmployerResponse, status_code=201)
async def create_employer(
    employer_data: EmployerCreate,
    db: Session = Depends(get_db_session)
):
    """Create a new employer."""
    try:
        # Check if company already exists
        existing_employer = db.query(Employer).filter(
            Employer.company_name.ilike(employer_data.company_name)
        ).first()
        
        if existing_employer:
            raise HTTPException(
                status_code=409,
                detail="Company already exists"
            )
        
        # For admin-created employers, find or create a system admin user
        admin_user = db.query(User).filter(User.role == UserRole.ADMIN).first()
        
        if not admin_user:
            # Create a system admin user if none exists
            admin_user = User(
                email="system@remotehive.com",
                password_hash="dummy_hash",  # This should be properly hashed in production
                first_name="System",
                last_name="Admin",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin_user)
            db.flush()  # Get the ID without committing
        
        # Create new employer
        employer = EmployerService.create_employer(
            db=db,
            user_id=admin_user.id,  # Use admin user ID
            company_data=employer_data.dict()
        )
        
        return EmployerResponse.model_validate(employer)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating employer: {e}")
        raise HTTPException(status_code=500, detail="Failed to create employer")

@router.get("/{employer_id}", response_model=EmployerResponse)
async def get_employer(
    employer_id: int,
    db: Session = Depends(get_db_session)
):
    """Get employer by ID."""
    try:
        employer = EmployerService.get_employer_by_id(db=db, employer_id=employer_id)
        
        if not employer:
            raise HTTPException(status_code=404, detail="Employer not found")
        
        return EmployerResponse.model_validate(employer)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching employer {employer_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch employer")

@router.put("/{employer_id}", response_model=EmployerResponse)
async def update_employer(
    employer_id: int,
    employer_data: EmployerCreate,
    db: Session = Depends(get_db_session)
):
    """Update employer information."""
    try:
        # Check if employer exists
        existing_employer = EmployerService.get_employer_by_id(db=db, employer_id=employer_id)
        if not existing_employer:
            raise HTTPException(status_code=404, detail="Employer not found")
        
        # Check if company name is being changed to an existing name
        if employer_data.company_name != existing_employer.company_name:
            name_conflict = db.query(Employer).filter(
                Employer.company_name.ilike(employer_data.company_name),
                Employer.id != employer_id
            ).first()
            
            if name_conflict:
                raise HTTPException(
                    status_code=409,
                    detail="Company name already exists"
                )
        
        # Update employer
        updated_employer = EmployerService.update_employer(
            db=db,
            employer_id=employer_id,
            **employer_data.dict()
        )
        
        return EmployerResponse.model_validate(updated_employer)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating employer {employer_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update employer")

@router.delete("/{employer_id}")
async def delete_employer(
    employer_id: int,
    db: Session = Depends(get_db_session)
):
    """Delete employer."""
    try:
        # Check if employer exists
        employer = EmployerService.get_employer_by_id(db=db, employer_id=employer_id)
        if not employer:
            raise HTTPException(status_code=404, detail="Employer not found")
        
        # Check if employer has job posts
        from ..database.models import JobPost
        job_posts_count = db.query(JobPost).filter(JobPost.employer_id == employer_id).count()
        
        if job_posts_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete employer with {job_posts_count} job posts. Please delete job posts first."
            )
        
        # Delete employer
        db.delete(employer)
        db.commit()
        
        return {"message": "Employer deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting employer {employer_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete employer")