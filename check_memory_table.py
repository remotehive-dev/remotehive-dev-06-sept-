from app.database.database import get_db_session
from sqlalchemy import text

def check_memory_table():
    try:
        from app.database.database import get_database_manager
        db_manager = get_database_manager()
        
        with db_manager.session_scope() as db:
            # Check if table exists
            result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='memory_uploads';"))
            table_exists = result.fetchone() is not None
            print(f"Table 'memory_uploads' exists: {table_exists}")
            
            if table_exists:
                # Get table schema
                result = db.execute(text("PRAGMA table_info(memory_uploads);"))
                columns = result.fetchall()
                print("\nTable schema:")
                for col in columns:
                    print(f"  {col[1]} ({col[2]}) - {'NOT NULL' if col[3] else 'NULL'}")
            else:
                # Check what tables do exist
                result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
                tables = result.fetchall()
                print("\nExisting tables:")
                for table in tables:
                    print(f"  {table[0]}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_memory_table()