#!/usr/bin/env python3

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def create_user(supabase, email, password, role):
    """Create a user in both Auth and database"""
    try:
        # Create in Auth
        auth_response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })
        
        user_id = auth_response.user.id
        print(f"✅ Created auth user: {email} (ID: {user_id})")
        
        # Create in database
        db_response = supabase.table('users').insert({
            "id": user_id,
            "email": email,
            "role": role,
            "is_active": True
        }).execute()
        
        print(f"✅ Created database user: {email} ({role})")
        return True
        
    except Exception as e:
        if "already exists" in str(e).lower():
            print(f"⚠️ User {email} already exists")
        else:
            print(f"❌ Error creating {email}: {e}")
        return False

def main():
    try:
        # Get Supabase client
        url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        supabase = create_client(url, service_role_key)
        
        print("🚀 Creating essential users...")
        
        # Create users
        users_to_create = [
            ("admin@remotehive.in", "Ranjeet11$", "admin"),
            ("employer@remotehive.in", "Employer123!", "employer"),
            ("jobseeker@remotehive.in", "Jobseeker123!", "jobseeker")
        ]
        
        for email, password, role in users_to_create:
            print(f"\n📝 Creating {role}: {email}")
            create_user(supabase, email, password, role)
        
        print("\n✅ User creation process completed")
        print("\n📋 Available credentials:")
        print("Admin: admin@remotehive.in / Ranjeet11$")
        print("Employer: employer@remotehive.in / Employer123!")
        print("Jobseeker: jobseeker@remotehive.in / Jobseeker123!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    main()