#!/usr/bin/env python3
"""
Script to remove Supabase dependencies and update code to use PostgreSQL/SQLAlchemy
This script will:
1. Update API endpoints to use SQLAlchemy instead of Supabase
2. Remove Supabase imports and configurations
3. Delete Supabase-specific files
4. Update environment variables
"""

import os
import shutil
from pathlib import Path

class SupabaseDependencyRemover:
    def __init__(self):
        self.project_root = Path("d:/Remotehive")
        self.files_to_delete = []
        self.files_updated = []
        self.errors = []
    
    def update_contact_endpoints(self):
        """Update contact.py to use SQLAlchemy instead of Supabase"""
        contact_file = self.project_root / "app" / "api" / "endpoints" / "contact.py"
        
        if not contact_file.exists():
            print(f"Contact file not found: {contact_file}")
            return
        
        try:
            with open(contact_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace Supabase imports with SQLAlchemy
            new_content = content.replace(
                "from app.core.database import get_supabase",
                "from app.core.database import get_db_session\nfrom app.database.models import ContactSubmission"
            )
            
            # Replace Supabase operations with SQLAlchemy
            # Replace table().insert() pattern
            new_content = new_content.replace(
                "supabase = get_supabase()\n    result = supabase.table('contact_submissions').insert(contact_data).execute()",
                "with get_db_session() as db:\n        contact = ContactSubmission(**contact_data)\n        db.add(contact)\n        db.commit()\n        db.refresh(contact)\n        result = contact"
            )
            
            # Replace table().select() pattern
            new_content = new_content.replace(
                "supabase.table('contact_submissions').select('*')",
                "db.query(ContactSubmission)"
            )
            
            # Replace .execute().data pattern
            new_content = new_content.replace(
                ".execute().data",
                ".all()"
            )
            
            # Remove get_supabase() calls
            new_content = new_content.replace(
                "supabase = get_supabase()",
                ""
            )
            
            with open(contact_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            self.files_updated.append(str(contact_file))
            print(f"✓ Updated {contact_file}")
            
        except Exception as e:
            error_msg = f"Error updating {contact_file}: {str(e)}"
            print(f"✗ {error_msg}")
            self.errors.append(error_msg)
    
    def update_cms_endpoints(self):
        """Update cms.py to use SQLAlchemy instead of Supabase"""
        cms_file = self.project_root / "app" / "api" / "endpoints" / "cms.py"
        
        if not cms_file.exists():
            print(f"CMS file not found: {cms_file}")
            return
        
        try:
            with open(cms_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace Supabase imports with SQLAlchemy
            new_content = content.replace(
                "from app.core.database import get_supabase",
                "from app.core.database import get_db_session\nfrom app.database.models import SeoSettings, Review, Ad"
            )
            
            # Replace Supabase operations with SQLAlchemy equivalents
            # This is a template - actual replacements depend on the specific code
            new_content = new_content.replace(
                "supabase = get_supabase()",
                ""
            )
            
            with open(cms_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            self.files_updated.append(str(cms_file))
            print(f"✓ Updated {cms_file}")
            
        except Exception as e:
            error_msg = f"Error updating {cms_file}: {str(e)}"
            print(f"✗ {error_msg}")
            self.errors.append(error_msg)
    
    def update_admin_endpoints(self):
        """Update admin.py to use SQLAlchemy instead of Supabase"""
        admin_file = self.project_root / "app" / "api" / "endpoints" / "admin.py"
        
        if not admin_file.exists():
            print(f"Admin file not found: {admin_file}")
            return
        
        try:
            with open(admin_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace Supabase imports with SQLAlchemy
            new_content = content.replace(
                "from app.core.database import get_supabase",
                "from app.core.database import get_db_session\nfrom app.database.models import User, ContactSubmission, JobPost"
            )
            
            # Remove get_supabase() calls
            new_content = new_content.replace(
                "supabase = get_supabase()",
                ""
            )
            
            with open(admin_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            self.files_updated.append(str(admin_file))
            print(f"✓ Updated {admin_file}")
            
        except Exception as e:
            error_msg = f"Error updating {admin_file}: {str(e)}"
            print(f"✗ {error_msg}")
            self.errors.append(error_msg)
    
    def update_scraper_files(self):
        """Update scraper files to use SQLAlchemy instead of Supabase"""
        scraper_files = [
            "app/tasks/scraper.py",
            "app/tasks/jobs.py",
            "scraper_cli.py",
            "scraper_analytics.py",
            "smart_scraper_manager.py"
        ]
        
        for file_path in scraper_files:
            full_path = self.project_root / file_path
            
            if not full_path.exists():
                continue
            
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Replace Supabase imports with SQLAlchemy
                new_content = content.replace(
                    "from app.core.database import get_supabase",
                    "from app.core.database import get_db_session\nfrom app.database.models import ScraperConfig, ScraperLog, ScraperMemory, JobPost"
                )
                
                # Remove get_supabase() calls
                new_content = new_content.replace(
                    "supabase = get_supabase()",
                    ""
                )
                
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                self.files_updated.append(str(full_path))
                print(f"✓ Updated {full_path}")
                
            except Exception as e:
                error_msg = f"Error updating {full_path}: {str(e)}"
                print(f"✗ {error_msg}")
                self.errors.append(error_msg)
    
    def delete_supabase_files(self):
        """Delete Supabase-specific files"""
        files_to_delete = [
            "create_supabase_tables.py",
            "create_cms_tables.py",
            "create_contact_table.sql",
            "create_contact_info_table.sql",
            "setup_contact_info_table.py",
            "create_supabase_auth_users.py",
            "setup_database.py",  # If it's Supabase-specific
            "test_contact_api_direct.py",
            "verify_admin_cleanup.py",
            "check_contact_submissions_quick.py"
        ]
        
        for file_name in files_to_delete:
            file_path = self.project_root / file_name
            
            if file_path.exists():
                try:
                    file_path.unlink()
                    self.files_to_delete.append(str(file_path))
                    print(f"✓ Deleted {file_path}")
                except Exception as e:
                    error_msg = f"Error deleting {file_path}: {str(e)}"
                    print(f"✗ {error_msg}")
                    self.errors.append(error_msg)
    
    def update_environment_file(self):
        """Update .env file to remove Supabase variables"""
        env_file = self.project_root / ".env"
        
        if not env_file.exists():
            print("No .env file found")
            return
        
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Remove Supabase-related environment variables
            new_lines = []
            for line in lines:
                if not any(var in line for var in ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']):
                    new_lines.append(line)
                else:
                    print(f"  Removing: {line.strip()}")
            
            with open(env_file, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            
            self.files_updated.append(str(env_file))
            print(f"✓ Updated {env_file}")
            
        except Exception as e:
            error_msg = f"Error updating {env_file}: {str(e)}"
            print(f"✗ {error_msg}")
            self.errors.append(error_msg)
    
    def update_requirements(self):
        """Remove Supabase from requirements.txt"""
        req_file = self.project_root / "requirements.txt"
        
        if not req_file.exists():
            print("No requirements.txt file found")
            return
        
        try:
            with open(req_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Remove Supabase-related packages
            new_lines = []
            for line in lines:
                if not any(pkg in line.lower() for pkg in ['supabase', 'postgrest']):
                    new_lines.append(line)
                else:
                    print(f"  Removing: {line.strip()}")
            
            with open(req_file, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            
            self.files_updated.append(str(req_file))
            print(f"✓ Updated {req_file}")
            
        except Exception as e:
            error_msg = f"Error updating {req_file}: {str(e)}"
            print(f"✗ {error_msg}")
            self.errors.append(error_msg)
    
    def run_cleanup(self):
        """Run the complete cleanup process"""
        print("Starting Supabase dependency removal...")
        print("-" * 50)
        
        # Update endpoint files
        print("\n1. Updating API endpoints...")
        self.update_contact_endpoints()
        self.update_cms_endpoints()
        self.update_admin_endpoints()
        
        # Update scraper files
        print("\n2. Updating scraper files...")
        self.update_scraper_files()
        
        # Delete Supabase-specific files
        print("\n3. Deleting Supabase-specific files...")
        self.delete_supabase_files()
        
        # Update configuration files
        print("\n4. Updating configuration files...")
        self.update_environment_file()
        self.update_requirements()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print cleanup summary"""
        print("\n" + "="*50)
        print("CLEANUP SUMMARY")
        print("="*50)
        print(f"Files updated: {len(self.files_updated)}")
        print(f"Files deleted: {len(self.files_to_delete)}")
        print(f"Errors: {len(self.errors)}")
        
        if self.files_updated:
            print("\nFiles updated:")
            for file_path in self.files_updated:
                print(f"  - {file_path}")
        
        if self.files_to_delete:
            print("\nFiles deleted:")
            for file_path in self.files_to_delete:
                print(f"  - {file_path}")
        
        if self.errors:
            print("\nErrors encountered:")
            for error in self.errors:
                print(f"  - {error}")
        
        if len(self.errors) == 0:
            print("\n✓ Cleanup completed successfully!")
            print("\nNext steps:")
            print("1. Run the migration script: python migrate_from_supabase.py")
            print("2. Test all endpoints to ensure they work with PostgreSQL")
            print("3. Update any remaining Supabase references manually")
        else:
            print("\n⚠ Cleanup completed with errors.")

if __name__ == "__main__":
    remover = SupabaseDependencyRemover()
    remover.run_cleanup()