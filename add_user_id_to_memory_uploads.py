#!/usr/bin/env python3
"""
Add user_id column to memory_uploads table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import get_database_manager
from sqlalchemy import text

def add_user_id_column():
    """Add user_id column to memory_uploads table"""
    db_manager = get_database_manager()
    
    with db_manager.session_scope() as session:
        try:
            # Check if column already exists
            result = session.execute(text("""
                SELECT COUNT(*) as count 
                FROM pragma_table_info('memory_uploads') 
                WHERE name = 'user_id'
            """))
            
            column_exists = result.fetchone()[0] > 0
            
            if column_exists:
                print("user_id column already exists in memory_uploads table")
                return
            
            # Add the user_id column
            session.execute(text("""
                ALTER TABLE memory_uploads 
                ADD COLUMN user_id TEXT NOT NULL DEFAULT 'admin'
            """))
            
            session.commit()
            print("Successfully added user_id column to memory_uploads table")
            
        except Exception as e:
            print(f"Error adding user_id column: {e}")
            session.rollback()
            raise

if __name__ == "__main__":
    add_user_id_column()