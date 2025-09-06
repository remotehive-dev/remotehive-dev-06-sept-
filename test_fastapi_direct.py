#!/usr/bin/env python3

import sys
sys.path.append('.')

from fastapi.testclient import TestClient
from app.main import app

def test_fastapi_routes():
    """Test FastAPI routes directly"""
    client = TestClient(app)
    
    print("=== TESTING FASTAPI APPLICATION DIRECTLY ===")
    
    # Get all routes
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append(f"{route.methods} {route.path}")
    
    print(f"\nTotal routes found: {len(routes)}")
    
    # Look for auth routes
    auth_routes = [route for route in routes if '/auth/' in route]
    print(f"\nAuth routes found: {len(auth_routes)}")
    for route in auth_routes:
        print(f"  - {route}")
    
    # Look specifically for test endpoints
    test_routes = [route for route in routes if 'test' in route.lower()]
    print(f"\nTest routes found: {len(test_routes)}")
    for route in test_routes:
        print(f"  - {route}")
    
    # Try to access the test-logging endpoint
    print("\n=== TESTING /api/v1/auth/test-logging ===")
    try:
        response = client.get("/api/v1/auth/test-logging")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Try to access the test-debug endpoint
    print("\n=== TESTING /api/v1/auth/test-debug ===")
    try:
        response = client.get("/api/v1/auth/test-debug")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_fastapi_routes()