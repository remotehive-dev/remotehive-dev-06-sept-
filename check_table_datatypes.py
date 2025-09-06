import sqlite3
import os

# Database path (two directories up from database folder)
db_path = 'D:/Remotehive/remotehive.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=== ALL TABLES IN DATABASE ===")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

if tables:
    for table in tables:
        print(f"Table: {table[0]}")
else:
    print("No tables found in database")

print("\n=== CHECKING IF SCRAPER_CONFIGS EXISTS ===")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='scraper_configs';")
scraper_table = cursor.fetchone()

if scraper_table:
    print("scraper_configs table exists")
    cursor.execute('PRAGMA table_info(scraper_configs)')
    columns = cursor.fetchall()
    
    for col in columns:
        print(f"Column: {col[1]}, Type: {col[2]}, NotNull: {col[3]}, Default: {col[4]}, PK: {col[5]}")
else:
    print("scraper_configs table does NOT exist")
    
print("\n=== CHECKING ALEMBIC VERSION ===")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version';")
alembic_table = cursor.fetchone()

if alembic_table:
    cursor.execute('SELECT version_num FROM alembic_version')
    version = cursor.fetchone()
    print(f"Current Alembic version: {version[0] if version else 'None'}")
else:
    print("No alembic_version table found")

conn.close()
print("\nTable structure check completed.")