#!/usr/bin/env python3

import sys
sys.path.append('.')

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=== Testing /api/employers/ endpoint ===")
try:
    response = client.get("/api/employers/")
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Response: {response.text}")
    
    if response.status_code != 200:
        print("\n=== Testing root endpoint ===")
        root_response = client.get("/")
        print(f"Root Status: {root_response.status_code}")
        print(f"Root Response: {root_response.text}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()