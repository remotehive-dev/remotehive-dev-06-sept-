import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_scraper_memory_schema():
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        
        if not database_url:
            print("❌ DATABASE_URL not found in environment")
            return
            
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("🔍 Checking scraper_memory table schema...")
        
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'scraper_memory'
            );
        """)
        
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            print("❌ scraper_memory table does not exist!")
            return
            
        print("✅ scraper_memory table exists")
        
        # Get column information
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'scraper_memory'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        
        print(f"\n📋 Table columns ({len(columns)} total):")
        for col_name, data_type, is_nullable, default_val in columns:
            nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
            default = f" DEFAULT {default_val}" if default_val else ""
            print(f"  - {col_name}: {data_type} {nullable}{default}")
            
        # Check for scraper_name specifically
        scraper_name_exists = any(col[0] == 'scraper_name' for col in columns)
        
        if scraper_name_exists:
            print("\n✅ 'scraper_name' column exists")
        else:
            print("\n❌ 'scraper_name' column is MISSING!")
            
        # Get sample data count
        cursor.execute("SELECT COUNT(*) FROM scraper_memory;")
        count = cursor.fetchone()[0]
        print(f"\n📊 Total records in scraper_memory: {count}")
        
        if count > 0:
            print("\n🔍 Sample records:")
            cursor.execute("SELECT * FROM scraper_memory LIMIT 3;")
            records = cursor.fetchall()
            for i, record in enumerate(records, 1):
                print(f"  Record {i}: {record}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_scraper_memory_schema()