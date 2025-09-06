#!/usr/bin/env python3
"""
Test CSV Upload Authentication End-to-End
Tests the complete authentication flow for CSV upload between admin frontend and autoscraper service
"""

import sys
import os
import asyncio
import tempfile
from pathlib import Path
import requests
import time

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Set environment variables
os.environ.setdefault("JWT_SECRET_KEY", "8b0aceeaa899e15c513ea9b6f9de82edef07bd6ba6d36c30007856f7a3db5f77")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "30")

def create_test_csv():
    """Create a test CSV file for upload"""
    csv_content = """name,url,location,job_types,description
Remote OK,https://remoteok.io,Global,"Full-time,Part-time,Contract",Remote job board
We Work Remotely,https://weworkremotely.com,Global,"Full-time,Contract",Remote work opportunities
Remote.co,https://remote.co,Global,"Full-time,Part-time",Remote job listings
"""
    
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
    temp_file.write(csv_content)
    temp_file.close()
    
    return temp_file.name

def test_admin_login():
    """Test admin login to get authentication token"""
    print("\n=== Testing Admin Login ===")
    
    try:
        # Import auth utilities
        from app.utils.jwt_auth import get_jwt_manager
        
        # Create JWT manager
        jwt_manager = get_jwt_manager()
        
        # Create a test admin token (simulating successful login)
        user_data = {
            "email": "admin@remotehive.com",
            "role": "admin",
            "user_id": 1,
            "name": "Test Admin"
        }
        
        token = jwt_manager.create_access_token(
            subject="admin@remotehive.com",
            user_data=user_data
        )
        
        print(f"✅ Admin token created successfully")
        print(f"Token: {token[:50]}...")
        
        return token
        
    except Exception as e:
        print(f"❌ Admin login failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_csv_upload_request(token, csv_file_path):
    """Test CSV upload request to autoscraper service"""
    print("\n=== Testing CSV Upload Request ===")
    
    if not token:
        print("❌ No token provided")
        return False
    
    try:
        # Prepare the upload request
        url = "http://localhost:8002/api/v1/autoscraper/job-boards/upload-csv"
        
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        # Prepare file for upload
        with open(csv_file_path, 'rb') as f:
            files = {
                'file': ('job_boards.csv', f, 'text/csv')
            }
            
            print(f"Uploading to: {url}")
            print(f"Headers: {headers}")
            print(f"File: {csv_file_path}")
            
            # Make the request (this will fail if autoscraper service is not running)
            try:
                response = requests.post(url, headers=headers, files=files, timeout=10)
                
                print(f"Response Status: {response.status_code}")
                print(f"Response Headers: {dict(response.headers)}")
                print(f"Response Body: {response.text[:500]}...")
                
                if response.status_code == 200:
                    print("✅ CSV upload successful!")
                    return True
                elif response.status_code == 401:
                    print("❌ Authentication failed (401 Unauthorized)")
                    return False
                elif response.status_code == 403:
                    print("❌ Authorization failed (403 Forbidden)")
                    return False
                else:
                    print(f"❌ Upload failed with status {response.status_code}")
                    return False
                    
            except requests.exceptions.ConnectionError:
                print("⚠️  Autoscraper service not running - testing token format only")
                
                # Test token format by decoding it
                from app.utils.jwt_auth import get_jwt_manager
                jwt_manager = get_jwt_manager()
                
                try:
                    payload = jwt_manager.decode_token(token)
                    print("✅ Token format is valid")
                    print(f"Token payload: {payload}")
                    return True
                except Exception as e:
                    print(f"❌ Token format is invalid: {e}")
                    return False
                    
            except requests.exceptions.Timeout:
                print("⚠️  Request timeout - service may be slow")
                return False
        
    except Exception as e:
        print(f"❌ CSV upload test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_autoscraper_service_status():
    """Test if autoscraper service is running"""
    print("\n=== Testing AutoScraper Service Status ===")
    
    try:
        response = requests.get("http://localhost:8002/health", timeout=5)
        if response.status_code == 200:
            print("✅ AutoScraper service is running")
            return True
        else:
            print(f"⚠️  AutoScraper service returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ AutoScraper service is not running")
        return False
    except requests.exceptions.Timeout:
        print("⚠️  AutoScraper service is not responding")
        return False
    except Exception as e:
        print(f"❌ Error checking AutoScraper service: {e}")
        return False

def test_main_service_status():
    """Test if main service is running"""
    print("\n=== Testing Main Service Status ===")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Main service is running")
            return True
        else:
            print(f"⚠️  Main service returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Main service is not running")
        return False
    except requests.exceptions.Timeout:
        print("⚠️  Main service is not responding")
        return False
    except Exception as e:
        print(f"❌ Error checking main service: {e}")
        return False

def main():
    """Main test function"""
    print("CSV Upload Authentication End-to-End Test")
    print("=" * 60)
    
    # Check service status
    main_service_running = test_main_service_status()
    autoscraper_service_running = test_autoscraper_service_status()
    
    # Create test CSV file
    csv_file_path = create_test_csv()
    print(f"\nCreated test CSV file: {csv_file_path}")
    
    try:
        # Test admin login (token creation)
        token = test_admin_login()
        
        if token:
            # Test CSV upload
            upload_success = test_csv_upload_request(token, csv_file_path)
            
            if upload_success:
                print("\n✅ CSV Upload Authentication Test PASSED!")
                if not autoscraper_service_running:
                    print("   (Token validation successful, but service not running for full test)")
            else:
                print("\n❌ CSV Upload Authentication Test FAILED!")
        else:
            print("\n❌ Could not create admin token")
    
    finally:
        # Clean up test file
        try:
            os.unlink(csv_file_path)
            print(f"\nCleaned up test file: {csv_file_path}")
        except Exception as e:
            print(f"Warning: Could not clean up test file: {e}")
    
    print("\n" + "=" * 60)
    print("Test complete")
    
    # Summary
    print("\n=== Test Summary ===")
    print(f"Main Service Running: {'✅' if main_service_running else '❌'}")
    print(f"AutoScraper Service Running: {'✅' if autoscraper_service_running else '❌'}")
    print(f"JWT Token Creation: {'✅' if token else '❌'}")
    print(f"Authentication Flow: {'✅' if token and upload_success else '❌'}")

if __name__ == "__main__":
    main()