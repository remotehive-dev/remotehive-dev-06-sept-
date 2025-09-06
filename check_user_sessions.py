from app.database.database import get_db_session
from sqlalchemy import text

db = next(get_db_session())

# Check if user_sessions table exists
result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='user_sessions';"))
table_exists = result.fetchone() is not None
print(f'user_sessions table exists: {table_exists}')

if table_exists:
    # Get table structure
    result2 = db.execute(text('PRAGMA table_info(user_sessions);'))
    print('Table structure:')
    for row in result2.fetchall():
        print(row)
    
    # Check foreign key constraints
    result3 = db.execute(text('PRAGMA foreign_key_list(user_sessions);'))
    print('\nForeign key constraints:')
    for row in result3.fetchall():
        print(row)
else:
    print('user_sessions table does not exist')

db.close()