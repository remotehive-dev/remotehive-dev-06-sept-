import sqlite3

try:
    conn = sqlite3.connect('remotehive.db')
    cursor = conn.cursor()
    
    # Check if last_run column already exists
    cursor.execute("PRAGMA table_info(scraper_configs);")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'last_run' not in columns:
        print('Adding last_run column to scraper_configs...')
        cursor.execute('ALTER TABLE scraper_configs ADD COLUMN last_run DATETIME;')
        
        # Update existing records
        cursor.execute('UPDATE scraper_configs SET last_run = last_run_at WHERE last_run IS NULL AND last_run_at IS NOT NULL;')
        
        conn.commit()
        print('Migration applied successfully!')
    else:
        print('last_run column already exists in scraper_configs')
    
    conn.close()
    
except Exception as e:
    print(f'Error applying migration: {e}')