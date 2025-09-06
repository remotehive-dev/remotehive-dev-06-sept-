#!/usr/bin/env python3
"""
Script to seed the database with default email templates.
"""

import os
import sys
from loguru import logger
from sqlalchemy.orm import sessionmaker

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import DatabaseManager
from app.database.models import EmailTemplate

def main():
    """Seed the database with default email templates."""
    try:
        logger.info("Starting email templates seeding...")
        
        # Initialize database manager
        db_manager = DatabaseManager()
        Session = sessionmaker(bind=db_manager.engine)
        session = Session()
        
        # Check if templates already exist
        existing_count = session.query(EmailTemplate).count()
        if existing_count > 0:
            logger.info(f"Email templates already exist ({existing_count} found). Skipping seeding.")
            session.close()
            return
        
        # Default email templates
        templates = [
            {
                'name': 'welcome_email',
                'subject': 'Welcome to RemoteHive!',
                'html_content': '''<html>
<body>
    <h1>Welcome to RemoteHive!</h1>
    <p>Dear {{user_name}},</p>
    <p>Thank you for joining our platform. Start exploring remote opportunities today!</p>
    <p>Best regards,<br>The RemoteHive Team</p>
</body>
</html>''',
                'text_content': 'Welcome to RemoteHive! Dear {{user_name}}, Thank you for joining our platform. Start exploring remote opportunities today! Best regards, The RemoteHive Team',
                'template_type': 'welcome',
                'category': 'onboarding',
                'is_active': True
            },
            {
                'name': 'job_alert',
                'subject': 'New Jobs Matching Your Preferences',
                'html_content': '''<html>
<body>
    <h1>New Job Opportunities</h1>
    <p>Hi {{user_name}},</p>
    <p>We found {{job_count}} new jobs that match your preferences:</p>
    <ul>
    {% for job in jobs %}
        <li><strong>{{job.title}}</strong> at {{job.company}} - {{job.location}}</li>
    {% endfor %}
    </ul>
    <p><a href="{{base_url}}/jobs">View All Jobs</a></p>
</body>
</html>''',
                'text_content': 'Hi {{user_name}}, We found {{job_count}} new jobs that match your preferences. Visit {{base_url}}/jobs to view them.',
                'template_type': 'notification',
                'category': 'notification',
                'is_active': True
            },
            {
                'name': 'email_verification',
                'subject': 'Verify Your Email Address',
                'html_content': '''<html>
<body>
    <h1>Email Verification</h1>
    <p>Hi {{user_name}},</p>
    <p>Please click the link below to verify your email address:</p>
    <p><a href="{{verification_url}}">Verify Email</a></p>
    <p>If you didn't create an account, please ignore this email.</p>
</body>
</html>''',
                'text_content': 'Hi {{user_name}}, Please visit {{verification_url}} to verify your email address. If you didn\'t create an account, please ignore this email.',
                'template_type': 'verification',
                'category': 'verification',
                'is_active': True
            },
            {
                'name': 'application_status',
                'subject': 'Application Status Update',
                'html_content': '''<html>
<body>
    <h1>Application Status Update</h1>
    <p>Hi {{user_name}},</p>
    <p>Your application for <strong>{{job_title}}</strong> at {{company_name}} has been {{status}}.</p>
    {% if status == 'accepted' %}
    <p>Congratulations! The employer will contact you soon.</p>
    {% elif status == 'rejected' %}
    <p>Thank you for your interest. Keep applying to other opportunities!</p>
    {% endif %}
    <p><a href="{{base_url}}/applications">View Your Applications</a></p>
</body>
</html>''',
                'text_content': 'Hi {{user_name}}, Your application for {{job_title}} at {{company_name}} has been {{status}}. Visit {{base_url}}/applications to view your applications.',
                'template_type': 'notification',
                'category': 'notification',
                'is_active': True
            },
            {
                'name': 'support_request',
                'subject': 'Support Request Received',
                'html_content': '''<html>
<body>
    <h1>Support Request Received</h1>
    <p>Hi {{user_name}},</p>
    <p>We've received your support request and will get back to you within 24 hours.</p>
    <p><strong>Request Details:</strong></p>
    <p>Subject: {{request_subject}}</p>
    <p>Message: {{request_message}}</p>
    <p>Reference ID: {{ticket_id}}</p>
</body>
</html>''',
                'text_content': 'Hi {{user_name}}, We\'ve received your support request and will get back to you within 24 hours. Reference ID: {{ticket_id}}',
                'template_type': 'support',
                'category': 'support',
                'is_active': True
            }
        ]
        
        # Create and add templates
        for template_data in templates:
            template = EmailTemplate(**template_data)
            session.add(template)
            logger.info(f"Added template: {template_data['name']}")
        
        # Commit changes
        session.commit()
        logger.info(f"✅ Successfully seeded {len(templates)} email templates")
        
        # Verify seeding
        total_templates = session.query(EmailTemplate).count()
        logger.info(f"Total templates in database: {total_templates}")
        
        session.close()
        
    except Exception as e:
        logger.error(f"Error seeding email templates: {e}")
        if 'session' in locals():
            session.rollback()
            session.close()
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()