#!/usr/bin/env python3
"""
Test script to verify DatabaseManager connection string
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.database.database import get_database_manager

async def test_database_manager():
    """Test the DatabaseManager connection string"""
    print("Testing DatabaseManager connection...")
    
    # Get the global database manager
    db_manager = get_database_manager()
    
    print(f"DatabaseManager initialized: {db_manager._initialized}")
    print(f"MongoDB manager exists: {db_manager.mongodb_manager is not None}")
    
    if db_manager.mongodb_manager:
        print(f"Connection string: {db_manager.mongodb_manager.connection_string[:50] if db_manager.mongodb_manager.connection_string else 'None'}...")
        print(f"Database name: {db_manager.mongodb_manager.database_name}")
        print(f"Is connected: {db_manager.mongodb_manager.is_connected}")
    
    # Try to initialize if not already done
    if not db_manager._initialized:
        print("\nInitializing DatabaseManager...")
        await db_manager.initialize()
        print(f"After initialization - MongoDB manager exists: {db_manager.mongodb_manager is not None}")
        if db_manager.mongodb_manager:
            print(f"Connection string: {db_manager.mongodb_manager.connection_string[:50]}...")
            print(f"Database name: {db_manager.mongodb_manager.database_name}")
            print(f"Is connected: {db_manager.mongodb_manager.is_connected}")
    
    # Test health check
    print("\nTesting health check...")
    health_result = await db_manager.health_check()
    print(f"Health check result: {health_result}")

if __name__ == "__main__":
    asyncio.run(test_database_manager())