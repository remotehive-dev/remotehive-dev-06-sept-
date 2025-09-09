from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_admin

router = APIRouter()

# Pydantic models for request/response
class ContactInfoBase(BaseModel):
    category: str
    label: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    office_hours: Optional[str] = None
    timezone: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    is_primary: bool = False
    display_order: int = 0

class ContactInfoCreate(ContactInfoBase):
    pass

class ContactInfoUpdate(ContactInfoBase):
    pass

class ContactInfoResponse(ContactInfoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ContactInfoListResponse(BaseModel):
    contact_infos: List[ContactInfoResponse]
    total: int

@router.get("/contact-info", response_model=ContactInfoListResponse)
async def get_contact_infos(
    current_user = Depends(get_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """
    Get all contact information entries.
    Admin only endpoint.
    """
    try:
        # Build query
        query = supabase.table("contact_information").select("*")
        
        if category:
            query = query.eq("category", category)
            
        if is_active is not None:
            query = query.eq("is_active", is_active)
            
        # Get total count first
        count_query = supabase.table("contact_information").select("id", count="exact")
        if category:
            count_query = count_query.eq("category", category)
        if is_active is not None:
            count_query = count_query.eq("is_active", is_active)
            
        count_result = count_query.execute()
        total = count_result.count
        
        # Get paginated results
        query = query.order("display_order", desc=False).order("created_at", desc=True)
        query = query.range(skip, skip + limit - 1)
        
        result = query.execute()
        contact_infos = result.data
        
        # Convert to response format
        contact_info_list = []
        for row in contact_infos:
            contact_info_list.append(ContactInfoResponse(**row))
        
        return ContactInfoListResponse(
            contact_infos=contact_info_list,
            total=total
        )
        
    except Exception as e:
        print(f"Error fetching contact information: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch contact information"
        )

@router.get("/contact-info/public", response_model=ContactInfoListResponse)
async def get_public_contact_infos(
    db: Session = Depends(get_db),
    category: Optional[str] = None
):
    """
    Get active contact information for public display.
    No authentication required.
    """
    try:
        query = supabase.table("contact_information").select("*").eq("is_active", True)
        
        if category:
            query = query.eq("category", category)
            
        query = query.order("display_order", desc=False).order("created_at", desc=True)
        
        result = query.execute()
        contact_infos = result.data
        
        # Convert to response format
        contact_info_list = []
        for row in contact_infos:
            contact_info_list.append(ContactInfoResponse(**row))
        
        return ContactInfoListResponse(
            contact_infos=contact_info_list,
            total=len(contact_info_list)
        )
        
    except Exception as e:
        print(f"Error fetching public contact information: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch contact information"
        )

@router.get("/contact-info/{contact_info_id}", response_model=ContactInfoResponse)
async def get_contact_info(
    contact_info_id: int,
    current_user = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """
    Get a specific contact information entry by ID.
    Admin only endpoint.
    """
    try:
        result = supabase.table("contact_information").select("*").eq("id", contact_info_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact information not found"
            )
        
        return ContactInfoResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching contact information: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch contact information"
        )

@router.post("/contact-info", response_model=ContactInfoResponse)
async def create_contact_info(
    contact_info: ContactInfoCreate,
    current_user = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new contact information entry.
    Admin only endpoint.
    """
    try:
        # If this is marked as primary, unset other primary entries in the same category
        if contact_info.is_primary:
            supabase.table("contact_information").update({
                "is_primary": False
            }).eq("category", contact_info.category).eq("is_primary", True).execute()
        
        # Insert new contact info
        data = contact_info.dict()
        result = supabase.table("contact_information").insert(data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create contact information"
            )
        
        return ContactInfoResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating contact information: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create contact information"
        )

@router.put("/contact-info/{contact_info_id}", response_model=ContactInfoResponse)
async def update_contact_info(
    contact_info_id: int,
    contact_info: ContactInfoUpdate,
    current_user = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """
    Update a contact information entry.
    Admin only endpoint.
    """
    try:
        # Check if contact info exists
        check_result = supabase.table("contact_information").select("id").eq("id", contact_info_id).execute()
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact information not found"
            )
        
        # If this is marked as primary, unset other primary entries in the same category
        if contact_info.is_primary:
            supabase.table("contact_information").update({
                "is_primary": False
            }).eq("category", contact_info.category).eq("is_primary", True).neq("id", contact_info_id).execute()
        
        # Update contact info
        data = contact_info.dict()
        result = supabase.table("contact_information").update(data).eq("id", contact_info_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update contact information"
            )
        
        return ContactInfoResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating contact information: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update contact information"
        )

@router.delete("/contact-info/{contact_info_id}")
async def delete_contact_info(
    contact_info_id: int,
    current_user = Depends(get_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a contact information entry.
    Admin only endpoint.
    """
    try:
        # Check if contact info exists
        check_result = supabase.table("contact_information").select("id").eq("id", contact_info_id).execute()
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact information not found"
            )
        
        # Delete contact info
        result = supabase.table("contact_information").delete().eq("id", contact_info_id).execute()
        
        return {"message": "Contact information deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting contact information: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete contact information"
        )