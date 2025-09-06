#!/usr/bin/env python3

import sys
sys.path.append('.')

from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.api.integration import APIIntegration

# Create a simple FastAPI app to test the validation error handling
app = FastAPI()
api_integration = APIIntegration(app)
api_integration._setup_error_handling()

# Add a simple endpoint that raises a ValueError
@app.get("/test-validation-error")
async def test_validation_error():
    raise ValueError("Test validation error")

client = TestClient(app)

try:
    # Test the validation error handling
    response = client.get("/test-validation-error")
    print(f"✅ Status Code: {response.status_code}")
    print(f"✅ Response: {response.json()}")
    
    # Check if the response has the expected structure
    data = response.json()
    if 'error_code' in data and 'message' in data:
        print("✅ Validation error handling is working correctly!")
    else:
        print("❌ Response structure is not as expected")
        
except Exception as e:
    print(f"❌ Error testing validation: {e}")
    import traceback
    traceback.print_exc()