#!/usr/bin/env python3
"""
MongoDB Atlas Connection Test Script
Tests the connection to MongoDB Atlas and verifies basic operations
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from app.database.mongodb_manager import MongoDBManager
from app.core.config import settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_mongodb_atlas_connection():
    """
    Test MongoDB Atlas connection and basic operations
    """
    logger.info("Starting MongoDB Atlas connection test...")
    
    # Initialize MongoDB manager
    mongodb_manager = MongoDBManager()
    
    try:
        # Test connection
        logger.info(f"Connecting to MongoDB Atlas...")
        logger.info(f"Connection string: {settings.MONGODB_URL[:50]}...")
        logger.info(f"Database name: {settings.MONGODB_DATABASE_NAME}")
        
        success = await mongodb_manager.connect(
            connection_string=settings.MONGODB_URL,
            database_name=settings.MONGODB_DATABASE_NAME
        )
        
        if not success:
            logger.error("Failed to connect to MongoDB Atlas")
            return False
        
        logger.info("✅ Successfully connected to MongoDB Atlas!")
        
        # Test connection details
        connection_info = await mongodb_manager.test_connection()
        
        if connection_info.get("connected"):
            logger.info("✅ Connection test passed!")
            logger.info(f"Database: {connection_info.get('database_name')}")
            logger.info(f"Server version: {connection_info.get('server_version')}")
            logger.info(f"Collections count: {connection_info.get('collections_count')}")
            logger.info(f"Collections: {connection_info.get('collections', [])}")
            logger.info(f"Database size: {connection_info.get('database_size_mb')} MB")
            logger.info(f"Storage size: {connection_info.get('storage_size_mb')} MB")
            logger.info(f"Objects count: {connection_info.get('objects_count')}")
            logger.info(f"Indexes count: {connection_info.get('indexes_count')}")
        else:
            logger.error(f"❌ Connection test failed: {connection_info.get('error')}")
            return False
        
        # Test basic database operations
        logger.info("Testing basic database operations...")
        
        # Test ping
        ping_result = await mongodb_manager.client.admin.command('ping')
        if ping_result.get('ok') == 1:
            logger.info("✅ Database ping successful")
        else:
            logger.error("❌ Database ping failed")
            return False
        
        # Test collection creation (if needed)
        test_collection = mongodb_manager.database.test_collection
        
        # Insert a test document
        test_doc = {"test": "connection_test", "timestamp": "2024-01-01"}
        result = await test_collection.insert_one(test_doc)
        logger.info(f"✅ Test document inserted with ID: {result.inserted_id}")
        
        # Find the test document
        found_doc = await test_collection.find_one({"_id": result.inserted_id})
        if found_doc:
            logger.info("✅ Test document retrieved successfully")
        else:
            logger.error("❌ Failed to retrieve test document")
            return False
        
        # Delete the test document
        delete_result = await test_collection.delete_one({"_id": result.inserted_id})
        if delete_result.deleted_count == 1:
            logger.info("✅ Test document deleted successfully")
        else:
            logger.error("❌ Failed to delete test document")
            return False
        
        logger.info("✅ All MongoDB Atlas tests passed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ MongoDB Atlas connection test failed: {e}")
        return False
    
    finally:
        # Clean up connection
        if mongodb_manager:
            await mongodb_manager.disconnect()
            logger.info("Disconnected from MongoDB Atlas")

async def main():
    """
    Main test function
    """
    logger.info("=" * 60)
    logger.info("MongoDB Atlas Connection Test")
    logger.info("=" * 60)
    
    # Check environment variables
    if not settings.MONGODB_URL:
        logger.error("❌ MONGODB_URL environment variable is not set")
        return False
    
    if not settings.MONGODB_DATABASE_NAME:
        logger.error("❌ MONGODB_DATABASE_NAME environment variable is not set")
        return False
    
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    
    # Run the test
    success = await test_mongodb_atlas_connection()
    
    if success:
        logger.info("=" * 60)
        logger.info("✅ MongoDB Atlas connection test PASSED")
        logger.info("=" * 60)
        return True
    else:
        logger.error("=" * 60)
        logger.error("❌ MongoDB Atlas connection test FAILED")
        logger.error("=" * 60)
        return False

if __name__ == "__main__":
    # Run the test
    result = asyncio.run(main())
    sys.exit(0 if result else 1)