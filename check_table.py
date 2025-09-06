import sqlite3

conn = sqlite3.connect('app/database/database.db')
cursor = conn.cursor()

# Check what tables exist
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print('Available tables:')
for table in tables:
    print(f'  {table[0]}')

print('\n')

# Check scraper_configs table structure if it exists
if any('scraper_configs' in table for table in tables):
    cursor.execute('PRAGMA table_info(scraper_configs)')
    print('scraper_configs columns:')
    for row in cursor.fetchall():
        print(f'  {row[1]} ({row[2]})')
else:
    print('scraper_configs table does not exist')

conn.close()