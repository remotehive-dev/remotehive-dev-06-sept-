import subprocess
import json
import requests

def test_with_curl():
    """Test SMTP endpoint using curl command"""
    print("=== Testing SMTP endpoint with curl ===")
    
    # First get the token
    try:
        login_response = requests.post(
            "http://localhost:8000/api/v1/auth/admin/login",
            json={"email": "admin@remotehive.in", "password": "Ranjeet11$"}
        )
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code}")
            return
            
        token = login_response.json()["access_token"]
        print(f"Got token: {token[:50]}...")
        
        # Use curl to test the endpoint
        curl_cmd = [
            "curl",
            "-X", "GET",
            "-H", f"Authorization: Bearer {token}",
            "-H", "Content-Type: application/json",
            "-v",  # verbose output
            "http://localhost:8000/api/v1/admin/email/smtp-settings"
        ]
        
        print(f"\nRunning curl command...")
        result = subprocess.run(curl_cmd, capture_output=True, text=True)
        
        print(f"Curl exit code: {result.returncode}")
        print(f"Curl stdout: {result.stdout}")
        print(f"Curl stderr: {result.stderr}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

def test_with_requests_verbose():
    """Test with requests but with more verbose output"""
    print("\n=== Testing with requests (verbose) ===")
    
    try:
        # Enable requests logging
        import logging
        import http.client as http_client
        
        http_client.HTTPConnection.debuglevel = 1
        logging.basicConfig()
        logging.getLogger().setLevel(logging.DEBUG)
        requests_log = logging.getLogger("requests.packages.urllib3")
        requests_log.setLevel(logging.DEBUG)
        requests_log.propagate = True
        
        # Login
        print("Logging in...")
        login_response = requests.post(
            "http://localhost:8000/api/v1/auth/admin/login",
            json={"email": "admin@remotehive.in", "password": "Ranjeet11$"}
        )
        
        print(f"Login status: {login_response.status_code}")
        if login_response.status_code != 200:
            print(f"Login response: {login_response.text}")
            return
            
        token = login_response.json()["access_token"]
        
        # Test SMTP endpoint
        print("\nTesting SMTP endpoint...")
        headers = {"Authorization": f"Bearer {token}"}
        smtp_response = requests.get(
            "http://localhost:8000/api/v1/admin/email/smtp-settings",
            headers=headers
        )
        
        print(f"SMTP status: {smtp_response.status_code}")
        print(f"SMTP headers: {dict(smtp_response.headers)}")
        print(f"SMTP response: {smtp_response.text}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_with_requests_verbose()
    test_with_curl()