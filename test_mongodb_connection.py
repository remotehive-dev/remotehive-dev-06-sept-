#!/usr/bin/env python3
"""
Test MongoDB Atlas connection
"""

import asyncio
import os
from app.database.database import DatabaseManager
from app.core.config import get_settings

async def test_mongodb_connection():
    """Test MongoDB Atlas connection and basic operations."""
    
    try:
        # Initialize database manager
        db_manager = DatabaseManager()
        
        # Get settings
        settings = get_settings()
        
        print("Testing MongoDB Atlas connection...")
        print(f"MongoDB URL configured: {settings.MONGODB_URL[:50]}...")
        
        # Connect to MongoDB Atlas
        await db_manager.initialize()
        print("✅ MongoDB Atlas connection successful!")
        
        # Test health check
        health = await db_manager.health_check()
        print(f"Health check status: {health.get('status', 'unknown')}")
        
        # Test basic operations
        db_session = db_manager.get_session()
        print(f"Database name: {db_session.name}")
        
        print("✅ All MongoDB Atlas tests passed!")
        
        # Close connection
        print("Connection test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB Atlas connection failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_mongodb_connection())
    exit(0 if success else 1)