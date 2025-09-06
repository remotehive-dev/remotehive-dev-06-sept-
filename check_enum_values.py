#!/usr/bin/env python3
"""
Script to check enum values in the scraper_configs table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def check_enum_values():
    try:
        # Create database connection
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("Checking enum values in scraper_configs table...")
        
        # Query distinct source values
        result = db.execute(text("SELECT DISTINCT source FROM scraper_configs"))
        sources = result.fetchall()
        
        print("\nDatabase enum values found:")
        for source in sources:
            print(f"- '{source[0]}'")
        
        # Also check if there are any records
        count_result = db.execute(text("SELECT COUNT(*) FROM scraper_configs"))
        total_count = count_result.fetchone()[0]
        print(f"\nTotal scraper configs: {total_count}")
        
        # Check the enum definition from the database schema
        print("\nChecking enum definition in database schema...")
        enum_result = db.execute(text("""
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'scraper_configs' AND column_name = 'source'
        """))
        
        enum_info = enum_result.fetchone()
        if enum_info:
            print(f"Column: {enum_info[0]}, Data Type: {enum_info[1]}, UDT Name: {enum_info[2]}")
        
        db.close()
        
    except Exception as e:
        print(f"Error checking enum values: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_enum_values()