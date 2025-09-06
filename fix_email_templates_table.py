#!/usr/bin/env python3
"""
Script to fix the email_templates table by adding the missing category column.
"""

import os
import sys
from loguru import logger
from sqlalchemy import text

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import DatabaseManager

def main():
    """Fix the email_templates table structure."""
    try:
        logger.info("Starting email_templates table fix...")
        
        # Initialize database manager
        db_manager = DatabaseManager()
        logger.info(f"Database engine created: {db_manager.engine.url}")
        
        with db_manager.engine.begin() as conn:
            # Check current table structure
            logger.info("Checking current table structure...")
            result = conn.execute(text("PRAGMA table_info(email_templates)"))
            columns = result.fetchall()
            column_names = [col[1] for col in columns]
            logger.info(f"Current columns: {column_names}")
            
            # Check if category column exists
            if 'category' not in column_names:
                logger.info("Adding missing 'category' column...")
                conn.execute(text(
                    "ALTER TABLE email_templates ADD COLUMN category VARCHAR(50) DEFAULT 'general' NOT NULL"
                ))
                logger.info("✅ Category column added successfully")
            else:
                logger.info("✅ Category column already exists")
        
        # Verify the fix in a separate connection
        with db_manager.engine.connect() as conn:
            logger.info("Verifying table structure after fix...")
            result = conn.execute(text("PRAGMA table_info(email_templates)"))
            columns = result.fetchall()
            column_names = [col[1] for col in columns]
            logger.info(f"Updated columns: {column_names}")
            
            # Check if there are any records
            result = conn.execute(text("SELECT COUNT(*) FROM email_templates"))
            count = result.fetchone()[0]
            logger.info(f"Total email templates: {count}")
            
            if count > 0:
                # Show sample records
                result = conn.execute(text("SELECT id, name, category, template_type FROM email_templates LIMIT 5"))
                records = result.fetchall()
                logger.info("Sample records:")
                for record in records:
                    logger.info(f"  ID: {record[0]}, Name: {record[1]}, Category: {record[2]}, Type: {record[3]}")
        
        logger.info("Email templates table fix completed successfully")
        
    except Exception as e:
        logger.error(f"Error fixing email_templates table: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()