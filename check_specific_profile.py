#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import get_db_session
from app.database.models import User, Employer, JobSeeker
from sqlalchemy import text

def check_specific_profile():
    """Check for the specific profile we just created"""
    
    # Get database session
    db = next(get_db_session())
    
    try:
        print("\n=== Checking Specific Profile ===")
        
        # Find the endpointtest user (employer)
        employer_user = db.query(User).filter(User.email == "ranjeettiwary589@gmail.com").first()
        if employer_user:
            print(f"✅ Employer user found: {employer_user.id} - {employer_user.email}")
            
            # Check for employer profile
            employer = db.query(Employer).filter(Employer.user_id == employer_user.id).first()
            if employer:
                print(f"✅ Employer profile found: {employer.id}")
                print(f"   Company Name: {employer.company_name}")
                print(f"   Company Email: {employer.company_email}")
                print(f"   Industry: {employer.industry}")
                print(f"   Company Size: {employer.company_size}")
            else:
                print(f"❌ No employer profile found for user {employer_user.id}")
        else:
            print("❌ User ranjeettiwary589@gmail.com not found")
        
        # Find the jobseekertest user (job seeker)
        jobseeker_user = db.query(User).filter(User.email == "ranjeettiwari105@gmail.com").first()
        if jobseeker_user:
            print(f"\n✅ Job seeker user found: {jobseeker_user.id} - {jobseeker_user.email}")
            
            # Check for job seeker profile
            job_seeker = db.query(JobSeeker).filter(JobSeeker.user_id == jobseeker_user.id).first()
            if job_seeker:
                print(f"✅ Job seeker profile found: {job_seeker.id}")
                print(f"   Current Title: {job_seeker.current_title}")
                print(f"   Experience Level: {job_seeker.experience_level}")
                print(f"   Actively Looking: {job_seeker.is_actively_looking}")
            else:
                print(f"❌ No job seeker profile found for user {jobseeker_user.id}")
        else:
            print("❌ User ranjeettiwari105@gmail.com not found")
        
        # Check all employer profiles in database
        print("\n=== All Employer Profiles ===")
        all_employers = db.query(Employer).all()
        if all_employers:
            for emp in all_employers:
                print(f"  • Employer ID: {emp.id} - User ID: {emp.user_id} - Company: {emp.company_name}")
        else:
            print("❌ No employer profiles found in database")
        
        # Check all job seeker profiles in database
        print("\n=== All Job Seeker Profiles ===")
        all_job_seekers = db.query(JobSeeker).all()
        if all_job_seekers:
            for js in all_job_seekers:
                print(f"  • Job Seeker ID: {js.id} - User ID: {js.user_id} - Title: {js.current_title}")
        else:
            print("❌ No job seeker profiles found in database")
        
        # Raw SQL check
        print("\n=== Raw SQL Check ===")
        result = db.execute(text("""
            SELECT e.id, e.user_id, e.company_name, u.email 
            FROM employers e 
            JOIN users u ON e.user_id = u.id 
            WHERE u.email = 'ranjeettiwary589@gmail.com'
        """))
        
        rows = result.fetchall()
        if rows:
            for row in rows:
                print(f"✅ Found employer via SQL: {row[0]} - {row[2]} - {row[3]}")
        else:
            print("❌ No employer found via SQL")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_specific_profile()
    print("\n=== Check Complete ===")