import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from alembic.config import Config
from alembic import command
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext

from .database import DatabaseManager
from .models import Base

logger = logging.getLogger(__name__)

class MigrationManager:
    def __init__(self, database_url: str = None):
        self.db_manager = DatabaseManager()
        self.engine = self.db_manager.engine
        
        # Setup Alembic configuration
        self.alembic_cfg = Config()
        self.alembic_cfg.set_main_option("script_location", "app/database/alembic")
        self.alembic_cfg.set_main_option("sqlalchemy.url", str(self.engine.url))
    
    def init_alembic(self):
        """Initialize Alembic for the project."""
        try:
            # Create alembic directory if it doesn't exist
            alembic_dir = "app/database/alembic"
            if not os.path.exists(alembic_dir):
                command.init(self.alembic_cfg, alembic_dir)
                logger.info("Alembic initialized successfully")
            else:
                logger.info("Alembic already initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Alembic: {e}")
            raise
    
    def create_migration(self, message: str):
        """Create a new migration."""
        try:
            command.revision(self.alembic_cfg, autogenerate=True, message=message)
            logger.info(f"Migration created: {message}")
        except Exception as e:
            logger.error(f"Failed to create migration: {e}")
            raise
    
    def run_migrations(self):
        """Run all pending migrations."""
        try:
            command.upgrade(self.alembic_cfg, "head")
            logger.info("Migrations completed successfully")
        except Exception as e:
            logger.error(f"Failed to run migrations: {e}")
            raise
    
    def downgrade_migration(self, revision: str = "-1"):
        """Downgrade to a specific revision."""
        try:
            command.downgrade(self.alembic_cfg, revision)
            logger.info(f"Downgraded to revision: {revision}")
        except Exception as e:
            logger.error(f"Failed to downgrade migration: {e}")
            raise
    
    def get_current_revision(self):
        """Get current database revision."""
        try:
            with self.engine.connect() as connection:
                context = MigrationContext.configure(connection)
                return context.get_current_revision()
        except Exception as e:
            logger.error(f"Failed to get current revision: {e}")
            return None
    
    def get_migration_history(self):
        """Get migration history."""
        try:
            script_dir = ScriptDirectory.from_config(self.alembic_cfg)
            revisions = []
            for revision in script_dir.walk_revisions():
                revisions.append({
                    'revision': revision.revision,
                    'down_revision': revision.down_revision,
                    'message': revision.doc,
                    'branch_labels': revision.branch_labels
                })
            return revisions
        except Exception as e:
            logger.error(f"Failed to get migration history: {e}")
            return []
    
    def create_tables_directly(self):
        """Create all tables directly without migrations (for development)."""
        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("All tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create tables: {e}")
            raise
    
    def drop_tables_directly(self):
        """Drop all tables directly (for development)."""
        try:
            Base.metadata.drop_all(bind=self.engine)
            logger.info("All tables dropped successfully")
        except Exception as e:
            logger.error(f"Failed to drop tables: {e}")
            raise
    
    def reset_database(self):
        """Reset database by dropping and recreating all tables."""
        try:
            self.drop_tables_directly()
            self.create_tables_directly()
            logger.info("Database reset successfully")
        except Exception as e:
            logger.error(f"Failed to reset database: {e}")
            raise
    
    def seed_initial_data(self):
        """Seed database with initial data."""
        try:
            Session = sessionmaker(bind=self.engine)
            session = Session()
            
            # Import here to avoid circular imports
            from .seed_data import seed_job_categories, seed_system_settings
            
            # Seed job categories
            seed_job_categories(session)
            
            # Seed system settings
            seed_system_settings(session)
            
            session.commit()
            session.close()
            
            logger.info("Initial data seeded successfully")
        except Exception as e:
            logger.error(f"Failed to seed initial data: {e}")
            if 'session' in locals():
                session.rollback()
                session.close()
            raise

def init_database_with_migrations(database_url: str = None, use_migrations: bool = True):
    """Initialize database with optional migrations."""
    migration_manager = MigrationManager(database_url)
    
    if use_migrations:
        # Use Alembic migrations
        migration_manager.init_alembic()
        migration_manager.run_migrations()
    else:
        # Create tables directly (for development)
        migration_manager.create_tables_directly()
    
    # Seed initial data
    migration_manager.seed_initial_data()
    
    return migration_manager