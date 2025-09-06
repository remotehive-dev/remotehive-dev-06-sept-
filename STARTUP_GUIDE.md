# RemoteHive Comprehensive Startup Guide

This guide provides comprehensive instructions for starting all RemoteHive services simultaneously using the provided startup scripts.

## 🚀 Quick Start

For immediate development setup:

```bash
# Install startup script dependencies
pip install -r startup_requirements.txt

# Quick start (simplified)
python quick_start.py

# OR comprehensive start (recommended)
python comprehensive_startup.py
```

## 📋 Services Overview

The startup scripts manage the following services:

| Service | Port | Description | Critical |
|---------|------|-------------|----------|
| **Redis Server** | 6379 | Message broker and cache | Optional |
| **Backend Server** | 8000 | Main FastAPI application | ✅ Critical |
| **Autoscraper API** | 8001 | Autoscraper service API | ✅ Critical |
| **Admin Panel** | 3000 | Next.js admin interface | ✅ Critical |
| **Website** | 5173 | Vite.js public website | ✅ Critical |
| **Celery Workers** | - | Background task processors | Optional |
| **Celery Beat** | - | Task scheduler | Optional |

## 🛠️ Prerequisites

Ensure the following are installed on your system:

### Required Dependencies
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Redis Server** (for background tasks)

### Installation Commands

```bash
# macOS (using Homebrew)
brew install python node redis

# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip nodejs npm redis-server

# Windows (using Chocolatey)
choco install python nodejs redis-64
```

### Project Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt
pip install -r startup_requirements.txt

# Install Node.js dependencies for admin panel
cd remotehive-admin
npm install
cd ..

# Install Node.js dependencies for website
cd remotehive-public
npm install
cd ..
```

## 📖 Startup Scripts

### 1. Comprehensive Startup Script

**File:** `comprehensive_startup.py`

**Features:**
- ✅ Concurrent service startup with dependency management
- ✅ Comprehensive error handling and logging
- ✅ Health checks and service verification
- ✅ Graceful shutdown handling
- ✅ Resource monitoring and cleanup
- ✅ Detailed startup summary and statistics

**Usage:**

```bash
# Start all services
python comprehensive_startup.py

# Start with verbose logging
python comprehensive_startup.py --verbose

# Skip cache cleanup
python comprehensive_startup.py --skip-cleanup

# Skip health checks (faster startup)
python comprehensive_startup.py --no-health-check

# Start specific services only
python comprehensive_startup.py --services backend,autoscraper_api,admin_panel
```

**Available Services for --services flag:**
- `redis` - Redis server
- `backend` - Main backend server
- `autoscraper_api` - Autoscraper API service
- `admin_panel` - Admin panel (Next.js)
- `website` - Public website (Vite.js)
- `autoscraper_worker_default` - Default queue worker
- `autoscraper_worker_heavy` - Heavy tasks worker
- `celery_beat` - Task scheduler

### 2. Quick Start Script

**File:** `quick_start.py`

**Features:**
- ⚡ Fast startup with minimal configuration
- 🎯 Core services only
- 📝 Simple output and logging

**Usage:**

```bash
python quick_start.py
```

## 🔧 Configuration

### Environment Variables

Ensure the following environment variables are set:

```bash
# Required for JWT authentication
export JWT_SECRET_KEY="your-secret-key-here"

# Database configuration
export DATABASE_URL="sqlite:///./remotehive.db"

# Redis configuration (optional)
export REDIS_URL="redis://localhost:6379/0"

# Environment setting
export ENVIRONMENT="development"
```

### Configuration Files

Ensure the following configuration files exist:

- `.env` files in project root and service directories
- `package.json` files in frontend directories
- Database migration files

## 📊 Monitoring and Logs

### Log Files

Startup logs are saved to:
```
logs/startup_YYYYMMDD_HHMMSS.log
```

### Service Monitoring

The comprehensive startup script includes:
- Real-time service health monitoring
- Automatic restart on failure (configurable)
- Resource usage tracking
- Port conflict detection and resolution

### Health Check URLs

- Backend: `http://localhost:8000/health`
- Autoscraper API: `http://localhost:8001/health`
- Admin Panel: `http://localhost:3000`
- Website: `http://localhost:5173`

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# The startup script automatically cleans up ports, but you can manually check:
lsof -i :8000  # Check what's using port 8000
kill -9 <PID>  # Kill the process
```

#### Missing Dependencies
```bash
# Check system dependencies
python comprehensive_startup.py --verbose

# Install missing Python packages
pip install -r requirements.txt
pip install -r startup_requirements.txt

# Install missing Node.js packages
cd remotehive-admin && npm install
cd ../remotehive-public && npm install
```

#### Service Startup Failures

1. **Check logs** in the `logs/` directory
2. **Run with verbose mode**: `python comprehensive_startup.py --verbose`
3. **Start services individually** to isolate issues
4. **Check configuration files** and environment variables

#### Database Issues
```bash
# Reset database (development only)
rm -f remotehive.db
python -m alembic upgrade head
```

### Debug Mode

For detailed debugging:

```bash
# Enable verbose logging
python comprehensive_startup.py --verbose

# Check individual service logs
tail -f logs/startup_*.log

# Test individual services
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 🔄 Service Management

### Starting Services

```bash
# All services
python comprehensive_startup.py

# Core services only
python comprehensive_startup.py --services backend,autoscraper_api

# With custom configuration
JWT_SECRET_KEY=mysecret python comprehensive_startup.py
```

### Stopping Services

- **Graceful shutdown**: Press `Ctrl+C`
- **Force stop**: Press `Ctrl+C` twice
- **Manual cleanup**: Use system process manager

### Restarting Services

```bash
# Stop current services (Ctrl+C)
# Then restart
python comprehensive_startup.py
```

## 🎯 Development Workflow

### Typical Development Session

1. **Start services**:
   ```bash
   python comprehensive_startup.py
   ```

2. **Verify all services are running**:
   - Check the startup summary
   - Visit the health check URLs
   - Monitor the logs

3. **Develop and test**:
   - Services auto-reload on code changes
   - Monitor logs for errors
   - Use the admin panel and website

4. **Stop services**:
   ```bash
   # Press Ctrl+C in the terminal
   ```

### Production Deployment

For production deployment, consider:

- Using process managers like PM2 or systemd
- Setting up proper logging and monitoring
- Configuring reverse proxies (nginx)
- Setting up SSL certificates
- Using production databases (PostgreSQL)

## 📚 Advanced Usage

### Custom Service Configuration

Modify the `ServiceConfig` objects in `comprehensive_startup.py` to:
- Change ports
- Add environment variables
- Modify startup commands
- Adjust health check settings

### Integration with CI/CD

```bash
# In your CI/CD pipeline
python comprehensive_startup.py --no-health-check --services backend,autoscraper_api
# Run tests
# Stop services
```

### Docker Integration

The startup scripts can be used alongside Docker:

```bash
# Start external services with Docker
docker-compose up -d redis postgres

# Start application services with the script
python comprehensive_startup.py --services backend,autoscraper_api,admin_panel,website
```

## 🤝 Contributing

To contribute improvements to the startup scripts:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

**Need Help?** 
- Check the troubleshooting section above
- Review the logs in the `logs/` directory
- Run with `--verbose` flag for detailed output
- Open an issue in the project repository