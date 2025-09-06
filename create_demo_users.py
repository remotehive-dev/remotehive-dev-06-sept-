#!/usr/bin/env python3
"""
Script to create demo users for RemoteHive application.
This script creates the demo accounts shown on the login page.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.core.database import get_supabase_admin
from app.core.security import get_password_hash
from loguru import logger

async def create_demo_users():
    """Create demo users for testing purposes."""
    try:
        supabase = get_supabase_admin()
        
        # Demo users data
        demo_users = [
            {
                "email": "ranjeettiwari105@gmail.com",
                "password": "Ranjeet11$",
                "full_name": "Ranjeet Tiwari",
                "role": "job_seeker",
                "is_active": True,
                "is_verified": True
            },
            {
                "email": "ranjeettiwary589@gmail.com",
                "password": "Ranjeet11$",
                "full_name": "Ranjeet Tiwary",
                "role": "employer",
                "is_active": True,
                "is_verified": True
            }
        ]
        
        for user_data in demo_users:
            email = user_data["email"]
            
            # Check if user already exists
            existing_user = supabase.table("users").select("*").eq("email", email).execute()
            
            if existing_user.data:
                logger.info(f"Demo user {email} already exists, skipping...")
                continue
            
            try:
                # Create user in Supabase Auth
                auth_response = supabase.auth.admin.create_user({
                    "email": email,
                    "password": user_data["password"],
                    "email_confirm": True,  # Auto-confirm email for demo users
                    "user_metadata": {
                        "full_name": user_data["full_name"],
                        "role": user_data["role"]
                    }
                })
                
                if not auth_response.user:
                    logger.error(f"Failed to create auth user for {email}")
                    continue
                
                # Create user record in database
                user_record = {
                    "id": auth_response.user.id,
                    "email": email,
                    "hashed_password": get_password_hash(user_data["password"]),
                    "full_name": user_data["full_name"],
                    "role": user_data["role"],
                    "is_active": user_data["is_active"],
                    "is_verified": user_data["is_verified"]
                }
                
                db_result = supabase.table("users").insert(user_record).execute()
                
                if db_result.data:
                    logger.info(f"✅ Created demo user: {email}")
                    
                    # Create role-specific profiles
                    if user_data["role"] == "job_seeker":
                        await create_job_seeker_profile(supabase, auth_response.user.id)
                    elif user_data["role"] == "employer":
                        await create_employer_profile(supabase, auth_response.user.id)
                        
                else:
                    logger.error(f"Failed to create database record for {email}")
                    
            except Exception as e:
                logger.error(f"Error creating demo user {email}: {e}")
                continue
        
        logger.info("Demo user creation completed!")
        
    except Exception as e:
        logger.error(f"Error in create_demo_users: {e}")
        raise

async def create_job_seeker_profile(supabase, user_id: str):
    """Create a job seeker profile for demo user."""
    try:
        job_seeker_data = {
            "user_id": user_id,
            "current_title": "Software Developer",
            "experience_level": "mid",
            "years_of_experience": 3,
            "skills": ["Python", "JavaScript", "React", "Node.js", "SQL"],
            "preferred_job_types": ["full_time", "remote"],
            "preferred_locations": ["Remote", "New York", "San Francisco"],
            "remote_work_preference": True,
            "min_salary": 70000,
            "max_salary": 120000,
            "salary_currency": "USD",
            "is_actively_looking": True,
            "education_level": "Bachelor's",
            "field_of_study": "Computer Science"
        }
        
        result = supabase.table("job_seekers").insert(job_seeker_data).execute()
        
        if result.data:
            logger.info(f"✅ Created job seeker profile for user {user_id}")
        else:
            logger.warning(f"Failed to create job seeker profile for user {user_id}")
            
    except Exception as e:
        logger.error(f"Error creating job seeker profile: {e}")

async def create_employer_profile(supabase, user_id: str):
    """Create an employer profile for demo user."""
    try:
        employer_data = {
            "user_id": user_id,
            "company_name": "Demo Tech Company",
            "company_description": "A leading technology company focused on innovation and remote work.",
            "company_website": "https://demo-tech.com",
            "company_size": "medium",
            "industry": "technology",
            "company_email": "hr@demo-tech.com",
            "city": "San Francisco",
            "state": "CA",
            "country": "United States"
        }
        
        result = supabase.table("employers").insert(employer_data).execute()
        
        if result.data:
            logger.info(f"✅ Created employer profile for user {user_id}")
        else:
            logger.warning(f"Failed to create employer profile for user {user_id}")
            
    except Exception as e:
        logger.error(f"Error creating employer profile: {e}")

if __name__ == "__main__":
    logger.info("Starting demo user creation...")
    asyncio.run(create_demo_users())
    logger.info("Demo user creation script completed.")