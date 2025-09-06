import sqlite3
import os

# Check remotehive.db which seems to be the main database
if os.path.exists('remotehive.db'):
    conn = sqlite3.connect('remotehive.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print('Tables in remotehive.db:', [t[0] for t in tables])
    
    # Check if scraper_memory table exists and its structure
    if 'scraper_memory' in [t[0] for t in tables]:
        cursor.execute("PRAGMA table_info(scraper_memory);")
        columns = cursor.fetchall()
        print('\nScraper_memory columns:', [(col[1], col[2]) for col in columns])
    
    # Check if scraper_configs table exists and its structure
    if 'scraper_configs' in [t[0] for t in tables]:
        cursor.execute("PRAGMA table_info(scraper_configs);")
        columns = cursor.fetchall()
        print('\nScraper_configs columns:', [(col[1], col[2]) for col in columns])
    
    conn.close()
else:
    print('remotehive.db does not exist')