#!/usr/bin/env python3

import sys
sys.path.append('.')

from sqlalchemy.orm import sessionmaker
from app.database.database import get_db_session
from app.database.models import User, UserRole
from app.core.local_auth import get_password_hash
from datetime import datetime

def check_and_cleanup_admin_users():
    """Check existing admin users and ensure only admin@remotehive.in exists"""
    try:
        db = next(get_db_session())
        
        print("🔍 Checking existing admin users...")
        
        # Find all admin and super_admin users
        admin_users = db.query(User).filter(
            User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN])
        ).all()
        
        print(f"\n📊 Found {len(admin_users)} admin/super_admin users:")
        
        target_email = "admin@remotehive.in"
        target_password = "Ranjeet11$"
        target_role = UserRole.SUPER_ADMIN
        
        correct_admin = None
        users_to_remove = []
        
        for user in admin_users:
            print(f"   - {user.email} (Role: {user.role}, Active: {user.is_active})")
            
            if user.email == target_email:
                correct_admin = user
            else:
                users_to_remove.append(user)
        
        # Remove incorrect admin users
        if users_to_remove:
            print(f"\n🗑️  Removing {len(users_to_remove)} incorrect admin users:")
            for user in users_to_remove:
                print(f"   - Removing: {user.email}")
                db.delete(user)
            
            db.commit()
            print("✅ Incorrect admin users removed successfully")
        else:
            print("\n✅ No incorrect admin users found")
        
        # Ensure correct admin exists and is properly configured
        if correct_admin:
            print(f"\n🔧 Updating existing admin user: {target_email}")
            
            # Update password
            correct_admin.password_hash = get_password_hash(target_password)
            
            # Ensure correct role
            correct_admin.role = target_role
            
            # Ensure user is active and verified
            correct_admin.is_active = True
            correct_admin.is_verified = True
            
            # Update timestamp
            correct_admin.updated_at = datetime.utcnow()
            
            db.commit()
            print("✅ Admin user updated successfully")
        else:
            print(f"\n➕ Creating new admin user: {target_email}")
            
            # Create new admin user
            new_admin = User(
                email=target_email,
                password_hash=get_password_hash(target_password),
                first_name="Admin",
                last_name="User",
                role=target_role,
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)
            
            print(f"✅ New admin user created with ID: {new_admin.id}")
        
        # Final verification
        print("\n🔍 Final verification:")
        final_admin = db.query(User).filter(User.email == target_email).first()
        
        if final_admin:
            print(f"✅ Admin user exists: {final_admin.email}")
            print(f"✅ Role: {final_admin.role}")
            print(f"✅ Active: {final_admin.is_active}")
            print(f"✅ Verified: {final_admin.is_verified}")
            
            # Check if there are any other admin users
            other_admins = db.query(User).filter(
                User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
                User.email != target_email
            ).count()
            
            if other_admins == 0:
                print("✅ No other admin users found - cleanup successful")
            else:
                print(f"⚠️  Warning: {other_admins} other admin users still exist")
        else:
            print("❌ Admin user verification failed")
        
        print("\n📋 Final admin credentials:")
        print(f"Email: {target_email}")
        print(f"Password: {target_password}")
        print(f"Role: {target_role}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if 'db' in locals():
            db.rollback()
    finally:
        if 'db' in locals():
            db.close()

if __name__ == '__main__':
    check_and_cleanup_admin_users()