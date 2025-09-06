# Running RemoteHive API Without Docker

This guide provides step-by-step instructions to run the RemoteHive API locally without Docker.

## Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**

```cmd
run_dev.bat
```

**Linux/macOS:**

```bash
./run_dev.sh
```

**Cross-platform:**

```bash
python run_dev.py
```

### Option 2: Manual Setup

If you prefer to set up everything manually, follow these steps:

## Prerequisites

1. **Python 3.8+** installed
2. **PostgreSQL** database running
3. **Redis** (optional, for background tasks)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
```

**Minimum required settings in `.env`:**

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/remotehive

# JWT
SECRET_KEY=your-very-secure-secret-key-here

# Optional: Redis for background tasks
REDIS_URL=redis://localhost:6379/0
```

### 3. Set Up Database

**Create PostgreSQL database:**

```sql
CREATE DATABASE remotehive;
CREATE USER remotehive_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE remotehive TO remotehive_user;
```

**Initialize database tables:**

```bash
python -c "from app.core.database import engine; from app.models.user import Base; Base.metadata.create_all(bind=engine)"
```

### 4. Start the Application

**Start API server:**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Optional: Start background tasks (in separate terminals):**

```bash
# Terminal 2: Celery worker
celery -A app.core.celery worker --loglevel=info --pool=solo

# Terminal 3: Celery beat scheduler
celery -A app.core.celery beat --loglevel=info
```

## Access the API

Once running, you can access:

- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Testing the Setup

### 1. Health Check

```bash
curl http://localhost:8000/health
```

### 2. Register a User

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "ranjeettiwari105@gmail.com",
       "password": "Ranjeet11$",
       "first_name": "Test",
       "last_name": "User"
     }'
```

### 3. Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "ranjeettiwari105@gmail.com",
       "password": "Ranjeet11$"
     }'
```

## What's Included

When you run the application, you get:

✅ **Core API Features:**

- User authentication and registration
- Job posting management
- Job application system
- Employer profiles
- Admin endpoints

✅ **Background Tasks** (if Redis is configured):

- Job scraping from external sources
- Email notifications
- Cleanup tasks
- Job recommendations

✅ **Development Features:**

- Auto-reload on code changes
- Interactive API documentation
- Detailed logging
- Error handling

## Differences from Docker Setup

| Feature                   | Docker                           | Without Docker                 |
| ------------------------- | -------------------------------- | ------------------------------ |
| **Setup Complexity**      | Simple (`docker-compose up`)     | Manual dependency installation |
| **Database**              | Automatic PostgreSQL container   | Manual PostgreSQL setup        |
| **Redis**                 | Automatic Redis container        | Manual Redis setup             |
| **Environment Isolation** | Complete isolation               | Uses local environment         |
| **Port Conflicts**        | Handled automatically            | Manual port management         |
| **Development**           | Good for production-like testing | Better for active development  |

## Troubleshooting

### Common Issues

**1. Database Connection Error**

```
sqlalchemy.exc.OperationalError: could not connect to server
```

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists and user has permissions

**2. Module Import Errors**

```
ModuleNotFoundError: No module named 'app'
```

- Ensure you're in the project root directory
- Check virtual environment is activated
- Verify all dependencies are installed

**3. Redis Connection Error**

```
celery.exceptions.ImproperlyConfigured: You're trying to use a 'redis' broker
```

- Install and start Redis, or
- Comment out Celery-related code for basic functionality

**4. Port Already in Use**

```
OSError: [Errno 48] Address already in use
```

- Kill existing process: `lsof -ti:8000 | xargs kill -9` (Linux/macOS)
- Or use different port: `uvicorn main:app --port 8001`

### Getting Help

1. Check the detailed logs for error messages
2. Verify all prerequisites are installed and running
3. Ensure `.env` file is properly configured
4. Test database connectivity separately
5. Review the API documentation at `/docs`

For more detailed development setup, see `DEVELOPMENT.md`.
