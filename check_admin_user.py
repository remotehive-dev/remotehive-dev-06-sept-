#!/usr/bin/env python3
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.core.database import get_database_manager
from app.database.services import UserService
from loguru import logger

async def check_admin_user():
    """Check the admin user details in the database"""
    try:
        db_manager = get_database_manager()
        
        with db_manager.session_scope() as session:
            user_service = UserService(session)
            
            # Get admin user
            admin_user = await user_service.get_user_by_email("admin@remotehive.in")
            
            if admin_user:
                print(f"Admin user found:")
                print(f"  Email: {admin_user.email}")
                print(f"  Role: {admin_user.role}")
                print(f"  Role type: {type(admin_user.role)}")
                print(f"  Role value: {admin_user.role.value if hasattr(admin_user.role, 'value') else admin_user.role}")
                print(f"  Is Active: {admin_user.is_active}")
                print(f"  Is Verified: {admin_user.is_verified}")
                print(f"  ID: {admin_user.id}")
            else:
                print("Admin user not found!")
                
    except Exception as e:
        logger.error(f"Error checking admin user: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    asyncio.run(check_admin_user())