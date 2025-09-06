#!/usr/bin/env python3
"""
Simple Admin User Creation Script
This script creates the admin user with the provided credentials.
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

async def create_admin_user():
    # MongoDB connection
    # MongoDB Atlas connection string with database user credentials
    # Testing with IP whitelist update
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
        
        # Check if admin user already exists
        admin_email = "admin@remotehive.in"
        existing_admin = await User.find_one({"email": admin_email})
        
        if existing_admin:
            print(f"⚠️  Admin user with email {admin_email} already exists")
            return
        
        # Create new admin user
        admin_password = "Ranjeet11$"
        hashed_password = pwd_context.hash(admin_password)
        
        admin_user = User(
            email=admin_email,
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
        print(f"📧 Email: {admin_email}")
        print(f"🔑 Password: {admin_password}")
        print(f"👤 Role: {UserRole.SUPER_ADMIN}")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Close connection
        client.close()
        print("🔌 Database connection closed")

if __name__ == "__main__":
    asyncio.run(create_admin_user())