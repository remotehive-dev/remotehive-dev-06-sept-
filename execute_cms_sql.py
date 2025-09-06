import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def execute_sql_file():
    try:
        # Get database connection details from environment
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            print("❌ DATABASE_URL not found in environment variables")
            return
        
        # Connect to PostgreSQL database
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Read and execute SQL file
        with open('create_missing_cms_tables.sql', 'r') as file:
            sql_content = file.read()
        
        print("Executing SQL statements...")
        cursor.execute(sql_content)
        conn.commit()
        
        print("✅ CMS tables created successfully!")
        print("✅ Sample data inserted!")
        
        # Verify tables were created
        cursor.execute("SELECT COUNT(*) FROM reviews;")
        reviews_count = cursor.fetchone()[0]
        print(f"✅ Reviews table has {reviews_count} records")
        
        cursor.execute("SELECT COUNT(*) FROM ads;")
        ads_count = cursor.fetchone()[0]
        print(f"✅ Ads table has {ads_count} records")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error executing SQL: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    execute_sql_file()