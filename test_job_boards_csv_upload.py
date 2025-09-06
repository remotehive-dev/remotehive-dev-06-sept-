#!/usr/bin/env python3
"""
Test script to verify job boards CSV upload functionality
"""

import requests
import json
from pathlib import Path
import os

# Base URL for the autoscraper service
BASE_URL = "http://localhost:8001"
API_PREFIX = "/api/v1/autoscraper"

def get_admin_token():
    """Get admin authentication token"""
    try:
        login_url = "http://localhost:8000/api/v1/auth/admin/login"
        login_data = {
            "email": "admin@remotehive.in",
            "password": "Ranjeet11$"
        }
        
        print("Getting admin token...")
        response = requests.post(login_url, json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print("✅ Admin token obtained successfully")
            return token
        else:
            print(f"❌ Failed to get admin token: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error getting admin token: {e}")
        return None

def test_job_boards_csv_upload():
    """Test the /api/v1/autoscraper/job-boards/upload-csv endpoint"""
    try:
        print("Testing job boards CSV upload endpoint...")
        
        # URL for the job boards upload endpoint
        url = f"{BASE_URL}{API_PREFIX}/job-boards/upload-csv"
        
        # Create a sample CSV file
        csv_content = """name,base_url,region
Test Job Board 1,https://example.com/jobs,US
Test Job Board 2,https://example.org/careers,EU"""
        
        csv_file_path = Path("test_job_boards.csv")
        with open(csv_file_path, 'w') as f:
            f.write(csv_content)
        
        print(f"Created sample CSV file: {csv_file_path}")
        
        # Get admin token by logging in
        admin_token = get_admin_token()
        
        headers = {}
        if admin_token:
            headers["Authorization"] = f"Bearer {admin_token}"
            print(f"Using admin token: {admin_token[:10]}...")
        else:
            print("⚠️ No admin token available, proceeding without authentication")
        
        # Prepare the file for upload
        with open(csv_file_path, 'rb') as f:
            files = {'file': ('test_job_boards.csv', f, 'text/csv')}
            data = {'test_accessibility': 'false'}
            
            print(f"Uploading file to: {url}")
            response = requests.post(url, files=files, data=data, headers=headers, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"Error Response: {response.text}")
            
            # Try to parse as JSON for better error details
            try:
                error_data = response.json()
                print(f"Error Details: {json.dumps(error_data, indent=2)}")
            except:
                pass
                
            return False
            
    except requests.exceptions.ConnectionError:
        print("Connection error - server might not be running")
        return False
    except Exception as e:
        print(f"Error testing endpoint: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Clean up the test file
        if csv_file_path.exists():
            os.remove(csv_file_path)
            print(f"Removed test file: {csv_file_path}")

if __name__ == "__main__":
    success = test_job_boards_csv_upload()
    if success:
        print("✅ Job boards CSV upload test passed")
    else:
        print("❌ Job boards CSV upload test failed")