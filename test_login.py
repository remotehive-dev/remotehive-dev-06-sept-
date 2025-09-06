#!/usr/bin/env python3
"""
Test login API endpoint
"""

import requests
import json

def test_admin_login():
    url = "http://localhost:8000/api/v1/auth/admin/login"
    
    login_data = {
        "email": "admin@remotehive.in",
        "password": "Ranjeet11$"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print(f"🔄 Testing login at: {url}")
        print(f"📧 Email: {login_data['email']}")
        print(f"🔑 Password: {login_data['password']}")
        
        response = requests.post(url, json=login_data, headers=headers, timeout=10)
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        
        try:
            response_json = response.json()
            print(f"📄 Response Body: {json.dumps(response_json, indent=2)}")
        except:
            print(f"📄 Response Text: {response.text}")
        
        if response.status_code == 200:
            print("\n✅ Login successful!")
        else:
            print(f"\n❌ Login failed with status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - is the server running?")
    except requests.exceptions.Timeout:
        print("❌ Request timeout")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_admin_login()