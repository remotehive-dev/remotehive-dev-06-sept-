#!/usr/bin/env python3

import sys
sys.path.append('.')

from main import app

print("=== FastAPI Routes ===")
for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        print(f"Path: {route.path}, Methods: {route.methods}")
    elif hasattr(route, 'path_regex'):
        print(f"Mount: {route.path_regex.pattern}")

print("\n=== Testing employers endpoint ===")
import requests
try:
    response = requests.get('http://localhost:8000/api/employers/')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")