#!/usr/bin/env python3

from app.core.database import get_db
from sqlalchemy import text

def check_scraper_data():
    db = next(get_db())
    
    print("=== SCRAPER MEMORY ANALYSIS ===")
    
    # 1. Check scraper_memory (from previous successful run, we know this works)
    print("\n1. SCRAPER MEMORY (Pre-configured websites):")
    memory_count = db.execute(text("SELECT COUNT(*) FROM scraper_memory;")).fetchone()
    print(f"   Total entries: {memory_count[0]}")
    
    if memory_count[0] > 0:
        memory_data = db.execute(text("SELECT scraper_name, description, is_active, usage_count FROM scraper_memory;")).fetchall()
        print("   Websites in memory:")
        for row in memory_data:
            status = "Active" if row[2] else "Inactive"
            print(f"     - {row[0]} ({row[1]}) - {status} - Used {row[3]} times")
    
    # 2. Check managed_websites
    print("\n2. MANAGED WEBSITES (User-configured websites):")
    managed_count = db.execute(text("SELECT COUNT(*) FROM managed_websites;")).fetchone()
    print(f"   Total entries: {managed_count[0]}")
    
    # 3. Check scraper_configs with correct columns
    print("\n3. SCRAPER CONFIGURATIONS:")
    config_count = db.execute(text("SELECT COUNT(*) FROM scraper_configs;")).fetchone()
    print(f"   Total configurations: {config_count[0]}")
    
    if config_count[0] > 0:
        # Use the columns we know exist from the previous successful query
        config_data = db.execute(text("SELECT config_name, description, base_url, is_active FROM scraper_configs;")).fetchall()
        print("   Configurations:")
        for row in config_data:
            status = "Active" if row[3] else "Inactive"
            print(f"     - {row[0]} ({row[1]}) - {row[2]} - {status}")
    
    # 4. Check mappings
    print("\n4. SCRAPER-WEBSITE MAPPING:")
    mapping_count = db.execute(text("SELECT COUNT(*) FROM scraper_website_mapping;")).fetchone()
    print(f"   Total mappings: {mapping_count[0]}")
    
    # 5. Check sessions
    print("\n5. SCRAPING SESSIONS (Historical data):")
    sessions_count = db.execute(text("SELECT COUNT(*) FROM scraping_sessions;")).fetchone()
    print(f"   Total sessions: {sessions_count[0]}")
    
    if sessions_count[0] > 0:
        try:
            recent_sessions = db.execute(text("SELECT website_url, status, created_at FROM scraping_sessions ORDER BY created_at DESC LIMIT 5;")).fetchall()
            print("   Recent sessions:")
            for row in recent_sessions:
                print(f"     - {row[0]} - {row[1]} - {row[2]}")
        except Exception as e:
            print(f"   Error reading sessions: {e}")
    
    # Summary
    print("\n=== SUMMARY ===")
    total_websites = memory_count[0] + managed_count[0]
    print(f"Total websites in scraper system: {total_websites}")
    print(f"  - Pre-configured (scraper_memory): {memory_count[0]}")
    print(f"  - User-managed (managed_websites): {managed_count[0]}")
    print(f"  - Active configurations: {config_count[0]}")
    print(f"  - Historical scraping sessions: {sessions_count[0]}")
    
    db.close()

if __name__ == '__main__':
    check_scraper_data()