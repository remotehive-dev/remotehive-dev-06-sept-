import sqlite3
import os
from pathlib import Path

# Database path
db_path = Path("remotehive.db")

if not db_path.exists():
    print(f"Database not found at {db_path}")
    exit(1)

print(f"Connecting to database: {db_path}")

try:
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check email_users table structure
    print("\n=== EMAIL_USERS TABLE STRUCTURE ===")
    cursor.execute("PRAGMA table_info(email_users)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"Column: {col[1]}, Type: {col[2]}, NotNull: {col[3]}, Default: {col[4]}, PK: {col[5]}")
    
    # Check if there are any records
    print("\n=== EMAIL_USERS TABLE DATA ===")
    cursor.execute("SELECT COUNT(*) FROM email_users")
    count = cursor.fetchone()[0]
    print(f"Total records in email_users: {count}")
    
    if count > 0:
        print("\nFirst 5 records:")
        cursor.execute("SELECT id, email, name, is_deleted, created_at FROM email_users LIMIT 5")
        records = cursor.fetchall()
        for record in records:
            print(f"ID: {record[0]}, Email: {record[1]}, Name: {record[2]}, Deleted: {record[3]}, Created: {record[4]}")
    
    # Check for any constraints or indexes
    print("\n=== EMAIL_USERS INDEXES ===")
    cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='email_users'")
    indexes = cursor.fetchall()
    for idx in indexes:
        print(f"Index: {idx[0]}, SQL: {idx[1]}")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
        print("\nDatabase connection closed.")