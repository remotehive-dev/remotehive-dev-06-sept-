#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text, inspect
from app.core.config import settings
from app.database.database import get_db_session

def check_email_tables():
    """Check email tables structure and existence"""
    try:
        # Create database connection
        engine = create_engine(settings.DATABASE_URL)
        inspector = inspect(engine)
        
        print("=== Checking Email Tables ===")
        
        # Check if email tables exist
        tables = inspector.get_table_names()
        email_tables = [t for t in tables if 'email' in t]
        
        print(f"\nFound email tables: {email_tables}")
        
        # Check email_users table structure if it exists
        if 'email_users' in tables:
            print("\n=== email_users table structure ===")
            columns = inspector.get_columns('email_users')
            for col in columns:
                print(f"  {col['name']}: {col['type']} (nullable: {col['nullable']})")
        else:
            print("\n❌ email_users table does not exist")
            
        # Check if we can query the table
        if 'email_users' in tables:
            db = next(get_db_session())
            try:
                result = db.execute(text("SELECT COUNT(*) FROM email_users"))
                count = result.scalar()
                print(f"\nCurrent email_users count: {count}")
                
                # Show existing records
                if count > 0:
                    result = db.execute(text("SELECT id, email, role, is_active FROM email_users LIMIT 5"))
                    records = result.fetchall()
                    print("\nExisting email users:")
                    for record in records:
                        print(f"  ID: {record[0]}, Email: {record[1]}, Role: {record[2]}, Active: {record[3]}")
            finally:
                db.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking email tables: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    check_email_tables()