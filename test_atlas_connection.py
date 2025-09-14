#!/usr/bin/env python3
"""
Test Atlas connection directly
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def test_connection():
    try:
        # Load environment variables
        load_dotenv()
        
        mongodb_url = os.getenv("MONGODB_URL")
        database_name = os.getenv("MONGODB_DATABASE_NAME", "remotehive_main")
        
        print(f"Testing connection to: {mongodb_url[:50]}...")
        print(f"Database: {database_name}")
        
        # Create client with timeout
        client = AsyncIOMotorClient(mongodb_url, serverSelectionTimeoutMS=10000)
        
        # Test connection
        print("Testing ping...")
        await client.admin.command('ping')
        print("✅ Atlas connection successful!")
        
        # Get database
        database = client[database_name]
        
        # List collections
        collections = await database.list_collection_names()
        print(f"📊 Found {len(collections)} collections: {collections}")
        
        # Check users collection
        if 'users' in collections:
            users_count = await database.users.count_documents({})
            print(f"👥 Users collection has {users_count} documents")
            
            # Get sample user
            sample_user = await database.users.find_one()
            if sample_user:
                print(f"📄 Sample user: {sample_user.get('email', 'No email')}")
        
        # Check jobs collection
        if 'jobs' in collections:
            jobs_count = await database.jobs.count_documents({})
            print(f"💼 Jobs collection has {jobs_count} documents")
            
            # Get sample job
            sample_job = await database.jobs.find_one()
            if sample_job:
                print(f"📄 Sample job: {sample_job.get('title', 'No title')}")
        
        # Close connection
        client.close()
        print("✅ Connection test completed successfully!")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())