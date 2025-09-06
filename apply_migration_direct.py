import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def apply_migration():
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        
        if not database_url:
            print("❌ DATABASE_URL not found in environment")
            return
            
        # Read migration SQL
        with open('supabase/migrations/fix_scraper_memory_schema.sql', 'r') as f:
            migration_sql = f.read()
            
        print("🔄 Applying scraper_memory schema migration...")
        
        # Connect to database
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Execute migration
        cursor.execute(migration_sql)
        
        print("✅ Migration applied successfully!")
        
        # Verify the new schema
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'scraper_memory'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        
        print(f"\n📋 New scraper_memory schema ({len(columns)} columns):")
        for col_name, data_type, is_nullable in columns:
            nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
            print(f"  - {col_name}: {data_type} {nullable}")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    apply_migration()