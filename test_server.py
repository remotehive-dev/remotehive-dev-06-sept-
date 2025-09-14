#!/usr/bin/env python3
"""
Simple test server to verify Atlas connection
"""

import asyncio
import os
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Test Server")

# Global variables
client = None
database = None

@app.on_event("startup")
async def startup_event():
    global client, database
    try:
        mongodb_url = os.getenv("MONGODB_URL")
        database_name = os.getenv("MONGODB_DATABASE_NAME", "remotehive_main")
        
        print(f"Connecting to: {mongodb_url[:50]}...")
        print(f"Database: {database_name}")
        
        client = AsyncIOMotorClient(mongodb_url, serverSelectionTimeoutMS=5000)
        database = client[database_name]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ MongoDB Atlas connection successful!")
        
        # List collections
        collections = await database.list_collection_names()
        print(f"📊 Found {len(collections)} collections: {collections}")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        raise

@app.get("/")
async def root():
    return {"message": "Test server running", "status": "ok"}

@app.get("/health")
async def health():
    try:
        # Test database connection
        await client.admin.command('ping')
        collections = await database.list_collection_names()
        
        return {
            "status": "healthy",
            "database": database.name,
            "collections_count": len(collections),
            "collections": collections
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.get("/users")
async def get_users():
    try:
        users_collection = database.users
        users = await users_collection.find().limit(5).to_list(length=5)
        
        # Convert ObjectId to string for JSON serialization
        for user in users:
            if '_id' in user:
                user['_id'] = str(user['_id'])
        
        return {
            "users_count": await users_collection.count_documents({}),
            "sample_users": users
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)