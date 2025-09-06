import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def verify_database_connection():
    """Verify which database we're connected to and check the schema"""
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        return
    
    print(f"🔗 Database URL: {database_url[:50]}...")
    
    try:
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Check current database name
        cursor.execute("SELECT current_database();")
        db_name = cursor.fetchone()[0]
        print(f"📊 Connected to database: {db_name}")
        
        # Check if scraper_memory table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'scraper_memory'
            );
        """)
        table_exists = cursor.fetchone()[0]
        print(f"📋 scraper_memory table exists: {table_exists}")
        
        if table_exists:
            # Get column information
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'scraper_memory'
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            print("\n📝 Current scraper_memory columns:")
            for col_name, data_type, nullable in columns:
                print(f"  - {col_name}: {data_type} ({'NULL' if nullable == 'YES' else 'NOT NULL'})")
            
            # Check if scraper_name column exists
            scraper_name_exists = any(col[0] == 'scraper_name' for col in columns)
            print(f"\n🔍 scraper_name column exists: {scraper_name_exists}")
            
            # Count records
            cursor.execute("SELECT COUNT(*) FROM scraper_memory;")
            count = cursor.fetchone()[0]
            print(f"📊 Records in scraper_memory: {count}")
        
        # Check scraper_configs table and enum values
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'scraper_configs'
            );
        """)
        configs_exists = cursor.fetchone()[0]
        print(f"\n⚙️ scraper_configs table exists: {configs_exists}")
        
        if configs_exists:
            cursor.execute("SELECT COUNT(*) FROM scraper_configs;")
            config_count = cursor.fetchone()[0]
            print(f"📊 Records in scraper_configs: {config_count}")
            
            if config_count > 0:
                cursor.execute("SELECT DISTINCT source FROM scraper_configs LIMIT 5;")
                sources = cursor.fetchall()
                print("🔍 Sample source values:")
                for source in sources:
                    print(f"  - {source[0]}")
        
        cursor.close()
        conn.close()
        print("\n✅ Database verification completed")
        
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")

if __name__ == "__main__":
    verify_database_connection()