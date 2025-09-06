#!/usr/bin/env python3
"""
Check existing users and create the correct admin user
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.database.mongodb_models import User, UserRole
from passlib.context import CryptContext
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def check_and_create_admin():
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
        
        # Check all existing users
        print("\n📋 Existing users in database:")
        users = await User.find_all().to_list()
        for user in users:
            print(f"  - Email: {user.email}, Role: {user.role}, Active: {user.is_active}")
        
        # Check if the required admin user exists
        required_email = "admin@remotehive.in"
        existing_admin = await User.find_one({"email": required_email})
        
        if existing_admin:
            print(f"\n✅ Admin user with email {required_email} already exists")
            # Verify password
            test_password = "Ranjeet11$"
            if pwd_context.verify(test_password, existing_admin.password_hash):
                print("✅ Password verification successful")
            else:
                print("❌ Password verification failed - updating password")
                existing_admin.password_hash = pwd_context.hash(test_password)
                await existing_admin.save()
                print("✅ Password updated successfully")
        else:
            print(f"\n⚠️  Admin user with email {required_email} does not exist. Creating...")
            
            # Create new admin user with correct email
            admin_password = "Ranjeet11$"
            hashed_password = pwd_context.hash(admin_password)
            
            admin_user = User(
                email=required_email,
                first_name="Admin",
                last_name="User",
                password_hash=hashed_password,
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True
            )
            
            # Save to database
            await admin_user.insert()
            print(f"✅ Admin user created successfully!")
            print(f"📧 Email: {required_email}")
            print(f"🔑 Password: {admin_password}")
            print(f"👤 Role: {UserRole.SUPER_ADMIN}")
        
        # Final verification
        print("\n🔍 Final verification:")
        final_admin = await User.find_one({"email": required_email})
        if final_admin:
            print(f"✅ Admin user exists: {final_admin.email}")
            print(f"✅ Role: {final_admin.role}")
            print(f"✅ Active: {final_admin.is_active}")
            print(f"✅ Verified: {final_admin.is_verified}")
            
            # Test password
            if pwd_context.verify("Ranjeet11$", final_admin.password_hash):
                print("✅ Password hash verification successful")
            else:
                print("❌ Password hash verification failed")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Close connection
        client.close()
        print("\n🔌 Database connection closed")

if __name__ == "__main__":
    asyncio.run(check_and_create_admin())