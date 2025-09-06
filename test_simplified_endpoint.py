import requests
import json

def test_simplified_smtp():
    """Test the simplified SMTP endpoint"""
    
    # Use a known working token (from previous successful tests)
    # In a real scenario, you'd get this from login
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBleGFtcGxlLmNvbSIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJleHAiOjE3MjMzMDI5NzF9.Ej8VGJhEKGJhEKGJhEKGJhEKGJhEKGJhEKGJhEKGJhE"
    
    # Try to get a fresh token first
    login_url = "http://localhost:8000/api/v1/auth/login"
    login_data = {
        "email": "admin@remotehive.in",
    "password": "Ranjeet11$"
    }
    
    print("=== Getting authentication token ===")
    try:
        login_response = requests.post(login_url, json=login_data, timeout=5)
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            print("✅ Login successful, token obtained")
        else:
            print(f"⚠️ Login failed, using fallback token: {login_response.status_code}")
    except Exception as e:
        print(f"⚠️ Login error, using fallback token: {e}")
    
    # Test the simplified endpoint
    print("\n=== Testing simplified SMTP endpoint ===")
    test_url = "http://localhost:8001/test-smtp"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(test_url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Simplified endpoint SUCCESS")
            data = response.json()
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ Simplified endpoint FAILED: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Request error: {e}")

if __name__ == "__main__":
    test_simplified_smtp()