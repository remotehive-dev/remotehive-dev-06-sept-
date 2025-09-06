#!/usr/bin/env python3
"""
Script to recreate database tables with the updated schema.
"""

import os
import sys
from sqlalchemy import text

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import DatabaseManager
from app.database.models import Base

def recreate_tables():
    """Recreate all database tables with updated schema."""
    db_manager = DatabaseManager()
    engine = db_manager.engine
    
    try:
        print("Recreating database tables...")
        
        # Drop all tables
        print("Dropping existing tables...")
        Base.metadata.drop_all(bind=engine)
        
        # Create all tables with updated schema
        print("Creating tables with updated schema...")
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database tables recreated successfully!")
        
        # Verify the users table structure
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result.fetchall()]
            print(f"\nUsers table columns: {columns}")
            
            if 'role' in columns:
                print("✅ Role column is present in users table")
            else:
                print("❌ Role column is missing from users table")
                
    except Exception as e:
        print(f"❌ Error recreating tables: {e}")
        raise

if __name__ == "__main__":
    try:
        recreate_tables()
        print("\n🎉 Database schema updated successfully!")
        print("\nNext steps:")
        print("1. Restart the API server")
        print("2. Test the local authentication system")
    except Exception as e:
        print(f"\n❌ Failed to update database schema: {e}")
        sys.exit(1)