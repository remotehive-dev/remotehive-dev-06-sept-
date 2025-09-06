#!/usr/bin/env python3
"""
Direct test of memory upload service to isolate the dictionary access error.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up environment
os.environ.setdefault('DATABASE_URL', 'sqlite:///./test.db')

from app.database.database import get_db_session
from app.services.memory_upload_service import MemoryUploadService
import uuid
import asyncio

async def test_memory_service_direct():
    """Test memory upload service directly"""
    print("=== Testing Memory Upload Service Directly ===")
    
    # Get database session
    db = next(get_db_session())
    
    # Create service instance
    memory_service = MemoryUploadService(db)
    
    # Test CSV content
    csv_content = """pattern_name,url_pattern,css_selector,xpath_selector,priority,is_active
Test Pattern,https://example.com/jobs/*,.job-title,,5,true
"""
    
    try:
        # Test validate_memory_csv method directly
        print("Testing validate_memory_csv...")
        validation_result = await memory_service.validate_memory_csv(
            csv_content=csv_content,
            filename="test.csv",
            upload_id=str(uuid.uuid4()),
            user_id="test-user-123",  # Pass as string directly
            memory_type="website_patterns",
            file_size=1024,
            config=None
        )
        
        print(f"Validation result: {validation_result}")
        print("✅ validate_memory_csv completed successfully")
        
    except Exception as e:
        print(f"❌ Error in validate_memory_csv: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_memory_service_direct())