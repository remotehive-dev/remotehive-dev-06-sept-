# RemoteHive Migration Backup

Created: 2025-08-25 18:29:09
Source: Windows
Target: macOS

## Contents

### Database Files
- remotehive.db
- remotehive.db-shm
- remotehive.db-wal
- app.db
- autoscraper/autoscraper.db
- autoscraper.db

### SQL Exports
- remotehive.sql
- app.sql
- autoscraper.sql

### JSON Exports
- remotehive.json
- app.json
- autoscraper.json

### Configuration Files
- .env
- .env.example
- autoscraper/.env
- remotehive-admin/.env.local
- requirements.txt
- autoscraper/requirements.txt
- autoscraper/requirements_ml.txt
- remotehive-admin/package.json
- remotehive-public/package.json
- package.json

## Usage

1. Transfer this entire backup directory to your macOS machine
2. Follow the MACOS_MIGRATION_GUIDE.md instructions
3. Use the SQL files to restore databases if needed
4. Use the JSON files for data analysis or alternative imports

## Database Statistics

{
  "remotehive.db": {
    "file_size": 737280,
    "table_count": 49,
    "tables": {
      "sqlite_sequence": 1,
      "contact_submissions": 0,
      "contact_information": 0,
      "seo_settings": 0,
      "reviews": 0,
      "ads": 0,
      "job_categories": 12,
      "scraper_configs": 1,
      "job_seekers": 5,
      "employers": 8,
      "system_settings": 22,
      "admin_logs": 0,
      "scraper_logs": 0,
      "job_posts": 4,
      "job_workflow_logs": 0,
      "job_applications": 0,
      "alembic_version": 1,
      "auto_apply_settings": 0,
      "saved_jobs": 0,
      "interviews": 0,
      "role_permissions": 0,
      "user_sessions": 213,
      "login_attempts": 233,
      "users": 47,
      "email_verification_tokens": 3,
      "email_templates": 5,
      "email_logs": 8,
      "email_users": 1,
      "email_messages": 0,
      "email_folders": 6,
      "email_signatures": 0,
      "email_attachments": 0,
      "email_message_folders": 0,
      "scraper_state": 0,
      "ml_parsing_config": 1,
      "analytics_metrics": 0,
      "scheduler_jobs": 1,
      "csv_import_log": 0,
      "csv_imports": 0,
      "csv_import_logs": 0,
      "managed_websites": 0,
      "memory_uploads": 8,
      "scraping_sessions": 0,
      "ml_training_data": 0,
      "scraping_metrics": 0,
      "scraper_memory": 3,
      "scraper_website_mapping": 0,
      "scraping_results": 0,
      "session_websites": 0
    }
  },
  "app.db": {
    "file_size": 24576,
    "table_count": 1,
    "tables": {
      "scraper_website_mapping": 0
    }
  },
  "autoscraper/autoscraper.db": {
    "file_size": 413696,
    "table_count": 7,
    "tables": {
      "websites": 735,
      "ml_models": 0,
      "scraping_schedules": 0,
      "job_postings": 0,
      "scraping_sessions": 0,
      "selector_patterns": 0,
      "error_logs": 0
    }
  }
}
