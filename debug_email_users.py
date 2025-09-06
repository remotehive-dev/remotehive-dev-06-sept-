import sys
sys.path.append('app')

from sqlalchemy.orm import Session
from app.database.database import db_manager
from app.services.email_management_service import EmailManagementService
from app.models.email import EmailUser

print("=== DEBUGGING EMAIL USERS ENDPOINT ===")

try:
    # Create database session
    db = db_manager.get_session()
    print("Database session created successfully")
    
    # Create EmailManagementService
    email_management_service = EmailManagementService(db)
    print("EmailManagementService created successfully")
    
    # Test get_all_email_users method
    print("\nTesting get_all_email_users method...")
    email_users = email_management_service.get_all_email_users(limit=100, offset=0)
    print(f"Success! Found {len(email_users)} email users")
    
    for user in email_users:
        print(f"User: {user.email}, Name: {user.name}, Deleted: {user.is_deleted}")
    
    # Test direct database query
    print("\nTesting direct database query...")
    direct_users = db.query(EmailUser).filter(EmailUser.deleted_at.is_(None)).all()
    print(f"Direct query found {len(direct_users)} email users")
    
except Exception as e:
    print(f"Error occurred: {e}")
    import traceback
    traceback.print_exc()
    
finally:
    if 'db' in locals():
        db.close()
        print("\nDatabase session closed")