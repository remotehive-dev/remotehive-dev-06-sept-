# RemoteHive Deployment Guide

This guide provides comprehensive instructions for deploying RemoteHive to a VPC using Docker Compose or Kubernetes.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Methods](#deployment-methods)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Local Requirements

- **Git** for version control
- **Docker** and **Docker Compose** for containerization
- **SSH access** to your VPC instance
- **GitHub account** with repository access

### VPC Requirements

- **Ubuntu 20.04+** or similar Linux distribution
- **Minimum 4GB RAM, 2 CPU cores**
- **20GB+ storage space**
- **Open ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000-8001 (APIs), 3000 (Admin), 5173 (Public)

### Environment Variables

Set these environment variables before deployment:

```bash
export VPC_HOST="your-vpc-ip-or-hostname"
export VPC_USER="your-vpc-username"
export VPC_SSH_KEY_PATH="~/.ssh/id_rsa"  # Optional, defaults to ~/.ssh/id_rsa
```

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/remotehive.git
cd remotehive
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Key configurations to update:**

```bash
# Database
MONGODB_URL=mongodb://admin:your-secure-password@mongodb:27017/remotehive?authSource=admin
REDIS_URL=redis://:your-redis-password@redis:6379/0

# Security
JWT_SECRET_KEY=your-super-secret-jwt-key-min-32-chars
NEXTAUTH_SECRET=your-nextauth-secret

# Email
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# External APIs
CLERK_SECRET_KEY=your-clerk-secret
GOOGLE_MAPS_API_KEY=your-maps-api-key
```

### 3. Make Deployment Script Executable

```bash
chmod +x deploy-to-vpc.sh
```

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

#### Docker Compose Deployment

```bash
# Deploy to production with Docker Compose
./deploy-to-vpc.sh production

# Deploy with force flag (skip confirmations)
./deploy-to-vpc.sh production --force
```

#### Kubernetes Deployment

```bash
# Deploy to production with Kubernetes
./deploy-to-vpc.sh production --k8s

# Deploy with force flag
./deploy-to-vpc.sh production --k8s --force
```

### Method 2: Manual Deployment

#### Docker Compose Manual Steps

1. **Copy files to VPC:**

```bash
scp -r . $VPC_USER@$VPC_HOST:~/remotehive-deployment/
```

2. **SSH into VPC and deploy:**

```bash
ssh $VPC_USER@$VPC_HOST
cd ~/remotehive-deployment

# Install Docker and Docker Compose if needed
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy services
docker-compose up -d
```

#### Kubernetes Manual Steps

1. **Install Kubernetes (k3s):**

```bash
ssh $VPC_USER@$VPC_HOST
curl -sfL https://get.k3s.io | sh -
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
```

2. **Deploy to Kubernetes:**

```bash
cd ~/remotehive-deployment

# Deploy in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/persistent-volumes.yaml
kubectl apply -f k8s/configmaps-secrets.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/redis.yaml

# Wait for databases
kubectl wait --for=condition=ready pod -l app=mongodb -n remotehive --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n remotehive --timeout=300s

# Deploy applications
kubectl apply -f k8s/backend-api.yaml
kubectl apply -f k8s/autoscraper-service.yaml
kubectl apply -f k8s/admin-panel.yaml
kubectl apply -f k8s/public-website.yaml
kubectl apply -f k8s/celery-workers.yaml
kubectl apply -f k8s/ingress.yaml
```

## CI/CD Pipeline

### GitHub Actions Setup

The repository includes a comprehensive CI/CD pipeline (`.github/workflows/deploy-to-vpc.yml`) that:

1. **Code Quality Checks**
   - Black formatting
   - isort import sorting
   - Flake8 linting
   - Bandit security scanning

2. **Testing**
   - Backend unit and integration tests
   - Frontend component tests

3. **Build and Push**
   - Docker images to GitHub Container Registry
   - Multi-architecture support (amd64, arm64)

4. **Deployment**
   - Automated deployment to VPC
   - Database migrations
   - Health checks
   - Rollback on failure

### Required GitHub Secrets

Add these secrets to your GitHub repository:

```
VPC_HOST=your-vpc-ip-or-hostname
VPC_USER=your-vpc-username
VPC_SSH_KEY=your-private-ssh-key-content
GHCR_TOKEN=your-github-token-with-packages-write-permission
```

### Triggering Deployments

```bash
# Automatic deployment on push to main
git push origin main

# Manual deployment via GitHub Actions
# Go to Actions tab → Deploy to VPC → Run workflow
```

## Service Architecture

### Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| backend-api | 8000 | Main FastAPI backend |
| autoscraper-service | 8001 | Job scraping service |
| admin-panel | 3000 | Next.js admin interface |
| public-website | 5173 | React public website |
| mongodb | 27017 | Primary database |
| redis | 6379 | Cache and message broker |
| celery-worker | - | Background task processor |
| celery-beat | - | Task scheduler |

### Kubernetes Resources

- **Namespace**: `remotehive`
- **Deployments**: All services with replica sets
- **Services**: ClusterIP and LoadBalancer types
- **ConfigMaps**: Environment configuration
- **Secrets**: Sensitive data (passwords, keys)
- **PersistentVolumes**: Database storage
- **Ingress**: External access routing

## Monitoring and Maintenance

### Health Checks

```bash
# Check service status (Docker Compose)
ssh $VPC_USER@$VPC_HOST 'cd ~/remotehive-deployment && docker-compose ps'

# Check service status (Kubernetes)
ssh $VPC_USER@$VPC_HOST 'kubectl get pods -n remotehive'

# Test endpoints
curl http://$VPC_HOST:8000/health
curl http://$VPC_HOST:8001/health
```

### Log Management

```bash
# Docker Compose logs
ssh $VPC_USER@$VPC_HOST 'cd ~/remotehive-deployment && docker-compose logs -f [service-name]'

# Kubernetes logs
ssh $VPC_USER@$VPC_HOST 'kubectl logs -f deployment/backend-api -n remotehive'
```

### Backup Procedures

#### Database Backup

```bash
# MongoDB backup (Docker Compose)
ssh $VPC_USER@$VPC_HOST 'cd ~/remotehive-deployment && docker-compose exec mongodb mongodump --out /backup'

# MongoDB backup (Kubernetes)
ssh $VPC_USER@$VPC_HOST 'kubectl exec -n remotehive deployment/mongodb -- mongodump --out /backup'
```

#### Application Backup

```bash
# Backup entire deployment
ssh $VPC_USER@$VPC_HOST 'tar -czf remotehive-backup-$(date +%Y%m%d).tar.gz ~/remotehive-deployment'
```

### Updates and Scaling

#### Rolling Updates

```bash
# Docker Compose update
ssh $VPC_USER@$VPC_HOST 'cd ~/remotehive-deployment && docker-compose pull && docker-compose up -d'

# Kubernetes rolling update
ssh $VPC_USER@$VPC_HOST 'kubectl rollout restart deployment/backend-api -n remotehive'
```

#### Scaling Services

```bash
# Docker Compose scaling
ssh $VPC_USER@$VPC_HOST 'cd ~/remotehive-deployment && docker-compose up -d --scale celery-worker=3'

# Kubernetes scaling
ssh $VPC_USER@$VPC_HOST 'kubectl scale deployment/celery-worker --replicas=3 -n remotehive'
```

## Security Considerations

### Network Security

1. **Firewall Configuration**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw allow 8000/tcp # Backend API
   sudo ufw allow 8001/tcp # Autoscraper
   sudo ufw allow 3000/tcp # Admin Panel
   sudo ufw allow 5173/tcp # Public Website
   sudo ufw enable
   ```

2. **SSL/TLS Setup**
   - Use Let's Encrypt for SSL certificates
   - Configure reverse proxy (Nginx/Traefik)
   - Enable HTTPS redirects

### Application Security

1. **Environment Variables**
   - Never commit secrets to version control
   - Use strong, unique passwords
   - Rotate secrets regularly

2. **Database Security**
   - Enable authentication
   - Use strong passwords
   - Limit network access
   - Regular backups

3. **Container Security**
   - Use non-root users
   - Scan images for vulnerabilities
   - Keep base images updated
   - Limit container privileges

## Troubleshooting

### Common Issues

#### 1. Service Not Starting

```bash
# Check logs
docker-compose logs [service-name]
# or
kubectl logs deployment/[service-name] -n remotehive

# Check resource usage
docker stats
# or
kubectl top pods -n remotehive
```

#### 2. Database Connection Issues

```bash
# Test MongoDB connection
docker-compose exec backend-api python -c "from app.database.database import get_database; print('DB Connected')"

# Check MongoDB status
docker-compose exec mongodb mongo --eval "db.adminCommand('ismaster')"
```

#### 3. Network Connectivity

```bash
# Test internal connectivity
docker-compose exec backend-api curl http://mongodb:27017
docker-compose exec backend-api curl http://redis:6379

# Test external connectivity
curl http://$VPC_HOST:8000/health
```

#### 4. Performance Issues

```bash
# Monitor resource usage
docker stats
htop

# Check application metrics
curl http://$VPC_HOST:8000/metrics
```

### Recovery Procedures

#### 1. Service Recovery

```bash
# Restart specific service
docker-compose restart [service-name]
# or
kubectl rollout restart deployment/[service-name] -n remotehive

# Full system restart
docker-compose down && docker-compose up -d
# or
kubectl delete pods --all -n remotehive
```

#### 2. Database Recovery

```bash
# Restore from backup
docker-compose exec mongodb mongorestore /backup

# Reset database (CAUTION: Data loss)
docker-compose down -v
docker-compose up -d
```

#### 3. Complete System Recovery

```bash
# Re-deploy from scratch
./deploy-to-vpc.sh production --force
```

## Performance Optimization

### Resource Allocation

1. **Memory Optimization**
   - Monitor memory usage patterns
   - Adjust container memory limits
   - Enable swap if needed

2. **CPU Optimization**
   - Scale worker processes based on load
   - Use CPU limits to prevent resource starvation
   - Monitor CPU utilization

3. **Storage Optimization**
   - Use SSD storage for databases
   - Implement log rotation
   - Regular cleanup of unused images

### Application Tuning

1. **Database Optimization**
   - Create appropriate indexes
   - Optimize query patterns
   - Use connection pooling

2. **Caching Strategy**
   - Implement Redis caching
   - Use CDN for static assets
   - Enable browser caching

3. **Load Balancing**
   - Scale horizontally when needed
   - Use health checks for load balancing
   - Implement circuit breakers

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Check service health
   - Review logs for errors
   - Monitor resource usage

2. **Monthly**
   - Update system packages
   - Rotate log files
   - Review security patches

3. **Quarterly**
   - Update application dependencies
   - Review and update secrets
   - Performance optimization review

### Getting Help

1. **Documentation**
   - Check service-specific README files
   - Review API documentation
   - Consult deployment logs

2. **Monitoring**
   - Use built-in health checks
   - Set up alerting for critical issues
   - Monitor application metrics

3. **Support Channels**
   - Create GitHub issues for bugs
   - Check existing documentation
   - Review troubleshooting guides

---

## Quick Reference

### Essential Commands

```bash
# Deploy to production
./deploy-to-vpc.sh production

# Check service status
ssh $VPC_USER@$VPC_HOST 'cd ~/remotehive-deployment && docker-compose ps'

# View logs
ssh $VPC_USER@$VPC_HOST 'cd ~/remotehive-deployment && docker-compose logs -f'

# Restart services
ssh $VPC_USER@$VPC_HOST 'cd ~/remotehive-deployment && docker-compose restart'

# Update services
ssh $VPC_USER@$VPC_HOST 'cd ~/remotehive-deployment && docker-compose pull && docker-compose up -d'
```

### Service URLs

- **Backend API**: `http://$VPC_HOST:8000`
- **Autoscraper Service**: `http://$VPC_HOST:8001`
- **Admin Panel**: `http://$VPC_HOST:3000`
- **Public Website**: `http://$VPC_HOST:5173`

### Default Credentials

- **Admin User**: `admin@remotehive.in`
- **Admin Password**: `Ranjeet11$`

This deployment guide provides comprehensive coverage of all aspects of deploying and maintaining RemoteHive in a production VPC environment.