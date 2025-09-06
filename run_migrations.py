#!/usr/bin/env python3
"""
Script to run database migrations and create all tables.
"""

import os
import sys
from loguru import logger

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.migrations import MigrationManager, init_database_with_migrations
from app.database.database import DatabaseManager

def main():
    """Run database migrations and create tables."""
    try:
        logger.info("Starting database migration process...")
        
        # Initialize database manager
        db_manager = DatabaseManager()
        logger.info(f"Database engine created: {db_manager.engine.url}")
        
        # Create migration manager
        migration_manager = MigrationManager()
        logger.info("Migration manager created")
        
        # Try to run migrations first
        try:
            logger.info("Attempting to run Alembic migrations...")
            migration_manager.init_alembic()
            migration_manager.run_migrations()
            logger.info("Alembic migrations completed successfully")
        except Exception as e:
            logger.warning(f"Alembic migrations failed: {e}")
            logger.info("Falling back to direct table creation...")
            
            # Create tables directly
            migration_manager.create_tables_directly()
            logger.info("Tables created directly")
        
        # Seed initial data
        try:
            migration_manager.seed_initial_data()
            logger.info("Initial data seeded successfully")
        except Exception as e:
            logger.warning(f"Failed to seed initial data: {e}")
        
        # Verify tables were created
        from sqlalchemy import text
        with db_manager.engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            tables = [row[0] for row in result.fetchall()]
            logger.info(f"Tables in database: {tables}")
            
            # Check specifically for email_templates
            if 'email_templates' in tables:
                logger.info("✅ email_templates table created successfully")
                
                # Check table structure
                result = conn.execute(text("PRAGMA table_info(email_templates)"))
                columns = result.fetchall()
                logger.info(f"email_templates columns: {[col[1] for col in columns]}")
            else:
                logger.error("❌ email_templates table not found")
        
        logger.info("Database migration process completed")
        
    except Exception as e:
        logger.error(f"Error during migration: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()