#!/usr/bin/env python3

import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

import requests
import json
from app.database.models import UserRole

def test_token_role():
    """Test the role value in JWT token"""
    try:
        # Login to get token
        login_url = "http://localhost:8000/api/v1/local-auth/login"
        login_data = {
            "email": "admin@remotehive.in",
            "password": "Ranjeet11$"
        }
        
        print("🔐 Testing admin login and token role...")
        response = requests.post(login_url, json=login_data)
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data["access_token"]
            user_info = token_data["user"]
            
            print(f"✅ Login successful!")
            print(f"   🔑 Token: {access_token[:50]}...")
            print(f"   👤 User role from response: {repr(user_info.get('role'))}")
            print(f"   👤 User role type: {type(user_info.get('role'))}")
            
            # Skip token decoding for now
            print(f"\n🔍 Token received, proceeding with API test...")
            
            # Test API call with token
            print(f"\n🌐 Testing analytics API call...")
            headers = {"Authorization": f"Bearer {access_token}"}
            analytics_url = "http://localhost:8000/api/v1/admin/analytics/platform"
            
            api_response = requests.get(analytics_url, headers=headers)
            print(f"   Status: {api_response.status_code}")
            if api_response.status_code != 200:
                print(f"   Error: {api_response.text}")
            else:
                print(f"   ✅ Success! Analytics data received.")
                
            # Test role comparison
            print(f"\n🔍 Role comparison tests:")
            role_from_response = user_info.get('role')
            print(f"   Role from response: {repr(role_from_response)}")
            print(f"   Role == 'admin': {role_from_response == 'admin'}")
            print(f"   Role == 'ADMIN': {role_from_response == 'ADMIN'}")
            print(f"   Role == UserRole.ADMIN: {role_from_response == UserRole.ADMIN}")
            print(f"   Role in ['SUPER_ADMIN', 'ADMIN']: {role_from_response in ['SUPER_ADMIN', 'ADMIN']}")
            print(f"   Role in ['super_admin', 'admin']: {role_from_response in ['super_admin', 'admin']}")
            
            if hasattr(role_from_response, 'value'):
                print(f"   Role.value: {repr(role_from_response.value)}")
                print(f"   Role.value in ['super_admin', 'admin']: {role_from_response.value in ['super_admin', 'admin']}")
                
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_token_role()