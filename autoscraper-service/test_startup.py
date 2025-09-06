#!/usr/bin/env python3
"""
Test script to verify autoscraper service startup and basic functionality.
"""

import sys
import os
import asyncio
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

try:
    from config.settings import AutoscraperSettings
    from models.models import JobBoard, ScheduleConfig, ScrapeJob
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
    print("✅ All imports successful")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

def test_settings():
    """Test settings configuration."""
    try:
        settings = AutoscraperSettings()
        print(f"✅ Settings loaded successfully")
        print(f"   - Service: {settings.SERVICE_NAME}")
        print(f"   - Environment: {settings.ENVIRONMENT}")
        print(f"   - Database URL: {settings.DATABASE_URL[:50]}...")
        return settings
    except Exception as e:
        print(f"❌ Settings error: {e}")
        return None

def test_database_connection(settings):
    """Test database connection."""
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            
            # Test if tables exist
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'autoscraper_%'"
            ))
            tables = [row[0] for row in result]
            print(f"✅ Found {len(tables)} autoscraper tables: {', '.join(tables)}")
            
        return True
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

def test_models():
    """Test model creation and basic operations."""
    try:
        settings = AutoscraperSettings()
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(bind=engine)
        
        with SessionLocal() as session:
            # Test creating a job board
            from models.models import JobBoardType
            job_board = JobBoard(
                name="Test Board",
                type=JobBoardType.HTML,
                base_url="https://test.example.com",
                is_active=True
            )
            session.add(job_board)
            session.commit()
            
            # Test querying
            boards = session.query(JobBoard).all()
            print(f"✅ Model operations successful - found {len(boards)} job boards")
            
            # Clean up
            session.delete(job_board)
            session.commit()
            
        return True
    except Exception as e:
        print(f"❌ Model operations error: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 Starting autoscraper service tests...\n")
    
    # Test 1: Settings
    settings = test_settings()
    if not settings:
        return False
    
    print()
    
    # Test 2: Database connection
    if not test_database_connection(settings):
        return False
    
    print()
    
    # Test 3: Model operations
    if not test_models():
        return False
    
    print()
    print("🎉 All tests passed! Autoscraper service is ready.")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)