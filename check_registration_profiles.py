#!/usr/bin/env python3

from app.database.database import get_database_manager
from sqlalchemy import text

def check_registration_profiles():
    """Check if employer and job seeker profiles were created for test users"""
    db_manager = get_database_manager()
    
    with db_manager.engine.connect() as conn:
        print("=== Checking Test User Registrations ===")
        
        # Check users table
        try:
            result = conn.execute(text("""
                SELECT id, email, first_name, last_name, role, created_at 
                FROM users 
                WHERE email IN ('ranjeettiwari105@gmail.com', 'ranjeettiwary589@gmail.com', 'admin@remotehive.in')
                ORDER BY created_at DESC
            """))
            
            print("\n📋 Users found:")
            users = []
            for row in result:
                user_id = row[0]
                users.append(user_id)
                print(f"  • {row[1]} ({row[2]} {row[3]}) - Role: {row[4]} - ID: {user_id[:8]}...")
                
        except Exception as e:
            print(f"❌ Error querying users: {e}")
            return
            
        # Check employer profiles
        try:
            result = conn.execute(text("""
                SELECT e.id, e.user_id, e.company_name, e.industry, e.created_at,
                       u.email, u.first_name, u.last_name
                FROM employers e
                JOIN users u ON e.user_id = u.id
                WHERE u.email IN ('ranjeettiwari105@gmail.com', 'ranjeettiwary589@gmail.com')
                ORDER BY e.created_at DESC
            """))
            
            print("\n🏢 Employer profiles found:")
            employer_count = 0
            for row in result:
                employer_count += 1
                print(f"  • Company: {row[2]} - Industry: {row[3]} - User: {row[5]} ({row[6]} {row[7]})")
                
            if employer_count == 0:
                print("  ❌ No employer profiles found")
                
        except Exception as e:
            print(f"❌ Error querying employers: {e}")
            
        # Check job seeker profiles
        try:
            result = conn.execute(text("""
                SELECT js.id, js.user_id, js.current_title, js.experience_level, js.created_at,
                       u.email, u.first_name, u.last_name
                FROM job_seekers js
                JOIN users u ON js.user_id = u.id
                WHERE u.email IN ('ranjeettiwari105@gmail.com', 'ranjeettiwary589@gmail.com')
                ORDER BY js.created_at DESC
            """))
            
            print("\n👤 Job seeker profiles found:")
            jobseeker_count = 0
            for row in result:
                jobseeker_count += 1
                print(f"  • Title: {row[2]} - Level: {row[3]} - User: {row[5]} ({row[6]} {row[7]})")
                
            if jobseeker_count == 0:
                print("  ❌ No job seeker profiles found")
                
        except Exception as e:
            print(f"❌ Error querying job seekers: {e}")
            
        print("\n=== Registration Check Complete ===")

if __name__ == "__main__":
    check_registration_profiles()