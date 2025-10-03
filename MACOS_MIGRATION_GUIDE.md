# RemoteHive Project Migration Guide: Windows to macOS

## Overview
This guide provides step-by-step instructions to transfer the complete RemoteHive project from Windows to macOS, ensuring all components, databases, configurations, and development environment are properly set up.

## Project Structure Analysis

The RemoteHive project consists of:

### Core Applications
1. **Backend API** (FastAPI) - Main server application
2. **Admin Panel** (Next.js) - Administrative interface
3. **Public Website** (React + Vite) - User-facing website

### Databases
- `remotehive.db` - Main SQLite database (1.2MB+)
- `app.db` - Additional application database

### Key Configuration Files
- `.env` - Main environment variables
- `requirements.txt` - Python dependencies
- `package.json` files - Node.js dependencies

## Pre-Migration Checklist

### 1. Backup Current Project
```bash
# Create a complete backup
tar -czf remotehive-backup-$(date +%Y%m%d).tar.gz /path/to/Remotehive
```

### 2. Document Current State
- [ ] Note all running services and ports
- [ ] Export environment variables
- [ ] List installed dependencies
- [ ] Document any custom configurations

## macOS Setup Requirements

### 1. Install Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install System Dependencies
```bash
# Python 3.11+
brew install python@3.11

# Node.js 18+
brew install node@18

# Redis
brew install redis
brew services start redis

# Git
brew install git

# PostgreSQL (optional, for production)
brew install postgresql@15
brew services start postgresql@15

# Additional tools
brew install wget curl
```

### 3. Install Python Package Manager
```bash
# Install pip and virtualenv
python3 -m pip install --upgrade pip
pip3 install virtualenv
```

## Migration Steps

### Step 1: Transfer Project Files

#### Option A: Using Git (Recommended)
```bash
# On Windows machine, commit all changes
cd d:\Remotehive
git add .
git commit -m "Pre-migration commit"
git push origin main

# On macOS machine
git clone <your-repository-url> ~/RemoteHive
cd ~/RemoteHive
```

#### Option B: Direct File Transfer
```bash
# Using rsync, scp, or cloud storage
# Transfer the entire project directory to ~/RemoteHive
```

### Step 2: Database Migration

#### Copy Database Files
```bash
# Ensure these files are transferred:
cp remotehive.db ~/RemoteHive/
cp remotehive.db-shm ~/RemoteHive/
cp remotehive.db-wal ~/RemoteHive/
cp app.db ~/RemoteHive/
```

#### Verify Database Integrity
```bash
cd ~/RemoteHive
python3 -c "import sqlite3; conn = sqlite3.connect('remotehive.db'); print('Tables:', [row[0] for row in conn.execute('SELECT name FROM sqlite_master WHERE type=\"table\"').fetchall()]); conn.close()"
```

### Step 3: Environment Configuration

#### Main Application Environment
```bash
cd ~/RemoteHive
cp .env.example .env
```

Edit `.env` with macOS-specific paths:
```env
# Database Settings
DATABASE_URL=sqlite:///./remotehive.db

# Redis Settings
REDIS_URL=redis://localhost:6379

# File Upload Settings
UPLOAD_DIR=./uploads

# Environment
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# Keep your existing API keys and secrets
SUPABASE_URL=https://nwltjjqhdpezreaikxfj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SECRET_KEY=your-super-secret-key-change-this-in-production

# Email Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=remotehive.official@gmail.com
EMAIL_PASSWORD=fzvewhcpexaoydwf

# API Keys
GOOGLE_MAPS_API_KEY=AIzaSyBNGjjlAJreahhuT5BHf2Mn-fJd4w60Fn8
```



### Step 4: Backend Setup

#### Create Virtual Environment
```bash
cd ~/RemoteHive
python3 -m venv venv
source venv/bin/activate
```

#### Install Python Dependencies
```bash
# Main application
pip install -r requirements.txt
```

#### Initialize Database
```bash
# Run migrations if needed
python run_migrations.py

# Verify database connection
python -c "from app.database.database import DatabaseManager; dm = DatabaseManager(); print('Database connected successfully')"
```

### Step 5: Frontend Setup

#### Admin Panel (Next.js)
```bash
cd ~/RemoteHive/remotehive-admin
npm install

# Create environment file
cp .env.example .env.local
```

Edit `admin-panel/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://nwltjjqhdpezreaikxfj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Public Website (React + Vite)
```bash
cd ~/RemoteHive/remotehive-public
npm install

# Create environment file
cp .env.example .env.local
```

Edit `website/.env.local`:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://nwltjjqhdpezreaikxfj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 6: Service Configuration

#### Create Startup Scripts

Create `~/RemoteHive/start_all_macos.sh`:
```bash
#!/bin/bash

# Start Redis
brew services start redis

# Start Backend API
echo "Starting Backend API..."
cd ~/RemoteHive
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!



# Start Admin Panel
echo "Starting Admin Panel..."
cd ~/RemoteHive/remotehive-admin
npm run dev &
ADMIN_PID=$!

# Start Public Website
echo "Starting Public Website..."
cd ~/RemoteHive/remotehive-public
npm run dev &
PUBLIC_PID=$!

# Start Celery Worker
echo "Starting Celery Worker..."
cd ~/RemoteHive
celery -A app.core.celery worker --loglevel=info &
CELERY_PID=$!

echo "All services started!"
echo "Backend API: http://localhost:8000"
echo "Admin Panel: http://localhost:3000"
echo "Public Website: http://localhost:5173"

# Save PIDs for cleanup
echo $BACKEND_PID > ~/RemoteHive/.pids
echo $ADMIN_PID >> ~/RemoteHive/.pids
echo $PUBLIC_PID >> ~/RemoteHive/.pids
echo $CELERY_PID >> ~/RemoteHive/.pids

wait
```

Make it executable:
```bash
chmod +x ~/RemoteHive/start_all_macos.sh
```

Create `~/RemoteHive/stop_all_macos.sh`:
```bash
#!/bin/bash

if [ -f ~/RemoteHive/.pids ]; then
    while read pid; do
        kill $pid 2>/dev/null
    done < ~/RemoteHive/.pids
    rm ~/RemoteHive/.pids
fi

echo "All services stopped!"
```

Make it executable:
```bash
chmod +x ~/RemoteHive/stop_all_macos.sh
```

## Verification Steps

### 1. Test Database Connections
```bash
cd ~/RemoteHive
source venv/bin/activate
python -c "from app.database.database import DatabaseManager; dm = DatabaseManager(); print('Main DB:', dm.test_connection())"
```

### 2. Test API Endpoints
```bash
# Start the backend
cd ~/RemoteHive
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/jobs
```

### 3. Test Frontend Applications
```bash
# Test admin panel
cd ~/RemoteHive/remotehive-admin
npm run dev
# Visit http://localhost:3000

# Test public website
cd ~/RemoteHive/remotehive-public
npm run dev
# Visit http://localhost:5173
```



## Troubleshooting

### Common Issues

#### 1. Python Path Issues
```bash
# Add to ~/.zshrc or ~/.bash_profile
export PATH="/opt/homebrew/bin:$PATH"
export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH"
```

#### 2. Node.js Version Issues
```bash
# Use nvm for Node.js version management
brew install nvm
nvm install 18
nvm use 18
```

#### 3. Database Permission Issues
```bash
chmod 664 ~/RemoteHive/*.db
```

#### 4. Redis Connection Issues
```bash
# Check Redis status
brew services list | grep redis

# Restart Redis
brew services restart redis
```

#### 5. Port Conflicts
```bash
# Check what's using ports
lsof -i :8000
lsof -i :3000
lsof -i :5000
lsof -i :5173

# Kill processes if needed
kill -9 <PID>
```

## Performance Optimization for macOS

### 1. Increase File Limits
Add to `~/.zshrc`:
```bash
ulimit -n 65536
```

### 2. Optimize Python Performance
```bash
# Install performance packages
pip install uvloop
pip install orjson
```

### 3. Configure Git for Large Files
```bash
git config core.preloadindex true
git config core.fscache true
git config gc.auto 256
```

## Security Considerations

### 1. Update API Keys
- Generate new API keys for production
- Use macOS Keychain for sensitive data
- Enable firewall for development ports

### 2. File Permissions
```bash
chmod 600 ~/RemoteHive/.env
chmod 600 ~/RemoteHive/admin-panel/.env.local
chmod 600 ~/RemoteHive/website/.env.local
```

## Final Checklist

- [ ] All databases transferred and accessible
- [ ] Environment variables configured
- [ ] Python dependencies installed
- [ ] Node.js dependencies installed
- [ ] All services start successfully
- [ ] API endpoints respond correctly
- [ ] Frontend applications load properly
- [ ] Background tasks (Celery) working
- [ ] File uploads working
- [ ] Email functionality tested
- [ ] Database migrations applied
- [ ] Logs directory created and writable

## Next Steps

1. **Test thoroughly** - Run all features to ensure everything works
2. **Update documentation** - Document any macOS-specific changes
3. **Set up monitoring** - Configure logging and error tracking
4. **Backup strategy** - Set up automated backups for the new environment
5. **Performance tuning** - Optimize for macOS hardware

## Support

If you encounter issues during migration:
1. Check the troubleshooting section
2. Review logs in `~/RemoteHive/logs/`
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed
5. Check file permissions and paths

---

**Migration completed successfully!** 🎉

Your RemoteHive project should now be fully operational on macOS with all features intact.