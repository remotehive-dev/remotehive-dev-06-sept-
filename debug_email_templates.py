import sys
sys.path.append('.')

from sqlalchemy.orm import Session
from app.core.database import get_db_session
from app.database.models import EmailTemplate
from sqlalchemy import text
import traceback

def debug_email_templates():
    """Debug the email templates query to find the exact error"""
    try:
        # Get database session
        db_gen = get_db_session()
        db = next(db_gen)
        
        print("Database session created successfully")
        
        # Try raw SQL first
        print("\n1. Testing raw SQL query...")
        result = db.execute(text("SELECT COUNT(*) FROM email_templates"))
        count = result.scalar()
        print(f"Raw SQL count: {count}")
        
        # Try simple SQLAlchemy query
        print("\n2. Testing simple SQLAlchemy query...")
        count2 = db.query(EmailTemplate).count()
        print(f"SQLAlchemy count: {count2}")
        
        # Try to fetch one record
        print("\n3. Testing fetch first record...")
        first_template = db.query(EmailTemplate).first()
        if first_template:
            print(f"First template: {first_template.name}")
        else:
            print("No templates found")
        
        # Try the exact query from the API
        print("\n4. Testing API-like query...")
        from sqlalchemy import desc
        page = 1
        size = 10
        
        query = db.query(EmailTemplate)
        total = query.count()
        print(f"Total count: {total}")
        
        templates = query.order_by(desc(EmailTemplate.updated_at)).offset((page - 1) * size).limit(size).all()
        print(f"Fetched {len(templates)} templates")
        
        # Try to serialize the results
        print("\n5. Testing serialization...")
        for template in templates:
            template_dict = {
                'id': template.id,
                'name': template.name,
                'subject': template.subject,
                'template_type': template.template_type,
                'is_active': template.is_active,
                'created_at': template.created_at,
                'updated_at': template.updated_at
            }
            print(f"Template dict: {template_dict}")
            break  # Just test the first one
        
        print("\nAll tests passed successfully!")
        
    except Exception as e:
        print(f"\nERROR OCCURRED: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print("\nFull traceback:")
        traceback.print_exc()
    
    finally:
        if 'db' in locals():
            db.close()
            print("\nDatabase session closed")

if __name__ == "__main__":
    debug_email_templates()