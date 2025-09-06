#!/usr/bin/env python3
"""
Script to add role column to users table and migrate existing users.
"""

import os
import sys
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import DatabaseManager
from app.database.models import User, UserRole

def add_role_column_migration():
    """Add role column to users table and set default values."""
    db_manager = DatabaseManager()
    engine = db_manager.engine
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("Starting role column migration...")
        
        # Check if role column already exists (SQLite compatible)
        result = session.execute(text("""
            PRAGMA table_info(users)
        """))
        
        columns = [row[1] for row in result.fetchall()]
        role_exists = 'role' in columns
        
        if role_exists:
            print("Role column already exists. Skipping migration.")
            return
        
        # Add role column to users table
        print("Adding role column to users table...")
        session.execute(text("""
            ALTER TABLE users 
            ADD COLUMN role VARCHAR(50) DEFAULT 'job_seeker' NOT NULL
        """))
        
        print("Role column added successfully (constraints will be enforced by application).")
        
        # Update existing users based on their profiles
        print("Updating existing user roles...")
        
        # Set employers based on employer profiles
        session.execute(text("""
            UPDATE users 
            SET role = 'employer' 
            WHERE id IN (
                SELECT DISTINCT user_id 
                FROM employers 
                WHERE user_id IS NOT NULL
            )
        """))
        
        # Set job seekers based on job seeker profiles
        session.execute(text("""
            UPDATE users 
            SET role = 'job_seeker' 
            WHERE id IN (
                SELECT DISTINCT user_id 
                FROM job_seekers 
                WHERE user_id IS NOT NULL
            ) AND role = 'job_seeker'
        """))
        
        # Commit the changes
        session.commit()
        print("✅ Role column migration completed successfully!")
        
        # Show migration results
        result = session.execute(text("""
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role 
            ORDER BY role
        """))
        
        print("\nUser role distribution:")
        for row in result:
            print(f"  {row[0]}: {row[1]} users")
            
    except Exception as e:
        session.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        session.close()

def create_initial_super_admin():
    """Create an initial super admin user if none exists."""
    db_manager = DatabaseManager()
    engine = db_manager.engine
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Check if any super admin exists
        result = session.execute(text("""
            SELECT COUNT(*) FROM users WHERE role = 'super_admin'
        """))
        
        count = result.scalar()
        if count > 0:
            print(f"Super admin already exists ({count} found). Skipping creation.")
            return
        
        print("\nNo super admin found. You can create one using the API endpoint:")
        print("POST /api/v1/local-auth/create-super-admin")
        print("\nExample payload:")
        print("{")  
        print('  "email": "admin@remotehive.in",')  
        print('  "password": "your_secure_password",')  
        print('  "first_name": "Super",')  
        print('  "last_name": "Admin"')  
        print("}")
        
    except Exception as e:
        print(f"❌ Error checking for super admin: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    try:
        add_role_column_migration()
        create_initial_super_admin()
        print("\n🎉 Migration completed successfully!")
        print("\nNext steps:")
        print("1. Start the API server: uvicorn main:app --reload")
        print("2. Create a super admin user via the API")
        print("3. Test the new local authentication system")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)