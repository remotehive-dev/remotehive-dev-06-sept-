from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form
from typing import Dict, Any, List, Optional
from loguru import logger
from datetime import datetime
import os
import uuid
import shutil
from pathlib import Path
from beanie import PydanticObjectId

from app.database.mongodb_models import CMSPage, SeoSettings, Review, Ad
from app.core.auth import get_current_active_user, get_admin
from app.schemas.cms import (
    CMSPageCreate, CMSPageUpdate, CMSPage as CMSPageSchema, CMSPageResponse,
    SEOSettings as SEOSettingsSchema, SEOSettingsUpdate,
    ReviewResponse, ReviewUpdate,
    ThemeSettings, ThemeSettingsUpdate,
    PaginatedResponse,
    MediaFileCreate, MediaFileUpdate, MediaFile,
    CarouselItemCreate, CarouselItemUpdate, CarouselItem,
    GalleryCreate, GalleryUpdate, Gallery, GalleryImageCreate, GalleryImageUpdate, GalleryImage
)
from app.schemas.cms import AdCampaignCreate as AdCreate, AdCampaignUpdate as AdUpdate, AdCampaign as AdSchema

router = APIRouter()

# Public CMS Endpoints (No Authentication Required)
@router.get("/public/pages", response_model=List[CMSPageSchema])
async def get_published_pages():
    """Get all published CMS pages for public viewing"""
    try:
        pages = await CMSPage.find({"status": "published"}).sort("-updated_at").to_list()
        return [{
            "id": str(page.id),
            "title": page.title,
            "slug": page.slug,
            "content": page.content,
            "meta_title": page.meta_title,
            "meta_description": page.meta_description,
            "meta_keywords": page.meta_keywords,
            "featured_image": page.featured_image,
            "status": page.status,
            "publish_date": page.publish_date,
            "is_homepage": page.is_homepage,
            "template": page.template,
            "custom_css": page.custom_css,
            "custom_js": page.custom_js,
            "created_at": page.created_at,
            "updated_at": page.updated_at,
            "created_by": page.created_by,
            "updated_by": page.updated_by,
            "views": page.views
        } for page in pages]
    except Exception as e:
        logger.error(f"Error fetching published pages: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch published pages")

@router.get("/public/pages/{slug}", response_model=CMSPageSchema)
async def get_page_by_slug(slug: str):
    """Get a specific published CMS page by slug for public website"""
    try:
        page = await CMSPage.find_one({"slug": slug, "status": "published"})
        
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        
        # Increment views
        await page.update({"$inc": {"views": 1}})
        
        return {
            "id": str(page.id),
            "title": page.title,
            "slug": page.slug,
            "content": page.content,
            "meta_title": page.meta_title,
            "meta_description": page.meta_description,
            "meta_keywords": page.meta_keywords,
            "featured_image": page.featured_image,
            "status": page.status,
            "publish_date": page.publish_date,
            "is_homepage": page.is_homepage,
            "template": page.template,
            "custom_css": page.custom_css,
            "custom_js": page.custom_js,
            "created_at": page.created_at,
            "updated_at": page.updated_at,
            "created_by": page.created_by,
            "updated_by": page.updated_by,
            "views": page.views + 1
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching page by slug {slug}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch page")

@router.get("/public/reviews")
async def get_public_reviews(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    featured_only: bool = Query(False)
):
    """Get approved reviews for public display"""
    try:
        filter_query = {"status": "approved"}
        
        if featured_only:
            filter_query["featured"] = True
        
        reviews = await Review.find(filter_query).sort("-created_at").skip(offset).limit(limit).to_list()
        
        return [{
            "id": str(review.id),
            "author": review.author,
            "email": review.email,
            "rating": review.rating,
            "title": review.title,
            "content": review.content,
            "company": review.company,
            "position": review.position,
            "status": review.status,
            "featured": review.featured,
            "helpful_count": review.helpful_count,
            "verified": review.verified,
            "created_at": review.created_at,
            "updated_at": review.updated_at
        } for review in reviews]
    except Exception as e:
        logger.error(f"Error fetching public reviews: {e}")
        return []

@router.get("/public/seo-settings", response_model=SEOSettingsSchema)
async def get_public_seo_settings():
    """Get SEO settings for public website"""
    try:
        seo_settings = await SeoSettings.find_one()
        if seo_settings:
            return {
                "id": str(seo_settings.id),
                "site_title": seo_settings.site_title,
                "site_description": seo_settings.site_description,
                "meta_keywords": seo_settings.meta_keywords,
                "og_title": seo_settings.og_title,
                "og_description": seo_settings.og_description,
                "og_image": seo_settings.og_image,
                "og_type": seo_settings.og_type,
                "twitter_card": seo_settings.twitter_card,
                "twitter_site": seo_settings.twitter_site,
                "twitter_creator": seo_settings.twitter_creator,
                "canonical_url": seo_settings.canonical_url,
                "robots_txt": seo_settings.robots_txt,
                "sitemap_url": seo_settings.sitemap_url,
                "google_analytics_id": seo_settings.google_analytics_id,
                "google_tag_manager_id": seo_settings.google_tag_manager_id,
                "facebook_pixel_id": seo_settings.facebook_pixel_id,
                "google_site_verification": seo_settings.google_site_verification,
                "bing_site_verification": seo_settings.bing_site_verification,
                "created_at": seo_settings.created_at,
                "updated_at": seo_settings.updated_at
            }
        else:
            # Return default SEO settings
            return {
                "site_title": "RemoteHive - Find Your Perfect Remote Job",
                "site_description": "Discover thousands of remote job opportunities from top companies worldwide. Your next remote career starts here.",
                "meta_keywords": "remote jobs, work from home, remote work, online jobs, telecommute",
                "og_title": "RemoteHive - Remote Job Board",
                "og_description": "Find your perfect remote job opportunity",
                "og_type": "website",
                "twitter_card": "summary_large_image"
            }
    except Exception as e:
        logger.error(f"Error fetching SEO settings: {e}")
        # Return default settings on error
        return {
            "site_title": "RemoteHive - Find Your Perfect Remote Job",
            "site_description": "Discover thousands of remote job opportunities from top companies worldwide. Your next remote career starts here.",
            "meta_keywords": "remote jobs, work from home, remote work, online jobs, telecommute",
            "og_title": "RemoteHive - Remote Job Board",
            "og_description": "Find your perfect remote job opportunity",
            "og_type": "website",
            "twitter_card": "summary_large_image"
        }

@router.get("/public/ads", response_model=List[dict])
async def get_public_ads(
    position: Optional[str] = Query(None, description="Ad position (header, sidebar, footer)")
):
    """Get active ads for public website"""
    try:
        query_filter = {"is_active": True}
        if position:
            query_filter["position"] = position
            
        ads = await Ad.find(query_filter).to_list()
        return [
            {
                "id": str(ad.id),
                "title": ad.title,
                "content": ad.content,
                "image_url": ad.image_url,
                "link_url": ad.link_url,
                "position": ad.position,
                "is_active": ad.is_active,
                "start_date": ad.start_date,
                "end_date": ad.end_date,
                "click_count": ad.click_count,
                "impression_count": ad.impression_count,
                "created_at": ad.created_at,
                "updated_at": ad.updated_at
            }
            for ad in ads
        ]
    except Exception as e:
        logger.error(f"Error fetching public ads: {e}")
        return []

# CMS Pages Management
@router.get("/pages", response_model=List[CMSPageResponse])
async def get_pages(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status (draft, published, archived)"),
    search: Optional[str] = Query(None, description="Search in title and content")
):
    """Get all pages with pagination and filtering"""
    try:
        query_filter = {}
        
        if status:
            query_filter["status"] = status
            
        if search:
            # MongoDB text search or regex search
            query_filter["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}}
            ]
            
        pages = await CMSPage.find(query_filter).sort("-created_at").skip(skip).limit(limit).to_list()
        return [
            {
                "id": str(page.id),
                "title": page.title,
                "slug": page.slug,
                "content": page.content,
                "excerpt": page.excerpt,
                "status": page.status,
                "is_homepage": page.is_homepage,
                "meta_title": page.meta_title,
                "meta_description": page.meta_description,
                "featured_image": page.featured_image,
                "author_id": str(page.author_id) if page.author_id else None,
                "view_count": page.view_count,
                "created_at": page.created_at,
                "updated_at": page.updated_at
            }
            for page in pages
        ]
    except Exception as e:
        logger.error(f"Error fetching pages: {e}")
        return []

@router.get("/pages/{page_id}", response_model=CMSPageSchema)
async def get_page_by_id(
    page_id: PydanticObjectId
):
    """Get a specific CMS page by ID"""
    try:
        page = await CMSPage.get(page_id)
        
        if not page:
            raise HTTPException(
                status_code=404,
                detail="Page not found"
            )
            
        return {
            "id": str(page.id),
            "title": page.title,
            "slug": page.slug,
            "content": page.content,
            "excerpt": page.excerpt,
            "status": page.status,
            "is_homepage": page.is_homepage,
            "meta_title": page.meta_title,
            "meta_description": page.meta_description,
            "featured_image": page.featured_image,
            "author_id": str(page.author_id) if page.author_id else None,
            "view_count": page.view_count,
            "created_at": page.created_at,
            "updated_at": page.updated_at
        }
    except Exception as e:
        logger.error(f"Error fetching page {page_id}: {e}")
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=404,
                detail="Page not found"
            )
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch page"
        )

@router.post("/pages", response_model=CMSPageSchema)
async def create_page(
    page_data: CMSPageCreate
):
    """Create a new CMS page"""
    try:
        # Check if slug already exists
        existing = await CMSPage.find_one({"slug": page_data.slug})
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Page with this slug already exists"
            )
        
        # If this is set as homepage, unset other homepages
        if page_data.is_homepage:
            await CMSPage.find({"is_homepage": True}).update({"$set": {"is_homepage": False}})
        
        # Create page
        page_dict = page_data.dict()
        page_dict["created_at"] = datetime.utcnow()
        page_dict["updated_at"] = datetime.utcnow()
        
        new_page = CMSPage(**page_dict)
        await new_page.insert()
        
        return {
            "id": str(new_page.id),
            "title": new_page.title,
            "slug": new_page.slug,
            "content": new_page.content,
            "excerpt": new_page.excerpt,
            "status": new_page.status,
            "is_homepage": new_page.is_homepage,
            "meta_title": new_page.meta_title,
            "meta_description": new_page.meta_description,
            "featured_image": new_page.featured_image,
            "author_id": str(new_page.author_id) if new_page.author_id else None,
            "view_count": new_page.view_count,
            "created_at": new_page.created_at,
            "updated_at": new_page.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating page: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create page"
        )

@router.put("/pages/{page_id}", response_model=CMSPageSchema)
async def update_page(
    page_id: PydanticObjectId,
    page_data: CMSPageUpdate
):
    """Update a CMS page"""
    try:
        # Check if page exists
        existing_page = await CMSPage.get(page_id)
        if not existing_page:
            raise HTTPException(
                status_code=404,
                detail="Page not found"
            )
        
        # If slug is being updated, check for conflicts
        if page_data.slug and page_data.slug != existing_page.slug:
            slug_conflict = await CMSPage.find_one({"slug": page_data.slug, "_id": {"$ne": page_id}})
            if slug_conflict:
                raise HTTPException(
                    status_code=400,
                    detail="A page with this slug already exists"
                )
        
        # If this is set as homepage, unset other homepages
        if page_data.is_homepage:
            await CMSPage.find({"is_homepage": True, "_id": {"$ne": page_id}}).update({"$set": {"is_homepage": False}})
        
        # Update page
        update_dict = page_data.dict(exclude_unset=True)
        update_dict["updated_at"] = datetime.utcnow()
        
        await existing_page.update({"$set": update_dict})
        
        # Fetch updated page
        updated_page = await CMSPage.get(page_id)
        
        return {
            "id": str(updated_page.id),
            "title": updated_page.title,
            "slug": updated_page.slug,
            "content": updated_page.content,
            "excerpt": updated_page.excerpt,
            "status": updated_page.status,
            "is_homepage": updated_page.is_homepage,
            "meta_title": updated_page.meta_title,
            "meta_description": updated_page.meta_description,
            "featured_image": updated_page.featured_image,
            "author_id": str(updated_page.author_id) if updated_page.author_id else None,
            "view_count": updated_page.view_count,
            "created_at": updated_page.created_at,
            "updated_at": updated_page.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating page {page_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update page"
        )

@router.delete("/pages/{page_id}")
async def delete_page(
    page_id: PydanticObjectId
):
    """Delete a CMS page"""
    try:
        # Check if page exists
        existing_page = await CMSPage.get(page_id)
        if not existing_page:
            raise HTTPException(
                status_code=404,
                detail="Page not found"
            )
        
        # Delete page
        await existing_page.delete()
        
        return {"message": "Page deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting page {page_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete page"
        )

# SEO Settings Management
@router.get("/seo-settings", response_model=SEOSettingsSchema)
async def get_seo_settings():
    """Get SEO settings"""
    try:
        seo_settings = await SeoSettings.find_one()
        
        if seo_settings:
            return {
                "id": str(seo_settings.id),
                "site_title": seo_settings.site_title,
                "site_description": seo_settings.site_description,
                "site_keywords": seo_settings.site_keywords,
                "og_image": seo_settings.og_image,
                "twitter_handle": seo_settings.twitter_handle,
                "google_analytics_id": seo_settings.google_analytics_id,
                "google_tag_manager_id": seo_settings.google_tag_manager_id,
                "facebook_pixel_id": seo_settings.facebook_pixel_id,
                "created_at": seo_settings.created_at,
                "updated_at": seo_settings.updated_at
            }
        else:
            # Return default settings if none exist
            return {
                "id": None,
                "site_title": "RemoteHive",
                "site_description": "Find your next remote job opportunity",
                "site_keywords": "remote jobs, work from home, remote work",
                "og_image": None,
                "twitter_handle": None,
                "google_analytics_id": None,
                "google_tag_manager_id": None,
                "facebook_pixel_id": None,
                "created_at": None,
                "updated_at": None
            }
    except Exception as e:
        logger.error(f"Error fetching SEO settings: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch SEO settings"
        )

@router.put("/seo-settings", response_model=SEOSettingsSchema)
async def update_seo_settings(
    settings_data: SEOSettingsUpdate
):
    """Update SEO settings"""
    try:
        # Check if settings exist
        existing_settings = await SeoSettings.find_one()
        
        settings_dict = settings_data.dict(exclude_unset=True)
        settings_dict["updated_at"] = datetime.utcnow()
        
        if existing_settings:
            # Update existing settings
            await existing_settings.update({"$set": settings_dict})
            updated_settings = await SeoSettings.find_one()
        else:
            # Create new settings
            settings_dict["created_at"] = datetime.utcnow()
            new_settings = SeoSettings(**settings_dict)
            updated_settings = await new_settings.insert()
        
        return {
            "id": str(updated_settings.id),
            "site_title": updated_settings.site_title,
            "site_description": updated_settings.site_description,
            "site_keywords": updated_settings.site_keywords,
            "og_image": updated_settings.og_image,
            "twitter_handle": updated_settings.twitter_handle,
            "google_analytics_id": updated_settings.google_analytics_id,
            "google_tag_manager_id": updated_settings.google_tag_manager_id,
            "facebook_pixel_id": updated_settings.facebook_pixel_id,
            "created_at": updated_settings.created_at,
            "updated_at": updated_settings.updated_at
        }
    except Exception as e:
        logger.error(f"Error updating SEO settings: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update SEO settings"
        )

# Reviews Management
@router.get("/reviews", response_model=PaginatedResponse)
async def get_reviews(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None)
):
    """Get paginated list of reviews"""
    try:
        skip = (page - 1) * limit
        
        # Build filter
        filter_dict = {}
        if status and status != "all":
            filter_dict["status"] = status
            
        # Get total count
        total = await Review.find(filter_dict).count()
        
        # Get paginated data
        reviews = await Review.find(filter_dict).sort("-created_at").skip(skip).limit(limit).to_list()
        
        # Convert to response format
        reviews_data = []
        for review in reviews:
            reviews_data.append({
                "id": str(review.id),
                "author": review.author,
                "rating": review.rating,
                "content": review.content,
                "status": review.status,
                "featured": review.featured,
                "created_at": review.created_at,
                "updated_at": review.updated_at
            })
        
        return {
            "data": reviews_data,
            "count": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error fetching reviews: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch reviews"
        )

@router.put("/reviews/{review_id}/status")
async def update_review_status(
    review_id: PydanticObjectId,
    status_data: dict
):
    """Update review status"""
    try:
        # Check if review exists
        review = await Review.get(review_id)
        if not review:
            raise HTTPException(
                status_code=404,
                detail="Review not found"
            )
        
        # Update status
        new_status = status_data.get("status")
        await review.update({"$set": {"status": new_status, "updated_at": datetime.utcnow()}})
        
        return {"data": {"id": str(review_id), "status": new_status, "message": "Review status updated successfully"}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating review status: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update review status"
        )

@router.put("/reviews/{review_id}/featured")
async def toggle_review_featured(
    review_id: PydanticObjectId,
    featured_data: dict
):
    """Toggle review featured status"""
    try:
        # Check if review exists
        review = await Review.get(review_id)
        if not review:
            raise HTTPException(
                status_code=404,
                detail="Review not found"
            )
        
        # Update featured status
        featured_status = featured_data.get("featured")
        await review.update({"$set": {"featured": featured_status, "updated_at": datetime.utcnow()}})
        
        return {"data": {"id": str(review_id), "featured": featured_status, "message": "Review featured status updated successfully"}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating review featured status: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update review featured status"
        )

# Analytics
@router.get("/analytics")
def get_website_analytics(
    start_date: str = Query(...),
    end_date: str = Query(...),
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Get website analytics"""
    try:
        # Return sample analytics data
        analytics_data = {
            "page_views": 15420,
            "unique_visitors": 8930,
            "bounce_rate": 0.32,
            "avg_session_duration": "00:03:45",
            "top_pages": [
                {"page": "/", "views": 5420, "percentage": 35.2},
                {"page": "/jobs", "views": 3210, "percentage": 20.8},
                {"page": "/about", "views": 1890, "percentage": 12.3}
            ],
            "traffic_sources": [
                {"source": "Organic Search", "visitors": 4200, "percentage": 47.0},
                {"source": "Direct", "visitors": 2800, "percentage": 31.4},
                {"source": "Social Media", "visitors": 1200, "percentage": 13.4},
                {"source": "Referral", "visitors": 730, "percentage": 8.2}
            ]
        }
        return {"data": analytics_data}
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analytics"
        )

# Theme Settings
@router.get("/theme-settings")
def get_theme_settings(
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Get theme settings"""
    try:
        # Return default theme settings
        default_theme = {
            "primary_color": "#3B82F6",
            "secondary_color": "#10B981",
            "accent_color": "#F59E0B",
            "background_color": "#FFFFFF",
            "text_color": "#1F2937",
            "font_family": "Inter",
            "logo_url": "",
            "favicon_url": "",
            "custom_css": ""
        }
        return {"data": default_theme}
    except Exception as e:
        logger.error(f"Error fetching theme settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch theme settings"
        )

@router.put("/theme-settings")
def update_theme_settings(
    settings_data: dict,
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Update theme settings"""
    try:
        # For now, return the updated settings
        return {"data": settings_data}
    except Exception as e:
        logger.error(f"Error updating theme settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update theme settings"
        )

# Ads Management
@router.get("/ads")
def get_ads(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Get ads campaigns"""
    try:
        # Return sample ads data
        sample_ads = [
            {
                "id": "1",
                "name": "Google Ads Campaign",
                "platform": "Google Ads",
                "status": "active",
                "budget": "$500/month",
                "performance": "+15% CTR"
            },
            {
                "id": "2",
                "name": "Meta Ads Campaign",
                "platform": "Meta",
                "status": "paused",
                "budget": "$300/month",
                "performance": "+8% CTR"
            }
        ]
        return {"data": sample_ads}
    except Exception as e:
        logger.error(f"Error fetching ads: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch ads"
        )

@router.put("/ads/{ad_id}")
def update_ad(
    ad_id: str,
    ad_data: dict,
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Update ad campaign"""
    try:
        # For now, return success
        return {"data": {"id": ad_id, **ad_data, "message": "Ad updated successfully"}}
    except Exception as e:
        logger.error(f"Error updating ad: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update ad"
        )

# ============================================================================
# MEDIA LIBRARY ENDPOINTS
# ============================================================================

@router.post("/admin/media/upload", response_model=MediaFile)
async def upload_media_file(
    file: UploadFile = File(...),
    alt_text: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    folder: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # Comma-separated tags
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Upload a media file to the library"""
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/media")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Determine media type
        mime_type = file.content_type or "application/octet-stream"
        if mime_type.startswith("image/"):
            media_type = "image"
        elif mime_type.startswith("video/"):
            media_type = "video"
        elif mime_type.startswith("audio/"):
            media_type = "audio"
        else:
            media_type = "document"
        
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",")] if tags else []
        
        # Create media file record
        media_data = {
            "id": str(uuid.uuid4()),
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_path": str(file_path),
            "file_url": f"/uploads/media/{unique_filename}",
            "file_size": file.size or 0,
            "mime_type": mime_type,
            "media_type": media_type,
            "alt_text": alt_text,
            "caption": caption,
            "tags": tag_list,
            "folder": folder,
            "is_public": True,
            "uploaded_by": current_admin.get("id"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "download_count": 0
        }
        
        # Store in database (using sample data for now)
        return media_data
        
    except Exception as e:
        logger.error(f"Error uploading media file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload media file"
        )

@router.get("/admin/media", response_model=List[MediaFile])
def get_media_files(
    folder: Optional[str] = Query(None),
    media_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Get media files with filtering"""
    try:
        # Sample media files for demonstration
        sample_media = [
            {
                "id": "1",
                "filename": "hero-image.jpg",
                "original_filename": "hero-image.jpg",
                "file_path": "/uploads/media/hero-image.jpg",
                "file_url": "/uploads/media/hero-image.jpg",
                "file_size": 1024000,
                "mime_type": "image/jpeg",
                "media_type": "image",
                "alt_text": "Hero section background",
                "caption": "Main hero image for homepage",
                "tags": ["hero", "homepage", "background"],
                "folder": "homepage",
                "is_public": True,
                "uploaded_by": "admin",
                "created_at": "2024-01-15T00:00:00Z",
                "updated_at": "2024-01-15T00:00:00Z",
                "download_count": 0
            },
            {
                "id": "2",
                "filename": "company-logo.png",
                "original_filename": "company-logo.png",
                "file_path": "/uploads/media/company-logo.png",
                "file_url": "/uploads/media/company-logo.png",
                "file_size": 256000,
                "mime_type": "image/png",
                "media_type": "image",
                "alt_text": "Company logo",
                "caption": "Official company logo",
                "tags": ["logo", "branding"],
                "folder": "branding",
                "is_public": True,
                "uploaded_by": "admin",
                "created_at": "2024-01-14T00:00:00Z",
                "updated_at": "2024-01-14T00:00:00Z",
                "download_count": 5
            }
        ]
        
        # Apply filters
        filtered_media = sample_media
        if folder:
            filtered_media = [m for m in filtered_media if m.get("folder") == folder]
        if media_type:
            filtered_media = [m for m in filtered_media if m.get("media_type") == media_type]
        if search:
            filtered_media = [m for m in filtered_media if search.lower() in m.get("filename", "").lower() or search.lower() in m.get("alt_text", "").lower()]
        
        # Apply pagination
        paginated_media = filtered_media[offset:offset + limit]
        return paginated_media
        
    except Exception as e:
        logger.error(f"Error fetching media files: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch media files"
        )

@router.put("/admin/media/{media_id}", response_model=MediaFile)
def update_media_file(
    media_id: str,
    media_data: MediaFileUpdate,
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Update media file metadata"""
    try:
        # For demonstration, return updated data
        updated_media = {
            "id": media_id,
            "filename": media_data.filename or "updated-file.jpg",
            "original_filename": "updated-file.jpg",
            "file_path": "/uploads/media/updated-file.jpg",
            "file_url": "/uploads/media/updated-file.jpg",
            "file_size": 1024000,
            "mime_type": "image/jpeg",
            "media_type": "image",
            "alt_text": media_data.alt_text,
            "caption": media_data.caption,
            "tags": media_data.tags or [],
            "folder": media_data.folder,
            "is_public": media_data.is_public if media_data.is_public is not None else True,
            "uploaded_by": "admin",
            "created_at": "2024-01-15T00:00:00Z",
            "updated_at": datetime.utcnow().isoformat(),
            "download_count": 0
        }
        return updated_media
        
    except Exception as e:
        logger.error(f"Error updating media file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update media file"
        )

@router.delete("/admin/media/{media_id}")
def delete_media_file(
    media_id: str,
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Delete media file"""
    try:
        # For demonstration, return success
        return {"message": "Media file deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting media file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete media file"
        )

# ============================================================================
# CAROUSEL MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/admin/carousel", response_model=List[CarouselItem])
def get_carousel_items(
    carousel_type: Optional[str] = Query(None),
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Get carousel items"""
    try:
        # Sample carousel items
        sample_items = [
            {
                "id": "1",
                "title": "Test Company",
            "subtitle": "Test Industry Leader",
            "description": "Test company description",
                "image_url": "/uploads/media/test-logo.svg",
            "link_url": "https://example.com",
                "link_text": "Learn More",
                "order": 1,
                "is_active": True,
                "carousel_type": "hero",
                "created_at": "2024-01-15T00:00:00Z",
                "updated_at": "2024-01-15T00:00:00Z",
                "created_by": "admin"
            },
            {
                "id": "2",
                "title": "Microsoft",
                "subtitle": "Innovation Partner",
                "description": "Empowering every person and organization",
                "image_url": "/uploads/media/microsoft-logo.svg",
                "link_url": "https://microsoft.com",
                "link_text": "Explore",
                "order": 2,
                "is_active": True,
                "carousel_type": "hero",
                "created_at": "2024-01-14T00:00:00Z",
                "updated_at": "2024-01-14T00:00:00Z",
                "created_by": "admin"
            }
        ]
        
        # Filter by carousel type if specified
        if carousel_type:
            sample_items = [item for item in sample_items if item["carousel_type"] == carousel_type]
        
        return sample_items
        
    except Exception as e:
        logger.error(f"Error fetching carousel items: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch carousel items"
        )

@router.post("/admin/carousel", response_model=CarouselItem)
def create_carousel_item(
    carousel_data: CarouselItemCreate,
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Create new carousel item"""
    try:
        new_item = {
            "id": str(uuid.uuid4()),
            "title": carousel_data.title,
            "subtitle": carousel_data.subtitle,
            "description": carousel_data.description,
            "image_url": carousel_data.image_url,
            "link_url": carousel_data.link_url,
            "link_text": carousel_data.link_text,
            "order": carousel_data.order,
            "is_active": carousel_data.is_active,
            "carousel_type": carousel_data.carousel_type,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "created_by": current_admin.get("id")
        }
        return new_item
        
    except Exception as e:
        logger.error(f"Error creating carousel item: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create carousel item"
        )

@router.put("/admin/carousel/{item_id}", response_model=CarouselItem)
def update_carousel_item(
    item_id: str,
    carousel_data: CarouselItemUpdate,
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Update carousel item"""
    try:
        updated_item = {
            "id": item_id,
            "title": carousel_data.title or "Updated Title",
            "subtitle": carousel_data.subtitle,
            "description": carousel_data.description,
            "image_url": carousel_data.image_url or "/uploads/media/default.jpg",
            "link_url": carousel_data.link_url,
            "link_text": carousel_data.link_text,
            "order": carousel_data.order or 0,
            "is_active": carousel_data.is_active if carousel_data.is_active is not None else True,
            "carousel_type": carousel_data.carousel_type or "hero",
            "created_at": "2024-01-15T00:00:00Z",
            "updated_at": datetime.utcnow().isoformat(),
            "created_by": "admin"
        }
        return updated_item
        
    except Exception as e:
        logger.error(f"Error updating carousel item: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update carousel item"
        )

@router.delete("/admin/carousel/{item_id}")
def delete_carousel_item(
    item_id: str,
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Delete carousel item"""
    try:
        return {"message": "Carousel item deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting carousel item: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete carousel item"
        )

# ============================================================================
# IMAGE GALLERY ENDPOINTS
# ============================================================================

@router.get("/admin/galleries", response_model=List[Gallery])
def get_galleries(
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Get all image galleries"""
    try:
        sample_galleries = [
            {
                "id": "1",
                "name": "Company Showcase",
                "description": "Images showcasing our company culture and workspace",
                "slug": "company-showcase",
                "is_public": True,
                "cover_image": "/uploads/media/gallery-cover-1.jpg",
                "created_at": "2024-01-15T00:00:00Z",
                "updated_at": "2024-01-15T00:00:00Z",
                "created_by": "admin",
                "image_count": 12
            },
            {
                "id": "2",
                "name": "Product Gallery",
                "description": "Product screenshots and features",
                "slug": "product-gallery",
                "is_public": True,
                "cover_image": "/uploads/media/gallery-cover-2.jpg",
                "created_at": "2024-01-14T00:00:00Z",
                "updated_at": "2024-01-14T00:00:00Z",
                "created_by": "admin",
                "image_count": 8
            }
        ]
        return sample_galleries
        
    except Exception as e:
        logger.error(f"Error fetching galleries: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch galleries"
        )

@router.post("/admin/galleries", response_model=Gallery)
def create_gallery(
    gallery_data: GalleryCreate,
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Create new image gallery"""
    try:
        new_gallery = {
            "id": str(uuid.uuid4()),
            "name": gallery_data.name,
            "description": gallery_data.description,
            "slug": gallery_data.slug,
            "is_public": gallery_data.is_public,
            "cover_image": gallery_data.cover_image,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "created_by": current_admin.get("id"),
            "image_count": 0
        }
        return new_gallery
        
    except Exception as e:
        logger.error(f"Error creating gallery: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create gallery"
        )

@router.get("/admin/galleries/{gallery_id}/images", response_model=List[GalleryImage])
def get_gallery_images(
    gallery_id: str,
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Get images in a gallery"""
    try:
        sample_images = [
            {
                "id": "1",
                "gallery_id": gallery_id,
                "media_file_id": "1",
                "order": 1,
                "caption": "Test image caption",
                "is_featured": True,
                "created_at": "2024-01-15T00:00:00Z",
                "media_file": {
                    "id": "1",
                    "filename": "team-photo.jpg",
                    "original_filename": "team-photo.jpg",
                    "file_path": "/uploads/media/team-photo.jpg",
                    "file_url": "/uploads/media/team-photo.jpg",
                    "file_size": 1024000,
                    "mime_type": "image/jpeg",
                    "media_type": "image",
                    "alt_text": "Test image alt text",
                    "caption": "Test image caption",
                    "tags": ["test", "sample"],
                    "folder": "company",
                    "is_public": True,
                    "uploaded_by": "admin",
                    "created_at": "2024-01-15T00:00:00Z",
                    "updated_at": "2024-01-15T00:00:00Z",
                    "download_count": 0
                }
            }
        ]
        return sample_images
        
    except Exception as e:
        logger.error(f"Error fetching gallery images: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch gallery images"
        )

@router.post("/admin/galleries/{gallery_id}/images", response_model=GalleryImage)
def add_image_to_gallery(
    gallery_id: str,
    image_data: GalleryImageCreate,
    current_admin: Dict[str, Any] = Depends(get_admin)
):
    """Add image to gallery"""
    try:
        new_gallery_image = {
            "id": str(uuid.uuid4()),
            "gallery_id": gallery_id,
            "media_file_id": image_data.media_file_id,
            "order": image_data.order,
            "caption": image_data.caption,
            "is_featured": image_data.is_featured,
            "created_at": datetime.utcnow().isoformat(),
            "media_file": None  # Would be populated from database
        }
        return new_gallery_image
        
    except Exception as e:
        logger.error(f"Error adding image to gallery: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add image to gallery"
        )

# ============================================================================
# PUBLIC ENDPOINTS FOR NEW FEATURES
# ============================================================================

@router.get("/public/carousel/{carousel_type}", response_model=List[CarouselItem])
def get_public_carousel(
    carousel_type: str
):
    """Get public carousel items by type"""
    try:
        # Sample public carousel data
        sample_items = [
            {
                "id": "1",
                "title": "Google",
                "subtitle": "Technology Leader",
                "description": "Join the world's leading technology company",
                "image_url": "/uploads/media/google-logo.svg",
                "link_url": "https://google.com",
                "link_text": "Learn More",
                "order": 1,
                "is_active": True,
                "carousel_type": carousel_type,
                "created_at": "2024-01-15T00:00:00Z",
                "updated_at": "2024-01-15T00:00:00Z",
                "created_by": "admin"
            }
        ]
        
        # Filter active items only
        active_items = [item for item in sample_items if item["is_active"] and item["carousel_type"] == carousel_type]
        return sorted(active_items, key=lambda x: x["order"])
        
    except Exception as e:
        logger.error(f"Error fetching public carousel: {e}")
        return []

@router.get("/public/galleries/{gallery_slug}", response_model=Dict[str, Any])
def get_public_gallery(
    gallery_slug: str
):
    """Get public gallery by slug"""
    try:
        # Sample public gallery data
        sample_gallery = {
            "id": "1",
            "name": "Test Gallery",
            "description": "Test gallery description",
            "slug": gallery_slug,
            "is_public": True,
            "cover_image": "/uploads/media/gallery-cover-1.jpg",
            "created_at": "2024-01-15T00:00:00Z",
            "updated_at": "2024-01-15T00:00:00Z",
            "created_by": "admin",
            "image_count": 12,
            "images": [
                {
                    "id": "1",
                    "gallery_id": "1",
                    "media_file_id": "1",
                    "order": 1,
                    "caption": "Test image caption",
                    "is_featured": True,
                    "created_at": "2024-01-15T00:00:00Z",
                    "media_file": {
                        "id": "1",
                        "filename": "team-photo.jpg",
                        "file_url": "/uploads/media/team-photo.jpg",
                        "alt_text": "Test image alt text",
                        "caption": "Test image caption"
                    }
                }
            ]
        }
        
        if sample_gallery["slug"] == gallery_slug and sample_gallery["is_public"]:
            return sample_gallery
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Gallery not found"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching public gallery: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch gallery"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update ad"
        )