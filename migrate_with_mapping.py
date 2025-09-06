#!/usr/bin/env python3
"""
RemoteHive Data Migration Script - Final Schema Mapping Version
Migrates data with proper column mapping between SQLite and Supabase
"""

import os
import sys
import sqlite3
import json
import uuid
from datetime import datetime
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://nwltjjqhdpezreaikxfj.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bHRqanFoZHBlenJlYWlreGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzNzU2MiwiZXhwIjoyMDcwNTEzNTYyfQ.HYvVlf-4CE0HAn2ZRb9VBxrI9duJvYmRfiJiWKuizbA"

# Column mappings for each table - only include columns that exist in both databases
TABLE_MAPPINGS = {
    'users': {
        'columns': ['id', 'email', 'password_hash', 'first_name', 'last_name', 'phone', 'is_active', 'is_verified', 'created_at', 'updated_at'],
        'transformations': {
            'is_admin': lambda row: row.get('role') == 'admin' if 'role' in row else False
        }
    },
    'job_categories': {
        'columns': ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at'],
        'transformations': {
            'slug': lambda row: row.get('name', '').lower().replace(' ', '-').replace('_', '-') if row.get('name') else 'category'
        }
    },
    'system_settings': {
        'columns': ['id', 'key', 'value', 'description', 'created_at', 'updated_at'],
        'transformations': {
            'is_public': lambda row: row.get('is_public', True)
        }
    },
    'email_templates': {
        'columns': ['id', 'name', 'subject', 'body', 'is_active', 'created_at', 'updated_at'],
        'transformations': {}
    },
    'employers': {
        'columns': ['id', 'user_id', 'company_name', 'company_description', 'industry', 'company_size', 'created_at', 'updated_at'],
        'transformations': {
            'company_website': lambda row: row.get('website'),
            'company_logo': lambda row: row.get('logo_url'),
            'headquarters': lambda row: row.get('location'),
            'verification_status': lambda row: 'verified' if row.get('is_verified') else 'pending'
        }
    },
    'job_seekers': {
        'columns': ['id', 'user_id', 'resume_url', 'skills', 'experience_years', 'education', 'preferred_job_types', 'preferred_locations', 'salary_expectation', 'availability', 'created_at', 'updated_at'],
        'transformations': {}
    },
    'job_posts': {
        'columns': ['id', 'employer_id', 'category_id', 'title', 'description', 'requirements', 'salary_min', 'salary_max', 'location', 'experience_level', 'created_at', 'updated_at'],
        'transformations': {
            'employment_type': lambda row: row.get('job_type'),
            'status': lambda row: 'active' if row.get('is_active') else 'inactive',
            'application_deadline': lambda row: row.get('expires_at')
        }
    }
}

class DataMigrator:
    def __init__(self):
        self.sqlite_db = 'remotehive.db'
        self.migration_log = []
        self.supabase: Client = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {message}"
        print(log_entry)
        self.migration_log.append(log_entry)
        
    def connect_sqlite(self):
        """Connect to SQLite database"""
        try:
            conn = sqlite3.connect(self.sqlite_db)
            conn.row_factory = sqlite3.Row
            self.log(f"Connected to SQLite database: {self.sqlite_db}")
            return conn
        except Exception as e:
            self.log(f"Failed to connect to SQLite: {e}", "ERROR")
            return None
            
    def connect_supabase(self):
        """Connect to Supabase using client library"""
        try:
            self.supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            # Test connection
            result = self.supabase.table('users').select('count', count='exact').execute()
            self.log("Connected to Supabase successfully")
            return True
        except Exception as e:
            self.log(f"Failed to connect to Supabase: {e}", "ERROR")
            return False
            
    def transform_row(self, table_name, row_dict):
        """Transform a row according to table mapping"""
        if table_name not in TABLE_MAPPINGS:
            return row_dict
            
        mapping = TABLE_MAPPINGS[table_name]
        transformed_row = {}
        
        # Copy mapped columns that exist in both databases
        for col in mapping['columns']:
            if col in row_dict:
                transformed_row[col] = row_dict[col]
            else:
                transformed_row[col] = None
                
        # Apply transformations to add missing columns
        if 'transformations' in mapping:
            for col, transform_func in mapping['transformations'].items():
                try:
                    transformed_row[col] = transform_func(row_dict)
                except:
                    transformed_row[col] = None
                        
        # Handle datetime fields
        for col in ['created_at', 'updated_at', 'expires_at', 'last_login', 'application_deadline']:
            if col in transformed_row and transformed_row[col]:
                if isinstance(transformed_row[col], str):
                    try:
                        # Ensure proper datetime format
                        dt = datetime.fromisoformat(transformed_row[col].replace('Z', '+00:00'))
                        transformed_row[col] = dt.isoformat()
                    except:
                        transformed_row[col] = None
                        
        # Handle JSON fields
        for col in ['skills', 'preferred_job_types', 'preferred_locations', 'settings', 'metadata']:
            if col in transformed_row and transformed_row[col]:
                if isinstance(transformed_row[col], str):
                    try:
                        json.loads(transformed_row[col])
                    except:
                        transformed_row[col] = None
                        
        # Remove None values to avoid inserting nulls where not needed
        transformed_row = {k: v for k, v in transformed_row.items() if v is not None}
                        
        return transformed_row
            
    def migrate_table(self, sqlite_conn, table_name):
        """Migrate data from SQLite table to Supabase table"""
        try:
            sqlite_cursor = sqlite_conn.cursor()
            
            # Check if table exists in SQLite
            sqlite_cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?", 
                (table_name,)
            )
            if not sqlite_cursor.fetchone():
                self.log(f"Table {table_name} not found in SQLite, skipping")
                return 0
                
            # Get row count from SQLite
            sqlite_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            total_rows = sqlite_cursor.fetchone()[0]
            
            if total_rows == 0:
                self.log(f"Table {table_name} is empty, skipping")
                return 0
                
            self.log(f"Migrating {total_rows} rows from {table_name}...")
            
            # Get all data from SQLite
            sqlite_cursor.execute(f"SELECT * FROM {table_name}")
            rows = sqlite_cursor.fetchall()
            
            migrated_count = 0
            batch_size = 5  # Very small batch size for better error handling
            batch_data = []
            
            for row in rows:
                try:
                    # Convert SQLite row to dict
                    row_dict = dict(row)
                    
                    # Transform row according to schema mapping
                    transformed_row = self.transform_row(table_name, row_dict)
                    
                    # Skip empty rows
                    if not transformed_row:
                        continue
                        
                    batch_data.append(transformed_row)
                    
                    # Process batch when it reaches batch_size
                    if len(batch_data) >= batch_size:
                        try:
                            result = self.supabase.table(table_name).upsert(batch_data).execute()
                            migrated_count += len(batch_data)
                            self.log(f"Migrated batch of {len(batch_data)} rows to {table_name}")
                            batch_data = []
                        except Exception as e:
                            self.log(f"Error migrating batch to {table_name}: {e}", "WARNING")
                            # Try individual inserts for failed batch
                            for item in batch_data:
                                try:
                                    self.supabase.table(table_name).upsert([item]).execute()
                                    migrated_count += 1
                                    self.log(f"Successfully migrated individual row to {table_name}")
                                except Exception as ie:
                                    self.log(f"Error migrating individual row to {table_name}: {str(ie)[:200]}...", "WARNING")
                            batch_data = []
                    
                except Exception as e:
                    self.log(f"Error processing row in {table_name}: {e}", "WARNING")
                    continue
                    
            # Process remaining batch
            if batch_data:
                try:
                    result = self.supabase.table(table_name).upsert(batch_data).execute()
                    migrated_count += len(batch_data)
                    self.log(f"Migrated final batch of {len(batch_data)} rows to {table_name}")
                except Exception as e:
                    self.log(f"Error migrating final batch to {table_name}: {e}", "WARNING")
                    # Try individual inserts for failed batch
                    for item in batch_data:
                        try:
                            self.supabase.table(table_name).upsert([item]).execute()
                            migrated_count += 1
                            self.log(f"Successfully migrated individual row to {table_name}")
                        except Exception as ie:
                            self.log(f"Error migrating individual row to {table_name}: {str(ie)[:200]}...", "WARNING")
                            
            self.log(f"Successfully migrated {migrated_count}/{total_rows} rows to {table_name}")
            return migrated_count
            
        except Exception as e:
            self.log(f"Error migrating table {table_name}: {e}", "ERROR")
            return 0
            
    def run_migration(self):
        """Run the complete migration process"""
        self.log("Starting RemoteHive data migration to Supabase - Final Version")
        self.log("=" * 70)
        
        # Connect to databases
        sqlite_conn = self.connect_sqlite()
        if not sqlite_conn:
            return False
            
        if not self.connect_supabase():
            sqlite_conn.close()
            return False
            
        try:
            # Get list of tables to migrate from our mappings
            tables_to_migrate = list(TABLE_MAPPINGS.keys())
            
            # Check which tables actually exist in SQLite
            sqlite_cursor = sqlite_conn.cursor()
            existing_tables = []
            for table in tables_to_migrate:
                sqlite_cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name=?", 
                    (table,)
                )
                if sqlite_cursor.fetchone():
                    existing_tables.append(table)
                    
            self.log(f"Found {len(existing_tables)} mapped tables to migrate: {', '.join(existing_tables)}")
            
            total_migrated = 0
            successful_tables = 0
            
            # Migrate each table in dependency order
            migration_order = ['users', 'job_categories', 'system_settings', 'email_templates', 'employers', 'job_seekers', 'job_posts']
            
            for table_name in migration_order:
                if table_name in existing_tables:
                    self.log(f"\nProcessing table: {table_name}")
                    migrated_rows = self.migrate_table(sqlite_conn, table_name)
                    if migrated_rows > 0:
                        successful_tables += 1
                    total_migrated += migrated_rows
                
            self.log("\n" + "=" * 70)
            self.log(f"Migration completed!")
            self.log(f"Tables processed: {len(existing_tables)}")
            self.log(f"Tables with data migrated: {successful_tables}")
            self.log(f"Total rows migrated: {total_migrated}")
            
            return True
            
        except Exception as e:
            self.log(f"Migration failed: {e}", "ERROR")
            return False
            
        finally:
            sqlite_conn.close()
            self.log("Database connections closed")
            
    def save_migration_log(self):
        """Save migration log to file"""
        log_filename = f"migration_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        try:
            with open(log_filename, 'w') as f:
                f.write("\n".join(self.migration_log))
            self.log(f"Migration log saved to: {log_filename}")
        except Exception as e:
            self.log(f"Failed to save migration log: {e}", "ERROR")

def main():
    print("\n" + "=" * 70)
    print("REMOTEHIVE DATABASE MIGRATION TO SUPABASE - FINAL VERSION")
    print("=" * 70)
    
    migrator = DataMigrator()
    
    # Check if SQLite database exists
    if not os.path.exists(migrator.sqlite_db):
        print(f"ERROR: SQLite database '{migrator.sqlite_db}' not found!")
        return False
        
    # Run migration
    success = migrator.run_migration()
    
    # Save log
    migrator.save_migration_log()
    
    if success:
        print("\n✅ Migration completed successfully!")
        print("\nNext steps:")
        print("1. Verify data in Supabase dashboard")
        print("2. Update application configuration to use Supabase")
        print("3. Test application functionality")
    else:
        print("\n❌ Migration failed! Check the logs for details.")
        
    return success

if __name__ == "__main__":
    main()