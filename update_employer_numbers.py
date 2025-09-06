#!/usr/bin/env python3

from app.database.database import get_database_manager
from sqlalchemy import text

def update_employer_numbers():
    """Update employer_number field with RH00 series numbers"""
    db_manager = get_database_manager()
    
    with db_manager.engine.begin() as conn:
        # For SQLite, we need a simpler approach since ROW_NUMBER() might not work
        # First, get all employers without employer_number
        result = conn.execute(text("SELECT id FROM employers WHERE employer_number IS NULL ORDER BY created_at"))
        employer_ids = [row[0] for row in result]
        
        print(f"Found {len(employer_ids)} employers without RH numbers")
        
        # Update each employer with RH00 series number
        for i, employer_id in enumerate(employer_ids, 1):
            rh_number = f"RH{i:04d}"
            conn.execute(text("UPDATE employers SET employer_number = :rh_number WHERE id = :id"), 
                        {"rh_number": rh_number, "id": employer_id})
            print(f"Updated employer {employer_id[:8]}... with {rh_number}")
        
        print("All employer numbers updated successfully!")
        
    # Verify the update with a separate connection
    with db_manager.engine.connect() as conn:
        result = conn.execute(text("SELECT id, company_name, employer_number FROM employers"))
        print("\nUpdated employer data:")
        for row in result:
            print(f"ID: {row[0][:8]}..., Name: {row[1]}, RH Number: {row[2]}")

if __name__ == "__main__":
    update_employer_numbers()