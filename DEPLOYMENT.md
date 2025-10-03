# RemoteHive Deployment Guide

This guide provides comprehensive instructions for deploying RemoteHive using Docker and Kubernetes, making the platform production-ready with sophisticated error handling and scalability.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development with Docker](#local-development-with-docker)
4. [Production Deployment with Kubernetes](#production-deployment-with-kubernetes)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring and Observability](#monitoring-and-observability)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)
9. [Scaling and Performance](#scaling-and-performance)
10. [Backup and Recovery](#backup-and-recovery)

## Overview

RemoteHive is a microservices-based job board platform consisting of:

- **Backend API** (FastAPI + MongoDB) - Core application logic
- **Autoscraper Service** (FastAPI + SQLite) - Job scraping functionality
- **Admin Panel** (Next.js) - Administrative interface
- **Public Website** (React + Vite) - User-facing job board
- **Background Services** (Celery + Redis) - Asynchronous task processing
- **Databases** (MongoDB, Redis, SQLite) - Data persistence and caching

### Architecture Benefits

✅ **Microservices Architecture** - Independent scaling and deployment
✅ **Container-First Design** - Consistent environments across development and production
✅ **Kubernetes-Ready** - Cloud-native deployment with auto-scaling
✅ **Sophisticated Error Handling** - Health checks, circuit breakers, and graceful degradation
✅ **Production-Grade Monitoring** - Comprehensive observability stack
✅ **CI/CD Integration** - Automated testing, building, and deployment

## Prerequisites

### Development Environment
- Docker Desktop 4.20+
- Docker Compose 2.20+
- Node.js 18+ and npm
- Python 3.11+
- Git

### Production Environment
- Kubernetes cluster 1.20+
- kubectl configured
- Container registry access
- Domain names and SSL certificates
- Monitoring stack (Prometheus, Grafana)

### Resource Requirements

#### Minimum (Development)
- **CPU**: 4 cores
- **Memory**: 8GB RAM
- **Storage**: 20GB

#### Recommended (Production)
- **CPU**: 8+ cores
- **Memory**: 16+ GB RAM
- **Storage**: 100+ GB SSD
- **Network**: 1Gbps+

## Local Development with Docker

### Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd RemoteHive_Migration_Package
   
   # Copy environment template
   cp .env.example .env
   
   # Edit environment variables
   nano .env
   ```

2. **Start All Services**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d
   
   # Or using the startup script
   python fixed_startup.py
   ```

3. **Verify Deployment**
   ```bash
   # Check service status
   docker-compose ps
   
   # View logs
   docker-compose logs -f
   
   # Test endpoints
   curl http://localhost:8000/health    # Backend API
   curl http://localhost:8001/health    # Autoscraper
   curl http://localhost:3000/api/health # Admin Panel
   curl http://localhost:5173/health    # Public Website
   ```

### Service URLs (Development)

| Service | URL | Purpose |
|---------|-----|----------|
| Backend API | http://localhost:8000 | Main application API |
| Autoscraper | http://localhost:8001 | Job scraping service |
| Admin Panel | http://localhost:3000 | Administrative interface |
| Public Website | http://localhost:5173 | User-facing website |
| MongoDB | localhost:27017 | Primary database |
| Redis | localhost:6379 | Cache and message broker |

### Development Workflow

1. **Code Changes**
   ```bash
   # Backend changes (auto-reload enabled)
   # Edit files in backend/ or autoscraper-engine-api/
   
   # Frontend changes (hot reload enabled)
   # Edit files in admin-panel/ or website/
   ```

2. **Running Tests**
   ```bash
   # Backend tests
   docker-compose exec backend-api pytest
   
   # Frontend tests
   docker-compose exec admin-panel npm test
   docker-compose exec public-website npm test
   ```

3. **Database Operations**
   ```bash
   # MongoDB shell
   docker-compose exec mongodb mongosh
   
   # Redis CLI
   docker-compose exec redis redis-cli
   ```

## Production Deployment with Kubernetes

### Pre-Deployment Checklist

- [ ] Kubernetes cluster is ready and accessible
- [ ] Container images are built and pushed to registry
- [ ] Domain names are configured
- [ ] SSL certificates are available
- [ ] Environment variables are configured
- [ ] Persistent storage is available
- [ ] Monitoring stack is deployed

### Deployment Steps

1. **Prepare Configuration**
   ```bash
   cd k8s/
   
   # Edit configuration files
   nano configmaps-secrets.yaml  # Update environment variables
   nano ingress.yaml             # Update domain names
   ```

2. **Deploy Infrastructure**
   ```bash
   # Make deployment script executable
   chmod +x deploy.sh
   
   # Full deployment
   ./deploy.sh
   
   # Or deploy step by step
   kubectl apply -f namespace.yaml
   kubectl apply -f persistent-volumes.yaml
   kubectl apply -f configmaps-secrets.yaml
   ```

3. **Deploy Services**
   ```bash
   # Deploy databases first
   kubectl apply -f mongodb.yaml
   kubectl apply -f redis.yaml
   
   # Wait for databases to be ready
   kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n remotehive
   kubectl wait --for=condition=available --timeout=300s deployment/redis -n remotehive
   
   # Deploy application services
   kubectl apply -f backend-api.yaml
   kubectl apply -f autoscraper-service.yaml
   kubectl apply -f admin-panel.yaml
   kubectl apply -f public-website.yaml
   kubectl apply -f celery-workers.yaml
   ```

4. **Deploy Ingress and Monitoring**
   ```bash
   kubectl apply -f ingress.yaml
   kubectl apply -f monitoring.yaml
   ```

5. **Verify Deployment**
   ```bash
   # Check pod status
   kubectl get pods -n remotehive
   
   # Check services
   kubectl get svc -n remotehive
   
   # Check ingress
   kubectl get ingress -n remotehive
   
   # Test health endpoints
   curl https://api.remotehive.in/health
   curl https://admin.remotehive.in/api/health
   curl https://remotehive.in/health
   ```

### Production URLs

| Service | URL | Purpose |
|---------|-----|----------|
| Public Website | https://remotehive.in | Main user interface |
| Admin Panel | https://admin.remotehive.in | Administrative interface |
| Backend API | https://api.remotehive.in | Application API |
| Autoscraper | https://autoscraper.remotehive.in | Scraping service API |

## CI/CD Pipeline

The project includes a comprehensive GitHub Actions pipeline that provides:

### Pipeline Stages

1. **Code Quality & Testing**
   - Python linting (flake8, mypy, bandit)
   - TypeScript type checking
   - Unit and integration tests
   - Code coverage reporting

2. **Security Scanning**
   - Vulnerability scanning with Trivy
   - Dependency scanning with Snyk
   - Container image security analysis

3. **Build & Push**
   - Multi-architecture Docker builds
   - Container registry push
   - Image vulnerability scanning

4. **Deployment**
   - Staging deployment (develop branch)
   - Production deployment (releases)
   - Smoke tests and health checks

### Setting Up CI/CD

1. **Configure Secrets**
   ```bash
   # GitHub repository secrets
   KUBE_CONFIG_STAGING      # Base64 encoded kubeconfig for staging
   KUBE_CONFIG_PRODUCTION   # Base64 encoded kubeconfig for production
   SLACK_WEBHOOK           # Slack webhook for notifications
   SNYK_TOKEN              # Snyk API token for security scanning
   ```

2. **Configure Environments**
   - Create `staging` and `production` environments in GitHub
   - Set up protection rules and required reviewers
   - Configure environment-specific variables

3. **Trigger Deployments**
   ```bash
   # Staging deployment
   git push origin develop
   
   # Production deployment
   git tag v1.0.0
   git push origin v1.0.0
   gh release create v1.0.0 --title "Release v1.0.0" --notes "Release notes"
   ```

## Monitoring and Observability

### Health Checks

All services include comprehensive health checks:

```bash
# Service health endpoints
GET /health                    # Basic health check
GET /health/detailed          # Detailed health information
GET /metrics                  # Prometheus metrics
```

### Monitoring Stack

1. **Prometheus** - Metrics collection
2. **Grafana** - Visualization and dashboards
3. **AlertManager** - Alert routing and management
4. **Jaeger** - Distributed tracing (optional)

### Key Metrics

- **Application Metrics**
  - Request rate and response time
  - Error rates and status codes
  - Database connection pool status
  - Queue length and processing time

- **Infrastructure Metrics**
  - CPU and memory usage
  - Disk I/O and network traffic
  - Pod restart counts
  - Resource utilization

### Alerting Rules

- Service downtime (> 1 minute)
- High error rate (> 5%)
- High response time (> 2 seconds)
- Resource exhaustion (CPU > 80%, Memory > 85%)
- Database connection failures

## Security Considerations

### Container Security

- **Non-root users** - All containers run as non-root
- **Read-only filesystems** - Containers use read-only root filesystems
- **Security contexts** - Proper security contexts and capabilities
- **Image scanning** - Regular vulnerability scanning

### Network Security

- **Network policies** - Restrict pod-to-pod communication
- **TLS encryption** - All external traffic uses HTTPS
- **Service mesh** - Consider Istio for advanced security (optional)

### Secrets Management

- **Kubernetes Secrets** - Encrypted at rest
- **External secret management** - HashiCorp Vault integration (recommended)
- **Secret rotation** - Regular rotation of sensitive credentials

### Access Control

- **RBAC** - Role-based access control for Kubernetes
- **Service accounts** - Minimal required permissions
- **Pod security standards** - Enforce security policies

## Troubleshooting

### Common Issues

#### 1. Services Not Starting

```bash
# Check pod status
kubectl get pods -n remotehive

# Describe problematic pod
kubectl describe pod <pod-name> -n remotehive

# Check logs
kubectl logs <pod-name> -n remotehive -f

# Check events
kubectl get events -n remotehive --sort-by='.lastTimestamp'
```

#### 2. Database Connection Issues

```bash
# Test MongoDB connection
kubectl exec -it -n remotehive <backend-pod> -- python -c "from app.database.database import test_connection; test_connection()"

# Test Redis connection
kubectl exec -it -n remotehive <redis-pod> -- redis-cli ping

# Check database logs
kubectl logs -n remotehive -l app=mongodb -f
kubectl logs -n remotehive -l app=redis -f
```

#### 3. Ingress Issues

```bash
# Check ingress status
kubectl get ingress -n remotehive
kubectl describe ingress remotehive-ingress -n remotehive

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx -f

# Test internal service connectivity
kubectl exec -it -n remotehive <test-pod> -- curl http://backend-api:8000/health
```

#### 4. SSL Certificate Issues

```bash
# Check certificate status
kubectl get certificates -n remotehive
kubectl describe certificate remotehive-tls -n remotehive

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager -f

# Manual certificate request
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: remotehive-tls-manual
  namespace: remotehive
spec:
  secretName: remotehive-tls-manual
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - remotehive.in
  - admin.remotehive.in
  - api.remotehive.in
EOF
```

### Performance Troubleshooting

```bash
# Check resource usage
kubectl top pods -n remotehive
kubectl top nodes

# Check HPA status
kubectl get hpa -n remotehive
kubectl describe hpa <hpa-name> -n remotehive

# Check metrics server
kubectl get --raw /apis/metrics.k8s.io/v1beta1/nodes
kubectl get --raw /apis/metrics.k8s.io/v1beta1/pods
```

## Scaling and Performance

### Horizontal Pod Autoscaling

Services are configured with HPA for automatic scaling:

```yaml
# Example HPA configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Manual Scaling

```bash
# Scale specific service
kubectl scale -n remotehive deployment/backend-api --replicas=5

# Scale Celery workers
kubectl scale -n remotehive deployment/celery-worker --replicas=8

# Check scaling status
kubectl get hpa -n remotehive
kubectl get pods -n remotehive -l app=backend-api
```

### Performance Optimization

1. **Database Optimization**
   - MongoDB indexing strategy
   - Connection pool tuning
   - Query optimization

2. **Caching Strategy**
   - Redis caching layers
   - CDN for static assets
   - Application-level caching

3. **Resource Tuning**
   - CPU and memory requests/limits
   - JVM tuning (if applicable)
   - Container resource optimization

## Backup and Recovery

### Database Backups

1. **MongoDB Backup**
   ```bash
   # Create backup
   kubectl exec -n remotehive <mongodb-pod> -- mongodump --out /backup/$(date +%Y%m%d_%H%M%S)
   
   # Restore backup
   kubectl exec -n remotehive <mongodb-pod> -- mongorestore /backup/<backup-directory>
   ```

2. **Redis Backup**
   ```bash
   # Create backup
   kubectl exec -n remotehive <redis-pod> -- redis-cli BGSAVE
   
   # Copy backup file
   kubectl cp remotehive/<redis-pod>:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
   ```

### Persistent Volume Backups

Use your cloud provider's volume snapshot feature:

```bash
# AWS EBS snapshots
aws ec2 create-snapshot --volume-id vol-xxxxxxxxx --description "RemoteHive backup $(date)"

# Google Cloud persistent disk snapshots
gcloud compute disks snapshot <disk-name> --snapshot-names=remotehive-backup-$(date +%Y%m%d)

# Azure disk snapshots
az snapshot create --resource-group <rg> --source <disk-name> --name remotehive-backup-$(date +%Y%m%d)
```

### Disaster Recovery

1. **Backup Strategy**
   - Daily automated backups
   - Weekly full system backups
   - Monthly backup verification
   - Offsite backup storage

2. **Recovery Procedures**
   - Document recovery time objectives (RTO)
   - Document recovery point objectives (RPO)
   - Regular disaster recovery testing
   - Automated recovery scripts

## Conclusion

This deployment guide provides a comprehensive approach to deploying RemoteHive in both development and production environments. The containerized, Kubernetes-native architecture ensures:

- **Scalability** - Automatic scaling based on demand
- **Reliability** - Health checks, circuit breakers, and graceful degradation
- **Observability** - Comprehensive monitoring and alerting
- **Security** - Industry-standard security practices
- **Maintainability** - Clear separation of concerns and standardized deployment

For additional support and advanced configurations, refer to the individual service documentation and Kubernetes best practices guides.

---

**Next Steps:**
1. Set up your development environment using Docker Compose
2. Configure your Kubernetes cluster for production deployment
3. Set up CI/CD pipeline with GitHub Actions
4. Configure monitoring and alerting
5. Implement backup and disaster recovery procedures

For questions or issues, please refer to the troubleshooting section or create an issue in the project repository.