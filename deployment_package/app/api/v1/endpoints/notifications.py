from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import logging
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.schemas.notification import (
    Notification,
    NotificationCreate,
    NotificationUpdate,
    NotificationList,
    NotificationPreferences,
    NotificationPreferencesUpdate,
    NotificationStats,
    MarkAsReadRequest,
    BulkNotificationCreate
)

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=NotificationList)
async def get_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    notification_type: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's notifications with pagination"""
    try:
        # Build query
        query = supabase.table("notifications").select("*").eq("user_id", current_user["id"])
        
        # Apply filters
        if unread_only:
            query = query.eq("is_read", False)
        
        if notification_type:
            query = query.eq("type", notification_type)
        
        # Get total count
        count_query = supabase.table("notifications").select("id", count="exact").eq("user_id", current_user["id"])
        if unread_only:
            count_query = count_query.eq("is_read", False)
        if notification_type:
            count_query = count_query.eq("type", notification_type)
        
        count_result = count_query.execute()
        total = count_result.count or 0
        
        # Get unread count
        unread_result = supabase.table("notifications").select("id", count="exact").eq("user_id", current_user["id"]).eq("is_read", False).execute()
        unread_count = unread_result.count or 0
        
        # Get paginated results
        offset = (page - 1) * per_page
        result = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()
        
        notifications = [Notification(**notification) for notification in result.data]
        
        return NotificationList(
            notifications=notifications,
            total=total,
            page=page,
            per_page=per_page,
            has_next=offset + per_page < total,
            has_prev=page > 1,
            unread_count=unread_count
        )
        
    except Exception as e:
        logger.error(f"Failed to get notifications for user {current_user.get('email')}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notifications"
        )

@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification statistics for the user"""
    try:
        user_id = current_user["id"]
        
        # Get total notifications
        total_result = supabase.table("notifications").select("id", count="exact").eq("user_id", user_id).execute()
        total_notifications = total_result.count or 0
        
        # Get unread notifications
        unread_result = supabase.table("notifications").select("id", count="exact").eq("user_id", user_id).eq("is_read", False).execute()
        unread_notifications = unread_result.count or 0
        
        read_notifications = total_notifications - unread_notifications
        
        # Get notifications by type
        type_result = supabase.table("notifications").select("type").eq("user_id", user_id).execute()
        notifications_by_type = {}
        for notification in type_result.data:
            notification_type = notification["type"]
            notifications_by_type[notification_type] = notifications_by_type.get(notification_type, 0) + 1
        
        # Get recent notifications (last 5)
        recent_result = supabase.table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(5).execute()
        recent_notifications = [Notification(**notification) for notification in recent_result.data]
        
        return NotificationStats(
            total_notifications=total_notifications,
            unread_notifications=unread_notifications,
            read_notifications=read_notifications,
            notifications_by_type=notifications_by_type,
            recent_notifications=recent_notifications
        )
        
    except Exception as e:
        logger.error(f"Failed to get notification stats for user {current_user.get('email')}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notification statistics"
        )

@router.post("/mark-read")
async def mark_notifications_read(
    request: MarkAsReadRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notifications as read"""
    try:
        user_id = current_user["id"]
        
        if request.notification_ids:
            # Mark specific notifications as read
            for notification_id in request.notification_ids:
                supabase.table("notifications").update({
                    "is_read": True,
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("id", notification_id).eq("user_id", user_id).execute()
            
            return {"message": f"Marked {len(request.notification_ids)} notifications as read"}
        else:
            # Mark all notifications as read
            result = supabase.table("notifications").update({
                "is_read": True,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).eq("is_read", False).execute()
            
            return {"message": "Marked all notifications as read"}
        
    except Exception as e:
        logger.error(f"Failed to mark notifications as read for user {current_user.get('email')}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notifications as read"
        )

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific notification"""
    try:
        result = supabase.table("notifications").delete().eq("id", notification_id).eq("user_id", current_user["id"]).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {"message": "Notification deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete notification {notification_id} for user {current_user.get('email')}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete notification"
        )

@router.get("/preferences", response_model=NotificationPreferences)
async def get_notification_preferences(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's notification preferences"""
    try:
        result = supabase.table("notification_preferences").select("*").eq("user_id", current_user["id"]).execute()
        
        if not result.data:
            # Create default preferences if they don't exist
            default_prefs = {
                "user_id": current_user["id"],
                "email_notifications": True,
                "push_notifications": True,
                "application_updates": True,
                "new_job_alerts": True,
                "marketing_emails": False,
                "weekly_digest": True
            }
            
            create_result = supabase.table("notification_preferences").insert(default_prefs).execute()
            return NotificationPreferences(**create_result.data[0])
        
        return NotificationPreferences(**result.data[0])
        
    except Exception as e:
        logger.error(f"Failed to get notification preferences for user {current_user.get('email')}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notification preferences"
        )

@router.put("/preferences", response_model=NotificationPreferences)
async def update_notification_preferences(
    preferences_update: NotificationPreferencesUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's notification preferences"""
    try:
        # Prepare update data
        update_data = preferences_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("notification_preferences").update(update_data).eq("user_id", current_user["id"]).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification preferences not found"
            )
        
        return NotificationPreferences(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update notification preferences for user {current_user.get('email')}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification preferences"
        )

# Admin endpoints
@router.post("/admin/create", response_model=Notification)
async def create_notification(
    notification_data: NotificationCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a notification (admin only)"""
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create notifications"
        )
    
    try:
        notification_dict = notification_data.model_dump()
        result = supabase.table("notifications").insert(notification_dict).execute()
        
        return Notification(**result.data[0])
        
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create notification"
        )

@router.post("/admin/bulk-create")
async def create_bulk_notifications(
    bulk_data: BulkNotificationCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create notifications for multiple users (admin only)"""
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create bulk notifications"
        )
    
    try:
        notifications = []
        for user_id in bulk_data.user_ids:
            notification_dict = bulk_data.model_dump(exclude={"user_ids"})
            notification_dict["user_id"] = user_id
            notifications.append(notification_dict)
        
        result = supabase.table("notifications").insert(notifications).execute()
        
        return {
            "message": f"Created {len(result.data)} notifications",
            "created_count": len(result.data)
        }
        
    except Exception as e:
        logger.error(f"Failed to create bulk notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create bulk notifications"
        )