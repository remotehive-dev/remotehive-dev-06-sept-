#!/usr/bin/env python3
from app.database.database import DatabaseManager
from sqlalchemy import inspect

db = DatabaseManager()
engine = db.engine
inspector = inspect(engine)

print('All scraper_configs columns:')
cols = inspector.get_columns('scraper_configs')
for c in cols:
    print(f'  {c["name"]}: {c["type"]}')

print('\nForeign keys:')
fks = inspector.get_foreign_keys('scraper_configs')
for fk in fks:
    print(f'  {fk["constrained_columns"]} -> {fk["referred_table"]}.{fk["referred_columns"]}')