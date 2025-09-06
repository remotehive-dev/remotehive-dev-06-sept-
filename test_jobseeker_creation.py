#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.database.services import JobSeekerService
from app.database.models import User
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_jobseeker_creation():
    """Test job seeker profile creation directly"""
    db = next(get_db())
    
    try:
        # Find the jobseekertest user
        user = db.query(User).filter(User.email == "ranjeettiwari105@gmail.com").first()
        if not user:
            print("❌ User ranjeettiwari105@gmail.com not found")
            return
        
        print(f"✅ User found: {user.id} - {user.email} - Role: {user.role}")
        
        # Test job seeker profile creation
        job_seeker_data = {
            "current_title": "Test Job Seeker",
            "experience_level": "entry",
            "skills": ["Python", "JavaScript"],
            "preferred_job_types": ["full_time"],
            "preferred_locations": ["Remote"],
            "is_actively_looking": True
        }
        
        print(f"\n🔧 Testing job seeker creation with data: {job_seeker_data}")
        
        try:
            job_seeker = JobSeekerService.create_job_seeker(db, user.id, job_seeker_data)
            print(f"✅ Job seeker profile created successfully: {job_seeker.id}")
            print(f"   Current Title: {job_seeker.current_title}")
            print(f"   Experience Level: {job_seeker.experience_level}")
            print(f"   Skills: {job_seeker.skills}")
            print(f"   Actively Looking: {job_seeker.is_actively_looking}")
            
        except Exception as e:
            print(f"❌ Failed to create job seeker profile: {e}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Testing Job Seeker Profile Creation ===\n")
    test_jobseeker_creation()
    print("\n=== Test Complete ===")