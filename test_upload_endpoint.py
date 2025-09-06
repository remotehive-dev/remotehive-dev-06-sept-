#!/usr/bin/env python3
"""
Test the memory upload endpoint to diagnose the 500 Internal Server Error.
"""

import requests
import json
from pathlib import Path

def test_upload_endpoint():
    """Test the /api/v1/admin/memory/upload endpoint"""
    try:
        print("Testing /api/v1/admin/memory/upload endpoint...")
        
        # Test without authentication first to see the error
        url = "http://localhost:8000/api/v1/admin/memory/upload"
        
        # Prepare the file
        csv_file_path = Path("test_upload.csv")
        if not csv_file_path.exists():
            print(f"Error: {csv_file_path} not found")
            return False
            
        with open(csv_file_path, 'rb') as f:
            files = {'file': ('test_upload.csv', f, 'text/csv')}
            data = {'memory_type': 'website_patterns'}
            
            print(f"Uploading file: {csv_file_path}")
            response = requests.post(url, files=files, data=data, timeout=30)
        
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

if __name__ == "__main__":
    success = test_upload_endpoint()
    if success:
        print("✅ Upload endpoint test passed")
    else:
        print("❌ Upload endpoint test failed")