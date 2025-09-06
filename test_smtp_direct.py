#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging
import asyncio
from app.database.database import get_db_session
from app.api.v1.endpoints.email_management import get_smtp_settings
from unittest.mock import Mock

# Configure logging to see all messages
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def test_smtp_direct():
    """Test SMTP settings function directly"""
    try:
        # Create a mock current_user
        mock_user = Mock()
        mock_user.id = 1
        mock_user.role = 'admin'
        
        # Get database session
        db = next(get_db_session())
        try:
            logger.info("Testing SMTP settings function directly...")
            
            # Call the function directly
            result = await get_smtp_settings(current_user=mock_user, db=db)
            
            logger.info(f"SMTP settings result: {result}")
            print(f"✅ SMTP settings retrieved successfully: {result}")
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error in direct SMTP test: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        print(f"❌ Direct SMTP test failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_smtp_direct())