#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging
from app.database.database import get_db_session
from app.database.services import EmployerService, JobSeekerService
from app.database.models import User
from app.api.v1.endpoints.auth_endpoints import PublicRegistrationRequest
from app.core.local_auth import create_user

# Set up logging to see all messages
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_registration_flow():
    """Test the complete registration flow including profile creation"""
    
    # Get database session
    db = next(get_db_session())
    
    try:
        # Test data
        registration_data = PublicRegistrationRequest(
            email="ranjeettiwari105@gmail.com",
            password="Ranjeet11$",
            first_name="Debug",
            last_name="Test",
            phone="+1234567897",
            role="employer"
        )
        
        print(f"\n=== Testing Registration Flow ===")
        print(f"Email: {registration_data.email}")
        print(f"Role: {registration_data.role}")
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == registration_data.email).first()
        if existing_user:
            print(f"❌ User already exists: {existing_user.id}")
            return
        
        # Create user
        print("\n🔄 Creating user...")
        user = create_user(
            db=db,
            email=registration_data.email,
            password=registration_data.password,
            first_name=registration_data.first_name,
            last_name=registration_data.last_name,
            phone=registration_data.phone,
            role=registration_data.role
        )
        print(f"✅ User created: {user.id}")
        
        # Test profile creation
        print(f"\n🔄 Creating {registration_data.role} profile...")
        
        if registration_data.role == "employer":
            # Create employer profile with basic information
            employer_data = {
                "company_name": f"{registration_data.first_name} {registration_data.last_name} Company",
                "company_email": registration_data.email,  # Required field
                "company_description": "New employer profile",
                "industry": "Not specified",
                "company_size": "startup",
                "location": "Not specified"
            }
            print(f"Employer data: {employer_data}")
            
            try:
                employer = EmployerService.create_employer(db, user.id, employer_data)
                print(f"✅ Employer profile created successfully: {employer.id}")
            except Exception as e:
                print(f"❌ Failed to create employer profile: {e}")
                print(f"Error type: {type(e).__name__}")
                import traceback
                traceback.print_exc()
                
        elif registration_data.role == "job_seeker":
            # Create job seeker profile with basic information
            job_seeker_data = {
                "current_title": "Job Seeker",
                "experience_level": "entry",
                "skills": [],
                "preferred_job_types": ["full_time"],
                "preferred_locations": ["Remote"],
                "is_actively_looking": True
            }
            print(f"Job seeker data: {job_seeker_data}")
            
            try:
                job_seeker = JobSeekerService.create_job_seeker(db, user.id, job_seeker_data)
                print(f"✅ Job seeker profile created successfully: {job_seeker.id}")
            except Exception as e:
                print(f"❌ Failed to create job seeker profile: {e}")
                print(f"Error type: {type(e).__name__}")
                import traceback
                traceback.print_exc()
        
    except Exception as e:
        print(f"❌ Registration flow failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_registration_flow()
    print("\n=== Test Complete ===")