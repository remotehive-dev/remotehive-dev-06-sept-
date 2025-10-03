# RemoteHive Migration Validation Checklist

This checklist helps validate that your RemoteHive project has been successfully migrated from Windows to macOS and all components are working correctly.

## Pre-Migration Validation (Windows)

### ✅ Data Export Verification
- [ ] Run `python export_databases.py` successfully
- [ ] Verify migration backup directory created: `migration_backup_YYYYMMDD_HHMMSS/`
- [ ] Check all database files exported:
  - [ ] `remotehive.db` (main database)
  - [ ] `app.db` (application database)
- [ ] Verify SQL dumps created for all databases
- [ ] Verify JSON backups created for all databases
- [ ] Check configuration files copied:
  - [ ] `.env` (main environment)
  - [ ] `requirements.txt` files
  - [ ] `package.json` files
- [ ] Review `migration_report.json` for completeness

### ✅ Project State Documentation
- [ ] Document current running services (Redis, PostgreSQL, etc.)
- [ ] Note current Python version and packages
- [ ] Document Node.js version and npm packages
- [ ] List any custom configurations or modifications
- [ ] Record current database schema versions
- [ ] Note any pending migrations or updates

## File Transfer Validation

### ✅ Complete Project Transfer
- [ ] Copy entire project directory to macOS
- [ ] Verify all subdirectories transferred:
  - [ ] `admin-panel/` (Next.js admin panel)
  - [ ] `website/` (Vite public site)
  - [ ] `database_migration/` (if exists)
  - [ ] `static/` and `uploads/` directories
- [ ] Copy migration backup directory
- [ ] Verify file permissions are correct
- [ ] Check that hidden files (.env, .gitignore) transferred

### ✅ Migration Scripts Transfer
- [ ] `MACOS_MIGRATION_GUIDE.md` copied
- [ ] `ENVIRONMENT_SETUP_GUIDE.md` copied
- [ ] `macos_setup.sh` copied and executable
- [ ] `export_databases.py` copied (for reference)

## macOS Environment Setup

### ✅ System Dependencies
- [ ] Run `./macos_setup.sh` successfully
- [ ] Homebrew installed and updated
- [ ] Python 3.11 installed and accessible
- [ ] Node.js 18 installed and accessible
- [ ] Redis installed and running
- [ ] PostgreSQL 15 installed and running
- [ ] SQLite3 available
- [ ] Additional tools installed (git, curl, wget, tree, htop, jq)

### ✅ Python Environment
- [ ] Virtual environment created at `~/RemoteHive/venv/`
- [ ] Virtual environment activates successfully
- [ ] pip updated to latest version
- [ ] Main dependencies installed from `requirements.txt`
- [ ] No critical package installation errors

### ✅ Node.js Environment
- [ ] Admin frontend dependencies installed (`admin-panel/node_modules/`)
- [ ] Public frontend dependencies installed (`website/node_modules/`)
- [ ] Root dependencies installed (if applicable)
- [ ] No critical npm installation errors

## Database Migration Validation

### ✅ Database Restoration
- [ ] Run `./restore_migration.sh` successfully
- [ ] Database files restored to correct locations:
  - [ ] `remotehive.db` in project root
  - [ ] `app.db` in project root
- [ ] Database files have correct permissions
- [ ] Database integrity check passes

### ✅ Database Connectivity
- [ ] SQLite databases open without errors
- [ ] Can query main tables successfully
- [ ] Foreign key constraints intact
- [ ] Indexes and triggers preserved
- [ ] Data counts match Windows export

## Configuration Validation

### ✅ Environment Files
- [ ] Main `.env` file exists and readable
- [ ] Admin frontend `.env.local` created
- [ ] Public frontend `.env.local` created
- [ ] All required environment variables present
- [ ] Database paths updated for macOS
- [ ] Redis URL configured correctly
- [ ] API URLs point to correct endpoints

### ✅ Path Adjustments
- [ ] Database file paths use forward slashes
- [ ] Upload directories use macOS paths
- [ ] Log file paths updated
- [ ] Static file paths corrected
- [ ] Any hardcoded Windows paths removed

## Service Validation

### ✅ Redis Service
- [ ] Redis server running: `brew services list | grep redis`
- [ ] Can connect to Redis: `redis-cli ping`
- [ ] Redis configuration appropriate for development
- [ ] Memory usage reasonable

### ✅ PostgreSQL Service (if used)
- [ ] PostgreSQL running: `brew services list | grep postgresql`
- [ ] Can connect to PostgreSQL
- [ ] Databases created if needed
- [ ] User permissions configured

## Application Testing

### ✅ Backend API
- [ ] Activate virtual environment: `source venv/bin/activate`
- [ ] Start backend server: `uvicorn main:app --host 0.0.0.0 --port 8001 --reload`
- [ ] API server starts without errors
- [ ] Health check endpoint responds: `curl http://localhost:8001/health`
- [ ] Database connections established
- [ ] Redis connections working
- [ ] Authentication endpoints functional
- [ ] File upload endpoints working
- [ ] API documentation accessible

### ✅ Admin Frontend (Next.js)
- [ ] Navigate to `admin-panel/` directory
- [ ] Install dependencies: `npm install` (if not done)
- [ ] Start development server: `npm run dev`
- [ ] Admin panel loads at `http://localhost:3001`
- [ ] Authentication flow works
- [ ] Dashboard displays correctly
- [ ] API calls to backend successful
- [ ] Database data displays properly
- [ ] Forms and interactions work

### ✅ Public Frontend (Vite)
- [ ] Navigate to `website/` directory
- [ ] Install dependencies: `npm install` (if not done)
- [ ] Start development server: `npm run dev`
- [ ] Public site loads at `http://localhost:3002`
- [ ] Static content displays
- [ ] API integration working
- [ ] Search and filtering functional
- [ ] Responsive design intact



## Integration Testing

### ✅ End-to-End Workflows
- [ ] User registration and login
- [ ] Data creation and modification
- [ ] File upload and download
- [ ] Search and filtering
- [ ] Admin panel operations
- [ ] Public site browsing
- [ ] Email notifications (if configured)

### ✅ Performance Validation
- [ ] Page load times acceptable
- [ ] Database query performance
- [ ] API response times reasonable
- [ ] Memory usage within limits
- [ ] No memory leaks detected
- [ ] File I/O operations working

## Security Validation

### ✅ Environment Security
- [ ] `.env` files not publicly accessible
- [ ] Database files have appropriate permissions
- [ ] API keys and secrets secured
- [ ] No sensitive data in logs
- [ ] CORS settings appropriate
- [ ] Authentication working correctly

### ✅ Network Security
- [ ] Services bound to appropriate interfaces
- [ ] Firewall settings reviewed
- [ ] SSL/TLS configuration (if applicable)
- [ ] No unnecessary ports exposed

## Development Workflow

### ✅ Helper Scripts
- [ ] `./start_remotehive.sh` works correctly
- [ ] `./check_services.sh` provides accurate status
- [ ] `./restore_migration.sh` can be re-run if needed
- [ ] Scripts have correct permissions

### ✅ Development Tools
- [ ] Code editor/IDE works with project
- [ ] Git repository status preserved
- [ ] Debugging tools functional
- [ ] Hot reload working for frontends
- [ ] Log files accessible and readable

## Troubleshooting Validation

### ✅ Common Issues Resolved
- [ ] Port conflicts resolved
- [ ] Permission issues fixed
- [ ] Path separator issues corrected
- [ ] Service startup problems solved
- [ ] Dependency conflicts resolved
- [ ] Environment variable issues fixed

### ✅ Error Handling
- [ ] Application errors logged properly
- [ ] Database connection errors handled
- [ ] File system errors managed
- [ ] Network errors handled gracefully
- [ ] User-friendly error messages displayed

## Documentation and Maintenance

### ✅ Documentation Updates
- [ ] README updated for macOS setup
- [ ] Development setup instructions current
- [ ] Deployment notes updated
- [ ] Troubleshooting guide available
- [ ] API documentation accessible

### ✅ Backup and Recovery
- [ ] Regular backup strategy planned
- [ ] Database backup procedures tested
- [ ] Configuration backup automated
- [ ] Recovery procedures documented
- [ ] Migration rollback plan available

## Final Validation

### ✅ Complete System Test
- [ ] All services running simultaneously
- [ ] Full user workflow completed
- [ ] Performance under normal load
- [ ] No critical errors in logs
- [ ] System stable over extended period

### ✅ Migration Success Criteria
- [ ] All original functionality preserved
- [ ] Performance equivalent or better
- [ ] No data loss detected
- [ ] Development workflow efficient
- [ ] Team can resume work immediately

---

## Migration Completion Sign-off

**Migration Date:** _______________

**Validated By:** _______________

**Critical Issues:** _______________

**Performance Notes:** _______________

**Next Steps:** _______________

---

## Quick Reference Commands

```bash
# Check service status
./check_services.sh

# Start all services
brew services start redis
brew services start postgresql@15

# Activate Python environment
source ~/RemoteHive/venv/bin/activate

# Start backend API
cd ~/RemoteHive
./start_remotehive.sh

# Start admin frontend
cd ~/RemoteHive/remotehive-admin
npm run dev

# Start public frontend
cd ~/RemoteHive/remotehive-public
npm run dev

# Check logs
tail -f ~/RemoteHive/logs/*.log

# Database backup
sqlite3 ~/RemoteHive/remotehive.db ".backup backup_$(date +%Y%m%d).db"
```

## Support and Resources

- **Migration Guide:** `MACOS_MIGRATION_GUIDE.md`
- **Environment Setup:** `ENVIRONMENT_SETUP_GUIDE.md`
- **Troubleshooting:** Check service logs and error messages
- **Community:** Refer to project documentation and issue tracker

---

*This checklist ensures a thorough validation of your RemoteHive migration to macOS. Complete each section systematically to ensure a successful transition.*