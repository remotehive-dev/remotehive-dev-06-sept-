from app.database.database import get_db_session
from sqlalchemy import inspect

db = next(get_db_session())
inspector = inspect(db.bind)
columns = inspector.get_columns('scraper_configs')

print('Database columns:')
for col in columns:
    print(f'- {col["name"]}')

db.close()