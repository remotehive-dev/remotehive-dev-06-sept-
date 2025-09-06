# RemoteHive API - Development Setup

This guide will help you set up and run the RemoteHive API locally without Docker for development purposes.

## Prerequisites

### Required Software

1. **Python 3.8+** - [Download from python.org](https://python.org)
2. **PostgreSQL 12+** - [Download from postgresql.org](https://postgresql.org)
3. **Redis** (optional, for background tasks) - [Download from redis.io](https://redis.io)

### Optional Software

- **Git** - For version control
- **VS Code** or your preferred IDE
- **Postman** or similar API testing tool

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd RemoteHive
```

### 2. Set Up Environment

#### Windows

```cmd
# Run the batch script
run_dev.bat
```

#### Linux/macOS

```bash
# Make the script executable and run
chmod +x run_dev.sh
./run_dev.sh
```

#### Manual Setup

```bash
# Run the Python script directly
python run_dev.py
```

The development script will automatically:

- Check Python version
- Create `.env` file from `.env.example` if needed
- Install dependencies
- Set up the database
- Start background services (Celery)
- Launch the API server

## Manual Setup (Step by Step)

If you prefer to set up everything manually:

### 1. Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
```

### 4. Set Up Database

#### PostgreSQL Setup

1. Install PostgreSQL
2. Create a database:

```sql
CREATE DATABASE remotehive;
CREATE USER remotehive_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE remotehive TO remotehive_user;
```

3. Update your `.env` file:

```env
DATABASE_URL=postgresql://remotehive_user:your_password@localhost:5432/remotehive
```

### 5. Set Up Redis (Optional)

For background tasks and caching:

1. Install Redis
2. Start Redis server:

```bash
# Linux/macOS
redis-server

# Windows (if using Redis for Windows)
redis-server.exe
```

3. Update your `.env` file:

```env
REDIS_URL=redis://localhost:6379/0
```

### 6. Initialize Database

```bash
# Create database tables
python -c "from app.core.database import engine; from app.models.user import Base; Base.metadata.create_all(bind=engine)"
```

### 7. Start Services

#### Terminal 1: API Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 2: Celery Worker (Optional)

```bash
celery -A app.core.celery worker --loglevel=info --pool=solo
```

#### Terminal 3: Celery Beat (Optional)

```bash
celery -A app.core.celery beat --loglevel=info
```

## Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/remotehive

# JWT Settings
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Supabase (if using)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Optional Environment Variables

```env
# Redis (for background tasks)
REDIS_URL=redis://localhost:6379/0

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@remotehive.com
EMAIL_USE_TLS=true

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# External APIs
LINKEDIN_API_KEY=your-linkedin-api-key
INDEED_API_KEY=your-indeed-api-key
GLASSDOOR_API_KEY=your-glassdoor-api-key

# Development
DEBUG=true
ENVIRONMENT=development
LOG_LEVEL=INFO
```

## API Access

Once the server is running, you can access:

- **API Base URL**: http://localhost:8000
- **Interactive API Docs**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Development Workflow

### 1. Making Changes

- The API server runs with `--reload` flag, so changes to Python files will automatically restart the server
- Database schema changes require manual migration or recreation
- Environment variable changes require server restart

### 2. Testing API Endpoints

#### Using curl

```bash
# Health check
curl http://localhost:8000/health

# Register a new user
curl -X POST "http://localhost:8000/api/v1/auth/register" \
     -H "Content-Type: application/json" \
     -d '{"email":"ranjeettiwari105@gmail.com","password":"Ranjeet11$","first_name":"Test","last_name":"User"}'
```

#### Using the Interactive Docs

1. Go to http://localhost:8000/docs
2. Click on any endpoint to expand it
3. Click "Try it out"
4. Fill in the parameters
5. Click "Execute"

### 3. Database Management

#### View Database

```bash
# Connect to PostgreSQL
psql -h localhost -U remotehive_user -d remotehive

# List tables
\dt

# View users
SELECT * FROM users;
```

#### Reset Database

```bash
# Drop and recreate tables
python -c "from app.core.database import engine; from app.models.user import Base; Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)"
```

### 4. Background Tasks

If Redis is configured, you can monitor background tasks:

```bash
# Monitor Celery tasks
celery -A app.core.celery events

# View task results
celery -A app.core.celery result <task-id>
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

```
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) could not connect to server
```

**Solution**:

- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists

#### 2. Import Errors

```
ModuleNotFoundError: No module named 'app'
```

**Solution**:

- Ensure you're in the project root directory
- Check that `__init__.py` files exist in app directories
- Verify virtual environment is activated

#### 3. Redis Connection Error

```
celery.exceptions.ImproperlyConfigured: You're trying to use a 'redis' broker
```

**Solution**:

- Install Redis or comment out Redis-related settings
- Update `REDIS_URL` in `.env`
- Start Redis server

#### 4. Port Already in Use

```
OSError: [Errno 48] Address already in use
```

**Solution**:

- Kill process using port 8000: `lsof -ti:8000 | xargs kill -9`
- Or use a different port: `uvicorn main:app --port 8001`

### Getting Help

1. Check the logs for detailed error messages
2. Ensure all prerequisites are installed
3. Verify environment configuration
4. Check database connectivity
5. Review the API documentation at `/docs`

## Production Considerations

This development setup is **NOT** suitable for production. For production deployment:

1. Use proper WSGI server (Gunicorn)
2. Set up reverse proxy (Nginx)
3. Use environment-specific configuration
4. Set up proper logging
5. Configure SSL/TLS
6. Use production database settings
7. Set up monitoring and alerting

Refer to the main README.md for production deployment guidelines.
