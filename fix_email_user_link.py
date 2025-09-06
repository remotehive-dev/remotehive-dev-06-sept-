#!/usr/bin/env python3
"""
Fix Email User Link

Update the email user record to link it to the admin user
so the email endpoints can find the email account.
"""

import sys
import os
from datetime import datetime

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.database import get_db_session
from app.database.models import User, UserRole
from app.models.email import EmailUser

def fix_email_user_link():
    """Link the email user to the admin user"""
    print("Email User Link Fix")
    print("=" * 30)
    print(f"Time: {datetime.now()}")
    
    try:
        db = next(get_db_session())
        
        # Find admin user
        admin_user = db.query(User).filter(
            User.email == "admin@remotehive.in",
            User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN])
        ).first()
        
        if not admin_user:
            print("❌ Admin user not found")
            return False
            
        print(f"✅ Found admin user: {admin_user.email} (ID: {admin_user.id})")
        
        # Find email user
        email_user = db.query(EmailUser).filter(
            EmailUser.email == "admin@remotehive.in",
            EmailUser.deleted_at.is_(None),
            EmailUser.is_active == True
        ).first()
        
        if not email_user:
            print("❌ Email user not found")
            return False
            
        print(f"✅ Found email user: {email_user.email} (ID: {email_user.id})")
        print(f"   Current created_by: {email_user.created_by}")
        
        # Update the email user to link it to admin
        if email_user.created_by != admin_user.id:
            email_user.created_by = admin_user.id
            email_user.updated_by = admin_user.id
            email_user.updated_at = datetime.utcnow()
            
            db.commit()
            print(f"✅ Email user linked to admin user successfully")
            print(f"   New created_by: {email_user.created_by}")
        else:
            print("✅ Email user already linked to admin user")
            
        return True
        
    except Exception as e:
        print(f"❌ Error fixing email user link: {e}")
        if 'db' in locals():
            db.rollback()
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    success = fix_email_user_link()
    if success:
        print("\n🎉 Email user link fixed successfully!")
        print("   The email endpoints should now work correctly.")
    else:
        print("\n💥 Failed to fix email user link.")