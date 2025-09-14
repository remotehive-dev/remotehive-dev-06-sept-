#!/usr/bin/env python3
"""
Debug script to test MongoDB connection and identify the issue
"""

import os
import asyncio
from dotenv import load_dotenv
from app.database.mongodb_manager import MongoDBManager

async def debug_connection():
    # Load environment variables
    load_dotenv()
    
    # Print environment variables
    mongodb_url = os.getenv("MONGODB_URL")
    mongodb_db = os.getenv("MONGODB_DATABASE_NAME")
    
    print(f"Environment MONGODB_URL: {mongodb_url[:50]}...")
    print(f"Environment MONGODB_DATABASE_NAME: {mongodb_db}")
    
    # Test with fresh MongoDB manager
    manager = MongoDBManager()
    
    print("\nTesting connection with fresh manager...")
    success = await manager.connect()
    
    if success:
        print("✅ Connection successful!")
        test_result = await manager.test_connection()
        print(f"Connection test result: {test_result}")
        await manager.disconnect()
    else:
        print("❌ Connection failed!")
        print(f"Manager connection string: {manager.connection_string}")
        print(f"Manager database name: {manager.database_name}")

if __name__ == "__main__":
    asyncio.run(debug_connection())