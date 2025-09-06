import psycopg2
import os
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv()

def check_postgres_enum():
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL not found in environment variables")
        
        print(f"Connecting to database using DATABASE_URL...")
        
        # Connect to database using URL
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("\nChecking PostgreSQL enum type 'scrapersource'...")
        
        # Query to get enum values
        cursor.execute("""
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (
                SELECT oid 
                FROM pg_type 
                WHERE typname = 'scrapersource'
            )
            ORDER BY enumsortorder;
        """)
        
        enum_values = cursor.fetchall()
        
        if enum_values:
            print("\nPostgreSQL enum 'scrapersource' values:")
            for i, (value,) in enumerate(enum_values, 1):
                print(f"  {i}. '{value}'")
        else:
            print("\nNo enum type 'scrapersource' found in database.")
            
        # Check if enum type exists
        cursor.execute("""
            SELECT typname, typtype 
            FROM pg_type 
            WHERE typname LIKE '%scraper%' OR typname LIKE '%source%';
        """)
        
        related_types = cursor.fetchall()
        if related_types:
            print("\nRelated types found:")
            for typname, typtype in related_types:
                print(f"  - {typname} (type: {typtype})")
        
        # Check table column constraints
        cursor.execute("""
            SELECT 
                t.table_name,
                c.column_name,
                c.data_type,
                c.udt_name,
                c.is_nullable
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name
            WHERE t.table_schema = 'public' 
            AND c.column_name = 'source'
            AND t.table_name IN ('scraper_configs', 'scraper_logs');
        """)
        
        columns = cursor.fetchall()
        if columns:
            print("\nTables with 'source' column:")
            for table_name, column_name, data_type, udt_name, is_nullable in columns:
                print(f"  - {table_name}.{column_name}: {data_type} ({udt_name}), nullable: {is_nullable}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    check_postgres_enum()