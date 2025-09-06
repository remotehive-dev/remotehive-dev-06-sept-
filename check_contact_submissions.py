#!/usr/bin/env python3
"""
Check Contact Submissions in Database
"""

import sys
import os
from loguru import logger

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import get_supabase_admin

def check_contact_submissions():
    """
    Check contact submissions in the database
    """
    try:
        logger.info("🔍 Checking contact submissions...")
        
        supabase_admin = get_supabase_admin()
        
        # Get all contact submissions
        result = supabase_admin.table('contact_submissions').select('*').order('created_at', desc=True).execute()
        
        logger.info(f"📊 Total submissions found: {len(result.data)}")
        
        if result.data:
            logger.info("\n📋 Recent submissions:")
            for i, submission in enumerate(result.data[:10]):
                logger.info(f"\n  {i+1}. ID: {submission.get('id')}")
                logger.info(f"     Name: {submission.get('name')}")
                logger.info(f"     Email: {submission.get('email')}")
                logger.info(f"     Subject: {submission.get('subject')}")
                logger.info(f"     Status: {submission.get('status')}")
                logger.info(f"     Priority: {submission.get('priority')}")
                logger.info(f"     Created: {submission.get('created_at')}")
        else:
            logger.info("📭 No contact submissions found in database")
            
        return len(result.data)
        
    except Exception as e:
        logger.error(f"❌ Error checking contact submissions: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return 0

if __name__ == '__main__':
    check_contact_submissions()