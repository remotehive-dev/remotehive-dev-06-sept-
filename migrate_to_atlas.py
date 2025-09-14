#!/usr/bin/env python3
"""
MongoDB Migration Script: Local to Atlas

This script migrates data from a local MongoDB instance to MongoDB Atlas.
It handles backup, migration, and verification of all collections.

Usage:
    python migrate_to_atlas.py

Environment Variables Required:
    MONGODB_URL - Atlas connection string
    MONGODB_DATABASE_NAME - Target database name
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Missing required packages: {e}")
    print("Please install: pip install pymongo python-dotenv")
    sys.exit(1)

# Load environment variables
load_dotenv()

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

class MongoMigrator:
    """MongoDB migration utility for local to Atlas migration."""
    
    def __init__(self):
        self.local_url = "mongodb://localhost:27017/remotehive"
        self.atlas_url = os.getenv('MONGODB_URL')
        self.database_name = os.getenv('MONGODB_DATABASE_NAME', 'remotehive')
        
        if not self.atlas_url:
            raise ValueError("MONGODB_URL environment variable is required")
        
        self.local_client = None
        self.atlas_client = None
        self.backup_dir = Path(f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        
        logger.info(f"Migration initialized:")
        logger.info(f"  Local: {self.local_url}")
        logger.info(f"  Atlas: {self.atlas_url[:50]}...")
        logger.info(f"  Database: {self.database_name}")
        logger.info(f"  Backup directory: {self.backup_dir}")
    
    def connect_databases(self) -> bool:
        """Establish connections to both local and Atlas databases."""
        try:
            # Connect to local MongoDB
            logger.info("Connecting to local MongoDB...")
            self.local_client = MongoClient(self.local_url, serverSelectionTimeoutMS=5000)
            self.local_client.admin.command('ping')
            logger.info("✓ Local MongoDB connection successful")
            
            # Connect to Atlas
            logger.info("Connecting to MongoDB Atlas...")
            self.atlas_client = MongoClient(self.atlas_url, serverSelectionTimeoutMS=10000)
            self.atlas_client.admin.command('ping')
            logger.info("✓ Atlas MongoDB connection successful")
            
            return True
            
        except ConnectionFailure as e:
            logger.error(f"Connection failed: {e}")
            return False
        except ServerSelectionTimeoutError as e:
            logger.error(f"Server selection timeout: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected connection error: {e}")
            return False
    
    def create_backup(self) -> bool:
        """Create a backup of local database before migration."""
        try:
            logger.info("Creating backup of local database...")
            self.backup_dir.mkdir(exist_ok=True)
            
            local_db = self.local_client[self.database_name]
            collections = local_db.list_collection_names()
            
            if not collections:
                logger.warning("No collections found in local database")
                return True
            
            backup_info = {
                'timestamp': datetime.now().isoformat(),
                'source_database': self.database_name,
                'collections': {},
                'total_documents': 0
            }
            
            for collection_name in collections:
                logger.info(f"Backing up collection: {collection_name}")
                collection = local_db[collection_name]
                
                # Get all documents
                documents = list(collection.find())
                doc_count = len(documents)
                
                # Save to JSON file
                backup_file = self.backup_dir / f"{collection_name}.json"
                with open(backup_file, 'w', encoding='utf-8') as f:
                    json.dump(documents, f, default=str, indent=2, ensure_ascii=False)
                
                backup_info['collections'][collection_name] = {
                    'document_count': doc_count,
                    'backup_file': str(backup_file)
                }
                backup_info['total_documents'] += doc_count
                
                logger.info(f"✓ Backed up {doc_count} documents from {collection_name}")
            
            # Save backup metadata
            with open(self.backup_dir / 'backup_info.json', 'w') as f:
                json.dump(backup_info, f, indent=2)
            
            logger.info(f"✓ Backup completed: {backup_info['total_documents']} total documents")
            return True
            
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            return False
    
    def migrate_collection(self, collection_name: str) -> Dict[str, Any]:
        """Migrate a single collection from local to Atlas."""
        try:
            logger.info(f"Migrating collection: {collection_name}")
            
            # Get source and target collections
            source_collection = self.local_client[self.database_name][collection_name]
            target_collection = self.atlas_client[self.database_name][collection_name]
            
            # Get all documents from source
            documents = list(source_collection.find())
            source_count = len(documents)
            
            if source_count == 0:
                logger.info(f"✓ Collection {collection_name} is empty, skipping")
                return {
                    'collection': collection_name,
                    'source_count': 0,
                    'migrated_count': 0,
                    'status': 'success',
                    'message': 'Empty collection'
                }
            
            # Check if target collection already has data
            target_count_before = target_collection.count_documents({})
            if target_count_before > 0:
                logger.warning(f"Target collection {collection_name} already has {target_count_before} documents")
                
                # Ask user what to do
                response = input(f"Collection {collection_name} exists with {target_count_before} documents. [s]kip, [a]ppend, [r]eplace? ")
                
                if response.lower() == 's':
                    logger.info(f"Skipping collection {collection_name}")
                    return {
                        'collection': collection_name,
                        'source_count': source_count,
                        'migrated_count': 0,
                        'status': 'skipped',
                        'message': 'User chose to skip'
                    }
                elif response.lower() == 'r':
                    logger.info(f"Replacing data in collection {collection_name}")
                    target_collection.delete_many({})
                    target_count_before = 0
            
            # Insert documents in batches
            batch_size = 1000
            migrated_count = 0
            
            for i in range(0, len(documents), batch_size):
                batch = documents[i:i + batch_size]
                try:
                    result = target_collection.insert_many(batch, ordered=False)
                    migrated_count += len(result.inserted_ids)
                    logger.info(f"  Migrated batch {i//batch_size + 1}: {len(batch)} documents")
                except Exception as e:
                    logger.error(f"  Batch {i//batch_size + 1} failed: {e}")
                    # Continue with next batch
            
            # Verify migration
            target_count_after = target_collection.count_documents({})
            expected_count = target_count_before + migrated_count
            
            if target_count_after == expected_count:
                logger.info(f"✓ Collection {collection_name} migrated successfully: {migrated_count} documents")
                status = 'success'
            else:
                logger.warning(f"⚠ Collection {collection_name} count mismatch: expected {expected_count}, got {target_count_after}")
                status = 'partial'
            
            return {
                'collection': collection_name,
                'source_count': source_count,
                'migrated_count': migrated_count,
                'target_count_before': target_count_before,
                'target_count_after': target_count_after,
                'status': status
            }
            
        except Exception as e:
            logger.error(f"Migration failed for collection {collection_name}: {e}")
            return {
                'collection': collection_name,
                'source_count': 0,
                'migrated_count': 0,
                'status': 'error',
                'error': str(e)
            }
    
    def migrate_all_collections(self) -> Dict[str, Any]:
        """Migrate all collections from local to Atlas."""
        try:
            logger.info("Starting migration of all collections...")
            
            local_db = self.local_client[self.database_name]
            collections = local_db.list_collection_names()
            
            if not collections:
                logger.warning("No collections found in local database")
                return {
                    'status': 'success',
                    'message': 'No collections to migrate',
                    'collections': []
                }
            
            logger.info(f"Found {len(collections)} collections to migrate: {collections}")
            
            migration_results = []
            total_migrated = 0
            
            for collection_name in collections:
                result = self.migrate_collection(collection_name)
                migration_results.append(result)
                total_migrated += result.get('migrated_count', 0)
            
            # Summary
            successful = [r for r in migration_results if r['status'] == 'success']
            failed = [r for r in migration_results if r['status'] == 'error']
            skipped = [r for r in migration_results if r['status'] == 'skipped']
            
            logger.info(f"\n=== Migration Summary ===")
            logger.info(f"Total collections: {len(collections)}")
            logger.info(f"Successful: {len(successful)}")
            logger.info(f"Failed: {len(failed)}")
            logger.info(f"Skipped: {len(skipped)}")
            logger.info(f"Total documents migrated: {total_migrated}")
            
            if failed:
                logger.error(f"Failed collections: {[r['collection'] for r in failed]}")
            
            return {
                'status': 'success' if not failed else 'partial',
                'total_collections': len(collections),
                'successful': len(successful),
                'failed': len(failed),
                'skipped': len(skipped),
                'total_migrated': total_migrated,
                'collections': migration_results
            }
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'collections': []
            }
    
    def verify_migration(self) -> Dict[str, Any]:
        """Verify that migration was successful by comparing document counts."""
        try:
            logger.info("Verifying migration...")
            
            local_db = self.local_client[self.database_name]
            atlas_db = self.atlas_client[self.database_name]
            
            local_collections = set(local_db.list_collection_names())
            atlas_collections = set(atlas_db.list_collection_names())
            
            verification_results = []
            
            # Check each local collection
            for collection_name in local_collections:
                local_count = local_db[collection_name].count_documents({})
                atlas_count = atlas_db[collection_name].count_documents({}) if collection_name in atlas_collections else 0
                
                status = 'success' if local_count == atlas_count else 'mismatch'
                
                verification_results.append({
                    'collection': collection_name,
                    'local_count': local_count,
                    'atlas_count': atlas_count,
                    'status': status
                })
                
                if status == 'success':
                    logger.info(f"✓ {collection_name}: {local_count} documents (verified)")
                else:
                    logger.warning(f"⚠ {collection_name}: local={local_count}, atlas={atlas_count}")
            
            # Check for extra collections in Atlas
            extra_collections = atlas_collections - local_collections
            for collection_name in extra_collections:
                atlas_count = atlas_db[collection_name].count_documents({})
                verification_results.append({
                    'collection': collection_name,
                    'local_count': 0,
                    'atlas_count': atlas_count,
                    'status': 'extra_in_atlas'
                })
                logger.info(f"ℹ {collection_name}: {atlas_count} documents (only in Atlas)")
            
            # Summary
            successful = [r for r in verification_results if r['status'] == 'success']
            mismatched = [r for r in verification_results if r['status'] == 'mismatch']
            
            logger.info(f"\n=== Verification Summary ===")
            logger.info(f"Collections verified: {len(verification_results)}")
            logger.info(f"Matching: {len(successful)}")
            logger.info(f"Mismatched: {len(mismatched)}")
            
            return {
                'status': 'success' if not mismatched else 'partial',
                'total_collections': len(verification_results),
                'matching': len(successful),
                'mismatched': len(mismatched),
                'collections': verification_results
            }
            
        except Exception as e:
            logger.error(f"Verification failed: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'collections': []
            }
    
    def close_connections(self):
        """Close database connections."""
        if self.local_client:
            self.local_client.close()
            logger.info("Local MongoDB connection closed")
        
        if self.atlas_client:
            self.atlas_client.close()
            logger.info("Atlas MongoDB connection closed")
    
    def run_migration(self) -> bool:
        """Run the complete migration process."""
        try:
            logger.info("=== Starting MongoDB Migration ===")
            
            # Step 1: Connect to databases
            if not self.connect_databases():
                logger.error("Failed to connect to databases")
                return False
            
            # Step 2: Create backup
            if not self.create_backup():
                logger.error("Failed to create backup")
                return False
            
            # Step 3: Migrate collections
            migration_result = self.migrate_all_collections()
            if migration_result['status'] == 'error':
                logger.error("Migration failed")
                return False
            
            # Step 4: Verify migration
            verification_result = self.verify_migration()
            if verification_result['status'] == 'error':
                logger.error("Verification failed")
                return False
            
            # Step 5: Final summary
            logger.info(f"\n=== Migration Completed ===")
            logger.info(f"Backup location: {self.backup_dir}")
            logger.info(f"Migration status: {migration_result['status']}")
            logger.info(f"Verification status: {verification_result['status']}")
            
            if migration_result['status'] == 'success' and verification_result['status'] == 'success':
                logger.info("✓ Migration completed successfully!")
                return True
            else:
                logger.warning("⚠ Migration completed with issues. Check logs for details.")
                return False
            
        except Exception as e:
            logger.error(f"Migration process failed: {e}")
            return False
        finally:
            self.close_connections()

def main():
    """Main entry point for the migration script."""
    try:
        migrator = MongoMigrator()
        success = migrator.run_migration()
        
        if success:
            logger.info("Migration completed successfully!")
            sys.exit(0)
        else:
            logger.error("Migration failed. Check logs for details.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("Migration interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()