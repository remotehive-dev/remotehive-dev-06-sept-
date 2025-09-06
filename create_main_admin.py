#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
import uuid
from app.database.database import get_db_session
from app.database.models import User, UserRole
from app.models.email import EmailUser
from app.core.security import get_password_hash

def create_main_admin():
    """Create main admin user account"""
    try:
        db = next(get_db_session())
        
        # Check if main admin already exists
        existing_user = db.query(User).filter(User.email == "admin@remotehive.in").first()
        if existing_user:
            print("✅ Main admin user already exists")
            print(f"   ID: {existing_user.id}")
            print(f"   Email: {existing_user.email}")
            print(f"   Role: {existing_user.role}")
            return existing_user.id
            
        # Create main admin user
        print("Creating main admin user...")
        admin_user = User(
            id=uuid.uuid4(),
            email="admin@remotehive.in",
            password_hash=get_password_hash("Ranjeet11$"),
            first_name="Admin",
            last_name="User",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow()
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Main admin user created successfully!")
        print(f"   ID: {admin_user.id}")
        print(f"   Email: {admin_user.email}")
        print(f"   Role: {admin_user.role}")
        
        # Now update the email user to link to this main user
        email_user = db.query(EmailUser).filter(EmailUser.email == "admin@remotehive.in").first()
        if email_user:
            email_user.created_by = admin_user.id
            db.commit()
            print("✅ Linked email user to main admin user")
        
        return admin_user.id
        
    except Exception as e:
        print(f"❌ Error creating main admin: {e}")
        import traceback
        traceback.print_exc()
        if 'db' in locals():
            db.rollback()
        return None
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    create_main_admin()