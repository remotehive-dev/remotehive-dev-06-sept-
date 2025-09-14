#!/usr/bin/env python3
import asyncio
import os
from app.database.mongodb_manager import MongoDBManager

async def test_connection():
    print("Testing MongoDB connection...")
    mgr = MongoDBManager()
    
    # Print environment variables
    print(f"MONGODB_URL: {os.getenv('MONGODB_URL', 'Not set')}")
    print(f"MONGODB_DATABASE_NAME: {os.getenv('MONGODB_DATABASE_NAME', 'Not set')}")
    
    try:
        result = await mgr.connect()
        print(f"Connection result: {result}")
        
        if result:
            test_result = await mgr.test_connection()
            print(f"Test result: {test_result}")
        
        await mgr.disconnect()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())