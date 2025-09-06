# RemoteHive Docker Migration Guide

## Overview

This guide helps you transition from system-based development to a fully containerized Docker/Kubernetes-first approach for the RemoteHive platform.

## 🎯 Migration Goals

- **Eliminate System Dependencies**: No more local Redis, MongoDB, or Node.js installations
- **Consistent Development Environment**: Same environment across all developers
- **Production Parity**: Development mirrors production deployment
- **Simplified Onboarding**: New developers can start with just Docker
- **Scalable Infrastructure**: Easy transition to Kubernetes for production

## 📋 Prerequisites

### Required Tools
```bash
# Install Docker Desktop (includes Docker Compose)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# For Kubernetes (optional)
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Enable Kubernetes in Docker Desktop
# Docker Desktop > Settings > Kubernetes > Enable Kubernetes
```

### System Cleanup (Optional)
```bash
# Stop existing system services
brew services stop redis
brew services stop mongodb-community

# Remove system installations (if desired)
# brew uninstall redis mongodb-community node
```

## 🚀 Quick Start

### 1. Development Mode (Recommended)
```bash
# Start all services with hot-reload
python docker-startup.py

# Or use Docker Compose directly
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 2. Production Mode
```bash
# Start production-optimized services
python docker-startup.py --mode prod

# Or use Docker Compose directly
docker-compose up -d
```

### 3. Kubernetes Mode
```bash
# Deploy to Kubernetes
python docker-startup.py --platform k8s

# Or use kubectl directly
kubectl apply -f k8s/
```

## 📁 File Structure Changes

### New Files Added
```
RemoteHive/
├── docker-startup.py              # New Docker-first startup script
├── docker-compose.dev.yml         # Development overrides
├── Dockerfile                     # Backend container
├── remotehive-admin/Dockerfile    # Admin panel container
├── remotehive-public/Dockerfile   # Public website container
├── autoscraper-service/Dockerfile # Autoscraper container
├── k8s/                          # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmaps-secrets.yaml
│   ├── persistent-volumes.yaml
│   ├── mongodb.yaml
│   ├── redis.yaml
│   ├── backend-api.yaml
│   ├── autoscraper-service.yaml
│   ├── celery-workers.yaml
│   ├── admin-panel.yaml
│   ├── public-website.yaml
│   ├── ingress.yaml
│   └── monitoring.yaml
├── nginx/                        # Nginx configurations
├── monitoring/                   # Prometheus/Grafana configs
└── scripts/                      # Deployment scripts
```

### Modified Files
```
├── docker-compose.yml            # Updated with all services
├── .env                         # Docker-specific variables
├── .dockerignore               # Docker ignore patterns
└── README.md                   # Updated with Docker instructions
```

## 🔄 Migration Steps

### Step 1: Environment Setup

1. **Update Environment Variables**
   ```bash
   # Add to .env file
   COMPOSE_PROJECT_NAME=remotehive
   DOCKER_BUILDKIT=1
   COMPOSE_DOCKER_CLI_BUILD=1
   
   # Database URLs (containerized)
   MONGODB_URL=mongodb://admin:password123@mongodb:27017/remotehive?authSource=admin
   REDIS_URL=redis://:redis_password@redis:6379/0
   CELERY_BROKER_URL=redis://:redis_password@redis:6379/0
   ```

2. **Update API Configurations**
   ```typescript
   // remotehive-admin/src/lib/api.ts
   const API_BASE_URL = process.env.NODE_ENV === 'production' 
     ? 'http://backend:8000'  // Internal Docker network
     : 'http://localhost:8000'; // Development
   
   // remotehive-public/src/lib/api.ts
   const API_BASE_URL = process.env.NODE_ENV === 'production'
     ? 'http://backend:8000'  // Internal Docker network  
     : 'http://localhost:8000'; // Development
   ```

### Step 2: Development Workflow Changes

#### Old Workflow (System-based)
```bash
# Old way - multiple terminals, system dependencies
python fixed_startup.py

# Required:
# - Local Redis installation
# - Local MongoDB installation  
# - Local Node.js installation
# - Python virtual environment
```

#### New Workflow (Docker-first)
```bash
# New way - single command, no system dependencies
python docker-startup.py

# Or for specific services
python docker-startup.py --services backend,admin,public

# Required:
# - Docker Desktop only
```

### Step 3: Development Features

#### Hot Reload Support
- **Backend**: Code changes trigger automatic reload
- **Frontend**: Vite/Next.js hot module replacement
- **Celery**: Watchdog auto-restart on code changes

#### Debugging Support
```bash
# Python debugging (VS Code)
# Connect to localhost:5678 (backend) or localhost:5679 (autoscraper)

# Frontend debugging
# Standard browser dev tools work normally
```

#### Development Tools
- **MongoDB Express**: http://localhost:8081 (admin/admin123)
- **Redis Commander**: http://localhost:8082 (admin/admin123)  
- **MailHog**: http://localhost:8025 (email testing)
- **Prometheus**: http://localhost:9090 (metrics)
- **Grafana**: http://localhost:3001 (admin/admin123)

### Step 4: Testing Changes

#### Running Tests
```bash
# Backend tests
docker-compose exec backend pytest

# Frontend tests  
docker-compose exec admin npm test
docker-compose exec public npm test

# Integration tests
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up test-runner
```

#### Test Database
```bash
# Separate test database automatically created
# No need to manage test data manually
```

## 🔧 Service Configuration

### Backend API (Port 8000)
```yaml
# Development features:
- Hot reload with volume mounts
- Debug port 5678 for Python debugger
- Automatic dependency installation
- Log aggregation
```

### Autoscraper Service (Port 8001)
```yaml
# Features:
- Independent SQLite database
- Hot reload support
- Debug port 5679
- Persistent data volume
```

### Admin Panel (Port 3000)
```yaml
# Features:
- Next.js hot reload
- Node modules caching
- TypeScript compilation
- Tailwind CSS processing
```

### Public Website (Port 5173)
```yaml
# Features:
- Vite hot module replacement
- React fast refresh
- Asset optimization
- Development server
```

### Background Services
```yaml
# Celery Worker:
- Auto-restart on code changes
- Configurable concurrency
- Log aggregation

# Celery Beat:
- Persistent schedule storage
- Automatic task discovery
- Development-friendly logging
```

## 🚀 Production Deployment

### Docker Production
```bash
# Build production images
docker-compose build

# Start production services
docker-compose up -d

# Scale services
docker-compose up -d --scale celery-worker=3
```

### Kubernetes Production
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n remotehive

# Scale services
kubectl scale deployment backend-api --replicas=3 -n remotehive
```

## 🔍 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :8000
lsof -i :3000
lsof -i :5173

# Stop conflicting services
docker-compose down
pkill -f "uvicorn\|npm\|redis-server"
```

#### Database Connection Issues
```bash
# Check MongoDB container
docker-compose logs mongodb

# Check Redis container  
docker-compose logs redis

# Reset databases
docker-compose down -v
docker-compose up -d
```

#### Build Issues
```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Increase Docker resources
# Docker Desktop > Settings > Resources
```

### Service Health Checks
```bash
# Check all services
docker-compose ps

# Check specific service logs
docker-compose logs -f backend
docker-compose logs -f admin

# Execute commands in containers
docker-compose exec backend bash
docker-compose exec mongodb mongosh
```

## 📊 Monitoring & Observability

### Development Monitoring
- **Health Checks**: All services have health endpoints
- **Log Aggregation**: Centralized logging with Docker
- **Metrics**: Prometheus metrics collection
- **Dashboards**: Grafana dashboards for visualization

### Production Monitoring
- **Kubernetes Metrics**: Built-in pod and service metrics
- **Application Metrics**: Custom business metrics
- **Alerting**: Prometheus AlertManager integration
- **Tracing**: Distributed tracing support

## 🔐 Security Considerations

### Development Security
- **Network Isolation**: Services communicate via Docker network
- **Secret Management**: Environment variables and Docker secrets
- **Image Security**: Regular base image updates
- **Access Control**: Container user permissions

### Production Security
- **Image Scanning**: Automated vulnerability scanning
- **Network Policies**: Kubernetes network policies
- **RBAC**: Role-based access control
- **TLS**: End-to-end encryption

## 📈 Performance Optimization

### Development Performance
- **Volume Mounts**: Optimized for hot reload
- **Build Cache**: Docker layer caching
- **Resource Limits**: Appropriate container limits
- **Parallel Builds**: Multi-stage build optimization

### Production Performance
- **Image Optimization**: Multi-stage builds for smaller images
- **Resource Management**: CPU and memory limits
- **Horizontal Scaling**: Auto-scaling based on metrics
- **Load Balancing**: Nginx and Kubernetes ingress

## 🎓 Best Practices

### Development
1. **Use docker-startup.py** for consistent environment
2. **Mount source code** for hot reload during development
3. **Use separate databases** for development and testing
4. **Monitor resource usage** to avoid performance issues
5. **Keep containers updated** with latest base images

### Production
1. **Use production-optimized images** (multi-stage builds)
2. **Implement proper health checks** for all services
3. **Set resource limits** to prevent resource exhaustion
4. **Use secrets management** for sensitive data
5. **Monitor and alert** on service health and performance

### Code Organization
1. **Keep Dockerfiles simple** and well-documented
2. **Use .dockerignore** to exclude unnecessary files
3. **Version your images** with proper tags
4. **Document environment variables** and their purposes
5. **Test containers** in CI/CD pipeline

## 🔄 Migration Checklist

### Pre-Migration
- [ ] Install Docker Desktop
- [ ] Backup existing data
- [ ] Review current environment variables
- [ ] Test Docker installation

### During Migration
- [ ] Update environment variables for Docker
- [ ] Modify API configurations for container networking
- [ ] Test Docker Compose setup
- [ ] Verify all services start correctly
- [ ] Test hot reload functionality

### Post-Migration
- [ ] Update development documentation
- [ ] Train team on new workflow
- [ ] Set up CI/CD with Docker
- [ ] Plan Kubernetes migration
- [ ] Monitor performance and optimize

### Validation
- [ ] All services accessible via browser
- [ ] Database connections working
- [ ] Authentication flow functional
- [ ] File uploads working
- [ ] Background tasks processing
- [ ] Hot reload working for all services

## 🆘 Getting Help

### Resources
- **Docker Documentation**: https://docs.docker.com/
- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **Docker Compose Reference**: https://docs.docker.com/compose/

### Troubleshooting Commands
```bash
# Service status
python docker-startup.py --services backend
docker-compose ps
kubectl get pods -n remotehive

# Logs
docker-compose logs -f [service]
kubectl logs -f deployment/[service] -n remotehive

# Shell access
docker-compose exec [service] bash
kubectl exec -it deployment/[service] -n remotehive -- bash

# Health checks
curl http://localhost:8000/health
curl http://localhost:8001/health
```

### Support
If you encounter issues during migration:
1. Check the troubleshooting section above
2. Review Docker and service logs
3. Verify environment variable configuration
4. Test with minimal service set first
5. Consult team documentation or create an issue

---

**🎉 Congratulations!** You've successfully migrated to a Docker-first development workflow. Your RemoteHive platform is now fully containerized and ready for scalable deployment.