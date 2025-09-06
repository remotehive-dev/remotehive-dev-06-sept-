#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import get_db_session
from app.database.services import EmployerService, JobSeekerService
from app.database.models import User
import json

def test_profile_creation():
    """Test creating employer and job seeker profiles directly"""
    
    # Get database session
    db = next(get_db_session())
    
    try:
        # Find a test user
        test_user = db.query(User).filter(User.email == 'ranjeettiwari105@gmail.com').first()
        
        if not test_user:
            print("❌ Test user not found")
            return
            
        print(f"✅ Found test user: {test_user.email} (ID: {test_user.id})")
        
        # Test employer profile creation
        if test_user.role.value == 'employer':
            print("\n🏢 Testing employer profile creation...")
            
            # Check if profile already exists
            existing_employer = EmployerService.get_employer_by_user_id(db, test_user.id)
            if existing_employer:
                print(f"✅ Employer profile already exists: {existing_employer.id}")
            else:
                try:
                    employer_data = {
                        "company_name": f"{test_user.first_name} {test_user.last_name} Company",
                        "company_email": test_user.email,  # Required field
                        "company_description": "Test employer profile",
                        "industry": "Technology",
                        "company_size": "startup",
                        "location": "Remote"
                    }
                    
                    print(f"Creating employer with data: {employer_data}")
                    employer = EmployerService.create_employer(db, test_user.id, employer_data)
                    print(f"✅ Employer profile created successfully: {employer.id}")
                    
                except Exception as e:
                    print(f"❌ Failed to create employer profile: {e}")
                    print(f"Error type: {type(e).__name__}")
                    import traceback
                    traceback.print_exc()
        
        elif test_user.role.value == 'job_seeker':
            print("\n👤 Testing job seeker profile creation...")
            
            # Check if profile already exists
            existing_job_seeker = JobSeekerService.get_job_seeker_by_user_id(db, test_user.id)
            if existing_job_seeker:
                print(f"✅ Job seeker profile already exists: {existing_job_seeker.id}")
            else:
                try:
                    job_seeker_data = {
                        "current_title": "Software Developer",
                        "experience_level": "mid",
                        "skills": ["Python", "JavaScript"],
                        "preferred_job_types": ["full_time", "remote"],
                        "preferred_locations": ["Remote"],
                        "is_actively_looking": True
                    }
                    
                    print(f"Creating job seeker with data: {job_seeker_data}")
                    job_seeker = JobSeekerService.create_job_seeker(db, test_user.id, job_seeker_data)
                    print(f"✅ Job seeker profile created successfully: {job_seeker.id}")
                    
                except Exception as e:
                    print(f"❌ Failed to create job seeker profile: {e}")
                    print(f"Error type: {type(e).__name__}")
                    import traceback
                    traceback.print_exc()
        
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Testing Profile Creation Services ===")
    test_profile_creation()
    print("\n=== Test Complete ===")