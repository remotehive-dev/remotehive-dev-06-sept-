#!/usr/bin/env python3

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import DatabaseManager
from sqlalchemy import text
from loguru import logger

def fix_scraper_memory_table():
    """Fix the scraper_memory table schema to match the ScraperMemory model"""
    try:
        db_manager = DatabaseManager()
        engine = db_manager.engine
        
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                logger.info("Dropping existing scraper_memory table...")
                conn.execute(text("DROP TABLE IF EXISTS scraper_memory"))
                
                logger.info("Creating new scraper_memory table with correct schema...")
                create_table_sql = """
                CREATE TABLE scraper_memory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    scraper_name VARCHAR(255) NOT NULL UNIQUE,
                    description TEXT,
                    content TEXT NOT NULL,
                    tags TEXT DEFAULT '[]',
                    is_active BOOLEAN DEFAULT 1,
                    usage_count INTEGER DEFAULT 0,
                    last_used_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
                """
                conn.execute(text(create_table_sql))
                
                logger.info("Creating indexes...")
                indexes_sql = [
                    "CREATE INDEX idx_scraper_memory_scraper_name ON scraper_memory(scraper_name)",
                    "CREATE INDEX idx_scraper_memory_is_active ON scraper_memory(is_active)",
                    "CREATE INDEX idx_scraper_memory_usage_count ON scraper_memory(usage_count DESC)",
                    "CREATE INDEX idx_scraper_memory_created_at ON scraper_memory(created_at DESC)"
                ]
                
                for index_sql in indexes_sql:
                    conn.execute(text(index_sql))
                
                logger.info("Creating trigger for updated_at...")
                trigger_sql = """
                CREATE TRIGGER update_scraper_memory_updated_at
                    AFTER UPDATE ON scraper_memory
                    FOR EACH ROW
                    BEGIN
                        UPDATE scraper_memory SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                    END
                """
                conn.execute(text(trigger_sql))
                
                logger.info("Inserting sample scraper memory data...")
                sample_data_sql = """
                INSERT INTO scraper_memory (scraper_name, description, content, tags) VALUES
                ('remote-europe.com', 'European remote job board', '{"selectors": {"job_title": ".job-title", "company": ".company-name", "location": ".location"}}', '["remote", "europe"]'),
                ('arc.dev', 'Tech-focused job board', '{"selectors": {"job_title": "h3.job-title", "company": ".company", "location": ".location"}}', '["tech", "remote"]'),
                ('remote4me.com', 'General remote job listings', '{"selectors": {"job_title": ".title", "company": ".company", "location": ".loc"}}', '["remote", "general"]')
                """
                conn.execute(text(sample_data_sql))
                
                # Commit transaction
                trans.commit()
                logger.success("Successfully fixed scraper_memory table schema!")
                
            except Exception as e:
                trans.rollback()
                logger.error(f"Error during transaction: {e}")
                raise
                
    except Exception as e:
        logger.error(f"Failed to fix scraper_memory table: {e}")
        return False
    
    return True

if __name__ == "__main__":
    logger.info("Starting scraper_memory table schema fix...")
    success = fix_scraper_memory_table()
    if success:
        logger.success("Schema fix completed successfully!")
    else:
        logger.error("Schema fix failed!")
        sys.exit(1)