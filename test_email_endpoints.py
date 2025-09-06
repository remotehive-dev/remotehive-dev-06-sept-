#!/usr/bin/env python3
"""
Test script to verify email management endpoints are working correctly
"""

import requests
import json
from datetime import datetime

# Base URL for the API
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api/v1"

def test_endpoint(endpoint, method="GET", headers=None, data=None):
    """Test an API endpoint"""
    url = f"{BASE_URL}{API_PREFIX}{endpoint}"
    print(f"\n=== Testing {method} {url} ===")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}..." if len(response.text) > 500 else f"Response: {response.text}")
        
        return response.status_code, response.text
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return None, str(e)

def main():
    print("Testing Email Management API Endpoints")
    print("=" * 50)
    
    # Test endpoints that should exist
    endpoints_to_test = [
        "/admin/email/templates",
        "/admin/email/stats?days=30", 
        "/admin/email/logs",
        "/admin/email/smtp-settings"
    ]
    
    # Test without authentication first (should get 401/403)
    print("\n1. Testing endpoints without authentication (expecting 401/403):")
    for endpoint in endpoints_to_test:
        test_endpoint(endpoint)
    
    # Test with basic headers
    print("\n2. Testing endpoints with basic headers:")
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json"
    }
    
    for endpoint in endpoints_to_test:
        test_endpoint(endpoint, headers=headers)
    
    # Test the root API endpoint
    print("\n3. Testing root API endpoint:")
    test_endpoint("/")
    
    # Test docs endpoint
    print("\n4. Testing docs endpoint:")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"Docs endpoint status: {response.status_code}")
    except Exception as e:
        print(f"Docs endpoint error: {e}")
    
    print("\n=== Test Summary ===")
    print("If endpoints return 401/403, they exist but need authentication.")
    print("If endpoints return 404, they are not properly registered.")
    print("The correct URLs should be:")
    for endpoint in endpoints_to_test:
        print(f"  {BASE_URL}{API_PREFIX}{endpoint}")

if __name__ == "__main__":
    main()