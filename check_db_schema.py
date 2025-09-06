from app.database.connection import get_db
from sqlalchemy import inspect

def check_scraper_configs_schema():
    db = next(get_db())
    inspector = inspect(db.bind)
    columns = inspector.get_columns('scraper_configs')
    
    print('Columns in scraper_configs table:')
    for col in columns:
        print(f'- {col["name"]}: {col["type"]}')
    
    # Check if 'name' or 'scraper_name' exists
    column_names = [col['name'] for col in columns]
    if 'name' in column_names:
        print('\n❌ OLD FIELD FOUND: "name" column still exists')
    if 'scraper_name' in column_names:
        print('\n✅ NEW FIELD FOUND: "scraper_name" column exists')
    
    db.close()

if __name__ == '__main__':
    check_scraper_configs_schema()