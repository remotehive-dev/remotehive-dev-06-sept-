#!/usr/bin/env python3
"""
Script to fix MongoDB index conflicts for email field
"""

import os
import sys
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# Load environment variables
load_dotenv()

async def fix_email_indexes():
    """Fix MongoDB email index conflicts"""
    
    # Get MongoDB connection
    mongodb_url = os.getenv('MONGODB_URL')
    database_name = os.getenv('MONGODB_DATABASE_NAME', 'remotehive_main')
    
    if not mongodb_url:
        print("❌ MONGODB_URL not found in environment variables")
        return False
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(mongodb_url)
        db = client[database_name]
        print(f"🔗 Connected to database: {database_name}")
        
        print("🔍 Checking current indexes on users collection...")
        
        # Get users collection
        users_collection = db.users
        
        # List current indexes
        indexes = await users_collection.list_indexes().to_list(length=None)
        print("Current indexes:")
        for idx in indexes:
            print(f"  - {idx['name']}: {idx.get('key', {})}")
        
        # Check if there's a conflicting email index
        email_indexes = [idx for idx in indexes if 'email' in str(idx.get('key', {}))]
        
        if len(email_indexes) > 1:
            print("\n⚠️  Found multiple email indexes, fixing...")
            
            # Drop all email indexes except _id_
            for idx in email_indexes:
                if idx['name'] != '_id_' and not idx.get('unique', False):
                    print(f"🗑️  Dropping non-unique index: {idx['name']}")
                    await users_collection.drop_index(idx['name'])
        elif len(email_indexes) == 1 and not email_indexes[0].get('unique', False):
            print("\n⚠️  Found non-unique email index, dropping...")
            await users_collection.drop_index(email_indexes[0]['name'])
        
        # Create the correct unique email index
        print("\n✅ Creating unique email index...")
        try:
            await users_collection.create_index(
                "email", 
                unique=True, 
                name="email_unique_idx",
                background=True
            )
            print("✅ Successfully created unique email index")
        except Exception as e:
            if "duplicate key" in str(e).lower():
                print("⚠️  Duplicate email values found. Checking for duplicates...")
                
                # Find duplicate emails
                pipeline = [
                    {"$group": {"_id": "$email", "count": {"$sum": 1}, "docs": {"$push": "$_id"}}},
                    {"$match": {"count": {"$gt": 1}}}
                ]
                
                duplicates = await users_collection.aggregate(pipeline).to_list(length=None)
                
                if duplicates:
                    print(f"Found {len(duplicates)} duplicate email(s):")
                    for dup in duplicates:
                        print(f"  - Email: {dup['_id']}, Count: {dup['count']}")
                        # Keep the first document, remove others
                        docs_to_remove = dup['docs'][1:]  # Keep first, remove rest
                        for doc_id in docs_to_remove:
                            await users_collection.delete_one({"_id": doc_id})
                            print(f"    Removed duplicate document: {doc_id}")
                    
                    # Try creating index again
                    await users_collection.create_index(
                        "email", 
                        unique=True, 
                        name="email_unique_idx",
                        background=True
                    )
                    print("✅ Successfully created unique email index after removing duplicates")
                else:
                    print("❌ Index creation failed but no duplicates found")
                    raise e
            else:
                raise e
        
        # Verify final indexes
        print("\n🔍 Final index verification:")
        final_indexes = await users_collection.list_indexes().to_list(length=None)
        for idx in final_indexes:
            print(f"  - {idx['name']}: {idx.get('key', {})} (unique: {idx.get('unique', False)})")
        
        client.close()
        print("\n✅ MongoDB email index fix completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error fixing MongoDB indexes: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(fix_email_indexes())
    sys.exit(0 if success else 1)