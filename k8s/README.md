# RemoteHive Kubernetes Deployment

This directory contains Kubernetes manifests and deployment scripts for the RemoteHive platform. The platform consists of multiple microservices that work together to provide a comprehensive job board solution.

## Architecture Overview

### Services
- **Backend API** (FastAPI + MongoDB) - Main application API
- **Autoscraper Service** (FastAPI + SQLite) - Job scraping service
- **Admin Panel** (Next.js) - Administrative interface
- **Public Website** (React + Vite) - Public job board
- **Celery Workers** - Background task processing
- **Celery Beat** - Task scheduling
- **MongoDB** - Primary database
- **Redis** - Caching and message broker

### Infrastructure Components
- **Ingress Controller** - External access and SSL termination
- **Persistent Volumes** - Data persistence
- **ConfigMaps & Secrets** - Configuration management
- **Horizontal Pod Autoscaler** - Auto-scaling
- **Monitoring** - Health checks and metrics

## Prerequisites

### Required Tools
- `kubectl` - Kubernetes command-line tool
- `docker` - Container runtime
- `helm` (optional) - Package manager for Kubernetes

### Kubernetes Cluster Requirements
- Kubernetes version 1.20+
- Ingress controller (nginx-ingress recommended)
- StorageClass for persistent volumes
- cert-manager for SSL certificates (optional)
- Prometheus operator for monitoring (optional)

### Resource Requirements

#### Minimum Resources
- **CPU**: 4 cores
- **Memory**: 8GB RAM
- **Storage**: 50GB
- **Nodes**: 2 (for high availability)

#### Recommended Resources
- **CPU**: 8 cores
- **Memory**: 16GB RAM
- **Storage**: 100GB
- **Nodes**: 3+ (for production)

## Quick Start

### 1. Clone and Prepare
```bash
# Navigate to the k8s directory
cd k8s/

# Make deployment script executable
chmod +x deploy.sh
```

### 2. Configure Environment
```bash
# Edit configmaps-secrets.yaml to update configuration values
# Important: Update the following before deployment:
# - JWT_SECRET_KEY
# - Database passwords
# - Email credentials
# - External API keys
# - Domain names in ingress.yaml
```

### 3. Deploy
```bash
# Full deployment (builds images and deploys)
./deploy.sh

# Deploy without building images
./deploy.sh --skip-build

# Clean deployment (removes existing resources first)
./deploy.sh --cleanup

# Custom registry and tag
./deploy.sh --registry your-registry.com/remotehive --tag v1.0.0
```

## Manual Deployment

If you prefer to deploy manually or need more control:

### Step 1: Create Namespace and Resources
```bash
kubectl apply -f namespace.yaml
kubectl apply -f persistent-volumes.yaml
kubectl apply -f configmaps-secrets.yaml
```

### Step 2: Deploy Databases
```bash
kubectl apply -f mongodb.yaml
kubectl apply -f redis.yaml

# Wait for databases to be ready
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n remotehive
kubectl wait --for=condition=available --timeout=300s deployment/redis -n remotehive
```

### Step 3: Deploy Application Services
```bash
kubectl apply -f backend-api.yaml
kubectl apply -f autoscraper-service.yaml
kubectl apply -f admin-panel.yaml
kubectl apply -f public-website.yaml

# Wait for services to be ready
kubectl wait --for=condition=available --timeout=300s deployment/backend-api -n remotehive
kubectl wait --for=condition=available --timeout=300s deployment/autoscraper-service -n remotehive
kubectl wait --for=condition=available --timeout=300s deployment/admin-panel -n remotehive
kubectl wait --for=condition=available --timeout=300s deployment/public-website -n remotehive
```

### Step 4: Deploy Background Services
```bash
kubectl apply -f celery-workers.yaml

# Wait for Celery services to be ready
kubectl wait --for=condition=available --timeout=300s deployment/celery-worker -n remotehive
kubectl wait --for=condition=available --timeout=300s deployment/celery-beat -n remotehive
```

### Step 5: Deploy Ingress and Monitoring
```bash
kubectl apply -f ingress.yaml
kubectl apply -f monitoring.yaml
```

## Configuration

### Environment Variables

Key configuration values are stored in ConfigMaps and Secrets:

#### ConfigMap: `remotehive-config`
- `ENVIRONMENT`: Deployment environment (production/staging/development)
- `LOG_LEVEL`: Logging level (INFO/DEBUG/WARNING/ERROR)
- `API_V1_STR`: API version prefix
- `FRONTEND_URL`: Public website URL
- `ADMIN_FRONTEND_URL`: Admin panel URL
- Database and Redis connection settings
- Email server configuration
- Celery configuration

#### Secret: `remotehive-secrets`
- `JWT_SECRET_KEY`: JWT signing key
- `MONGODB_ROOT_PASSWORD`: MongoDB root password
- `REDIS_PASSWORD`: Redis password
- `NEXTAUTH_SECRET`: NextAuth.js secret
- `SMTP_PASSWORD`: Email server password
- External API keys

### Persistent Storage

The deployment creates several persistent volumes:
- `mongodb-pvc`: MongoDB data (20Gi)
- `redis-pvc`: Redis data (5Gi)
- `autoscraper-pvc`: SQLite database (2Gi)
- `logs-pvc`: Application logs (10Gi)
- `uploads-pvc`: File uploads (20Gi)

### Ingress Configuration

The ingress is configured for the following domains:
- `remotehive.in` → Public Website
- `admin.remotehive.in` → Admin Panel
- `api.remotehive.in` → Backend API
- `autoscraper.remotehive.in` → Autoscraper Service

**Important**: Update the domain names in `ingress.yaml` to match your actual domains.

## Monitoring and Health Checks

### Health Check Endpoints
- Backend API: `GET /health`
- Autoscraper: `GET /health`
- Admin Panel: `GET /api/health`
- Public Website: `GET /health` (via nginx)

### Monitoring Stack

The deployment includes:
- **ServiceMonitor**: Prometheus metrics collection
- **PrometheusRule**: Alerting rules
- **Grafana Dashboard**: Service monitoring dashboard
- **Health Check Service**: Centralized health monitoring

### Accessing Monitoring

```bash
# Port forward to access health check service
kubectl port-forward -n remotehive svc/health-check-service 8080:8080

# Access health dashboard
open http://localhost:8080
```

## Scaling

### Horizontal Pod Autoscaler (HPA)

Services are configured with HPA for automatic scaling:

- **Backend API**: 3-10 replicas (CPU: 70%, Memory: 80%)
- **Autoscraper**: 2-5 replicas (CPU: 70%, Memory: 80%)
- **Admin Panel**: 2-5 replicas (CPU: 70%, Memory: 80%)
- **Public Website**: 3-10 replicas (CPU: 70%, Memory: 80%)
- **Celery Workers**: 3-8 replicas (CPU: 75%, Memory: 85%)

### Manual Scaling

```bash
# Scale a specific service
kubectl scale -n remotehive deployment/backend-api --replicas=5

# Scale Celery workers
kubectl scale -n remotehive deployment/celery-worker --replicas=6
```

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting
```bash
# Check pod status
kubectl get pods -n remotehive

# Describe problematic pod
kubectl describe pod <pod-name> -n remotehive

# Check logs
kubectl logs <pod-name> -n remotehive -f
```

#### 2. Database Connection Issues
```bash
# Check database pods
kubectl get pods -n remotehive -l app=mongodb
kubectl get pods -n remotehive -l app=redis

# Test database connectivity
kubectl exec -it -n remotehive <backend-api-pod> -- python -c "from app.database.database import test_connection; test_connection()"
```

#### 3. Ingress Not Working
```bash
# Check ingress status
kubectl get ingress -n remotehive
kubectl describe ingress remotehive-ingress -n remotehive

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
kubectl get certificates -n remotehive
kubectl describe certificate remotehive-tls -n remotehive

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager
```

### Useful Commands

```bash
# View all resources
kubectl get all -n remotehive

# Check resource usage
kubectl top pods -n remotehive
kubectl top nodes

# Port forward for local access
kubectl port-forward -n remotehive svc/backend-api 8000:8000
kubectl port-forward -n remotehive svc/admin-panel 3000:3000
kubectl port-forward -n remotehive svc/public-website 5173:80

# Execute commands in pods
kubectl exec -it -n remotehive <pod-name> -- /bin/bash

# View logs
kubectl logs -n remotehive -l app=backend-api -f
kubectl logs -n remotehive -l app=celery-worker -f

# Restart deployment
kubectl rollout restart -n remotehive deployment/backend-api

# Check rollout status
kubectl rollout status -n remotehive deployment/backend-api
```

## Security Considerations

### Network Policies
- Ingress traffic is controlled via NetworkPolicy
- Internal service communication is allowed within namespace
- Database access is restricted to application pods

### Secrets Management
- All sensitive data is stored in Kubernetes Secrets
- Secrets are mounted as environment variables
- Consider using external secret management (e.g., HashiCorp Vault)

### RBAC
- Create service accounts with minimal required permissions
- Use Pod Security Standards/Policies
- Regular security audits

### SSL/TLS
- All external traffic uses HTTPS
- Automatic certificate management with cert-manager
- Internal service communication can be encrypted (optional)

## Backup and Recovery

### Database Backups

```bash
# MongoDB backup
kubectl exec -n remotehive <mongodb-pod> -- mongodump --out /backup/$(date +%Y%m%d)

# Redis backup
kubectl exec -n remotehive <redis-pod> -- redis-cli BGSAVE
```

### Persistent Volume Backups

Use your cloud provider's volume snapshot feature or backup tools like Velero.

## Production Deployment Checklist

- [ ] Update all default passwords and secrets
- [ ] Configure proper domain names in ingress
- [ ] Set up SSL certificates
- [ ] Configure monitoring and alerting
- [ ] Set up log aggregation
- [ ] Configure backup strategy
- [ ] Test disaster recovery procedures
- [ ] Set up CI/CD pipeline
- [ ] Configure resource limits and requests
- [ ] Enable network policies
- [ ] Set up external secret management
- [ ] Configure image pull secrets for private registries
- [ ] Test scaling scenarios
- [ ] Validate health checks
- [ ] Set up external monitoring

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Kubernetes and application logs
3. Consult the main project documentation
4. Create an issue in the project repository

## License

This deployment configuration is part of the RemoteHive project. Please refer to the main project license for terms and conditions.