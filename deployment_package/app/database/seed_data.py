from sqlalchemy.orm import Session
from .models import JobCategory, SystemSettings
import logging

logger = logging.getLogger(__name__)

def seed_job_categories(session: Session):
    """Seed initial job categories."""
    categories = [
        {
            'name': 'Software Development',
            'slug': 'software-development',
            'description': 'Programming, software engineering, and development roles',
            'is_active': True
        },
        {
            'name': 'Data Science',
            'slug': 'data-science',
            'description': 'Data analysis, machine learning, and data engineering roles',
            'is_active': True
        },
        {
            'name': 'Design',
            'slug': 'design',
            'description': 'UI/UX design, graphic design, and creative roles',
            'is_active': True
        },
        {
            'name': 'Marketing',
            'slug': 'marketing',
            'description': 'Digital marketing, content marketing, and growth roles',
            'is_active': True
        },
        {
            'name': 'Sales',
            'slug': 'sales',
            'description': 'Sales representatives, account managers, and business development',
            'is_active': True
        },
        {
            'name': 'Customer Support',
            'slug': 'customer-support',
            'description': 'Customer service, technical support, and success roles',
            'is_active': True
        },
        {
            'name': 'Product Management',
            'slug': 'product-management',
            'description': 'Product managers, product owners, and strategy roles',
            'is_active': True
        },
        {
            'name': 'Operations',
            'slug': 'operations',
            'description': 'Operations, logistics, and administrative roles',
            'is_active': True
        },
        {
            'name': 'Finance',
            'slug': 'finance',
            'description': 'Accounting, finance, and business analysis roles',
            'is_active': True
        },
        {
            'name': 'Human Resources',
            'slug': 'human-resources',
            'description': 'HR, recruiting, and people operations roles',
            'is_active': True
        },
        {
            'name': 'DevOps',
            'slug': 'devops',
            'description': 'Infrastructure, cloud, and deployment roles',
            'is_active': True
        },
        {
            'name': 'Quality Assurance',
            'slug': 'quality-assurance',
            'description': 'Testing, QA, and quality control roles',
            'is_active': True
        }
    ]
    
    for category_data in categories:
        # Check if category already exists
        existing = session.query(JobCategory).filter(
            JobCategory.name == category_data['name']
        ).first()
        
        if not existing:
            category = JobCategory(**category_data)
            session.add(category)
            logger.info(f"Added job category: {category_data['name']}")
        else:
            logger.info(f"Job category already exists: {category_data['name']}")

def seed_system_settings(session: Session):
    """Seed initial system settings."""
    settings = [
        {
            'key': 'site_name',
            'value': 'RemoteHive',
            'description': 'Name of the website',
            'data_type': 'string',
            'is_public': True
        },
        {
            'key': 'site_description',
            'value': 'Find your perfect remote job opportunity',
            'description': 'Site description for SEO',
            'data_type': 'string',
            'is_public': True
        },
        {
            'key': 'jobs_per_page',
            'value': '12',
            'description': 'Number of jobs to display per page',
            'data_type': 'integer',
            'is_public': True
        },
        {
            'key': 'max_file_upload_size',
            'value': '5242880',
            'description': 'Maximum file upload size in bytes (5MB)',
            'data_type': 'integer',
            'is_public': False
        },
        {
            'key': 'allowed_file_types',
            'value': 'pdf,doc,docx',
            'description': 'Allowed file types for uploads',
            'data_type': 'string',
            'is_public': False
        },
        {
            'key': 'email_notifications_enabled',
            'value': 'true',
            'description': 'Enable email notifications',
            'data_type': 'boolean',
            'is_public': False
        },
        {
            'key': 'job_post_approval_required',
            'value': 'false',
            'description': 'Require admin approval for job posts',
            'data_type': 'boolean',
            'is_public': False
        },
        {
            'key': 'maintenance_mode',
            'value': 'false',
            'description': 'Enable maintenance mode',
            'data_type': 'boolean',
            'is_public': True
        },
        {
            'key': 'contact_email',
            'value': 'contact@remotehive.com',
            'description': 'Contact email address',
            'data_type': 'string',
            'is_public': True
        },
        {
            'key': 'support_email',
            'value': 'support@remotehive.com',
            'description': 'Support email address',
            'data_type': 'string',
            'is_public': True
        },
        {
            'key': 'featured_jobs_limit',
            'value': '6',
            'description': 'Number of featured jobs to display',
            'data_type': 'integer',
            'is_public': True
        },
        {
            'key': 'job_expiry_days',
            'value': '30',
            'description': 'Number of days before job posts expire',
            'data_type': 'integer',
            'is_public': False
        },
        {
            'key': 'auto_approve_employers',
            'value': 'true',
            'description': 'Automatically approve new employer registrations',
            'data_type': 'boolean',
            'is_public': False
        },
        {
            'key': 'enable_job_alerts',
            'value': 'true',
            'description': 'Enable job alert notifications',
            'data_type': 'boolean',
            'is_public': True
        },
        {
            'key': 'social_login_enabled',
            'value': 'true',
            'description': 'Enable social media login',
            'data_type': 'boolean',
            'is_public': True
        }
    ]
    
    for setting_data in settings:
        # Check if setting already exists
        existing = session.query(SystemSettings).filter(
            SystemSettings.key == setting_data['key']
        ).first()
        
        if not existing:
            setting = SystemSettings(**setting_data)
            session.add(setting)
            logger.info(f"Added system setting: {setting_data['key']}")
        else:
            logger.info(f"System setting already exists: {setting_data['key']}")

def seed_all_data(session: Session):
    """Seed all initial data."""
    try:
        seed_job_categories(session)
        seed_system_settings(session)
        session.commit()
        logger.info("All seed data added successfully")
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to seed data: {e}")
        raise