#!/usr/bin/env python3
"""
Create Admin User for MongoDB
This script properly initializes MongoDB and creates the admin user
"""

import asyncio
import os
from datetime import datetime
from passlib.context import CryptContext
from app.database.mongodb_manager import MongoDBManager
from app.database.mongodb_models import User, UserRole

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user():
    """
    Create the main admin user in MongoDB
    """
    try:
        # Initialize MongoDB connection
        mongodb_manager = MongoDBManager()
        
        # Connect to MongoDB
        print("🔄 Connecting to MongoDB...")
        success = await mongodb_manager.connect()
        
        if not success:
            print("❌ Failed to connect to MongoDB")
            return False
            
        print("✅ Connected to MongoDB successfully")
        
        # Check if admin user already exists
        existing_admin = await User.find_one(User.email == "admin@remotehive.in")
        
        if existing_admin:
            print(f"✅ Admin user already exists: {existing_admin.email}")
            print(f"   Role: {existing_admin.role}")
            print(f"   Active: {existing_admin.is_active}")
            print(f"   Created: {existing_admin.created_at}")
            return True
            
        # Create admin user
        print("🔄 Creating admin user...")
        
        # Hash the password
        password_hash = pwd_context.hash("Ranjeet11$")
        
        # Create admin user document
        admin_user = User(
            email="admin@remotehive.in",
            password_hash=password_hash,
            first_name="Admin",
            last_name="User",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Save to database
        await admin_user.insert()
        
        print("✅ Admin user created successfully!")
        print(f"   Email: {admin_user.email}")
        print(f"   Role: {admin_user.role}")
        print(f"   ID: {admin_user.id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Close connection
        if 'mongodb_manager' in locals():
            await mongodb_manager.disconnect()
            print("🔄 MongoDB connection closed")

async def verify_admin_login():
    """
    Verify that the admin user can be found and password verified
    """
    try:
        # Initialize MongoDB connection
        mongodb_manager = MongoDBManager()
        
        # Connect to MongoDB
        print("\n🔄 Verifying admin login...")
        success = await mongodb_manager.connect()
        
        if not success:
            print("❌ Failed to connect to MongoDB for verification")
            return False
            
        # Find admin user
        admin_user = await User.find_one(User.email == "admin@remotehive.in")
        
        if not admin_user:
            print("❌ Admin user not found")
            return False
            
        # Verify password
        password_valid = pwd_context.verify("Ranjeet11$", admin_user.password_hash)
        
        print(f"✅ Admin user found: {admin_user.email}")
        print(f"   Role: {admin_user.role}")
        print(f"   Active: {admin_user.is_active}")
        print(f"   Password valid: {password_valid}")
        
        return password_valid
        
    except Exception as e:
        print(f"❌ Error verifying admin login: {e}")
        return False
    finally:
        # Close connection
        if 'mongodb_manager' in locals():
            await mongodb_manager.disconnect()

if __name__ == "__main__":
    print("🚀 Starting MongoDB Admin User Creation...")
    
    # Run the admin creation
    success = asyncio.run(create_admin_user())
    
    if success:
        # Verify the login
        verification_success = asyncio.run(verify_admin_login())
        
        if verification_success:
            print("\n🎉 Admin user setup completed successfully!")
            print("\n📋 Admin Credentials:")
            print("   Email: admin@remotehive.in")
            print("   Password: Ranjeet11$")
            print("   Role: Super Admin")
        else:
            print("\n❌ Admin user created but verification failed")
    else:
        print("\n❌ Failed to create admin user")
