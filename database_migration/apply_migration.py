#!/usr/bin/env python3
"""
Apply RemoteHive Database Migration to Supabase
This script applies the migration using the Trae Supabase integration
"""

import os
import sys
from pathlib import Path

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from migrate_to_supabase import SupabaseMigrationOrchestrator

def main():
    """Apply migration to Supabase"""
    print("\n" + "="*60)
    print("APPLYING REMOTEHIVE MIGRATION TO SUPABASE")
    print("="*60)
    print("")
    
    # Supabase configuration from Trae integration
    supabase_url = "postgresql://postgres.nwltjjqhdpezreaikxfj:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
    supabase_service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bHRqanFoZHBlenJlYWlreGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzNzU2MiwiZXhwIjoyMDcwNTEzNTYyfQ.HYvVlf-4CE0HAn2ZRb9VBxrI9duJvYmRfiJiWKuizbA"
    
    # You'll need to provide your database password
    db_password = input("Enter your Supabase database password: ").strip()
    if not db_password:
        print("Database password is required.")
        return False
    
    # Update the connection string with the password
    supabase_url = supabase_url.replace("[YOUR-PASSWORD]", db_password)
    
    # Local database configuration (adjust as needed)
    local_db_url = "sqlite:///D:/Remotehive/app.db"  # Adjust this path
    
    print(f"Local Database: {local_db_url}")
    print(f"Supabase Project: nwltjjqhdpezreaikxfj.supabase.co")
    print("")
    
    # Confirm migration
    print("This migration will:")
    print("1. ✅ Create all database tables and relationships")
    print("2. 📊 Migrate data from local database to Supabase")
    print("3. 🔒 Set up Row Level Security policies")
    print("4. ✅ Validate the migration")
    print("")
    
    response = input("Proceed with migration? (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        print("Migration cancelled.")
        return False
    
    # Ask about dry run
    dry_run_response = input("\nRun as dry-run first? (Y/n): ").strip().lower()
    dry_run = dry_run_response not in ['n', 'no']
    
    if dry_run:
        print("\n🔍 Running DRY RUN - no data will be modified")
    else:
        print("\n🚀 Running FULL MIGRATION - data will be modified")
    
    print("")
    
    try:
        # Run migration
        orchestrator = SupabaseMigrationOrchestrator(
            supabase_url=supabase_url,
            supabase_service_key=supabase_service_key,
            local_db_url=local_db_url
        )
        
        success = orchestrator.run_complete_migration(
            dry_run=dry_run,
            skip_backup=False
        )
        
        if success:
            if dry_run:
                print("\n✅ DRY RUN COMPLETED SUCCESSFULLY!")
                print("\nTo run the actual migration, run this script again and choose 'n' for dry-run.")
            else:
                print("\n🎉 MIGRATION COMPLETED SUCCESSFULLY!")
                print("\nYour RemoteHive database has been migrated to Supabase.")
                print("\nNext steps:")
                print("1. Update your application to use these Supabase credentials:")
                print(f"   - URL: https://nwltjjqhdpezreaikxfj.supabase.co")
                print(f"   - Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bHRqanFoZHBlenJlYWlreGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzc1NjIsImV4cCI6MjA3MDUxMzU2Mn0.7R1zu7fqvNvWaY_9IbkaM-GHbhRB6Iup_e1sDij_U1o")
                print("2. Test your application thoroughly")
                print("3. Monitor for any issues")
        else:
            print("\n❌ MIGRATION FAILED!")
            print("\nPlease check the logs for details.")
        
        return success
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Migration interrupted by user")
        return False
    except Exception as e:
        print(f"\n❌ Migration failed with error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)