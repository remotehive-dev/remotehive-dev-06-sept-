#!/usr/bin/env python3
import sqlite3
import os

def fix_scraper_configs_schema():
    """Fix the scraper_configs table schema by adding missing parallel_workers column"""
    db_path = 'app/database/remotehive.db'
    
    if not os.path.exists(db_path):
        print(f"Database file not found: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current schema
        cursor.execute("PRAGMA table_info(scraper_configs)")
        columns = cursor.fetchall()
        
        print("Current columns in scraper_configs:")
        column_names = []
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
            column_names.append(col[1])
        
        # Check if parallel_workers column exists
        if 'parallel_workers' not in column_names:
            print("\nAdding parallel_workers column...")
            cursor.execute("ALTER TABLE scraper_configs ADD COLUMN parallel_workers INTEGER DEFAULT 1")
            conn.commit()
            print("Successfully added parallel_workers column!")
        else:
            print("\nparallel_workers column already exists.")
        
        # Verify the change
        cursor.execute("PRAGMA table_info(scraper_configs)")
        columns = cursor.fetchall()
        print("\nUpdated columns in scraper_configs:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = fix_scraper_configs_schema()
    if success:
        print("\nSchema fix completed successfully!")
    else:
        print("\nSchema fix failed!")