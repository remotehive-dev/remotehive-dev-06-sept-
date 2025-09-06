#!/usr/bin/env python3
from app.database.database import DatabaseManager
from sqlalchemy import text

db = DatabaseManager()
conn = db.engine.connect()
trans = conn.begin()

try:
    # Try to add the user_id column
    print('Adding user_id column to scraper_configs...')
    conn.execute(text('ALTER TABLE scraper_configs ADD COLUMN user_id VARCHAR(36)'))
    print('user_id column added successfully')
    
    # Add foreign key constraint
    print('Adding foreign key constraint...')
    conn.execute(text('ALTER TABLE scraper_configs ADD CONSTRAINT fk_scraper_configs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'))
    print('Foreign key constraint added successfully')
    
    trans.commit()
    print('All changes committed successfully')
    
except Exception as e:
    print(f'Error: {e}')
    trans.rollback()
    print('Changes rolled back')
    
finally:
    conn.close()