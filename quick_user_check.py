#!/usr/bin/env python3

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def main():
    try:
        # Get Supabase client
        url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        supabase = create_client(url, service_role_key)
        
        print("🔍 Checking users system...")
        
        # Check users table
        try:
            users = supabase.table('users').select('*').execute()
            print(f"\n📊 Database Users ({len(users.data)}):")
            for user in users.data:
                print(f"  - {user['email']} ({user['role']}) - Active: {user['is_active']}")
        except Exception as e:
            if "does not exist" in str(e):
                print("❌ Users table does not exist")
            else:
                print(f"❌ Error checking users table: {e}")
        
        # Check auth users
        try:
            auth_response = supabase.auth.admin.list_users()
            auth_users = auth_response if isinstance(auth_response, list) else getattr(auth_response, 'users', auth_response)
            print(f"\n🔐 Auth Users ({len(auth_users)}):")
            for auth_user in auth_users:
                print(f"  - {auth_user.email} (ID: {auth_user.id})")
        except Exception as e:
            print(f"❌ Error checking auth users: {e}")
        
        # Test admin login
        try:
            print("\n🧪 Testing admin login...")
            auth_response = supabase.auth.sign_in_with_password({
                "email": "admin@remotehive.in",
                "password": "Ranjeet11$"
            })
            
            if auth_response.user and auth_response.session:
                print("✅ Admin login successful")
                print(f"User ID: {auth_response.user.id}")
            else:
                print("❌ Admin login failed")
        except Exception as e:
            print(f"❌ Error testing admin login: {e}")
        
        print("\n✅ Quick check completed")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    main()