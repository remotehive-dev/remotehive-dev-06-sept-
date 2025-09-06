import requests
import json

# Login first
login_url = "http://localhost:8000/api/v1/auth/admin/login"
login_data = {
    "email": "admin@remotehive.in",
    "password": "Ranjeet11$"
}

print("Logging in...")
login_response = requests.post(login_url, json=login_data)
print(f"Login status: {login_response.status_code}")

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print(f"Token obtained: {token[:50]}...")
    
    # Get current user info
    headers = {"Authorization": f"Bearer {token}"}
    user_info_url = "http://localhost:8000/api/v1/auth/profile"
    
    print("\nGetting user info...")
    user_response = requests.get(user_info_url, headers=headers)
    print(f"User info status: {user_response.status_code}")
    
    if user_response.status_code == 200:
        user_data = user_response.json()
        print(f"User data: {json.dumps(user_data, indent=2)}")
        print(f"User role: {user_data.get('role')}")
        print(f"User role type: {type(user_data.get('role'))}")
else:
    print(f"Login failed: {login_response.text}")