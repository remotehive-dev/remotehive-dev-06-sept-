# RemoteHive Project Memory & Context Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Services](#architecture--services)
3. [Database Architecture](#database-architecture)
4. [Build & Configuration](#build--configuration)
5. [Development Environment](#development-environment)
6. [API Endpoints & Services](#api-endpoints--services)
7. [Authentication & Security](#authentication--security)
8. [Frontend Applications](#frontend-applications)
9. [Background Services](#background-services)
10. [Testing Strategy](#testing-strategy)
11. [Deployment & Production](#deployment--production)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [Key Files Reference](#key-files-reference)

---

## Project Overview

**RemoteHive** is a comprehensive job board platform built with a microservices architecture. The platform enables job seekers to find remote opportunities and employers to post job listings with advanced scraping capabilities.

### Core Components
- **Backend API** (FastAPI + MongoDB) - Main application logic
- **Autoscraper Service** (FastAPI + SQLite) - Job scraping functionality
- **Admin Panel** (Next.js + TypeScript) - Administrative interface
- **Public Website** (React + Vite + TypeScript) - User-facing application
- **Background Services** (Celery + Redis) - Asynchronous task processing

### Technology Stack
- **Backend**: Python 3.9+, FastAPI, MongoDB (Beanie ODM), SQLite
- **Frontend**: TypeScript, Next.js 14+, React 19+, Vite
- **Styling**: Tailwind CSS
- **Authentication**: JWT, Clerk, Supabase integration
- **Background Tasks**: Celery, Redis
- **Testing**: pytest, React Testing Library
- **Deployment**: Gunicorn, Uvicorn, Vercel

---

## Architecture & Services

### Service Ports & URLs
```
Main Backend API:     http://localhost:8000
Autoscraper Service:  http://localhost:8001
Admin Panel:          http://localhost:3000
Public Website:       http://localhost:5173
Redis Cache:          redis://localhost:6379
```

### Project Structure
```
RemoteHive_Migration_Package/
├── backend/                           # Main Backend API
│   ├── main.py                   # FastAPI application entry
│   ├── config.py                 # Configuration settings
│   ├── api/                      # API endpoints
│   │   ├── api.py               # Main router
│   │   └── endpoints/           # Individual endpoint modules
│   ├── models/                   # Database models
│   │   ├── mongodb_models.py    # MongoDB/Beanie models
│   │   └── models.py            # SQLAlchemy models (legacy)
│   ├── database/                 # Database utilities
│   │   └── database.py          # DB initialization
│   ├── services/                 # Business logic layer
│   ├── middleware/               # Custom middleware
│   ├── core/                     # Core utilities
│   │   ├── auth.py              # Authentication logic
│   │   ├── config.py            # Core configuration
│   │   └── rbac.py              # Role-based access control
│   └── tests/                    # Test files
├── autoscraper-engine-api/          # Independent scraping service
├── admin-panel/             # Next.js admin panel
│   ├── src/
│   │   ├── lib/api.ts           # API service layer
│   │   ├── components/          # React components
│   │   └── pages/              # Next.js pages
├── website/            # React public website
│   ├── src/
│   │   ├── lib/                # API and utilities
│   │   ├── components/         # React components
│   │   ├── pages/             # Page components
│   │   └── contexts/          # React contexts
├── fixed_startup.py              # Service startup script
├── requirements.txt              # Python dependencies
└── docs/                         # Documentation
```

---

## Database Architecture

### Primary Database (MongoDB)
**Connection**: `mongodb://localhost:27017/remotehive`

#### Key Collections & Models
```python
# User Management
class User(Document):
    email: str
    password_hash: str
    role: UserRole
    is_active: bool
    created_at: datetime

# Job Management
class JobPost(Document):
    title: str
    description: str
    company: str
    location: str
    salary_range: Optional[str]
    job_type: JobType
    created_at: datetime
    employer_id: PydanticObjectId

# Employer Management
class Employer(Document):
    company_name: str
    contact_email: str
    website: Optional[str]
    description: Optional[str]
    user_id: PydanticObjectId

# Job Applications
class JobApplication(Document):
    job_id: PydanticObjectId
    job_seeker_id: PydanticObjectId
    status: ApplicationStatus
    applied_at: datetime
    cover_letter: Optional[str]
```

### Autoscraper Database (SQLite)
**Location**: `autoscraper-engine-api/app.db`

#### Key Tables
- `autoscrape_schedule_config` - Scraping schedules
- `autoscrape_scrape_job` - Job scraping tasks
- `autoscrape_raw_job` - Raw scraped data
- `autoscrape_normalized_job` - Processed job data
- `autoscrape_engine_state` - Scraper state management

### Caching Layer (Redis)
**Connection**: `redis://localhost:6379`
- Session storage
- API response caching
- Background task queues
- Rate limiting data

---

## Build & Configuration

### Environment Variables
```bash
# Database Configuration
MONGODB_URL=mongodb://localhost:27017/remotehive
REDIS_URL=redis://localhost:6379
DATABASE_URL=sqlite:///./app.db  # For autoscraper

# Authentication
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# External Services
CLERK_SECRET_KEY=your-clerk-secret
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# API Configuration
API_V1_STR=/api/v1
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760  # 10MB

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Python Dependencies (requirements.txt)
```
# Core Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
gunicorn==21.2.0

# Database
mongodb==4.6.0
motor==3.3.2
beanie==1.23.6
sqlalchemy==2.0.23
alembic==1.13.1

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# Background Tasks
celery==5.3.4
redis==5.0.1
flower==2.0.1

# Web Scraping
playwright==1.40.0
beautifulsoup4==4.12.2
selenium==4.15.2
scrapy==2.11.0
requests-html==0.10.0

# Data Processing
pandas==2.1.3
numpy==1.25.2
scikit-learn==1.3.2
nltk==3.8.1
spacy==3.7.2

# Development & Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
faker==20.1.0

# Utilities
pydantic==2.5.0
python-dotenv==1.0.0
loguru==0.7.2
click==8.1.7
rich==13.7.0
```

### Frontend Dependencies

#### Admin Panel (package.json)
```json
{
  "dependencies": {
    "next": "14.0.3",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "typescript": "5.3.2",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "3.3.6",
    "zustand": "4.4.7",
    "@supabase/supabase-js": "2.38.4",
    "jsonwebtoken": "9.0.2",
    "lucide-react": "0.294.0"
  }
}
```

#### Public Website (package.json)
```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-router-dom": "6.20.1",
    "vite": "5.0.0",
    "typescript": "5.3.2",
    "@clerk/clerk-react": "4.27.1",
    "tailwindcss": "3.3.6",
    "framer-motion": "10.16.5",
    "lucide-react": "0.294.0",
    "razorpay": "2.9.2",
    "stripe": "14.7.0"
  }
}
```

---

## Development Environment

### Service Startup Sequence

#### Automated Startup
```bash
# Use the comprehensive startup script
python fixed_startup.py
```

#### Manual Startup (Development)
```bash
# 1. Start Redis Server
redis-server

# 2. Start Main Backend API (Terminal 1)
cd /path/to/RemoteHive_Migration_Package
source venv/bin/activate
uvicorn backend.main:app --reload --port 8000

# 3. Start Autoscraper Service (Terminal 2)
cd autoscraper-engine-api
uvicorn backend.main:app --reload --port 8001

# 4. Start Admin Panel (Terminal 3)
cd admin-panel
npm install
npm run dev

# 5. Start Public Website (Terminal 4)
cd website
npm install
npm run dev

# 6. Start Celery Worker (Terminal 5)
celery -A app.tasks.celery_app worker --loglevel=info

# 7. Start Celery Beat Scheduler (Terminal 6)
celery -A app.tasks.celery_app beat --loglevel=info
```

### Default Credentials
- **Admin Email**: `admin@remotehive.in`
- **Admin Password**: `Ranjeet11$`

---

## API Endpoints & Services

### Main Backend API (Port 8000)

#### Authentication Endpoints
```
POST /api/v1/auth/login          # User login
POST /api/v1/auth/register       # User registration
POST /api/v1/auth/logout         # User logout
POST /api/v1/auth/refresh        # Token refresh
GET  /api/v1/auth/me            # Get current user
```

#### Job Management
```
GET    /api/v1/jobs             # List jobs
POST   /api/v1/jobs             # Create job
GET    /api/v1/jobs/{id}        # Get job details
PUT    /api/v1/jobs/{id}        # Update job
DELETE /api/v1/jobs/{id}        # Delete job
```

#### User Management
```
GET    /api/v1/users            # List users (admin)
GET    /api/v1/users/{id}       # Get user details
PUT    /api/v1/users/{id}       # Update user
DELETE /api/v1/users/{id}       # Delete user
```

#### Employer Management
```
GET    /api/v1/employers        # List employers
POST   /api/v1/employers        # Create employer profile
GET    /api/v1/employers/{id}   # Get employer details
PUT    /api/v1/employers/{id}   # Update employer
```

### Autoscraper API (Port 8001)
```
GET    /api/v1/scraper/status   # Scraper status
POST   /api/v1/scraper/start    # Start scraping
POST   /api/v1/scraper/stop     # Stop scraping
GET    /api/v1/scraper/jobs     # List scraped jobs
GET    /api/v1/scraper/config   # Get scraper config
PUT    /api/v1/scraper/config   # Update scraper config
```

---

## Authentication & Security

### JWT Configuration
```python
# JWT Settings
JWT_SECRET_KEY = "your-secret-key"
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7
```

### Role-Based Access Control (RBAC)
```python
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    EMPLOYER = "employer"
    JOB_SEEKER = "job_seeker"
    GUEST = "guest"
```

### Security Middleware
- **CORS**: Configured for frontend domains
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Pydantic models
- **SQL Injection Protection**: ORM usage
- **XSS Protection**: Input sanitization

---

## Frontend Applications

### Admin Panel (Next.js)
**Location**: `/admin-panel/`
**Port**: 3000

#### Key Features
- User management dashboard
- Job posting management
- Employer verification
- Analytics and reporting
- System configuration

#### API Service Configuration
```typescript
// src/lib/api.ts
const API_BASE_URL = 'http://localhost:8000';

export const authApi = {
  signIn: (credentials) => post('/api/v1/auth/login', credentials),
  signOut: () => post('/api/v1/auth/logout'),
  getSession: () => get('/api/v1/auth/me')
};

export const jobsApi = {
  getJobs: (params) => get('/api/v1/jobs', { params }),
  createJob: (data) => post('/api/v1/jobs', data),
  updateJob: (id, data) => put(`/api/v1/jobs/${id}`, data),
  deleteJob: (id) => del(`/api/v1/jobs/${id}`)
};
```

### Public Website (React + Vite)
**Location**: `/website/`
**Port**: 5173

#### Key Features
- Job search and filtering
- User registration/login
- Job application system
- Employer profiles
- Payment integration (Razorpay, Stripe)

#### API Service Configuration
```typescript
// src/lib/api.ts
const API_BASE_URL = 'http://localhost:8000';

export const jobApi = {
  searchJobs: (query) => get('/api/v1/jobs/search', { params: query }),
  getJobDetails: (id) => get(`/api/v1/jobs/${id}`),
  applyToJob: (jobId, application) => post(`/api/v1/jobs/${jobId}/apply`, application)
};
```

---

## Background Services

### Celery Configuration
```python
# backend/core/celery.py
from celery import Celery

celery_app = Celery(
    "remotehive",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["app.tasks.email", "app.tasks.jobs"]
)

# Task routing
celery_app.conf.task_routes = {
    "app.tasks.email.*": {"queue": "email"},
    "app.tasks.jobs.*": {"queue": "jobs"},
}
```

### Background Tasks
```python
# Email Tasks
@celery_app.task
def send_welcome_email(user_email: str):
    # Send welcome email logic
    pass

@celery_app.task
def send_job_alert(user_id: str, jobs: list):
    # Send job alert email
    pass

# Job Processing Tasks
@celery_app.task
def process_scraped_jobs(raw_jobs: list):
    # Process and normalize scraped jobs
    pass

@celery_app.task
def update_job_status():
    # Update expired job postings
    pass
```

---

## Testing Strategy

### Backend Testing (pytest)
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test types
pytest -m unit          # Unit tests
pytest -m integration   # Integration tests
pytest -m api          # API tests
pytest -m database     # Database tests
```

#### Test Configuration (pytest.ini)
```ini
[tool:pytest]
testpaths = tests app
python_files = test_*.py *_test.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --tb=short
    --strict-markers
    --disable-warnings
    --cov=app
    --cov-report=term-missing
    --cov-report=html:htmlcov

markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
    autoscraper: Autoscraper related tests
    api: API endpoint tests
    database: Database related tests
```

### Frontend Testing
```bash
# Admin Panel
cd admin-panel
npm test

# Public Website
cd website
npm test
```

---

## Deployment & Production

### Production Configuration

#### Backend Deployment
```bash
# Using Gunicorn + Uvicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend Deployment
```bash
# Admin Panel Build
cd admin-panel
npm run build
npm start

# Public Website Build
cd website
npm run build
npm run preview
```

### Environment-Specific Settings
```python
# Production settings
class ProductionSettings(Settings):
    debug: bool = False
    cors_origins: List[str] = ["https://admin.remotehive.com", "https://remotehive.com"]
    mongodb_url: str = "mongodb+srv://user:pass@cluster.mongodb.net/remotehive"
    redis_url: str = "redis://redis-cluster:6379"
```

### Health Checks
```python
# Health check endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "services": {
            "database": await check_database_health(),
            "redis": await check_redis_health(),
            "celery": await check_celery_health()
        }
    }
```

---

## Troubleshooting Guide

### Common Issues

#### 1. Service Connection Issues
**Problem**: 401 Unauthorized errors between services
**Solution**:
- Verify API URLs in frontend configuration files
- Check CORS settings in backend
- Validate JWT token configuration

#### 2. Database Connection Issues
**MongoDB**:
```bash
# Check MongoDB connection
mongosh mongodb://localhost:27017/remotehive

# Verify collections
db.users.countDocuments()
db.job_posts.countDocuments()
```

**Redis**:
```bash
# Check Redis connection
redis-cli ping

# Monitor Redis activity
redis-cli monitor
```

#### 3. Port Conflicts
```bash
# Check port usage
lsof -i :8000  # Backend API
lsof -i :8001  # Autoscraper
lsof -i :3000  # Admin Panel
lsof -i :5173  # Public Website
lsof -i :6379  # Redis
```

#### 4. Authentication Issues
- Default admin: `admin@remotehive.in` / `Ranjeet11$`
- Check JWT secret key configuration
- Verify token expiration settings
- Review RBAC role assignments

### Logging Configuration
```python
# backend/core/logging.py
from loguru import logger

logger.add(
    "logs/remotehive.log",
    rotation="1 day",
    retention="30 days",
    level="INFO",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}"
)
```

---

## Key Files Reference

### Configuration Files
- `/backend/main.py` - FastAPI application entry point
- `/backend/config.py` - Main backend configuration
- `/backend/core/config.py` - Core configuration settings
- `/fixed_startup.py` - Service startup script
- `/.env` - Environment variables
- `/requirements.txt` - Python dependencies
- `/pytest.ini` - Test configuration
- `/tsconfig.json` - TypeScript configuration

### Database Models
- `/backend/models/mongodb_models.py` - MongoDB/Beanie models
- `/backend/models/models.py` - SQLAlchemy models (legacy)
- `/backend/database/database.py` - Database initialization

### API Layer
- `/backend/api/api.py` - Main API router
- `/backend/api/endpoints/` - Individual endpoint modules
- `/admin-panel/src/lib/api.ts` - Admin API service
- `/website/src/lib/api.ts` - Public API service

### Authentication & Security
- `/backend/core/auth.py` - Authentication logic
- `/backend/core/rbac.py` - Role-based access control
- `/backend/middleware/` - Custom middleware

### Background Tasks
- `/backend/core/celery.py` - Celery configuration
- `/backend/tasks/` - Background task definitions

### Frontend Components
- `/admin-panel/src/components/` - Admin panel components
- `/website/src/components/` - Public website components
- `/website/src/pages/` - Page components
- `/website/src/contexts/` - React contexts

### Testing
- `/tests/` - Backend test files
- `/backend/tests/` - Application-specific tests
- `/admin-panel/tests/` - Admin panel tests
- `/website/tests/` - Public website tests

### Documentation
- `/docs/` - Project documentation
- `/README.md` - Project overview
- `/DEVELOPMENT.md` - Development guide
- `/STARTUP_GUIDE.md` - Service startup guide

---

## Migration Notes

### Database Migration (PostgreSQL → MongoDB)
The project has been migrated from PostgreSQL/Supabase to MongoDB:

- **Legacy models**: `/backend/models/models.py` (SQLAlchemy)
- **Current models**: `/backend/models/mongodb_models.py` (Beanie ODM)
- **Migration scripts**: `/migrations/` directory
- **Backup data**: `/migration_backup_*/` directories

### Authentication Migration
- **From**: Supabase Auth
- **To**: Custom JWT + Clerk integration
- **Compatibility**: Both systems supported during transition

---

This documentation serves as the complete memory and context reference for the RemoteHive project. It should be updated whenever significant changes are made to the architecture, configuration, or core functionality.

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: RemoteHive Development Team