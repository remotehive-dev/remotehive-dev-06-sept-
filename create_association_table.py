#!/usr/bin/env python3
"""
Create association table for ScraperConfig and ManagedWebsite relationship
"""

import sqlite3
from datetime import datetime

def create_association_table():
    """Create the scraper_website_mapping association table"""
    
    # Connect to SQLite database
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    
    try:
        # Create association table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS scraper_website_mapping (
            scraper_config_id INTEGER NOT NULL,
            managed_website_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (scraper_config_id, managed_website_id),
            FOREIGN KEY (scraper_config_id) REFERENCES scraper_configs(id),
            FOREIGN KEY (managed_website_id) REFERENCES managed_websites(id)
        )
        """
        
        cursor.execute(create_table_sql)
        
        # Create indexes for better performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_scraper_website_mapping_scraper_id ON scraper_website_mapping(scraper_config_id)",
            "CREATE INDEX IF NOT EXISTS idx_scraper_website_mapping_website_id ON scraper_website_mapping(managed_website_id)",
            "CREATE INDEX IF NOT EXISTS idx_scraper_website_mapping_created_at ON scraper_website_mapping(created_at)"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
        
        conn.commit()
        print("Association table created successfully!")
        
        # Verify table creation
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='scraper_website_mapping'")
        result = cursor.fetchone()
        
        if result:
            print(f"✓ Table 'scraper_website_mapping' created successfully")
        else:
            print("✗ Failed to create table 'scraper_website_mapping'")
            
    except Exception as e:
        print(f"Error creating association table: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_association_table()