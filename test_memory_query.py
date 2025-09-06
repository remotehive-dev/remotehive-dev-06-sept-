from app.database.database import get_database_manager
from sqlalchemy import text
from app.database.models import MemoryUpload
from app.core.auth import get_current_user
import traceback

def test_memory_query():
    try:
        db_manager = get_database_manager()
        
        with db_manager.session_scope() as db:
            # Check total records
            total_count = db.query(MemoryUpload).count()
            print(f"Total memory uploads: {total_count}")
            
            # Check records with uploaded_by field
            records_with_user = db.query(MemoryUpload).filter(MemoryUpload.uploaded_by.isnot(None)).count()
            print(f"Records with uploaded_by: {records_with_user}")
            
            # Test the exact query from the endpoint with a sample user_id
            sample_user_id = "admin@remotehive.in"  # This might be the issue
            
            # Try the query that's failing
            try:
                result = db.query(MemoryUpload).filter(MemoryUpload.uploaded_by == sample_user_id).all()
                print(f"Query with user_id '{sample_user_id}' returned {len(result)} records")
            except Exception as e:
                print(f"Query failed: {e}")
                traceback.print_exc()
            
            # Check what uploaded_by values actually exist
            result = db.execute(text("SELECT DISTINCT uploaded_by FROM memory_uploads WHERE uploaded_by IS NOT NULL LIMIT 10;"))
            uploaded_by_values = result.fetchall()
            print(f"\nExisting uploaded_by values:")
            for value in uploaded_by_values:
                print(f"  '{value[0]}'")
                
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_memory_query()