#!/usr/bin/env python3
"""
Test script to check admin user login credentials
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from passlib.context import CryptContext

# Import models
from app.database.mongodb_models import User, UserRole

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def test_admin_login():
    # MongoDB connection
    connection_string = os.getenv(
        "MONGODB_URL", 
        "mongodb+srv://remotehiveofficial_db_user:b9z6QbkaiR3qc2KZ@remotehive.l5zq7k0.mongodb.net/remotehive?retryWrites=true&w=majority&appName=Remotehive"
    )
    database_name = os.getenv("MONGODB_DATABASE_NAME", "remotehive_main")
    
    client = AsyncIOMotorClient(connection_string)
    database = client[database_name]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB")
        
        # Initialize Beanie with User model
        await init_beanie(database=database, document_models=[User])
        print("✅ Beanie initialized")
        
        # Check for admin@remotehive.in user
        admin_email = "admin@remotehive.in"
        admin_user = await User.find_one({"email": admin_email})
        
        if admin_user:
            print(f"✅ Found user: {admin_user.email}")
            print(f"   Role: {admin_user.role}")
            print(f"   Active: {admin_user.is_active}")
            print(f"   Verified: {admin_user.is_verified}")
            print(f"   Has password_hash: {bool(admin_user.password_hash)}")
            
            # Test password
            test_password = "Ranjeet11$"
            if admin_user.password_hash:
                password_valid = pwd_context.verify(test_password, admin_user.password_hash)
                print(f"   Password '{test_password}' valid: {password_valid}")
            else:
                print("   ❌ No password hash found!")
        else:
            print(f"❌ User {admin_email} not found")
            
            # List all users
            print("\n📋 All users in database:")
            all_users = await User.find_all().to_list()
            for user in all_users:
                print(f"  - {user.email} (Role: {user.role}, Active: {user.is_active})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_admin_login())