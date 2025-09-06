import requests
import json

# First, get admin token
login_url = "http://localhost:8000/api/v1/auth/admin/login"
login_data = {
    "email": "admin@remotehive.in",
    "password": "Ranjeet11$"
}

print("=== ADMIN LOGIN ===")
try:
    login_response = requests.post(login_url, json=login_data)
    print(f"Login Status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        login_result = login_response.json()
        access_token = login_result.get("access_token")
        print(f"Login successful! Token obtained.")
        
        # Test email-users endpoint
        print("\n=== TESTING EMAIL-USERS ENDPOINT ===")
        email_users_url = "http://localhost:8000/api/v1/admin/email-users/"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        }
        
        email_response = requests.get(email_users_url, headers=headers)
        print(f"Email Users Status: {email_response.status_code}")
        print(f"Response Headers: {dict(email_response.headers)}")
        
        if email_response.status_code == 200:
            email_data = email_response.json()
            print(f"Response Data: {json.dumps(email_data, indent=2)}")
        else:
            print(f"Error Response: {email_response.text}")
            
        # Also test with query parameters
        print("\n=== TESTING WITH QUERY PARAMETERS ===")
        email_response_params = requests.get(
            email_users_url + "?limit=10&offset=0", 
            headers=headers
        )
        print(f"Email Users (with params) Status: {email_response_params.status_code}")
        
        if email_response_params.status_code == 200:
            email_data_params = email_response_params.json()
            print(f"Response Data (with params): {json.dumps(email_data_params, indent=2)}")
        else:
            print(f"Error Response (with params): {email_response_params.text}")
            
    else:
        print(f"Login failed: {login_response.text}")
        
except Exception as e:
    print(f"Error: {e}")