#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging
import asyncio
from fastapi import Request
from unittest.mock import Mock
from app.database.database import get_db_session
from app.api.v1.endpoints.auth_endpoints import public_register, PublicRegistrationRequest

# Configure logging to show all levels
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_registration_endpoint():
    """Test the actual registration endpoint with detailed logging"""
    
    # Get database session
    db = next(get_db_session())
    
    try:
        # Create mock request
        mock_request = Mock(spec=Request)
        mock_request.client = Mock()
        mock_request.client.host = "127.0.0.1"
        mock_request.headers = {"user-agent": "test-agent"}
        
        # Test data
        registration_data = PublicRegistrationRequest(
            email="ranjeettiwary589@gmail.com",
            password="Ranjeet11$",
            first_name="Endpoint",
            last_name="Test",
            phone="+1234567899",
            role="employer"
        )
        
        print(f"\n=== Testing Registration Endpoint ===")
        print(f"Email: {registration_data.email}")
        print(f"Role: {registration_data.role}")
        
        # Call the actual registration endpoint
        print("\n🔄 Calling registration endpoint...")
        response = await public_register(registration_data, mock_request, db)
        
        print(f"✅ Registration successful!")
        print(f"User ID: {response.user['id']}")
        print(f"Access Token: {response.access_token[:50]}...")
        
        # Check if profile was created
        from app.database.models import Employer, JobSeeker
        
        if registration_data.role == "employer":
            employer = db.query(Employer).filter(Employer.user_id == response.user['id']).first()
            if employer:
                print(f"✅ Employer profile found: {employer.id}")
            else:
                print(f"❌ No employer profile found for user {response.user['id']}")
        
    except Exception as e:
        print(f"❌ Registration failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_registration_endpoint())
    print("\n=== Test Complete ===")