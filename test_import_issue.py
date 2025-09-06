#!/usr/bin/env python3
"""
Test script to identify import issues with the main app.
"""

import sys
import traceback
from pathlib import Path

def test_imports():
    """Test importing various components step by step"""
    print("Testing imports step by step...")
    
    try:
        print("1. Testing basic imports...")
        import os
        print(f"   Current directory: {os.getcwd()}")
        print(f"   Python path: {sys.path[:3]}...")  # Show first 3 entries
        
        print("2. Testing app.database imports...")
        from app.database.database import get_db_session, init_database
        print("   [OK] app.database.database imports OK")
        
        print("3. Testing app.core.database imports...")
        from app.core.database import get_db
        print("   [OK] app.core.database imports OK")
        
        print("4. Testing scraper services...")
        from app.database.scraper_services import ScraperMemoryService
        print("   [OK] ScraperMemoryService imports OK")
        
        print("5. Testing main app import...")
        from app.main import app
        print("   [OK] app.main imports OK")
        
        print("6. Testing FastAPI creation...")
        print(f"   App type: {type(app)}")
        print(f"   App title: {getattr(app, 'title', 'Unknown')}")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Import failed at step: {e}")
        traceback.print_exc()
        return False

def test_database_connection():
    """Test database connection"""
    try:
        print("\n7. Testing database connection...")
        from app.database.database import get_db_session
        
        session = next(get_db_session())
        print("   [OK] Database session created")
        
        # Test a simple query
        from app.database.models import ScraperMemory
        count = session.query(ScraperMemory).count()
        print(f"   [OK] ScraperMemory count: {count}")
        
        session.close()
        return True
        
    except Exception as e:
        print(f"[ERROR] Database test failed: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Import and Database Test ===")
    
    imports_ok = test_imports()
    if imports_ok:
        db_ok = test_database_connection()
        if db_ok:
            print("\n[SUCCESS] All tests passed - imports and database are working")
        else:
            print("\n[ERROR] Database connection failed")
    else:
        print("\n[ERROR] Import test failed")