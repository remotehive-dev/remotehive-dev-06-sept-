import sys
sys.path.append('d:/Remotehive')

from app.core.database import get_db
from sqlalchemy import text

try:
    db = next(get_db())
    
    # Add the missing parallel_workers column
    print('Adding parallel_workers column to scraper_configs table...')
    db.execute(text('ALTER TABLE scraper_configs ADD COLUMN parallel_workers INTEGER DEFAULT 1'))
    db.commit()
    print('✓ parallel_workers column added successfully')
    
    # Verify the column was added
    result = db.execute(text('PRAGMA table_info(scraper_configs)'))
    columns = result.fetchall()
    column_names = [col[1] for col in columns]
    
    if 'parallel_workers' in column_names:
        print('✓ Verification: parallel_workers column exists')
    else:
        print('✗ Verification failed: parallel_workers column still missing')
        
except Exception as e:
    print(f'Error: {e}')
    db.rollback()