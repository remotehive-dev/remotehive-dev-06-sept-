# RemoteHive Deployment Guide

This guide provides comprehensive instructions for deploying the RemoteHive platform using Docker and Kubernetes.

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose**: Latest version
- **Kubernetes**: v1.24+ (for production)
- **kubectl**: Latest version
- **Node.js**: v18+ (for local development)
- **Python**: 3.11+ (for local development)
- **Git**: Latest version

### Environment Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd RemoteHive_Migration_Package
   ```

2. **Set up environment variables**:
   ```bash
   # For development
   cp .env.example .env
   
   # For production
   cp .env.prod.template .env.prod
   # Edit .env.prod with your actual values
   ```

## 🐳 Docker Deployment

### Development Environment

```bash
# Start all services with hot-reload
./dev-workflow.sh start

# Or manually with Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**Services will be available at**:
- **Backend API**: http://localhost:8000
- **Autoscraper API**: http://localhost:8001
- **Admin Panel**: http://localhost:3000
- **Public Website**: http://localhost:5173
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **Mongo Express**: http://localhost:8081
- **Redis Commander**: http://localhost:8082
- **MailHog**: http://localhost:8025
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001

### Production Environment

```bash
# Deploy to production
./deploy-remotehive.sh deploy production

# Or manually
docker-compose -f docker-compose.prod.yml up -d
```

### Useful Docker Commands

```bash
# View logs
./dev-workflow.sh logs [service-name]

# Restart services
./dev-workflow.sh restart

# Stop all services
./dev-workflow.sh stop

# Clean up
./dev-workflow.sh clean

# Database backup
./dev-workflow.sh backup

# Database restore
./dev-workflow.sh restore backup-file.tar.gz
```

## ☸️ Kubernetes Deployment

### Prerequisites

1. **Kubernetes cluster** (local or cloud)
2. **kubectl** configured
3. **Container registry** access
4. **Domain names** configured
5. **SSL certificates** (Let's Encrypt recommended)

### Quick Deployment

```bash
# Deploy to staging
./deploy-k8s.sh deploy --environment staging --domain staging.remotehive.com

# Deploy to production
./deploy-k8s.sh deploy --environment production --domain remotehive.com
```

### Manual Kubernetes Deployment

1. **Create namespace**:
   ```bash
   kubectl create namespace remotehive-prod
   ```

2. **Apply configurations**:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/persistent-volumes.yaml
   ```

3. **Deploy databases**:
   ```bash
   kubectl apply -f k8s/mongodb-deployment.yaml
   kubectl apply -f k8s/redis-deployment.yaml
   ```

4. **Deploy applications**:
   ```bash
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/autoscraper-deployment.yaml
   kubectl apply -f k8s/admin-deployment.yaml
   kubectl apply -f k8s/public-deployment.yaml
   kubectl apply -f k8s/celery-deployment.yaml
   ```

5. **Configure ingress**:
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

### Kubernetes Management Commands

```bash
# Check deployment status
./deploy-k8s.sh status --environment production

# View logs
./deploy-k8s.sh logs --environment production --service backend

# Scale services
kubectl scale deployment backend --replicas=3 -n remotehive-prod

# Update deployment
./deploy-k8s.sh update --environment production --tag v1.2.0

# Rollback deployment
./deploy-k8s.sh rollback --environment production

# Clean up
./deploy-k8s.sh cleanup --environment staging
```

## 🔄 CI/CD Pipeline

The project includes a comprehensive GitHub Actions workflow:

### Triggers
- **Push** to `main`, `develop`, `staging` branches
- **Pull requests** to `main`, `develop`
- **Tags** matching `v*`
- **Manual dispatch** with environment selection

### Pipeline Stages

1. **Code Quality**:
   - Black formatting
   - isort import sorting
   - flake8 linting
   - Bandit security scanning

2. **Testing**:
   - Backend tests with coverage
   - Frontend tests (admin & public)
   - Integration tests

3. **Build & Push**:
   - Multi-service Docker builds
   - Container registry push
   - Image vulnerability scanning

4. **Deployment**:
   - **Development**: Auto-deploy on `develop` branch
   - **Staging**: Auto-deploy on `staging` branch
   - **Production**: Auto-deploy on `main` branch
   - **Manual**: Workflow dispatch with environment selection

### Required Secrets

Configure these secrets in your GitHub repository:

```bash
# Container Registry
GITHUB_TOKEN  # Automatically provided

# Kubernetes
KUBE_CONFIG_STAGING     # Base64 encoded kubeconfig for staging
KUBE_CONFIG_PRODUCTION  # Base64 encoded kubeconfig for production

# Environment Variables
MONGODB_URL
REDIS_URL
JWT_SECRET_KEY
SMTP_PASSWORD
# ... other environment-specific secrets
```

## 🛠️ Development Workflow

### Local Development

```bash
# Quick start development environment
./dev-workflow.sh quick-start

# Hot-reload development
./dev-workflow.sh hot-reload

# Debug mode
./dev-workflow.sh debug

# Run tests
./dev-workflow.sh test

# Run tests in watch mode
./dev-workflow.sh test-watch
```

### Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test categories
pytest tests/ -m "unit"        # Unit tests
pytest tests/ -m "integration" # Integration tests
pytest tests/ -m "api"         # API tests
pytest tests/ -m "database"    # Database tests

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

### Code Quality

```bash
# Format code
black app/ tests/
isort app/ tests/

# Lint code
flake8 app/ tests/

# Security scan
bandit -r app/
```

## 🔧 Configuration

### Environment Variables

#### Core Configuration
```bash
# Application
ENVIRONMENT=production
DEBUG=false
APP_NAME="RemoteHive"
APP_VERSION=1.0.0

# Database
MONGODB_URL=mongodb://localhost:27017/remotehive
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### External Services
```bash
# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
PROMETHEUS_ENABLED=true
```

### Service Configuration

#### Backend API (Port 8000)
- **Framework**: FastAPI
- **Database**: MongoDB with Beanie ODM
- **Authentication**: JWT with role-based access
- **Background Tasks**: Celery with Redis

#### Autoscraper Service (Port 8001)
- **Framework**: FastAPI
- **Database**: SQLite
- **Purpose**: Job scraping and data collection

#### Admin Panel (Port 3000)
- **Framework**: Next.js with TypeScript
- **Authentication**: JWT integration
- **Purpose**: Administrative interface

#### Public Website (Port 5173)
- **Framework**: React with Vite and TypeScript
- **Purpose**: Job board for users

## 📊 Monitoring & Observability

### Health Checks

All services include health check endpoints:
- **Backend**: `GET /health`
- **Autoscraper**: `GET /health`
- **Admin**: `GET /api/health`
- **Public**: `GET /health`

### Monitoring Stack

- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Sentry**: Error tracking (production)
- **Structured Logging**: JSON logs with correlation IDs

### Accessing Monitoring

```bash
# Development
open http://localhost:9090  # Prometheus
open http://localhost:3001  # Grafana (admin/admin)

# Production
kubectl port-forward svc/prometheus 9090:9090 -n remotehive-prod
kubectl port-forward svc/grafana 3001:3000 -n remotehive-prod
```

## 🔒 Security

### Security Features

- **HTTPS**: Required for production
- **JWT Authentication**: Secure token-based auth
- **CORS**: Properly configured for frontend domains
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Pydantic models for all inputs
- **Security Headers**: Comprehensive security headers
- **Container Security**: Non-root users, minimal images

### Security Scanning

```bash
# Vulnerability scanning
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image remotehive-backend:latest

# Security linting
bandit -r app/

# Dependency scanning
safety check
```

## 🚨 Troubleshooting

### Common Issues

#### Service Connection Issues
```bash
# Check service status
docker-compose ps
kubectl get pods -n remotehive-prod

# Check logs
docker-compose logs backend
kubectl logs deployment/backend -n remotehive-prod

# Check network connectivity
docker-compose exec backend ping mongodb
kubectl exec -it deployment/backend -- ping mongodb
```

#### Database Issues
```bash
# MongoDB connection
docker-compose exec mongodb mongosh
kubectl exec -it deployment/mongodb -- mongosh

# Redis connection
docker-compose exec redis redis-cli ping
kubectl exec -it deployment/redis -- redis-cli ping
```

#### Authentication Issues
```bash
# Check JWT configuration
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@remotehive.in","password":"Ranjeet11$"}'
```

### Performance Issues

```bash
# Check resource usage
docker stats
kubectl top pods -n remotehive-prod

# Check database performance
docker-compose exec mongodb mongosh --eval "db.stats()"

# Check Redis performance
docker-compose exec redis redis-cli info stats
```

## 📚 Additional Resources

### Documentation
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **API Redoc**: http://localhost:8000/redoc
- **Architecture Guide**: `docs/ARCHITECTURE.md`
- **Development Guide**: `docs/DEVELOPMENT.md`

### Scripts Reference
- `deploy-remotehive.sh`: Main deployment script
- `dev-workflow.sh`: Development workflow automation
- `deploy-k8s.sh`: Kubernetes deployment automation
- `fixed_startup.py`: Local development startup

### Support

For issues and questions:
1. Check the troubleshooting section above
2. Review service logs
3. Check GitHub Issues
4. Contact the development team

---

**Happy Deploying! 🚀**