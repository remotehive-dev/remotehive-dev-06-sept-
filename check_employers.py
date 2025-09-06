#!/usr/bin/env python3

from app.database.database import get_database_manager
from sqlalchemy import text

def check_employers():
    """Check employer_number field in employers table"""
    db_manager = get_database_manager()
    
    with db_manager.engine.connect() as conn:
        # Check if employer_number column exists
        try:
            result = conn.execute(text("SELECT id, company_name, employer_number FROM employers LIMIT 5"))
            print("Employer data:")
            for row in result:
                print(f"ID: {row[0][:8]}..., Name: {row[1]}, RH Number: {row[2]}")
        except Exception as e:
            print(f"Error querying employers: {e}")
            
        # Check table structure
        try:
            result = conn.execute(text("PRAGMA table_info(employers)"))
            print("\nEmployers table structure:")
            for row in result:
                if 'employer_number' in row[1]:
                    print(f"Column: {row[1]}, Type: {row[2]}, NotNull: {row[3]}, Default: {row[4]}")
        except Exception as e:
            print(f"Error checking table structure: {e}")

if __name__ == "__main__":
    check_employers()