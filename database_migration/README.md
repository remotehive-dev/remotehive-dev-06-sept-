# RemoteHive Database Migration to Supabase

This directory contains a comprehensive database migration system to migrate RemoteHive from a local SQLAlchemy database to Supabase.

## 🚀 Quick Start

### Prerequisites

1. **Python 3.8+** installed
2. **Supabase project** set up and connected to your Trae IDE
3. **Local database** with existing RemoteHive data

### Installation

```bash
# Navigate to migration directory
cd database_migration

# Install dependencies
pip install -r requirements.txt
```

### Configuration

#### Option 1: Using Trae Supabase Integration (Recommended)

If you have Supabase connected in Trae IDE, the migration will automatically use your project configuration.

#### Option 2: Manual Configuration

Set environment variables:

```bash
# Windows (PowerShell)
$env:SUPABASE_DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
$env:SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"
$env:LOCAL_DATABASE_URL="sqlite:///./app.db"  # or your local DB URL

# Linux/Mac
export SUPABASE_DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
export SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"
export LOCAL_DATABASE_URL="sqlite:///./app.db"
```

### Running the Migration

#### Simple Migration (Recommended)

```bash
python run_migration.py
```

This interactive script will:
- Guide you through the migration process
- Ask for confirmation before making changes
- Offer a dry-run option to test first
- Provide clear feedback and next steps

#### Advanced Migration

```bash
# Dry run (test without making changes)
python migrate_to_supabase.py --dry-run

# Full migration
python migrate_to_supabase.py

# Skip backup (if you're sure)
python migrate_to_supabase.py --skip-backup

# Custom database URLs
python migrate_to_supabase.py --local-db "sqlite:///./custom.db" --supabase-url "your-url"
```

## 📋 Migration Process

The migration system performs these steps:

### 1. Prerequisites Check ✅
- Verifies Supabase connection
- Checks required files exist
- Validates configuration

### 2. Data Backup 💾
- Creates timestamped backup of existing Supabase data
- Exports table structures and data to SQL files
- Stores backups in `backup_YYYYMMDD_HHMMSS/` directory

### 3. Schema Creation 🏗️
- Creates all database tables with proper constraints
- Sets up relationships and foreign keys
- Enables UUID extension for Supabase compatibility
- Creates indexes for performance

### 4. Data Migration 📊
- Migrates data in correct order (respecting foreign keys)
- Converts integer IDs to UUIDs
- Handles data type conversions
- Validates data integrity
- Provides detailed progress reporting

### 5. Row Level Security (RLS) 🔒
- Enables RLS on all tables
- Creates policies for authenticated users
- Sets up admin access controls
- Grants appropriate permissions

### 6. Validation ✅
- Verifies all tables were created
- Checks data integrity
- Validates RLS policies
- Generates migration report

## 📁 File Structure

```
database_migration/
├── README.md                     # This file
├── requirements.txt              # Python dependencies
├── run_migration.py             # Simple migration runner
├── migrate_to_supabase.py       # Main migration orchestrator
├── models/
│   └── cms_models.py            # Additional CMS models
└── scripts/
    ├── generate_migration_sql.py # Database schema SQL
    ├── rls_policies.sql         # Row Level Security policies
    └── data_migration.py        # Data migration logic
```

## 🗃️ Database Schema

The migration includes these tables:

### Core Tables
- `users` - User accounts and profiles
- `job_seekers` - Job seeker profiles
- `employers` - Employer profiles
- `job_posts` - Job listings
- `job_applications` - Job applications
- `saved_jobs` - Saved job listings
- `interviews` - Interview scheduling

### CMS Tables
- `pages` - CMS pages
- `media_files` - File uploads
- `carousel_items` - Homepage carousel
- `galleries` - Image galleries
- `navigation_menus` - Site navigation
- `theme_settings` - UI customization

### System Tables
- `contact_submissions` - Contact form data
- `email_templates` - Email templates
- `system_settings` - Application settings
- `admin_logs` - Admin activity logs
- `scraper_config` - Job scraping configuration

### Supporting Tables
- `job_categories` - Job categorization
- `reviews` - User reviews
- `ads` - Advertisement management
- `auto_apply_settings` - Auto-application settings

## 🔧 Troubleshooting

### Common Issues

#### Connection Errors
```
Error: Failed to connect to Supabase
```
**Solution:** Check your Supabase URL and service role key. Ensure your Supabase project is active.

#### Permission Errors
```
Error: permission denied for table [table_name]
```
**Solution:** The migration automatically sets up permissions, but if you encounter this:
1. Check if RLS policies were applied correctly
2. Verify your service role key has admin privileges
3. Run the RLS setup again: `psql -f scripts/rls_policies.sql`

#### Data Type Errors
```
Error: invalid input syntax for type uuid
```
**Solution:** This usually happens during UUID conversion. The migration handles this automatically, but if you encounter issues:
1. Check your local database data for invalid formats
2. Run with `--dry-run` first to identify issues
3. Clean up any malformed data in your local database

#### Large Database Migration
For databases with millions of records:
1. Increase batch size in `data_migration.py`
2. Run migration during low-traffic periods
3. Consider migrating tables individually
4. Monitor Supabase usage limits

### Getting Help

1. **Check Logs:** Migration creates detailed log files with timestamps
2. **Dry Run:** Always test with `--dry-run` first
3. **Backup:** Backups are created automatically, but verify they're complete
4. **Rollback:** Use backup files to restore if needed

## 🔄 Rollback Process

If you need to rollback:

1. **Stop your application** to prevent new data
2. **Locate backup files** in `backup_YYYYMMDD_HHMMSS/` directory
3. **Restore from backup:**
   ```bash
   # Connect to Supabase
   psql "your-supabase-connection-string"
   
   # Drop current tables (be careful!)
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   
   # Restore from backup
   \i backup_YYYYMMDD_HHMMSS/restore_script.sql
   ```

## 📊 Post-Migration

### Update Application Configuration

1. **Update database connection** in your app to use Supabase
2. **Update environment variables:**
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. **Test all functionality** thoroughly
4. **Monitor performance** and adjust as needed

### Verification Checklist

- [ ] All tables exist in Supabase
- [ ] Data counts match between local and Supabase
- [ ] User authentication works
- [ ] File uploads work (if using Supabase Storage)
- [ ] All application features function correctly
- [ ] Performance is acceptable
- [ ] RLS policies are working

## 🚨 Important Notes

- **Backup First:** Always backup your data before migration
- **Test Thoroughly:** Use dry-run mode to test before actual migration
- **Monitor Limits:** Check Supabase usage limits for your plan
- **UUID Conversion:** Primary keys are converted from integers to UUIDs
- **RLS Security:** Row Level Security is enabled by default
- **Foreign Keys:** Relationships are maintained during migration

## 📈 Performance Tips

1. **Batch Size:** Adjust batch size in migration config for optimal performance
2. **Indexes:** The migration creates essential indexes automatically
3. **Connection Pooling:** Use connection pooling in your application
4. **Monitoring:** Set up monitoring for your Supabase project

## 🔐 Security Considerations

- **Service Role Key:** Keep your service role key secure and never expose it
- **RLS Policies:** Review and customize RLS policies for your needs
- **User Permissions:** Verify user access controls work as expected
- **Data Validation:** Validate sensitive data after migration

---

**Need Help?** Check the migration logs for detailed information about any issues. The migration system provides comprehensive logging and error reporting to help diagnose and resolve problems.