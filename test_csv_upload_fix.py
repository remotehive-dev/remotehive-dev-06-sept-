#!/usr/bin/env python3
"""
Test script to verify CSV upload authentication fix
Tests the corrected port configuration for autoscraper service
"""

import requests
import json
from pathlib import Path

# Configuration
MAIN_SERVICE_URL = "http://localhost:8000"
AUTOSCRAPER_SERVICE_URL = "http://localhost:8001"  # Corrected port
ADMIN_EMAIL = "admin@remotehive.com"
ADMIN_PASSWORD = "admin123"

def test_service_health():
    """Test if both services are running"""
    print("=== Testing Service Health ===")
    
    # Test main service
    try:
        response = requests.get(f"{MAIN_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Main service is running")
        else:
            print(f"❌ Main service returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Main service is not accessible: {e}")
        return False
    
    # Test autoscraper service
    try:
        response = requests.get(f"{AUTOSCRAPER_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Autoscraper service is running")
        else:
            print(f"❌ Autoscraper service returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Autoscraper service is not accessible: {e}")
        return False
    
    return True

def get_admin_token():
    """Get admin authentication token"""
    print("\n=== Getting Admin Token ===")
    
    login_data = {
        "email": "admin@remotehive.in",
        "password": "Ranjeet11$"
    }
    
    try:
        response = requests.post(
            f"{MAIN_SERVICE_URL}/api/v1/auth/admin/login",
            json=login_data,
            timeout=10
        )
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get("access_token")
            if token:
                print("✅ Admin token obtained successfully")
                return token
            else:
                print("❌ No access token in response")
                return None
        else:
            print(f"❌ Login failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Login request failed: {e}")
        return None

def test_csv_upload(token):
    """Test CSV upload with authentication"""
    print("\n=== Testing CSV Upload ===")
    
    # Create a test CSV file
    csv_content = """name,base_url,region,description
Test Job Board,https://example.com/jobs,US,Test job board for authentication
Another Test Board,https://test.org/careers,EU,Another test job board
"""
    
    csv_file_path = Path("test_upload_auth.csv")
    with open(csv_file_path, 'w') as f:
        f.write(csv_content)
    
    print(f"Created test CSV file: {csv_file_path}")
    
    # Prepare headers with authentication
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Prepare file upload
    try:
        with open(csv_file_path, 'rb') as f:
            files = {'file': ('test_upload_auth.csv', f, 'text/csv')}
            data = {'test_accessibility': 'false'}
            
            print(f"Uploading to: {AUTOSCRAPER_SERVICE_URL}/api/v1/autoscraper/job-boards/upload-csv")
            response = requests.post(
                f"{AUTOSCRAPER_SERVICE_URL}/api/v1/autoscraper/job-boards/upload-csv",
                files=files,
                data=data,
                headers=headers,
                timeout=30
            )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ CSV upload successful!")
            print(f"Upload ID: {result.get('upload_id')}")
            print(f"Total rows: {result.get('total_rows')}")
            return True
        elif response.status_code == 401:
            print("❌ 401 Unauthorized - Authentication failed")
            print(f"Response: {response.text}")
            return False
        elif response.status_code == 403:
            print("❌ 403 Forbidden - Insufficient permissions")
            print(f"Response: {response.text}")
            return False
        else:
            print(f"❌ Upload failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Upload request failed: {e}")
        return False
    finally:
        # Clean up test file
        if csv_file_path.exists():
            csv_file_path.unlink()
            print(f"Cleaned up test file: {csv_file_path}")

def main():
    """Main test function"""
    print("CSV Upload Authentication Fix Test")
    print("=" * 50)
    
    # Test service health
    if not test_service_health():
        print("\n❌ Services are not running properly. Please start the services first.")
        return
    
    # Get admin token
    token = get_admin_token()
    if not token:
        print("\n❌ Failed to get admin token. Cannot proceed with upload test.")
        return
    
    # Test CSV upload
    upload_success = test_csv_upload(token)
    
    # Final result
    print("\n" + "=" * 50)
    if upload_success:
        print("✅ CSV Upload Authentication Fix Test PASSED!")
        print("The port configuration has been corrected and authentication is working.")
    else:
        print("❌ CSV Upload Authentication Fix Test FAILED!")
        print("There may still be authentication or configuration issues.")

if __name__ == "__main__":
    main()