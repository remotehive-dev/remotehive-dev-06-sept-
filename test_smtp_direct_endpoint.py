import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import get_db_session
from app.api.v1.endpoints.email_management import get_smtp_settings
from app.core.auth import get_admin
import logging

# Configure logging to capture all levels
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_smtp_endpoint_direct():
    """Test SMTP endpoint directly using FastAPI TestClient"""
    try:
        print("=== Testing SMTP endpoint with TestClient ===")
        
        # Create test client
        client = TestClient(app)
        
        # First, login to get token
        login_response = client.post("/api/v1/auth/admin/login", json={
            "email": "admin@remotehive.in",
            "password": "Ranjeet11$"
        })
        
        print(f"Login status: {login_response.status_code}")
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return
            
        token_data = login_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            print("No access token received")
            return
            
        print(f"Access token: {access_token[:50]}...")
        
        # Now test the SMTP endpoint
        headers = {"Authorization": f"Bearer {access_token}"}
        smtp_response = client.get("/api/v1/admin/email/smtp-settings", headers=headers)
        
        print(f"SMTP endpoint status: {smtp_response.status_code}")
        print(f"SMTP endpoint response: {smtp_response.text}")
        
        if smtp_response.status_code != 200:
            print("❌ SMTP endpoint failed")
        else:
            print("✅ SMTP endpoint succeeded")
            
    except Exception as e:
        print(f"Error in direct test: {e}")
        import traceback
        traceback.print_exc()

async def test_smtp_function_direct():
    """Test SMTP function directly without FastAPI"""
    try:
        print("\n=== Testing SMTP function directly ===")
        
        # Get database session
        db_session = next(get_db_session())
        
        try:
            # Create mock user (admin)
            class MockUser:
                def __init__(self):
                    self.user_id = "4a8ab5d4-cedc-4dc4-8d99-6b9dd9496924"
                    self.email = "admin@remotehive.in"
                    self.role = "super_admin"
                    
                def get(self, key, default=None):
                    return getattr(self, key, default)
            
            mock_user = MockUser()
            
            # Call the function directly
            result = await get_smtp_settings(current_user=mock_user, db=db_session)
            print(f"Direct function result: {result}")
            print("✅ Direct function call succeeded")
            
        finally:
            db_session.close()
            
    except Exception as e:
        print(f"Error in direct function test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Test both approaches
    test_smtp_endpoint_direct()
    asyncio.run(test_smtp_function_direct())