#!/usr/bin/env python3
"""
Script to run database migrations for fixing scraper config field names.
"""

import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.migrations import MigrationManager
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Run the migration to rename scraper config fields."""
    try:
        logger.info("Starting migration process...")
        
        # Initialize migration manager
        migration_manager = MigrationManager()
        
        # Get current revision
        current_revision = migration_manager.get_current_revision()
        logger.info(f"Current database revision: {current_revision}")
        
        # Run migrations
        logger.info("Running migrations...")
        migration_manager.run_migrations()
        
        # Get new revision
        new_revision = migration_manager.get_current_revision()
        logger.info(f"New database revision: {new_revision}")
        
        logger.info("Migration completed successfully!")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()