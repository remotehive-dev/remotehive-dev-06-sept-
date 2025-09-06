# AutoScraper Integration Documentation

This document provides comprehensive information about the AutoScraper service integration into the RemoteHive application, including startup procedures, testing guidelines, and monitoring.

## Table of Contents

1. [Overview](#overview)
2. [Service Integration](#service-integration)
3. [Startup Procedures](#startup-procedures)
4. [Testing Guidelines](#testing-guidelines)
5. [Health Monitoring](#health-monitoring)
6. [Service Management](#service-management)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

## Overview

The AutoScraper service has been fully integrated into the RemoteHive application startup process. This integration ensures:

- Automatic startup of the AutoScraper service alongside the main application
- Comprehensive health monitoring and alerting
- Robust testing coverage for all endpoints and edge cases
- Service management utilities for operational control
- Integration testing between services

### Architecture

```
RemoteHive Application
├── Main App (Port 8000)
├── AutoScraper Service (Port 8001)
├── Redis (Port 6379)
├── Celery Workers
└── Admin Panel
```

## Service Integration

### Configuration

The AutoScraper service is configured in `start_remotehive_macos.py` with the following settings:

```python
"autoscraper_service": {
    "port": 8001,
    "command": "uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload",
    "cwd": "autoscraper-service",
    "health_url": "http://localhost:8001/health",
    "name": "AutoScraper Service",
    "dependencies": ["redis"]
}
```

### Dependencies

- **Redis**: Required for caching and task queuing
- **Database**: PostgreSQL for data persistence
- **Python 3.8+**: Runtime environment
- **FastAPI**: Web framework
- **Uvicorn**: ASGI server

## Startup Procedures

### Automatic Startup

The AutoScraper service starts automatically when running:

```bash
python start_remotehive_macos.py
```

The startup process:

1. **Dependency Check**: Verifies Redis is running
2. **Service Start**: Launches AutoScraper service on port 8001
3. **Health Check**: Validates service is responding
4. **Integration**: Confirms communication with main app

### Manual Startup

For development or debugging, you can start the service manually:

```bash
# Using the dedicated startup script
cd autoscraper-service/scripts
python startup.py

# Or directly with uvicorn
cd autoscraper-service
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Service Management

Use the service manager for operational control:

```bash
cd autoscraper-service/scripts

# Start service
python service_manager.py start

# Stop service
python service_manager.py stop

# Restart service
python service_manager.py restart

# Check status
python service_manager.py status

# View logs
python service_manager.py logs
```

## Testing Guidelines

### Test Suite Overview

The testing framework includes three comprehensive test suites:

1. **Comprehensive Tests** (`test_autoscraper_comprehensive.py`)
2. **Edge Case Tests** (`test_autoscraper_edge_cases.py`)
3. **Integration Tests** (`test_integration_main_autoscraper.py`)

### Running Tests

#### All Tests

```bash
# Run all test suites
cd tests
python test_autoscraper_comprehensive.py
python test_autoscraper_edge_cases.py
python test_integration_main_autoscraper.py
```

#### Individual Test Categories

```bash
# Comprehensive endpoint testing
python test_autoscraper_comprehensive.py

# Edge cases and error handling
python test_autoscraper_edge_cases.py

# Integration between services
python test_integration_main_autoscraper.py
```

### Test Results

Test results are saved as JSON files:

- `autoscraper_test_results.json` - Comprehensive test results
- `autoscraper_edge_case_results.json` - Edge case test results
- `integration_test_results.json` - Integration test results

### Test Coverage

#### Comprehensive Tests

- ✅ Service availability and health endpoints
- ✅ Metrics endpoints and Prometheus integration
- ✅ AutoScraper API endpoints (dashboard, jobs, engine)
- ✅ Admin panel proxy functionality
- ✅ Authentication and authorization
- ✅ Performance metrics and response times
- ✅ Data validation and error handling

#### Edge Case Tests

- ✅ Malformed request handling
- ✅ Boundary value testing
- ✅ Concurrent request handling
- ✅ Rate limiting validation
- ✅ Timeout and resource limit testing
- ✅ Service recovery scenarios
- ✅ Authentication edge cases

#### Integration Tests

- ✅ Cross-service communication
- ✅ Shared dependency validation (Redis, Database)
- ✅ Admin panel proxy integration
- ✅ Concurrent load handling
- ✅ Service startup order dependencies
- ✅ Data consistency across services
- ✅ Error propagation between services

## Health Monitoring

### Health Monitor

The health monitoring system (`health_monitor.py`) provides:

- **Real-time Health Checks**: Continuous monitoring of service health
- **System Metrics**: CPU, memory, disk, and network monitoring
- **Alert System**: Configurable alerts for service failures
- **Historical Data**: Health check history and trend analysis

### Running Health Checks

```bash
cd autoscraper-service/scripts

# Single health check
python health_monitor.py check

# Continuous monitoring
python health_monitor.py monitor

# Health summary
python health_monitor.py summary --hours 24

# Save results to file
python health_monitor.py check --output health_results.json
```

### Health Check Endpoints

The service provides multiple health check endpoints:

- `GET /health` - Overall service health
- `GET /health/liveness` - Service liveness probe
- `GET /health/readiness` - Service readiness probe
- `GET /health/database` - Database connectivity
- `GET /health/redis` - Redis connectivity
- `GET /health/celery` - Celery worker status

### Monitoring Configuration

```python
# Configuration in health_monitor.py
SERVICE_URL = "http://localhost:8001"
MAIN_APP_URL = "http://localhost:8000"
CHECK_INTERVAL = 30  # seconds
ALERT_THRESHOLD = 3  # consecutive failures
METRICS_RETENTION = 24 * 60 * 60  # 24 hours
```

## Service Management

### Service Manager Features

- **Process Management**: Start, stop, restart operations
- **Health Monitoring**: Real-time status checking
- **Log Management**: Centralized logging and rotation
- **Dependency Validation**: Automatic dependency checking
- **PID Management**: Process tracking and cleanup

### Configuration Files

#### Environment Variables

Ensure these environment variables are set:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/remotehive

# Redis
REDIS_URL=redis://localhost:6379/0

# Service Configuration
AUTOSCRAPER_PORT=8001
AUTOSCRAPER_HOST=0.0.0.0

# Security
SECRET_KEY=your-secret-key
API_KEY=your-api-key
```

#### Service Configuration

The service configuration is defined in `app/core/config.py`:

```python
class Settings(BaseSettings):
    app_name: str = "RemoteHive AutoScraper Service"
    version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str
    
    # Security
    secret_key: str
    api_key: str
```

## Troubleshooting

### Common Issues

#### Service Won't Start

1. **Check Dependencies**:
   ```bash
   # Verify Redis is running
   redis-cli ping
   
   # Check database connectivity
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Check Port Availability**:
   ```bash
   # Check if port 8001 is in use
   lsof -i :8001
   ```

3. **Review Logs**:
   ```bash
   # Check service logs
   python service_manager.py logs
   ```

#### Health Check Failures

1. **Service Unresponsive**:
   - Check if service process is running
   - Verify network connectivity
   - Review resource usage (CPU, memory)

2. **Database Issues**:
   - Verify database connection string
   - Check database server status
   - Review database logs

3. **Redis Issues**:
   - Confirm Redis server is running
   - Check Redis configuration
   - Verify Redis connectivity

#### Performance Issues

1. **Slow Response Times**:
   - Monitor system resources
   - Check database query performance
   - Review Redis cache hit rates

2. **High Resource Usage**:
   - Analyze process metrics
   - Review concurrent request handling
   - Check for memory leaks

### Debugging Commands

```bash
# Check service status
curl http://localhost:8001/health

# View detailed metrics
curl http://localhost:8001/metrics

# Check process information
ps aux | grep uvicorn

# Monitor resource usage
top -p $(pgrep -f "uvicorn.*autoscraper")

# Check network connections
netstat -tlnp | grep 8001
```

### Log Files

- **Service Logs**: `autoscraper-service/logs/service.log`
- **Health Monitor Logs**: `autoscraper-service/logs/health_monitor.log`
- **Test Results**: `tests/*.json`
- **System Logs**: `/var/log/remotehive/`

## API Reference

### Core Endpoints

#### Health Endpoints

```http
GET /health
GET /health/liveness
GET /health/readiness
GET /health/database
GET /health/redis
GET /health/celery
```

#### Metrics Endpoints

```http
GET /metrics
GET /api/v1/autoscraper/system/metrics
```

#### AutoScraper API

```http
GET /api/v1/autoscraper/dashboard
GET /api/v1/autoscraper/engine/state
POST /api/v1/autoscraper/jobs/start
POST /api/v1/autoscraper/jobs/pause
GET /api/v1/autoscraper/jobs/list
GET /api/v1/autoscraper/job-boards
```

#### Admin Panel

```http
GET /admin/{path:path}
```

### Authentication

Most endpoints require API key authentication:

```http
Authorization: Bearer your-api-key
```

### Response Formats

All API responses follow this format:

```json
{
  "status": "success|error",
  "data": {},
  "message": "Optional message",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Error Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error
- `503` - Service Unavailable

## Best Practices

### Development

1. **Always run tests** before deploying changes
2. **Monitor health checks** during development
3. **Use service manager** for consistent operations
4. **Review logs regularly** for early issue detection
5. **Test edge cases** thoroughly

### Production

1. **Enable continuous monitoring** with alerts
2. **Set up log rotation** to manage disk space
3. **Monitor resource usage** and scale as needed
4. **Implement backup strategies** for data persistence
5. **Document operational procedures** for team members

### Security

1. **Use strong API keys** and rotate regularly
2. **Enable HTTPS** in production environments
3. **Implement rate limiting** to prevent abuse
4. **Monitor authentication attempts** for suspicious activity
5. **Keep dependencies updated** for security patches

## Support

For additional support:

1. **Check logs** for error details
2. **Run health checks** to identify issues
3. **Review test results** for validation
4. **Consult troubleshooting guide** for common problems
5. **Contact development team** for complex issues

---

*Last updated: January 2024*
*Version: 1.0.0*