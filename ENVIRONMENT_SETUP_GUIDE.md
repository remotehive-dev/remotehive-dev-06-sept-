# RemoteHive Environment Setup Guide

## Overview
This guide documents all environment variables, API keys, and configuration files required for the RemoteHive project migration to macOS.

## Environment Files Structure

### Main Application Environment (`.env`)
Location: `d:\Remotehive\.env`

#### Database Configuration
```bash
# Supabase Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Local SQLite Database
DATABASE_URL=sqlite:///./remotehive.db
APP_DATABASE_URL=sqlite:///./app.db
```

#### Redis Configuration
```bash
# Redis for caching and task queue
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

#### Flask Application Settings
```bash
# Flask Configuration
FLASK_APP=main.py
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_HOST=0.0.0.0
FLASK_PORT=8001
SECRET_KEY=your_secret_key_here
```

#### Authentication & Security
```bash
# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000

# Password Security
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=True
PASSWORD_REQUIRE_LOWERCASE=True
PASSWORD_REQUIRE_NUMBERS=True
PASSWORD_REQUIRE_SYMBOLS=True
```

#### Email Configuration
```bash
# SMTP Settings
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_USE_TLS=True
FROM_EMAIL=noreply@remotehive.com
```

#### Frontend Configuration
```bash
# Frontend URLs
FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3001
PUBLIC_FRONTEND_URL=http://localhost:3002
```

#### File Upload Settings
```bash
# File Upload Configuration
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216  # 16MB
ALLOWED_EXTENSIONS=pdf,doc,docx,txt,jpg,jpeg,png,gif
```

#### External API Keys
```bash
# OpenAI API (if used for ML features)
OPENAI_API_KEY=your_openai_api_key

# Other API Keys (add as needed)
GOOGLE_MAPS_API_KEY=your_google_maps_key
LINKEDIN_API_KEY=your_linkedin_api_key
```



### Frontend Environment Files

#### Admin Frontend (`.env.local`)
Location: `admin-panel/.env.local`

```bash
# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret

# API Endpoints
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Public Frontend (`.env.local`)
Location: `website/.env.local`

```bash
# Vite Configuration
VITE_API_URL=http://localhost:8001
VITE_FRONTEND_URL=http://localhost:3002

# Public API Keys
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## Configuration Files

### Python Dependencies

#### Main Application (`requirements.txt`)
```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.4
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
jinja2==3.1.2
python-dotenv==1.0.0
requests==2.31.0
supabase==2.0.2
pandas==2.1.3
numpy==1.25.2
scikit-learn==1.3.2
```



### Frontend Dependencies

#### Admin Frontend (`admin-panel/package.json`)
```json
{
  "dependencies": {
    "next": "15.4.1",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-toast": "^1.2.4",
    "lucide-react": "^0.469.0",
    "react-hot-toast": "^2.4.1",
    "framer-motion": "^11.15.0",
    "tailwindcss": "^3.4.17"
  }
}
```

#### Public Frontend (`website/package.json`)
```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "lucide-react": "^0.469.0",
    "react-hot-toast": "^2.4.1",
    "framer-motion": "^11.15.0",
    "tailwindcss": "^3.4.17",
    "vite": "^6.0.7"
  }
}
```

## macOS-Specific Configuration Changes

### Path Adjustments
- Windows paths (`d:\Remotehive`) → macOS paths (`/Users/username/RemoteHive`)
- Database file paths need forward slashes
- Log file paths need forward slash separators

### Service Configuration
- Redis: Use Homebrew installation (`brew install redis`)
- PostgreSQL: Use Homebrew installation (`brew install postgresql@15`)
- Python: Use pyenv or Homebrew Python 3.11+

### Environment Variable Updates for macOS
```bash
# Update paths for macOS
DATABASE_URL=sqlite:///./remotehive.db
APP_DATABASE_URL=sqlite:///./app.db

# Update Redis URL (default macOS Homebrew)
REDIS_URL=redis://localhost:6379/0

# Update log paths
LOG_FILE=logs/application.log
```

## Security Considerations

### API Keys and Secrets
- **NEVER** commit actual API keys to version control
- Use `.env.example` files with placeholder values
- Generate new JWT secrets for production
- Use strong, unique passwords for all services

### File Permissions (macOS)
```bash
# Set appropriate permissions for environment files
chmod 600 .env
chmod 600 admin-panel/.env.local
chmod 600 website/.env.local
```

## Migration Checklist

### Before Migration
- [ ] Export all environment files
- [ ] Document all API keys and secrets
- [ ] Backup database files
- [ ] Note service configurations

### After Migration
- [ ] Update all file paths for macOS
- [ ] Install required services (Redis, PostgreSQL)
- [ ] Create new environment files with correct paths
- [ ] Test all service connections
- [ ] Verify API key functionality
- [ ] Test database connections
- [ ] Validate frontend-backend communication

## Troubleshooting

### Common Issues
1. **Database Connection Errors**: Check SQLite file paths and permissions
2. **Redis Connection Failed**: Ensure Redis service is running (`brew services start redis`)
3. **API Key Errors**: Verify all keys are correctly set and not expired
4. **Path Issues**: Ensure all paths use forward slashes on macOS
5. **Permission Denied**: Check file permissions for environment files

### Service Status Commands (macOS)
```bash
# Check Redis status
brew services list | grep redis

# Check PostgreSQL status
brew services list | grep postgresql

# Start services
brew services start redis
brew services start postgresql@15
```

## Support
For additional help with environment setup, refer to:
- `MACOS_MIGRATION_GUIDE.md` for complete migration steps
- `DEVELOPMENT.md` for development environment setup
- Individual service documentation for specific configuration issues