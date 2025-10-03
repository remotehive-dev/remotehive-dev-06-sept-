# RemoteHive Senior Full-Stack Developer Rules

## Project Overview
RemoteHive is a comprehensive job board platform with a microservices architecture consisting of:
- **Backend API** (FastAPI + MongoDB)
- **Admin Panel** (Next.js + TypeScript)
- **Public Website** (React + Vite + TypeScript)
- **Autoscraper Service** (FastAPI + SQLite)
- **Background Services** (Celery + Redis)

## Architecture Understanding

### Core Services
1. **Main Backend API** (Port 8000)
   - FastAPI application with MongoDB
   - Authentication, user management, job management
   - Location: `/backend/main.py`

2. **Autoscraper Service** (Port 8001)
   - Independent FastAPI service for job scraping
   - SQLite database for scraper data
   - Location: `/autoscraper-engine-api/`

3. **Admin Panel** (Port 3000)
   - Next.js application for administrative tasks
   - Location: `/admin-panel/`

4. **Public Website** (Port 5173)
   - React + Vite application for job seekers and employers
   - Location: `/website/`

5. **Background Services**
   - Redis (Port 6379)
   - Celery Workers
   - Celery Beat Scheduler

### Database Architecture
- **Primary Database**: MongoDB (via Beanie ODM)
- **Autoscraper Database**: SQLite
- **Caching**: Redis
- **Migration Support**: From PostgreSQL/Supabase to MongoDB

## Development Rules

### 1. Service Communication
- **API Base URLs**:
  - Main API: `http://localhost:8000`
  - Autoscraper API: `http://localhost:8001`
  - Admin Panel: `http://localhost:3000`
  - Public Website: `http://localhost:5173`

- **Cross-Service Authentication**:
  - Use JWT tokens for service-to-service communication
  - Admin credentials: `admin@remotehive.in` / `Ranjeet11$`
  - Verify port configurations in API service files

### 2. File Structure Navigation

#### Backend (`/backend/`)
```
backend/
├── main.py                 # FastAPI application entry
├── config.py              # Configuration settings
├── api/                   # API endpoints
│   ├── api.py            # Main router
│   └── endpoints/        # Individual endpoint modules
├── models/               # Database models
│   ├── mongodb_models.py # MongoDB/Beanie models
│   └── models.py         # SQLAlchemy models (legacy)
├── database/             # Database utilities
├── services/             # Business logic
├── middleware/           # Custom middleware
├── core/                 # Core utilities
└── tests/               # Test files
```

#### Frontend Applications
```
admin-panel/         # Next.js Admin Panel
├── src/
│   ├── lib/api.ts       # API service layer
│   ├── components/      # React components
│   └── pages/          # Next.js pages

website/        # React Public Website
├── src/
│   ├── lib/            # API and utility functions
│   ├── components/     # React components
│   ├── pages/         # Page components
│   └── contexts/      # React contexts
```

### 3. Development Workflow

#### Starting Services
1. **Use the startup script**: `python fixed_startup.py`
2. **Manual startup order**:
   ```bash
   # 1. Start Redis
   redis-server
   
   # 2. Start main backend
   cd /path/to/project
   uvicorn backend.main:app --reload --port 8000
   
   # 3. Start autoscraper service
   cd autoscraper-engine-api
   uvicorn backend.main:app --reload --port 8001
   
   # 4. Start admin panel
   cd admin-panel
   npm run dev
   
   # 5. Start public website
   cd website
   npm run dev
   
   # 6. Start background workers
   celery -A app.tasks.celery_app worker --loglevel=info
   celery -A app.tasks.celery_app beat --loglevel=info
   ```

#### Testing Approach
1. **Backend Testing**:
   - Use pytest with markers: `unit`, `integration`, `api`, `database`
   - Test files: `test_*.py` in `/tests/` directory
   - Coverage reporting enabled

2. **Frontend Testing**:
   - Admin Panel: Next.js testing framework
   - Public Website: Vite + React testing

### 4. Code Standards

#### Backend (Python)
- **Framework**: FastAPI with async/await patterns
- **Database**: MongoDB with Beanie ODM
- **Authentication**: JWT with role-based access control
- **Configuration**: Pydantic Settings with environment variables
- **Error Handling**: Custom middleware with structured responses

#### Frontend (TypeScript)
- **Admin Panel**: Next.js 14+ with App Router
- **Public Website**: React 19+ with Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand (Admin), React Context (Public)
- **API Layer**: Centralized API services in `/lib/api.ts`

### 5. Common Issues and Solutions

#### Port Configuration Issues
- **Problem**: 401 Unauthorized errors between services
- **Solution**: Verify API URLs in frontend configuration files
- **Files to check**: 
  - `/admin-panel/src/lib/api.ts`
  - `/website/src/lib/api.ts`

#### Database Connection Issues
- **MongoDB**: Check connection string in `.env`
- **SQLite**: Verify autoscraper database path
- **Redis**: Ensure Redis server is running on port 6379

#### Authentication Issues
- **Admin Login**: Use `admin@remotehive.in` / `Ranjeet11$`
- **JWT Tokens**: Check token expiration and refresh logic
- **CORS**: Verify CORS settings in backend configuration

### 6. Environment Configuration

#### Required Environment Variables
```bash
# Database
MONGODB_URL=mongodb://localhost:27017/remotehive
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# External APIs
CLERK_SECRET_KEY=your-clerk-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password
```

### 7. Deployment Considerations

#### Production Setup
- **Backend**: Gunicorn + Uvicorn workers
- **Frontend**: Static builds deployed to CDN
- **Database**: MongoDB Atlas or self-hosted
- **Caching**: Redis cluster
- **Monitoring**: Health check endpoints available

#### Security
- **HTTPS**: Required for production
- **CORS**: Properly configured for frontend domains
- **Rate Limiting**: Implemented in middleware
- **Input Validation**: Pydantic models for all inputs

### 8. Development Best Practices

#### Code Organization
- **Separation of Concerns**: Clear separation between API, business logic, and data layers
- **Dependency Injection**: Use FastAPI's dependency system
- **Error Handling**: Consistent error responses across all endpoints
- **Documentation**: OpenAPI/Swagger documentation auto-generated

#### Performance
- **Async Operations**: Use async/await for I/O operations
- **Database Queries**: Optimize MongoDB queries with proper indexing
- **Caching**: Redis for frequently accessed data
- **Background Tasks**: Celery for heavy operations

#### Monitoring
- **Health Checks**: `/health` endpoints for all services
- **Logging**: Structured logging with appropriate levels
- **Metrics**: Performance monitoring for critical paths

### 9. Troubleshooting Guide

#### Service Startup Issues
1. Check if all required services are running
2. Verify port availability
3. Check environment variables
4. Review service logs

#### API Communication Issues
1. Verify service URLs and ports
2. Check authentication tokens
3. Validate request/response formats
4. Review CORS configuration

#### Database Issues
1. Check database connection strings
2. Verify database server status
3. Review migration status
4. Check data integrity

### 10. Key Files Reference

#### Configuration Files
- `/backend/config.py` - Main backend configuration
- `/backend/main.py` - FastAPI application setup
- `/admin-panel/src/lib/api.ts` - Admin panel API configuration
- `/website/src/lib/api.ts` - Public website API configuration

#### Database Models
- `/backend/models/mongodb_models.py` - MongoDB models
- `/backend/database/database.py` - Database initialization

#### API Endpoints
- `/backend/api/api.py` - Main API router
- `/backend/api/endpoints/` - Individual endpoint modules

#### Startup Scripts
- `/fixed_startup.py` - Comprehensive service startup
- `/comprehensive_startup.py` - Alternative startup script

This handbook serves as the foundation for understanding and working with the RemoteHive platform as a senior full-stack developer. Always refer to this guide when making architectural decisions or troubleshooting issues.