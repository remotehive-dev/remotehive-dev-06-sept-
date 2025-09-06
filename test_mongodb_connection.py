#!/usr/bin/env python3
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_mongodb_connection():
    """Test MongoDB connection directly"""
    try:
        # Get connection string from environment
        connection_string = os.getenv("MONGODB_URL")
        database_name = os.getenv("MONGODB_DATABASE_NAME", "remotehive_main")
        
        print(f"Testing MongoDB connection...")
        print(f"Database: {database_name}")
        print(f"Connection string: {connection_string[:50]}...")
        
        # Create client
        client = AsyncIOMotorClient(
            connection_string,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=15000,
            socketTimeoutMS=30000
        )
        
        # Test connection with ping
        print("Attempting to ping MongoDB...")
        result = await client.admin.command('ping')
        print(f"Ping result: {result}")
        
        # Get database
        db = client[database_name]
        
        # List collections
        collections = await db.list_collection_names()
        print(f"Collections in database: {collections}")
        
        # Test a simple operation
        test_collection = db.test_connection
        await test_collection.insert_one({"test": "connection", "timestamp": "2025-09-02"})
        doc = await test_collection.find_one({"test": "connection"})
        print(f"Test document: {doc}")
        
        # Clean up test document
        await test_collection.delete_one({"test": "connection"})
        
        print("✅ MongoDB connection successful!")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mongodb_connection())