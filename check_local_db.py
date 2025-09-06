import sqlite3
import os

def check_local_database():
    db_path = 'remotehive.db'
    
    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print(f"Found {len(tables)} tables in local database:")
        print("=" * 50)
        
        total_records = 0
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            total_records += count
            print(f"- {table_name}: {count} records")
        
        print("=" * 50)
        print(f"Total records across all tables: {total_records}")
        
        # Check some key tables for sample data
        key_tables = ['users', 'job_posts', 'employers', 'job_seekers']
        for table_name in key_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                if count > 0:
                    print(f"\n{table_name} sample data:")
                    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                    rows = cursor.fetchall()
                    
                    # Get column names
                    cursor.execute(f"PRAGMA table_info({table_name})")
                    columns = [col[1] for col in cursor.fetchall()]
                    print(f"Columns: {', '.join(columns)}")
                    
                    for i, row in enumerate(rows, 1):
                        print(f"Record {i}: {dict(zip(columns, row))}")
            except sqlite3.Error as e:
                print(f"Error checking {table_name}: {e}")
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_local_database()