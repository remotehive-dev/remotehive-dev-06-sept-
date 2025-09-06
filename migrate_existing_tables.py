#!/usr/bin/env python3
"""
RemoteHive Data Migration Script - Fixed Version
Migrates only tables that exist in both SQLite and Supabase
"""

import os
import sys
import sqlite3
import json
from datetime import datetime
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://nwltjjqhdpezreaikxfj.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bHRqanFoZHBlenJlYWlreGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzNzU2MiwiZXhwIjoyMDcwNTEzNTYyfQ.HYvVlf-4CE0HAn2ZRb9VBxrI9duJvYmRfiJiWKuizbA"

# Tables that exist in both SQLite and Supabase
COMMON_TABLES = [
    'users', 'job_categories', 'system_settings', 'email_templates',
    'employers', 'job_seekers', 'job_posts', 'job_applications',
    'saved_jobs', 'interviews', 'auto_apply_settings',
    'contact_information', 'seo_settings', 'reviews', 'ads',
    'contact_submissions', 'email_logs', 'email_verification_tokens',
    'job_workflow_logs', 'scraper_logs', 'scraper_memory', 'admin_logs'
]

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
            batch_size = 50  # Smaller batch size for better error handling
            batch_data = []
            
            for row in rows:
                try:
                    # Convert SQLite row to dict
                    row_dict = dict(row)
                    
                    # Handle JSON fields
                    for col, value in row_dict.items():
                        if isinstance(value, str) and col in ['skills', 'preferred_job_types', 'preferred_locations', 'settings', 'metadata']:
                            try:
                                # Validate JSON
                                json.loads(value)
                            except:
                                row_dict[col] = None
                                
                        # Handle datetime fields
                        elif col in ['created_at', 'updated_at', 'last_login', 'expires_at', 'sent_at', 'scheduled_for']:
                            if value and isinstance(value, str):
                                # Ensure proper datetime format
                                try:
                                    datetime.fromisoformat(value.replace('Z', '+00:00'))
                                except:
                                    row_dict[col] = None
                    
                    batch_data.append(row_dict)
                    
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
                                except Exception as ie:
                                    self.log(f"Error migrating individual row to {table_name}: {str(ie)[:100]}...", "WARNING")
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
                        except Exception as ie:
                            self.log(f"Error migrating individual row to {table_name}: {str(ie)[:100]}...", "WARNING")
                            
            self.log(f"Successfully migrated {migrated_count}/{total_rows} rows to {table_name}")
            return migrated_count
            
        except Exception as e:
            self.log(f"Error migrating table {table_name}: {e}", "ERROR")
            return 0
            
    def run_migration(self):
        """Run the complete migration process"""
        self.log("Starting RemoteHive data migration to Supabase")
        self.log("=" * 60)
        
        # Connect to databases
        sqlite_conn = self.connect_sqlite()
        if not sqlite_conn:
            return False
            
        if not self.connect_supabase():
            sqlite_conn.close()
            return False
            
        try:
            # Get list of tables to migrate from our common tables list
            sqlite_cursor = sqlite_conn.cursor()
            
            # Check which common tables actually exist in SQLite
            existing_tables = []
            for table in COMMON_TABLES:
                sqlite_cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name=?", 
                    (table,)
                )
                if sqlite_cursor.fetchone():
                    existing_tables.append(table)
                    
            self.log(f"Found {len(existing_tables)} common tables to migrate: {', '.join(existing_tables)}")
            
            total_migrated = 0
            successful_tables = 0
            
            # Migrate each table
            for table_name in existing_tables:
                self.log(f"\nProcessing table: {table_name}")
                migrated_rows = self.migrate_table(sqlite_conn, table_name)
                if migrated_rows > 0:
                    successful_tables += 1
                total_migrated += migrated_rows
                
            self.log("\n" + "=" * 60)
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
    print("\n" + "=" * 60)
    print("REMOTEHIVE DATABASE MIGRATION TO SUPABASE - FIXED VERSION")
    print("=" * 60)
    
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