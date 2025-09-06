#!/usr/bin/env python3
"""
RemoteHive Database Migration Runner
Simplified script to run the migration with Supabase integration
"""

import os
import sys
import logging
from pathlib import Path

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from migrate_to_supabase import SupabaseMigrationOrchestrator

def get_supabase_config():
    """Get Supabase configuration from Trae integration"""
    # These will be provided by the Supabase integration in Trae
    # For now, we'll use environment variables as fallback
    
    supabase_url = os.getenv('SUPABASE_DATABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("\n" + "="*60)
        print("SUPABASE CONFIGURATION REQUIRED")
        print("="*60)
        print("Please set the following environment variables:")
        print("")
        print("SUPABASE_DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres")
        print("SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]")
        print("")
        print("Or get them from your Supabase project dashboard:")
        print("1. Go to your Supabase project")
        print("2. Navigate to Settings > Database")
        print("3. Copy the connection string (use service_role key)")
        print("")
        return None, None
    
    return supabase_url, supabase_key

def main():
    """Main migration runner"""
    print("\n" + "="*60)
    print("REMOTEHIVE DATABASE MIGRATION TO SUPABASE")
    print("="*60)
    print("")
    
    # Get Supabase configuration
    supabase_url, supabase_key = get_supabase_config()
    if not supabase_url or not supabase_key:
        return False
    
    # Local database configuration
    local_db_url = os.getenv('LOCAL_DATABASE_URL', 'sqlite:///./app.db')
    
    print(f"Local Database: {local_db_url}")
    print(f"Supabase URL: {supabase_url.split('@')[0]}@[hidden]")
    print("")
    
    # Ask user for confirmation
    print("This will:")
    print("1. Backup any existing data in Supabase")
    print("2. Create all database tables and relationships")
    print("3. Migrate data from local database to Supabase")
    print("4. Set up Row Level Security policies")
    print("5. Validate the migration")
    print("")
    
    response = input("Do you want to proceed? (y/N): ").strip().lower()
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
    
    # Run migration
    try:
        orchestrator = SupabaseMigrationOrchestrator(
            supabase_url=supabase_url,
            supabase_service_key=supabase_key,
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
                print("1. Update your application configuration to use Supabase")
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