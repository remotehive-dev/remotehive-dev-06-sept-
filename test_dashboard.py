#!/usr/bin/env python3
"""
Simple test script to test dashboard endpoint without authentication
"""

import requests
import json

def test_dashboard_endpoint_no_auth():
    """Test the dashboard endpoint without authentication"""
    url = "http://localhost:8000/api/v1/autoscraper/dashboard"
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print(f"Testing URL: {url}")
        print("Testing without authentication token...")
        
        response = requests.get(url, headers=headers, timeout=10)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print("\n✅ Dashboard Response:")
                print(json.dumps(data, indent=2, default=str))
                return True
            except json.JSONDecodeError:
                print(f"\n⚠️  Response is not JSON: {response.text}")
                return False
        else:
            print(f"\n❌ Error Response ({response.status_code}): {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection error - is the autoscraper service running on port 8000?")
        return False
    except Exception as e:
        print(f"\n❌ Request error: {e}")
        return False

if __name__ == "__main__":
    print("Testing dashboard endpoint without authentication...")
    success = test_dashboard_endpoint_no_auth()
    
    if success:
        print("\n🎉 Dashboard endpoint test successful!")
    else:
        print("\n💥 Dashboard endpoint test failed!")