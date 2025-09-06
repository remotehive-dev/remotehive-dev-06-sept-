#!/usr/bin/env python3
"""
Test script to verify the authentication flow for job boards CSV upload
"""

import requests
import json
import tempfile
import os

def test_auth_flow():
    print("Testing authentication flow...")
    
    # Step 1: Login to get admin token
    login_url = "http://localhost:3000/api/auth/login"
    login_data = {
        "email": "admin@remotehive.in",
        "password": "Ranjeet11$"
    }
    
    print("\n1. Testing login endpoint...")
    try:
        login_response = requests.post(login_url, json=login_data, timeout=10)
        print(f"Login Status: {login_response.status_code}")
        print(f"Login Response: {login_response.text}")
        
        if login_response.status_code == 200:
            login_data_response = login_response.json()
            if 'access_token' in login_data_response:
                admin_token = login_data_response['access_token']
                print(f"✓ Successfully obtained admin token: {admin_token[:20]}...")
                
                # Step 2: Test CSV upload with token
                print("\n2. Testing CSV upload with admin token...")
                test_csv_with_token(admin_token)
            else:
                print("✗ No access_token in login response")
        else:
            print("✗ Login failed")
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Login request failed: {e}")

def test_csv_with_token(token):
    # Create a test CSV file
    csv_content = """name,url,description,is_active
Test Board,https://example.com,Test job board,true
"""
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        f.write(csv_content)
        temp_file_path = f.name
    
    try:
        upload_url = "http://localhost:8001/api/v1/autoscraper/job-boards/upload-csv"
        
        with open(temp_file_path, 'rb') as f:
            files = {'file': ('test_job_boards.csv', f, 'text/csv')}
            headers = {'Authorization': f'Bearer {token}'}
            
            response = requests.post(upload_url, files=files, headers=headers, timeout=10)
            print(f"Upload Status: {response.status_code}")
            print(f"Upload Response: {response.text}")
            
            if response.status_code == 200:
                print("✓ CSV upload successful with admin token!")
            elif response.status_code == 401:
                print("✗ Still getting 401 - token might be invalid or not properly formatted")
            else:
                print(f"✗ Upload failed with status {response.status_code}")
                
    except requests.exceptions.RequestException as e:
        print(f"✗ Upload request failed: {e}")
    finally:
        # Clean up temp file
        os.unlink(temp_file_path)

if __name__ == "__main__":
    test_auth_flow()