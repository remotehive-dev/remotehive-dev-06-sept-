#!/usr/bin/env python3
"""
Database migration script to create email management tables
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.database.models import Base
from app.database.database import get_database_manager
from app.models.email import (
    EmailUser, EmailMessage, EmailAttachment, 
    EmailFolder, EmailMessageFolder, EmailSignature
)
from app.database.models import EmailTemplate, EmailLog

def create_email_tables():
    """
    Create all email-related tables
    """
    try:
        print("Creating email management tables...")
        
        # Get database manager and create tables
        db_manager = get_database_manager()
        Base.metadata.create_all(bind=db_manager.engine, tables=[
            EmailUser.__table__,
            EmailMessage.__table__,
            EmailAttachment.__table__,
            EmailTemplate.__table__,
            EmailLog.__table__,
            EmailFolder.__table__,
            EmailMessageFolder.__table__,
            EmailSignature.__table__
        ])
        
        print("✅ Email tables created successfully!")
        
        # Create default email templates
        create_default_templates()
        
        print("✅ Email management system setup completed!")
        
    except Exception as e:
        print(f"❌ Error creating email tables: {str(e)}")
        raise

def create_default_templates():
    """
    Create default email templates
    """
    from sqlalchemy.orm import sessionmaker
    from app.database.models import EmailTemplate
    import uuid
    from datetime import datetime
    
    db_manager = get_database_manager()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_manager.engine)
    db = SessionLocal()
    
    try:
        # Check if templates already exist
        existing_templates = db.query(EmailTemplate).count()
        if existing_templates > 0:
            print("📧 Email templates already exist, skipping creation.")
            return
        
        templates = [
            {
                "name": "welcome_email",
                "description": "Welcome email for new email users",
                "subject_template": "Welcome to {company_name} - Set Up Your Email Account",
                "content_template": """Dear {first_name},

Welcome to {company_name}! Your email account has been created successfully.

Your login details:
Email: {work_email}
Temporary Password: {temp_password}

For security reasons, please log in and change your password immediately.

Login URL: {login_url}

If you have any questions, please contact your administrator.

Best regards,
{company_name} Team""",
                "html_template": """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to {company_name}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Welcome to {company_name}!</h2>
        <p>Dear {first_name},</p>
        <p>Your email account has been created successfully.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Login Details:</h3>
            <p><strong>Email:</strong> {work_email}</p>
            <p><strong>Temporary Password:</strong> {temp_password}</p>
        </div>
        
        <p style="color: #e74c3c;"><strong>Important:</strong> For security reasons, please log in and change your password immediately.</p>
        
        <p><a href="{login_url}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a></p>
        
        <p>If you have any questions, please contact your administrator.</p>
        
        <p>Best regards,<br>{company_name} Team</p>
    </div>
</body>
</html>""",
                "category": "welcome"
            },
            {
                "name": "password_reset",
                "description": "Password reset notification email",
                "subject_template": "{company_name} - Password Reset",
                "content_template": """Dear {first_name},

Your password has been reset by an administrator.

Your login details:
Email: {work_email}
New Password: {new_password}

For security reasons, please log in and change your password immediately.

Login URL: {login_url}

If you did not request this password reset, please contact your administrator immediately.

Best regards,
{company_name} Team""",
                "html_template": """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset - {company_name}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e74c3c;">Password Reset</h2>
        <p>Dear {first_name},</p>
        <p>Your password has been reset by an administrator.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your New Login Details:</h3>
            <p><strong>Email:</strong> {work_email}</p>
            <p><strong>New Password:</strong> {new_password}</p>
        </div>
        
        <p style="color: #e74c3c;"><strong>Important:</strong> For security reasons, please log in and change your password immediately.</p>
        
        <p><a href="{login_url}" style="background-color: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a></p>
        
        <p style="color: #e67e22;"><strong>Security Notice:</strong> If you did not request this password reset, please contact your administrator immediately.</p>
        
        <p>Best regards,<br>{company_name} Team</p>
    </div>
</body>
</html>""",
                "category": "password_reset"
            },
            {
                "name": "notification_general",
                "description": "General notification email template",
                "subject_template": "{company_name} - {notification_title}",
                "content_template": """Dear {recipient_name},

{notification_message}

{additional_details}

If you have any questions, please contact your administrator.

Best regards,
{company_name} Team""",
                "html_template": """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{notification_title} - {company_name}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">{notification_title}</h2>
        <p>Dear {recipient_name},</p>
        <p>{notification_message}</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            {additional_details}
        </div>
        
        <p>If you have any questions, please contact your administrator.</p>
        
        <p>Best regards,<br>{company_name} Team</p>
    </div>
</body>
</html>""",
                "category": "notification"
            }
        ]
        
        for template_data in templates:
            template = EmailTemplate(
                id=uuid.uuid4(),
                name=template_data["name"],
                description=template_data["description"],
                subject_template=template_data["subject_template"],
                content_template=template_data["content_template"],
                html_template=template_data["html_template"],
                category=template_data["category"],
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(template)
        
        db.commit()
        print("📧 Default email templates created successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating email templates: {str(e)}")
        raise
    finally:
        db.close()

def check_existing_tables():
    """
    Check if email tables already exist
    """
    try:
        db_manager = get_database_manager()
        with db_manager.engine.connect() as conn:
            # Check if email_users table exists
            result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='email_users'
            """))
            
            if result.fetchone():
                print("📧 Email tables already exist.")
                return True
            return False
    except Exception as e:
        print(f"Error checking existing tables: {str(e)}")
        return False

def main():
    """
    Main function to run the migration
    """
    print("🚀 Starting email management system setup...")
    print(f"📊 Database URL: {settings.DATABASE_URL}")
    
    try:
        # Check if tables already exist
        if check_existing_tables():
            response = input("Email tables already exist. Do you want to recreate them? (y/N): ")
            if response.lower() != 'y':
                print("✅ Skipping table creation.")
                return
        
        # Create the tables
        create_email_tables()
        
        print("\n🎉 Email management system setup completed successfully!")
        print("\n📋 Created tables:")
        print("   - email_users (Organization email accounts)")
        print("   - email_messages (Email communications)")
        print("   - email_attachments (File attachments)")
        print("   - email_templates (Reusable templates)")
        print("   - email_logs (Email event tracking)")
        print("   - email_folders (Email organization)")
        print("   - email_message_folders (Message-folder relationships)")
        print("   - email_signatures (User signatures)")
        print("\n📧 Default email templates created:")
        print("   - welcome_email (New user welcome)")
        print("   - password_reset (Password reset notifications)")
        print("   - notification_general (General notifications)")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()