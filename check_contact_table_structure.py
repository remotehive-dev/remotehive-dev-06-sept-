#!/usr/bin/env python3
"""
Check Contact Submissions Table Structure
Inspect the actual columns in the contact_submissions table
"""

import sys
import os
from loguru import logger

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import get_supabase_admin

def check_contact_table_structure():
    """
    Check the structure of contact_submissions table
    """
    try:
        logger.info("🔍 Checking contact_submissions table structure...")
        
        supabase_admin = get_supabase_admin()
        
        # Try to get existing submissions to see the structure
        logger.info("1. Checking existing submissions...")
        result = supabase_admin.table('contact_submissions').select('*').limit(5).execute()
        
        if result.data:
            logger.info(f"✅ Found {len(result.data)} existing submissions")
            sample = result.data[0]
            logger.info(f"📋 Available columns: {list(sample.keys())}")
            
            # Show sample data
            for i, submission in enumerate(result.data):
                logger.info(f"\n📝 Submission {i+1}:")
                for key, value in submission.items():
                    logger.info(f"   {key}: {value}")
        else:
            logger.info("📋 No existing submissions found")
            
            # Try a simple insert to see what columns are expected
            logger.info("\n2. Testing minimal insert to discover required columns...")
            
            minimal_data = {
                "name": "Test",
                "email": "ranjeettiwari105@gmail.com",
                "message": "Test message"
            }
            
            try:
                insert_result = supabase_admin.table('contact_submissions').insert(minimal_data).execute()
                
                if insert_result.data:
                    logger.info("✅ Minimal insert successful")
                    inserted = insert_result.data[0]
                    logger.info(f"📋 Inserted record columns: {list(inserted.keys())}")
                    
                    # Clean up
                    supabase_admin.table('contact_submissions').delete().eq('id', inserted.get('id')).execute()
                    logger.info("🧹 Test record cleaned up")
                    
                    return inserted
                else:
                    logger.error("❌ Minimal insert failed - no data returned")
                    return None
                    
            except Exception as insert_error:
                logger.error(f"❌ Minimal insert error: {insert_error}")
                
                # Try with different column combinations
                logger.info("\n3. Trying different column combinations...")
                
                test_combinations = [
                    {"name": "Test", "email": "ranjeettiwari105@gmail.com", "subject": "Test", "message": "Test"},
        {"name": "Test", "email": "ranjeettiwari105@gmail.com", "message": "Test", "created_at": "2025-01-25T12:00:00Z"},
        {"name": "Test", "email": "ranjeettiwari105@gmail.com", "message": "Test", "timestamp": "2025-01-25T12:00:00Z"},
        {"full_name": "Test", "email_address": "ranjeettiwari105@gmail.com", "message_content": "Test"}
                ]
                
                for i, test_data in enumerate(test_combinations):
                    try:
                        logger.info(f"   Testing combination {i+1}: {list(test_data.keys())}")
                        test_result = supabase_admin.table('contact_submissions').insert(test_data).execute()
                        
                        if test_result.data:
                            logger.info(f"   ✅ Combination {i+1} worked!")
                            inserted = test_result.data[0]
                            logger.info(f"   📋 Successful columns: {list(inserted.keys())}")
                            
                            # Clean up
                            supabase_admin.table('contact_submissions').delete().eq('id', inserted.get('id')).execute()
                            
                            return inserted
                        else:
                            logger.info(f"   ❌ Combination {i+1} failed - no data")
                            
                    except Exception as combo_error:
                        logger.info(f"   ❌ Combination {i+1} error: {combo_error}")
                
                return None
        
        return result.data[0] if result.data else None
        
    except Exception as e:
        logger.error(f"❌ Error checking contact table structure: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None

def suggest_correct_structure(sample_data):
    """
    Suggest the correct structure based on discovered columns
    """
    if not sample_data:
        logger.warning("⚠️ No sample data available to suggest structure")
        return
    
    logger.info("\n💡 Suggested contact form submission structure:")
    logger.info("```python")
    logger.info("contact_data = {")
    
    for key in sample_data.keys():
        if key == 'id':
            continue
        elif 'name' in key.lower():
            logger.info(f'    "{key}": "User Name",  # User\'s full name')
        elif 'email' in key.lower():
            logger.info(f'    "{key}": "ranjeettiwari105@gmail.com",  # User\'s email')
        elif 'subject' in key.lower():
            logger.info(f'    "{key}": "Contact Subject",  # Message subject')
        elif 'message' in key.lower():
            logger.info(f'    "{key}": "User message content",  # Message content')
        elif 'phone' in key.lower():
            logger.info(f'    "{key}": "+1234567890",  # Optional phone number')
        elif 'created' in key.lower() or 'submitted' in key.lower() or 'timestamp' in key.lower():
            logger.info(f'    # "{key}" is auto-generated')
        else:
            logger.info(f'    "{key}": "value",  # {key}')
    
    logger.info("}")
    logger.info("```")

def main():
    """
    Main function
    """
    logger.info("🚀 Checking contact_submissions table structure...")
    
    sample_data = check_contact_table_structure()
    
    if sample_data:
        suggest_correct_structure(sample_data)
        logger.info("\n✅ Contact table structure discovered successfully!")
    else:
        logger.error("\n❌ Could not determine contact table structure")
        logger.info("\n💡 You may need to:")
        logger.info("   1. Check if contact_submissions table exists in Supabase")
        logger.info("   2. Verify table permissions")
        logger.info("   3. Create the table with proper schema")

if __name__ == "__main__":
    main()