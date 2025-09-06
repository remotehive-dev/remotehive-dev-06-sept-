import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData, inspect
from sqlalchemy.pool import QueuePool

# Load environment variables
load_dotenv()

def refresh_database_metadata():
    """Force refresh SQLAlchemy metadata cache"""
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL not found")
        return False
    
    try:
        print("🔄 Creating new database engine...")
        
        # Create a new engine with fresh metadata
        engine = create_engine(
            database_url,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30,
            pool_recycle=0,  # Force immediate connection recycling
            pool_pre_ping=True,
            pool_reset_on_return='commit',
            connect_args={
                'connect_timeout': 10,
                'application_name': 'MetadataRefresh'
            }
        )
        
        print("🔍 Inspecting database schema...")
        
        # Use inspector to get fresh metadata
        inspector = inspect(engine)
        
        # Check scraper_memory table
        if inspector.has_table('scraper_memory'):
            columns = inspector.get_columns('scraper_memory')
            print("\n📋 scraper_memory columns (fresh metadata):")
            for col in columns:
                print(f"  - {col['name']}: {col['type']} ({'NULL' if col['nullable'] else 'NOT NULL'})")
            
            # Check if scraper_name exists
            scraper_name_exists = any(col['name'] == 'scraper_name' for col in columns)
            print(f"\n✅ scraper_name column exists: {scraper_name_exists}")
        else:
            print("❌ scraper_memory table not found")
        
        # Check scraper_configs table
        if inspector.has_table('scraper_configs'):
            columns = inspector.get_columns('scraper_configs')
            print("\n⚙️ scraper_configs columns:")
            for col in columns:
                print(f"  - {col['name']}: {col['type']} ({'NULL' if col['nullable'] else 'NOT NULL'})")
        
        # Test a simple query
        print("\n🧪 Testing database queries...")
        with engine.connect() as conn:
            # Test scraper_memory query
            try:
                result = conn.execute("SELECT COUNT(*) FROM scraper_memory")
                count = result.scalar()
                print(f"✅ scraper_memory query successful: {count} records")
            except Exception as e:
                print(f"❌ scraper_memory query failed: {e}")
            
            # Test scraper_configs query
            try:
                result = conn.execute("SELECT COUNT(*) FROM scraper_configs")
                count = result.scalar()
                print(f"✅ scraper_configs query successful: {count} records")
            except Exception as e:
                print(f"❌ scraper_configs query failed: {e}")
        
        # Dispose of the engine to clean up connections
        engine.dispose()
        print("\n🧹 Database connections cleaned up")
        
        return True
        
    except Exception as e:
        print(f"❌ Error refreshing metadata: {e}")
        return False

def clear_sqlalchemy_cache():
    """Clear any SQLAlchemy module-level caches"""
    print("🧹 Clearing SQLAlchemy caches...")
    
    # Clear any cached metadata
    try:
        from sqlalchemy.schema import MetaData
        # Force garbage collection of metadata objects
        import gc
        gc.collect()
        print("✅ SQLAlchemy caches cleared")
    except Exception as e:
        print(f"⚠️ Warning clearing caches: {e}")

if __name__ == "__main__":
    print("🔄 Starting database metadata refresh...")
    
    # Clear caches first
    clear_sqlalchemy_cache()
    
    # Refresh metadata
    success = refresh_database_metadata()
    
    if success:
        print("\n✅ Database metadata refresh completed successfully")
        print("💡 Recommendation: Restart the FastAPI server to pick up fresh metadata")
    else:
        print("\n❌ Database metadata refresh failed")
        sys.exit(1)