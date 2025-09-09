import sqlite3

conn = sqlite3.connect('D:/Remotehive/remotehive.db')
cursor = conn.cursor()

# Get table creation SQL
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='scraper_configs'")
result = cursor.fetchone()

if result:
    print("Table creation SQL:")
    print(result[0])
else:
    print("Table not found")

conn.close()