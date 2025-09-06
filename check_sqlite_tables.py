#!/usr/bin/env python3
import sqlite3
import os

def check_sqlite_tables():
    db_file = 'remotehive.db'
    
    if not os.path.exists(db_file):
        print(f"Database file '{db_file}' not found!")
        return
    
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            AND name NOT LIKE 'sqlite_%' 
            AND name NOT IN ('alembic_version')
            ORDER BY name
        """)
        
        tables = cursor.fetchall()
        print(f"Found {len(tables)} tables in SQLite database:")
        print("=" * 50)
        
        for table in tables:
            table_name = table[0]
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"  {table_name}: {count} rows")
            
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_sqlite_tables()