#!/usr/bin/env python3

import sys
sys.path.append('.')

from app.database.database import get_db_session
from app.core.rbac import LoginAttempt
from sqlalchemy import text

def clear_admin_login_attempts():
    """Clear failed login attempts for admin user"""
    try:
        db = next(get_db_session())
        
        try:
            # Check current login attempts for admin
            admin_attempts = db.query(LoginAttempt).filter(
                LoginAttempt.email == "admin@remotehive.in"
            ).all()
            
            print(f"Found {len(admin_attempts)} login attempts for admin@remotehive.in")
            
            # Show recent attempts
            for attempt in admin_attempts[-5:]:
                print(f"  - {attempt.attempted_at}: Success={attempt.success}, Reason={attempt.failure_reason}")
            
            # Clear all login attempts for admin
            deleted_count = db.query(LoginAttempt).filter(
                LoginAttempt.email == "admin@remotehive.in"
            ).delete()
            
            db.commit()
            print(f"\n✅ Cleared {deleted_count} login attempts for admin@remotehive.in")
            
            # Also clear any rate limiting entries if they exist
            try:
                # This might not exist depending on implementation
                db.execute(text("DELETE FROM rate_limits WHERE identifier = 'admin@remotehive.in'"))
                db.commit()
                print("✅ Cleared rate limiting entries")
            except Exception as e:
                print(f"ℹ️ No rate limiting table or entries to clear: {e}")
                
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error clearing login attempts: {e}")
        return False
    
    return True

if __name__ == '__main__':
    print("Clearing admin login attempts...")
    if clear_admin_login_attempts():
        print("\n🎉 Admin login attempts cleared successfully!")
        print("You can now try logging in again.")
    else:
        print("\n❌ Failed to clear admin login attempts.")