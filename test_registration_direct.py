import requests
import json

# Test the registration endpoint directly
url = "http://localhost:8000/api/v1/auth/public/register"
data = {
    "email": "ranjeettiwari105@gmail.com",
    "password": "Ranjeet11$",
    "role": "job_seeker",
    "first_name": "Direct",
    "last_name": "Test"
}

print("Testing registration endpoint...")
try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

# Check if debug log file exists
import os
log_file = "D:\\Remotehive\\registration_debug.log"
if os.path.exists(log_file):
    print(f"\nDebug log file exists!")
    with open(log_file, 'r') as f:
        print(f"Content: {f.read()}")
else:
    print(f"\nDebug log file does not exist at {log_file}")