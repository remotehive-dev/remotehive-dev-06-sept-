#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import get_db_session
from app.database.models import User
from app.models.email import EmailUser
from sqlalchemy import text

def check_users():
    """Check what users exist in both tables"""
    try:
        db = next(get_db_session())
        
        print("=== Checking Main Users Table ===")
        users = db.query(User).all()
        print(f"Total users in main table: {len(users)}")
        
        for user in users:
            print(f"  ID: {user.id}")
            print(f"  Email: {user.email}")
            print(f"  Role: {user.role}")
            print(f"  Active: {user.is_active}")
            print("  ---")
            
        print("\n=== Checking Email Users Table ===")
        email_users = db.query(EmailUser).all()
        print(f"Total email users: {len(email_users)}")
        
        for email_user in email_users:
            print(f"  ID: {email_user.id}")
            print(f"  Email: {email_user.email}")
            print(f"  Role: {email_user.role}")
            print(f"  Active: {email_user.is_active}")
            print(f"  Created by: {email_user.created_by}")
            print("  ---")
            
        return True
        
    except Exception as e:
        print(f"❌ Error checking users: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    check_users()