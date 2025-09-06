#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
import uuid
from app.database.database import get_db_session
from app.models.email import EmailUser, EmailUserRole
from app.core.security import get_password_hash
from app.database.models import User

def create_email_admin():
    """Create email admin user account"""
    try:
        db = next(get_db_session())
        
        # Check if email admin already exists
        existing_email_user = db.query(EmailUser).filter(EmailUser.email == "admin@remotehive.in").first()
        if existing_email_user:
            print("✅ Email admin user already exists")
            print(f"   ID: {existing_email_user.id}")
            print(f"   Email: {existing_email_user.email}")
            print(f"   Role: {existing_email_user.role}")
            print(f"   Active: {existing_email_user.is_active}")
            return True
            
        # Get the main admin user to use as created_by
        admin_user = db.query(User).filter(User.email == "admin@remotehive.in").first()
        if not admin_user:
            print("❌ Main admin user not found. Creating basic email user without created_by reference.")
            created_by_id = None
        else:
            created_by_id = admin_user.id
            print(f"✅ Found main admin user: {admin_user.id}")
        
        # Create email user account
        print("Creating email admin user...")
        email_user = EmailUser(
            id=str(uuid.uuid4()),
            email="admin@remotehive.in",
            first_name="Admin",
            last_name="User",
            personal_email="admin@remotehive.in",
            role=EmailUserRole.ADMIN,
            password_hash=get_password_hash("Ranjeet11$"),
            is_active=True,
            is_verified=True,
            is_locked=False,
            created_by=created_by_id,
            failed_login_attempts=0
        )
        
        db.add(email_user)
        db.commit()
        
        print("✅ Email admin user created successfully!")
        print(f"   ID: {email_user.id}")
        print(f"   Email: {email_user.email}")
        print(f"   Role: {email_user.role}")
        print(f"   Password: Ranjeet11$")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating email admin: {e}")
        import traceback
        traceback.print_exc()
        if 'db' in locals():
            db.rollback()
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    create_email_admin()