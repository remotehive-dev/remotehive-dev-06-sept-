#!/usr/bin/env python3
"""
Check what tables exist in the SQLite database.
"""

import sqlite3
import os

def check_tables():
    """Check what tables exist in the database."""
    
    # Get database path
    db_path = os.path.join(os.getcwd(), 'remotehive.db')
    
    if not os.path.exists(db_path):
        print(f"Database file not found: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"Existing tables ({len(tables)}):")
        for table in sorted(tables):
            print(f"  - {table}")
        
        # Check for our new tables specifically
        new_tables = ['managed_websites', 'memory_uploads', 'scraping_sessions', 'ml_training_data', 'scraping_metrics']
        existing_new_tables = [t for t in new_tables if t in tables]
        
        print(f"\nNew tables ({len(existing_new_tables)}/{len(new_tables)}):")
        for table in new_tables:
            status = "✅" if table in tables else "❌"
            print(f"  {status} {table}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error checking tables: {e}")

if __name__ == '__main__':
    check_tables()