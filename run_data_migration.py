#!/usr/bin/env python3
"""
RemoteHive Data Migration to Supabase
This script migrates data from the local SQLite database to Supabase
"""

import os
import sys
import logging
from datetime import datetime
from pathlib import Path

# Add the database_migration directory to Python path
sys.path.append(str(Path(__file__).parent / 'database_migration'))
sys.path.append(str(Path(__file__).parent / 'database_migration' / 'scripts'))

from migrate_to_supabase import SupabaseMigrationOrchestrator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'data_migration_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Main migration function"""
    
    # Supabase configuration (from Trae integration)
    supabase_project_url = "https://nwltjjqhdpezreaikxfj.supabase.co"
    supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bHRqanFoZHBlenJlYWlreGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzc1NjIsImV4cCI6MjA3MDUxMzU2Mn0.7R1zu7fqvNvWaY_9IbkaM-GHbhRB6Iup_e1sDij_U1o