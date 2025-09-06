#!/usr/bin/env python3
"""
Cleanup script to remove all demo/test data from the database.
This script will:
1. Remove all test users (keeping only legitimate admin accounts)
2. Remove test contact submissions
3. Reset the database to production-ready state
"""

import sys
import os
from sqlalchemy.orm import Session
from app.database.database import get_db_session
from app.database.models import (
    User, UserRole, ContactSubmission, JobPost, JobApplication, 
    Employer, JobSeeker, AdminLog
)

def cleanup_demo_data():
    """Remove all demo/test data from the database."""
    session = next(get_db_session())
    
    try:
        print("Starting demo data cleanup...")
        
        # Get current counts
        user_count = session.query(User).count()
        contact_count = session.query(ContactSubmission).count()
        
        print(f"Current state:")
        print(f"- Users: {user_count}")
        print(f"- Contact submissions: {contact_count}")
        
        # Define test/demo email patterns to remove
        test_patterns = [
            '@test.com',
            '@example.com',
            'test',
            'demo',
            'employer@test.com',
            'jobseeker@test.com'
        ]
        
        # Find and remove test users
        test_users = []
        for user in session.query(User).all():
            is_test_user = False
            
            # Check if email contains test patterns
            for pattern in test_patterns:
                if pattern in user.email.lower():
                    is_test_user = True
                    break
            
            # Check if it's a generated test user (random numbers in email)
            if any(char.isdigit() for char in user.email) and ('@test.com' in user.email or '@example.com' in user.email):
                is_test_user = True
            
            # Keep legitimate admin accounts (you may want to adjust this logic)
            if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN] and not is_test_user:
                print(f"Keeping admin user: {user.email}")
                continue
            
            if is_test_user:
                test_users.append(user)
        
        print(f"\nFound {len(test_users)} test users to remove:")
        for user in test_users:
            print(f"- {user.email} ({user.first_name} {user.last_name}) - {user.role.value}")
        
        # Remove test users and their related data
        if test_users:
            confirm = input(f"\nAre you sure you want to remove {len(test_users)} test users? (yes/no): ")
            if confirm.lower() == 'yes':
                for user in test_users:
                    # Remove related job seeker profile if exists
                    if user.job_seeker:
                        session.delete(user.job_seeker)
                    
                    # Remove related employer profile if exists
                    if user.employer_profile:
                        session.delete(user.employer_profile)
                    
                    # Remove the user
                    session.delete(user)
                    print(f"Removed user: {user.email}")
                
                session.commit()
                print(f"Successfully removed {len(test_users)} test users.")
            else:
                print("User removal cancelled.")
        
        # Remove test contact submissions
        test_contacts = session.query(ContactSubmission).filter(
            ContactSubmission.email.like('%test%')
        ).all()
        
        if test_contacts:
            print(f"\nFound {len(test_contacts)} test contact submissions to remove.")
            confirm = input(f"Remove {len(test_contacts)} test contact submissions? (yes/no): ")
            if confirm.lower() == 'yes':
                for contact in test_contacts:
                    session.delete(contact)
                session.commit()
                print(f"Successfully removed {len(test_contacts)} test contact submissions.")
        
        # Final counts
        final_user_count = session.query(User).count()
        final_contact_count = session.query(ContactSubmission).count()
        
        print(f"\nCleanup completed!")
        print(f"Final state:")
        print(f"- Users: {final_user_count} (removed {user_count - final_user_count})")
        print(f"- Contact submissions: {final_contact_count} (removed {contact_count - final_contact_count})")
        
        # Show remaining users
        remaining_users = session.query(User).all()
        if remaining_users:
            print(f"\nRemaining users:")
            for user in remaining_users:
                print(f"- {user.email} ({user.first_name} {user.last_name}) - {user.role.value}")
        else:
            print("\nNo users remaining in database.")
        
    except Exception as e:
        session.rollback()
        print(f"Error during cleanup: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("RemoteHive Demo Data Cleanup Tool")
    print("=" * 40)
    print("This script will remove all test/demo data from the database.")
    print("Make sure you have a backup before proceeding!")
    print()
    
    confirm = input("Do you want to proceed with the cleanup? (yes/no): ")
    if confirm.lower() == 'yes':
        cleanup_demo_data()
    else:
        print("Cleanup cancelled.")