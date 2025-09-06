# RemoteHive Project Startup Script

## Overview

The `project_startup.sh` script is a comprehensive bash script designed to manage the entire RemoteHive project startup process. It provides a single-command solution to stop existing services, clear cache, start Docker containers, and verify all services are running properly.

## Features

- ✅ **Complete Service Management**: Stops existing containers and starts fresh instances
- ✅ **Cache Cleaning**: Removes Python cache, Node.js cache, and temporary files
- ✅ **Docker Integration**: Works with existing Docker Compose configurations
- ✅ **Health Checks**: Verifies all services are running and responding
- ✅ **Error Handling**: Comprehensive error handling with colored output
- ✅ **Logging**: Detailed logging to `logs/startup.log`
- ✅ **Compatibility**: Works alongside existing `fixed_startup.py` infrastructure

## Usage

### Basic Usage
```bash
# Start with default configuration
./project_startup.sh

# Show help
./project_startup.sh --help
```

### Advanced Options
```bash
# Start with development configuration
./project_startup.sh --dev

# Force rebuild Docker images
./project_startup.sh --build

# Clear Docker cache and rebuild
./project_startup.sh --no-cache --build

# Enable verbose output for debugging
./project_startup.sh --verbose
```

## What the Script Does

### 1. Prerequisites Check
- Verifies Docker and Docker Compose are installed and running
- Checks if Docker daemon is accessible

### 2. Service Cleanup
- Stops all existing Docker Compose services
- Removes RemoteHive containers
- Kills processes on required ports (8000, 8001, 3000, 5173, 6379, 27017)
- Stops Python processes related to RemoteHive

### 3. Cache Cleaning
- Removes Python `__pycache__` directories and `.pyc` files
- Cleans Node.js cache and build directories (`.next`, `dist`, `node_modules/.cache`)
- Removes old log files (older than 7 days)
- Cleans temporary files

### 4. Docker Operations
- Builds Docker images (if needed or forced)
- Starts all services using Docker Compose
- Uses development configuration if available

### 5. Health Verification
- Waits for Docker containers to become healthy
- Checks HTTP endpoints for service readiness
- Provides detailed status information

### 6. Success Confirmation
- Displays service URLs and status
- Shows Docker container information
- Provides quick command references

## Service URLs

After successful startup, the following services will be available:

- **Backend API**: http://localhost:8000
- **Autoscraper API**: http://localhost:8001
- **Admin Panel**: http://localhost:3000
- **Public Website**: http://localhost:5173
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379

## Compatibility with Existing Infrastructure

The script is designed to work alongside the existing RemoteHive infrastructure:

### With `fixed_startup.py`
- The bash script can be used as an alternative to the Python startup script
- Both scripts manage the same services and ports
- The bash script will properly stop any processes started by `fixed_startup.py`

### With Docker Compose
- Uses existing `docker-compose.yml` and `docker-compose.dev.yml` files
- Respects the same service configurations and dependencies
- Maintains compatibility with manual Docker Compose commands

### With Kubernetes
- The script focuses on local Docker development
- For Kubernetes deployment, use the existing `k8s/deploy.sh` script
- The Docker images built by this script are compatible with Kubernetes deployment

## Logging

The script creates detailed logs in `logs/startup.log` including:
- Timestamp for each operation
- Service status information
- Error messages and warnings
- Health check results

## Error Handling

The script includes comprehensive error handling:
- Exits on any critical error
- Provides colored output for different message types
- Logs all operations for debugging
- Handles cleanup on script interruption

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```
   Error: Docker daemon is not running. Please start Docker Desktop.
   ```
   **Solution**: Start Docker Desktop application

2. **Port conflicts**
   ```
   Warning: Killing processes on port 8000...
   ```
   **Solution**: The script automatically handles this

3. **Build failures**
   ```
   Error: Failed to build Docker images
   ```
   **Solution**: Check Docker logs and ensure all Dockerfiles are present

4. **Service not responding**
   ```
   Service backend not ready at http://localhost:8000/health
   ```
   **Solution**: Check service logs with `docker-compose logs backend`

### Debug Mode

For detailed debugging, use verbose mode:
```bash
./project_startup.sh --verbose
```

This will show all executed commands and their output.

## Quick Commands

After startup, you can use these commands for management:

```bash
# View logs for a specific service
docker-compose logs -f backend

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend

# Access service shell
docker-compose exec backend /bin/bash

# Check service status
docker-compose ps
```

## Integration with Development Workflow

### Daily Development
1. Run `./project_startup.sh` at the beginning of your work session
2. Develop and test your changes
3. Use `docker-compose logs -f [service]` to monitor specific services
4. Use `docker-compose restart [service]` to restart services after changes

### After Code Changes
1. For backend changes: `docker-compose restart backend`
2. For frontend changes: The development servers will auto-reload
3. For dependency changes: `./project_startup.sh --build`

### Clean Restart
When you need a completely fresh environment:
```bash
./project_startup.sh --no-cache --build
```

## Performance Considerations

- **First run**: Takes longer due to image building
- **Subsequent runs**: Faster as images are cached
- **Development mode**: Uses volume mounts for hot reloading
- **Cache clearing**: Use `--no-cache` sparingly as it increases build time

## Security Notes

- The script requires Docker access (may need sudo on some systems)
- Kills processes on specific ports (be careful on shared systems)
- Logs may contain sensitive information (review log files)
- Uses default credentials for development (change for production)

---

## Support

For issues or questions:
1. Check the logs in `logs/startup.log`
2. Run with `--verbose` for detailed output
3. Verify Docker Desktop is running
4. Ensure all required files are present in the project directory

The script is designed to be robust and handle most common scenarios automatically.