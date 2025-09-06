#!/usr/bin/env python3
"""
Final test of admin login functionality
"""

import requests
import json

def test_admin_login():
    """Test admin login with the correct credentials"""
    
    url = "http://localhost:8000/api/v1/auth/admin/login"
    credentials = {
        "email": "admin@remotehive.in",
        "password": "Ranjeet11$"
    }
    
    print("🔐 Testing admin login...")
    print(f"URL: {url}")
    print(f"Credentials: {credentials['email']} / {credentials['password']}")
    
    try:
        response = requests.post(url, json=credentials, timeout=10)
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Login successful!")
            print(f"📋 Response data:")
            print(json.dumps(data, indent=2))
            
            # Extract token for further testing
            if 'access_token' in data:
                token = data['access_token']
                print(f"\n🔑 Access Token: {token[:50]}...")
                return token
            else:
                print("⚠️ No access_token in response")
                
        else:
            print(f"\n❌ Login failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Request failed: {e}")
        
    return None

def test_autoscraper_access(token):
    """Test access to autoscraper endpoint with admin token"""
    if not token:
        print("\n⚠️ No token available for autoscraper test")
        return
        
    url = "http://localhost:8001/api/v1/autoscraper/job-boards/upload-csv"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"\n🔧 Testing autoscraper access...")
    print(f"URL: {url}")
    
    try:
        # Just test the endpoint without actual file upload
        response = requests.post(url, headers=headers, json={}, timeout=10)
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 401:
            print("❌ Still getting 401 Unauthorized - auth issue persists")
        elif response.status_code == 422:
            print("✅ Got 422 Unprocessable Entity - auth works, just missing required data")
        elif response.status_code == 200:
            print("✅ Request successful!")
        else:
            print(f"📊 Got status {response.status_code}: {response.text[:200]}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    print("🚀 Starting admin authentication test...\n")
    
    # Test admin login
    token = test_admin_login()
    
    # Test autoscraper access if login successful
    test_autoscraper_access(token)
    
    print("\n🏁 Test completed!")