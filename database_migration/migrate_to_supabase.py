#!/usr/bin/env python3
"""
RemoteHive Database Migration to Supabase
Main orchestrator script for complete database migration

This script coordinates:
1. Schema creation (DDL)
2. Data migration
3. Row Level Security setup
4. Validation and testing
5. Rollback capabilities
"""

import os
import sys
import logging
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

import psycopg2
from psycopg2.extras import RealDictCursor

# Add the scripts directory to Python path
sys.path.append(str(Path(__file__).parent / 'scripts'))

from data_migration import DatabaseMigrator, MigrationConfig

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'migration_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class SupabaseMigrationOrchestrator:
    """Orchestrates the complete migration process to Supabase"""
    
    def __init__(self, supabase_url: str, supabase_service_key: str, local_db_url: str):
        self.supabase_url = supabase_url
        self.supabase_service_key = supabase_service_key
        self.local_db_url = local_db_url
        self.supabase_conn = None
        self.migration_steps = []
        
        # Migration file paths
        self.scripts_dir = Path(__file__).parent / 'scripts'
        self.schema_file = self.scripts_dir / 'generate_migration_sql.py'
        self.rls_file = self.scripts_dir / 'rls_policies.sql'
    
    def connect_supabase(self) -> bool:
        """Connect to Supabase database"""
        try:
            logger.info("Connecting to Supabase...")
            self.supabase_conn = psycopg2.connect(
                self.supabase_url,
                cursor_factory=RealDictCursor
            )
            self.supabase_conn.autocommit = False
            
            # Test connection
            with self.supabase_conn.cursor() as cursor:
                cursor.execute("SELECT version()")
                version = cursor.fetchone()['version']
                logger.info(f"Connected to Supabase: {version}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {e}")
            return False
    
    def check_prerequisites(self) -> bool:
        """Check if all prerequisites are met"""
        logger.info("Checking prerequisites...")
        
        # Check if required files exist
        required_files = [self.schema_file, self.rls_file]
        for file_path in required_files:
            if not file_path.exists():
                logger.error(f"Required file not found: {file_path}")
                return False
        
        # Check environment variables
        if not self.supabase_url or not self.supabase_service_key:
            logger.error("Supabase configuration missing")
            return False
        
        # Check Supabase connection
        if not self.connect_supabase():
            return False
        
        logger.info("Prerequisites check passed")
        return True
    
    def backup_existing_data(self) -> bool:
        """Create backup of existing Supabase data"""
        try:
            logger.info("Creating backup of existing data...")
            
            backup_dir = Path(f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
            backup_dir.mkdir(exist_ok=True)
            
            with self.supabase_conn.cursor() as cursor:
                # Get all existing tables
                cursor.execute("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                    ORDER BY table_name
                """)
                tables = [row['table_name'] for row in cursor.fetchall()]
                
                if not tables:
                    logger.info("No existing tables found, skipping backup")
                    return True
                
                logger.info(f"Found {len(tables)} existing tables: {', '.join(tables)}")
                
                # Backup each table
                for table in tables:
                    try:
                        cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                        count = cursor.fetchone()['count']
                        
                        if count > 0:
                            logger.info(f"Backing up {table} ({count} records)...")
                            
                            # Export table structure
                            cursor.execute(f"""
                                SELECT column_name, data_type, is_nullable, column_default
                                FROM information_schema.columns
                                WHERE table_name = '{table}' AND table_schema = 'public'
                                ORDER BY ordinal_position
                            """)
                            columns = cursor.fetchall()
                            
                            backup_file = backup_dir / f"{table}_backup.sql"
                            with open(backup_file, 'w') as f:
                                f.write(f"-- Backup of {table} table\n")
                                f.write(f"-- Created: {datetime.now().isoformat()}\n")
                                f.write(f"-- Records: {count}\n\n")
                                
                                # Write table structure
                                f.write(f"-- Table structure for {table}\n")
                                for col in columns:
                                    f.write(f"-- {col['column_name']}: {col['data_type']}\n")
                                f.write("\n")
                                
                                # Export data
                                cursor.execute(f"SELECT * FROM {table}")
                                rows = cursor.fetchall()
                                
                                if rows:
                                    column_names = list(rows[0].keys())
                                    f.write(f"-- Data for {table}\n")
                                    
                                    for row in rows:
                                        values = []
                                        for col in column_names:
                                            value = row[col]
                                            if value is None:
                                                values.append('NULL')
                                            elif isinstance(value, str):
                                                values.append(f"'{value.replace("'", "''")}'")  # Escape quotes
                                            else:
                                                values.append(str(value))
                                        
                                        f.write(f"INSERT INTO {table} ({', '.join(column_names)}) VALUES ({', '.join(values)});\n")
                        else:
                            logger.info(f"Table {table} is empty, skipping backup")
                            
                    except Exception as e:
                        logger.warning(f"Could not backup table {table}: {e}")
                        continue
            
            logger.info(f"Backup completed in directory: {backup_dir}")
            return True
            
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            return False
    
    def execute_sql_file(self, file_path: Path, description: str) -> bool:
        """Execute SQL commands from a file"""
        try:
            logger.info(f"Executing {description}...")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            # Split SQL content into individual statements
            statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
            
            with self.supabase_conn.cursor() as cursor:
                for i, statement in enumerate(statements):
                    if statement and not statement.startswith('--'):
                        try:
                            cursor.execute(statement)
                            logger.debug(f"Executed statement {i+1}/{len(statements)}")
                        except Exception as e:
                            # Log warning but continue for non-critical errors
                            if "already exists" in str(e).lower():
                                logger.warning(f"Statement {i+1} - Object already exists: {e}")
                            else:
                                logger.error(f"Statement {i+1} failed: {e}")
                                logger.error(f"Statement: {statement[:100]}...")
                                raise
                
                self.supabase_conn.commit()
            
            logger.info(f"{description} completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"{description} failed: {e}")
            self.supabase_conn.rollback()
            return False
    
    def create_database_schema(self) -> bool:
        """Create database schema from SQL file"""
        try:
            logger.info("Creating database schema...")
            
            # Read and execute the schema SQL
            with open(self.schema_file, 'r', encoding='utf-8') as f:
                schema_content = f.read()
            
            # Extract SQL from the Python file (it's stored as a string)
            # Find the SQL content between triple quotes
            start_marker = 'migration_sql = """'
            end_marker = '"""'
            
            start_idx = schema_content.find(start_marker)
            if start_idx == -1:
                logger.error("Could not find SQL content in schema file")
                return False
            
            start_idx += len(start_marker)
            end_idx = schema_content.find(end_marker, start_idx)
            
            if end_idx == -1:
                logger.error("Could not find end of SQL content in schema file")
                return False
            
            sql_content = schema_content[start_idx:end_idx].strip()
            
            # Execute SQL statements
            statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
            
            with self.supabase_conn.cursor() as cursor:
                for i, statement in enumerate(statements):
                    if statement and not statement.startswith('--'):
                        try:
                            cursor.execute(statement)
                            logger.debug(f"Executed schema statement {i+1}/{len(statements)}")
                        except Exception as e:
                            if "already exists" in str(e).lower():
                                logger.warning(f"Schema object already exists: {e}")
                            else:
                                logger.error(f"Schema statement {i+1} failed: {e}")
                                logger.error(f"Statement: {statement[:100]}...")
                                raise
                
                self.supabase_conn.commit()
            
            logger.info("Database schema created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Schema creation failed: {e}")
            self.supabase_conn.rollback()
            return False
    
    def migrate_data(self, dry_run: bool = False) -> bool:
        """Migrate data from local database to Supabase"""
        try:
            logger.info(f"Starting data migration (dry_run={dry_run})...")
            
            # Configure migration
            config = MigrationConfig(
                local_db_url=self.local_db_url,
                supabase_url=self.supabase_url,
                supabase_key=self.supabase_service_key,
                batch_size=1000,
                dry_run=dry_run,
                backup_before_migration=False,  # We already did backup
                validate_after_migration=True
            )
            
            # Run migration
            migrator = DatabaseMigrator(config)
            success = migrator.run_migration()
            
            if success:
                logger.info("Data migration completed successfully")
                
                # Generate and save report
                report = migrator.generate_migration_report()
                report_file = f"data_migration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
                with open(report_file, 'w') as f:
                    f.write(report)
                logger.info(f"Migration report saved to: {report_file}")
            else:
                logger.error("Data migration failed")
            
            return success
            
        except Exception as e:
            logger.error(f"Data migration failed: {e}")
            return False
    
    def setup_row_level_security(self) -> bool:
        """Setup Row Level Security policies"""
        return self.execute_sql_file(self.rls_file, "Row Level Security setup")
    
    def validate_migration(self) -> bool:
        """Validate the complete migration"""
        try:
            logger.info("Validating migration...")
            
            validation_results = []
            
            with self.supabase_conn.cursor() as cursor:
                # Check if all expected tables exist
                cursor.execute("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                    ORDER BY table_name
                """)
                tables = [row['table_name'] for row in cursor.fetchall()]
                
                expected_tables = [
                    'users', 'contact_submissions', 'contact_information', 'seo_settings',
                    'reviews', 'ads', 'job_seekers', 'employers', 'job_categories',
                    'job_posts', 'job_workflow_logs', 'job_applications', 'saved_jobs',
                    'interviews', 'auto_apply_settings', 'email_verification_tokens',
                    'email_templates', 'email_logs', 'system_settings', 'admin_logs',
                    'scraper_config', 'scraper_logs', 'scraper_memory', 'media_files',
                    'carousel_items', 'galleries', 'gallery_images', 'pages',
                    'theme_settings', 'ad_campaigns', 'navigation_menus', 'navigation_items'
                ]
                
                missing_tables = set(expected_tables) - set(tables)
                if missing_tables:
                    logger.error(f"Missing tables: {', '.join(missing_tables)}")
                    return False
                
                logger.info(f"All {len(expected_tables)} expected tables found")
                
                # Check table structures and data
                for table in expected_tables:
                    try:
                        # Check if table has data
                        cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                        count = cursor.fetchone()['count']
                        
                        # Check if RLS is enabled
                        cursor.execute("""
                            SELECT relrowsecurity FROM pg_class 
                            WHERE relname = %s AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
                        """, (table,))
                        rls_result = cursor.fetchone()
                        rls_enabled = rls_result['relrowsecurity'] if rls_result else False
                        
                        validation_results.append({
                            'table': table,
                            'record_count': count,
                            'rls_enabled': rls_enabled
                        })
                        
                        logger.info(f"Table {table}: {count} records, RLS: {rls_enabled}")
                        
                    except Exception as e:
                        logger.error(f"Validation failed for table {table}: {e}")
                        return False
                
                # Check if UUID extension is enabled
                cursor.execute("SELECT * FROM pg_extension WHERE extname = 'uuid-ossp'")
                uuid_ext = cursor.fetchone()
                if not uuid_ext:
                    logger.warning("UUID extension not found")
                else:
                    logger.info("UUID extension is enabled")
                
                # Summary
                total_records = sum(result['record_count'] for result in validation_results)
                tables_with_rls = sum(1 for result in validation_results if result['rls_enabled'])
                
                logger.info(f"Validation Summary:")
                logger.info(f"  - Tables: {len(validation_results)}")
                logger.info(f"  - Total records: {total_records}")
                logger.info(f"  - Tables with RLS: {tables_with_rls}/{len(validation_results)}")
                
                return True
            
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return False
    
    def run_complete_migration(self, dry_run: bool = False, skip_backup: bool = False) -> bool:
        """Run the complete migration process"""
        try:
            logger.info("=" * 60)
            logger.info("STARTING REMOTEHIVE DATABASE MIGRATION TO SUPABASE")
            logger.info("=" * 60)
            logger.info(f"Dry run: {dry_run}")
            logger.info(f"Skip backup: {skip_backup}")
            logger.info("")
            
            # Step 1: Prerequisites
            if not self.check_prerequisites():
                logger.error("Prerequisites check failed")
                return False
            self.migration_steps.append("✓ Prerequisites check")
            
            # Step 2: Backup (if not skipped)
            if not skip_backup:
                if not self.backup_existing_data():
                    logger.error("Backup failed")
                    return False
                self.migration_steps.append("✓ Data backup")
            else:
                logger.info("Skipping backup as requested")
                self.migration_steps.append("⚠ Data backup (skipped)")
            
            # Step 3: Create schema
            if not self.create_database_schema():
                logger.error("Schema creation failed")
                return False
            self.migration_steps.append("✓ Database schema creation")
            
            # Step 4: Migrate data
            if not self.migrate_data(dry_run=dry_run):
                logger.error("Data migration failed")
                return False
            self.migration_steps.append(f"✓ Data migration (dry_run={dry_run})")
            
            # Step 5: Setup RLS (only if not dry run)
            if not dry_run:
                if not self.setup_row_level_security():
                    logger.error("RLS setup failed")
                    return False
                self.migration_steps.append("✓ Row Level Security setup")
            else:
                self.migration_steps.append("⚠ Row Level Security (skipped - dry run)")
            
            # Step 6: Validate
            if not self.validate_migration():
                logger.error("Migration validation failed")
                return False
            self.migration_steps.append("✓ Migration validation")
            
            # Success!
            logger.info("")
            logger.info("=" * 60)
            logger.info("MIGRATION COMPLETED SUCCESSFULLY!")
            logger.info("=" * 60)
            
            for step in self.migration_steps:
                logger.info(f"  {step}")
            
            logger.info("")
            logger.info("Next steps:")
            logger.info("1. Test your application with the new Supabase database")
            logger.info("2. Update your application configuration to use Supabase")
            logger.info("3. Monitor the application for any issues")
            logger.info("4. Remove local database once everything is working")
            
            return True
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return False
        
        finally:
            if self.supabase_conn:
                self.supabase_conn.close()

def main():
    """Main function with command line interface"""
    parser = argparse.ArgumentParser(description='Migrate RemoteHive database to Supabase')
    parser.add_argument('--dry-run', action='store_true', help='Run migration without actually modifying data')
    parser.add_argument('--skip-backup', action='store_true', help='Skip backup of existing data')
    parser.add_argument('--local-db', default='sqlite:///./remotehive.db', help='Local database URL')
    parser.add_argument('--supabase-url', help='Supabase database URL (or set SUPABASE_DATABASE_URL)')
    parser.add_argument('--supabase-key', help='Supabase service role key (or set SUPABASE_SERVICE_ROLE_KEY)')
    
    args = parser.parse_args()
    
    # Get configuration from args or environment
    supabase_url = args.supabase_url or os.getenv('SUPABASE_DATABASE_URL')
    supabase_key = args.supabase_key or os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    local_db_url = args.local_db or os.getenv('LOCAL_DATABASE_URL', 'sqlite:///./remotehive.db')
    
    if not supabase_url or not supabase_key:
        logger.error("Supabase configuration required. Set SUPABASE_DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables or use command line arguments.")
        return False
    
    # Run migration
    orchestrator = SupabaseMigrationOrchestrator(
        supabase_url=supabase_url,
        supabase_service_key=supabase_key,
        local_db_url=local_db_url
    )
    
    success = orchestrator.run_complete_migration(
        dry_run=args.dry_run,
        skip_backup=args.skip_backup
    )
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)