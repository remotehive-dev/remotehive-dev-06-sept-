#!/usr/bin/env python3
"""
Data Migration Script for RemoteHive
Migrates data from local SQLAlchemy database to Supabase PostgreSQL

This script:
1. Connects to both local and remote databases
2. Migrates data in correct order (respecting foreign keys)
3. Handles UUID conversion for primary keys
4. Provides detailed logging and error handling
5. Validates data integrity after migration
6. Supports rollback on failure
"""

import os
import sys
import uuid
import logging
import traceback
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class MigrationConfig:
    """Configuration for database migration"""
    local_db_url: str
    supabase_url: str
    supabase_key: str
    batch_size: int = 1000
    dry_run: bool = False
    backup_before_migration: bool = True
    validate_after_migration: bool = True

class DatabaseMigrator:
    """Handles database migration from local SQLAlchemy to Supabase"""
    
    def __init__(self, config: MigrationConfig):
        self.config = config
        self.local_engine = None
        self.local_session = None
        self.supabase_conn = None
        self.migration_log = []
        self.id_mappings = {}  # Maps old IDs to new UUIDs
        
        # Define migration order (respecting foreign key dependencies)
        self.migration_order = [
            # Core tables first (no dependencies)
            'users',
            'contact_information',
            'seo_settings',
            'system_settings',
            'theme_settings',
            'job_categories',
            'email_templates',
            
            # User-dependent tables
            'job_seekers',
            'employers',
            'email_verification_tokens',
            'admin_logs',
            'media_files',
            'navigation_menus',
            
            # Content tables
            'pages',
            'reviews',
            'ads',
            'ad_campaigns',
            'galleries',
            'carousel_items',
            'navigation_items',
            
            # Job-related tables
            'job_posts',
            'auto_apply_settings',
            'saved_jobs',
            'job_applications',
            'interviews',
            'job_workflow_logs',
            
            # Gallery images (depends on galleries)
            'gallery_images',
            
            # Contact and email logs
            'contact_submissions',
            'email_logs',
            
            # Scraper tables
            'scraper_config',
            'scraper_logs',
            'scraper_memory'
        ]
    
    def connect_databases(self) -> bool:
        """Establish connections to both databases"""
        try:
            # Connect to local database
            logger.info("Connecting to local database...")
            self.local_engine = create_engine(self.config.local_db_url)
            Session = sessionmaker(bind=self.local_engine)
            self.local_session = Session()
            
            # Test local connection
            self.local_session.execute(text("SELECT 1"))
            logger.info("Local database connection established")
            
            # Connect to Supabase
            logger.info("Connecting to Supabase...")
            self.supabase_conn = psycopg2.connect(
                self.config.supabase_url,
                cursor_factory=RealDictCursor
            )
            self.supabase_conn.autocommit = False
            
            # Test Supabase connection
            with self.supabase_conn.cursor() as cursor:
                cursor.execute("SELECT 1")
            logger.info("Supabase connection established")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to databases: {e}")
            return False
    
    def backup_supabase_data(self) -> bool:
        """Create backup of existing Supabase data"""
        if not self.config.backup_before_migration:
            return True
            
        try:
            logger.info("Creating backup of existing Supabase data...")
            backup_dir = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            os.makedirs(backup_dir, exist_ok=True)
            
            with self.supabase_conn.cursor() as cursor:
                # Get all tables
                cursor.execute("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                """)
                tables = [row['table_name'] for row in cursor.fetchall()]
                
                for table in tables:
                    cursor.execute(f"SELECT * FROM {table}")
                    rows = cursor.fetchall()
                    
                    if rows:
                        backup_file = os.path.join(backup_dir, f"{table}.sql")
                        with open(backup_file, 'w') as f:
                            f.write(f"-- Backup of {table} table\n")
                            for row in rows:
                                columns = list(row.keys())
                                values = [str(row[col]) for col in columns]
                                f.write(f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join(values)});\n")
            
            logger.info(f"Backup created in {backup_dir}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            return False
    
    def generate_uuid_mapping(self, table_name: str, local_data: List[Dict]) -> Dict[int, str]:
        """Generate UUID mappings for integer primary keys"""
        mapping = {}
        for row in local_data:
            old_id = row.get('id')
            if old_id is not None:
                new_uuid = str(uuid.uuid4())
                mapping[old_id] = new_uuid
                self.id_mappings[f"{table_name}_{old_id}"] = new_uuid
        return mapping
    
    def transform_row_data(self, table_name: str, row: Dict, uuid_mapping: Dict[int, str]) -> Dict:
        """Transform row data for Supabase compatibility"""
        transformed = row.copy()
        
        # Convert primary key to UUID
        if 'id' in transformed and transformed['id'] is not None:
            transformed['id'] = uuid_mapping.get(transformed['id'], str(uuid.uuid4()))
        
        # Handle foreign key conversions
        foreign_key_mappings = {
            'user_id': 'users',
            'job_seeker_id': 'job_seekers',
            'employer_id': 'employers',
            'job_post_id': 'job_posts',
            'application_id': 'job_applications',
            'category_id': 'job_categories',
            'gallery_id': 'galleries',
            'menu_id': 'navigation_menus',
            'parent_id': 'navigation_items',
            'uploaded_by': 'users',
            'created_by': 'users',
            'author_id': 'users',
            'admin_id': 'users'
        }
        
        for fk_field, ref_table in foreign_key_mappings.items():
            if fk_field in transformed and transformed[fk_field] is not None:
                old_fk_id = transformed[fk_field]
                new_fk_uuid = self.id_mappings.get(f"{ref_table}_{old_fk_id}")
                if new_fk_uuid:
                    transformed[fk_field] = new_fk_uuid
                else:
                    logger.warning(f"No UUID mapping found for {fk_field}={old_fk_id} in table {table_name}")
        
        # Handle datetime fields
        datetime_fields = ['created_at', 'updated_at', 'last_login', 'expires_at', 
                          'start_date', 'end_date', 'scheduled_time', 'sent_at']
        for field in datetime_fields:
            if field in transformed and transformed[field] is not None:
                if isinstance(transformed[field], str):
                    # Already a string, keep as is
                    pass
                else:
                    # Convert to ISO format
                    transformed[field] = transformed[field].isoformat() if hasattr(transformed[field], 'isoformat') else str(transformed[field])
        
        # Handle JSON fields
        json_fields = ['preferences', 'skills', 'content_blocks', 'settings', 
                      'criteria', 'metadata', 'config', 'memory_data']
        for field in json_fields:
            if field in transformed and transformed[field] is not None:
                if isinstance(transformed[field], str):
                    # Already JSON string
                    pass
                else:
                    # Convert to JSON string
                    import json
                    transformed[field] = json.dumps(transformed[field])
        
        return transformed
    
    def migrate_table(self, table_name: str) -> bool:
        """Migrate a single table from local to Supabase"""
        try:
            logger.info(f"Migrating table: {table_name}")
            
            # Check if table exists in local database
            try:
                result = self.local_session.execute(text(f"SELECT * FROM {table_name} LIMIT 1"))
                result.fetchone()
            except SQLAlchemyError:
                logger.info(f"Table {table_name} does not exist in local database, skipping")
                return True
            
            # Fetch all data from local table
            result = self.local_session.execute(text(f"SELECT * FROM {table_name}"))
            local_data = [dict(row._mapping) for row in result]
            
            if not local_data:
                logger.info(f"No data found in table {table_name}")
                return True
            
            logger.info(f"Found {len(local_data)} records in {table_name}")
            
            # Generate UUID mappings for this table
            uuid_mapping = self.generate_uuid_mapping(table_name, local_data)
            
            # Transform data for Supabase
            transformed_data = []
            for row in local_data:
                try:
                    transformed_row = self.transform_row_data(table_name, row, uuid_mapping)
                    transformed_data.append(transformed_row)
                except Exception as e:
                    logger.error(f"Failed to transform row in {table_name}: {e}")
                    logger.error(f"Row data: {row}")
                    continue
            
            if not transformed_data:
                logger.warning(f"No valid data to migrate for table {table_name}")
                return True
            
            # Insert data into Supabase in batches
            if not self.config.dry_run:
                with self.supabase_conn.cursor() as cursor:
                    # Get column names from first row
                    columns = list(transformed_data[0].keys())
                    
                    # Prepare insert statement
                    placeholders = ', '.join(['%s'] * len(columns))
                    insert_sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
                    
                    # Insert in batches
                    for i in range(0, len(transformed_data), self.config.batch_size):
                        batch = transformed_data[i:i + self.config.batch_size]
                        values = [[row[col] for col in columns] for row in batch]
                        
                        try:
                            execute_values(
                                cursor,
                                insert_sql,
                                values,
                                template=None,
                                page_size=self.config.batch_size
                            )
                            logger.info(f"Inserted batch {i//self.config.batch_size + 1} for {table_name}")
                        except Exception as e:
                            logger.error(f"Failed to insert batch for {table_name}: {e}")
                            # Log problematic data
                            for j, row in enumerate(batch):
                                logger.error(f"Batch row {j}: {row}")
                            raise
            
            self.migration_log.append({
                'table': table_name,
                'records_migrated': len(transformed_data),
                'status': 'success',
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"Successfully migrated {len(transformed_data)} records from {table_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to migrate table {table_name}: {e}")
            logger.error(traceback.format_exc())
            self.migration_log.append({
                'table': table_name,
                'records_migrated': 0,
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            return False
    
    def validate_migration(self) -> bool:
        """Validate that migration was successful"""
        if not self.config.validate_after_migration:
            return True
            
        try:
            logger.info("Validating migration...")
            validation_results = []
            
            for table_name in self.migration_order:
                # Check if table exists in local database
                try:
                    local_result = self.local_session.execute(text(f"SELECT COUNT(*) as count FROM {table_name}"))
                    local_count = local_result.fetchone()[0]
                except SQLAlchemyError:
                    local_count = 0
                
                # Check Supabase count
                with self.supabase_conn.cursor() as cursor:
                    try:
                        cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
                        supabase_count = cursor.fetchone()['count']
                    except Exception:
                        supabase_count = 0
                
                validation_results.append({
                    'table': table_name,
                    'local_count': local_count,
                    'supabase_count': supabase_count,
                    'match': local_count == supabase_count
                })
                
                if local_count != supabase_count:
                    logger.warning(f"Count mismatch for {table_name}: local={local_count}, supabase={supabase_count}")
                else:
                    logger.info(f"Validation passed for {table_name}: {local_count} records")
            
            # Check overall validation
            all_valid = all(result['match'] for result in validation_results)
            
            if all_valid:
                logger.info("Migration validation passed!")
            else:
                logger.error("Migration validation failed!")
                for result in validation_results:
                    if not result['match']:
                        logger.error(f"  {result['table']}: {result['local_count']} -> {result['supabase_count']}")
            
            return all_valid
            
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return False
    
    def rollback_migration(self) -> bool:
        """Rollback migration by clearing Supabase tables"""
        try:
            logger.info("Rolling back migration...")
            
            with self.supabase_conn.cursor() as cursor:
                # Disable foreign key checks temporarily
                cursor.execute("SET session_replication_role = replica;")
                
                # Clear tables in reverse order
                for table_name in reversed(self.migration_order):
                    try:
                        cursor.execute(f"TRUNCATE TABLE {table_name} CASCADE")
                        logger.info(f"Cleared table {table_name}")
                    except Exception as e:
                        logger.warning(f"Could not clear table {table_name}: {e}")
                
                # Re-enable foreign key checks
                cursor.execute("SET session_replication_role = DEFAULT;")
                
                self.supabase_conn.commit()
            
            logger.info("Migration rollback completed")
            return True
            
        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return False
    
    def run_migration(self) -> bool:
        """Run the complete migration process"""
        try:
            logger.info("Starting database migration...")
            
            # Connect to databases
            if not self.connect_databases():
                return False
            
            # Create backup
            if not self.backup_supabase_data():
                logger.error("Backup failed, aborting migration")
                return False
            
            # Start transaction
            if not self.config.dry_run:
                self.supabase_conn.begin()
            
            try:
                # Migrate tables in order
                for table_name in self.migration_order:
                    if not self.migrate_table(table_name):
                        logger.error(f"Migration failed at table {table_name}")
                        if not self.config.dry_run:
                            self.supabase_conn.rollback()
                            self.rollback_migration()
                        return False
                
                # Validate migration
                if not self.validate_migration():
                    logger.error("Migration validation failed")
                    if not self.config.dry_run:
                        self.supabase_conn.rollback()
                        self.rollback_migration()
                    return False
                
                # Commit transaction
                if not self.config.dry_run:
                    self.supabase_conn.commit()
                    logger.info("Migration committed successfully")
                else:
                    logger.info("Dry run completed successfully")
                
                return True
                
            except Exception as e:
                logger.error(f"Migration failed: {e}")
                if not self.config.dry_run:
                    self.supabase_conn.rollback()
                    self.rollback_migration()
                return False
            
        except Exception as e:
            logger.error(f"Migration process failed: {e}")
            return False
        
        finally:
            # Close connections
            if self.local_session:
                self.local_session.close()
            if self.supabase_conn:
                self.supabase_conn.close()
    
    def generate_migration_report(self) -> str:
        """Generate a detailed migration report"""
        report = []
        report.append("=" * 60)
        report.append("DATABASE MIGRATION REPORT")
        report.append("=" * 60)
        report.append(f"Migration Date: {datetime.now().isoformat()}")
        report.append(f"Dry Run: {self.config.dry_run}")
        report.append("")
        
        successful_tables = [log for log in self.migration_log if log['status'] == 'success']
        failed_tables = [log for log in self.migration_log if log['status'] == 'failed']
        
        report.append(f"Tables Migrated Successfully: {len(successful_tables)}")
        report.append(f"Tables Failed: {len(failed_tables)}")
        report.append("")
        
        if successful_tables:
            report.append("SUCCESSFUL MIGRATIONS:")
            report.append("-" * 30)
            for log in successful_tables:
                report.append(f"  {log['table']}: {log['records_migrated']} records")
            report.append("")
        
        if failed_tables:
            report.append("FAILED MIGRATIONS:")
            report.append("-" * 30)
            for log in failed_tables:
                report.append(f"  {log['table']}: {log.get('error', 'Unknown error')}")
            report.append("")
        
        total_records = sum(log['records_migrated'] for log in successful_tables)
        report.append(f"Total Records Migrated: {total_records}")
        report.append("=" * 60)
        
        return "\n".join(report)

def main():
    """Main migration function"""
    # Configuration
    config = MigrationConfig(
        local_db_url=os.getenv('LOCAL_DATABASE_URL', 'sqlite:///./remotehive.db'),
        supabase_url=os.getenv('SUPABASE_DATABASE_URL'),
        supabase_key=os.getenv('SUPABASE_SERVICE_ROLE_KEY'),
        batch_size=1000,
        dry_run=os.getenv('DRY_RUN', 'false').lower() == 'true',
        backup_before_migration=True,
        validate_after_migration=True
    )
    
    if not config.supabase_url or not config.supabase_key:
        logger.error("Supabase configuration missing. Please set SUPABASE_DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return False
    
    # Run migration
    migrator = DatabaseMigrator(config)
    success = migrator.run_migration()
    
    # Generate report
    report = migrator.generate_migration_report()
    logger.info("\n" + report)
    
    # Save report to file
    with open(f"migration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt", 'w') as f:
        f.write(report)
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)