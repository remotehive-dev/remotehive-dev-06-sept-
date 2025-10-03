# RemoteHive Production Deployment Guide

This guide provides precise step-by-step instructions to complete the production deployment process for RemoteHive.

## Prerequisites Checklist

- [ ] Kubernetes cluster access (kubectl configured)
- [ ] Container registry account (Docker Hub, AWS ECR, GCR, etc.)
- [ ] Domain names registered
- [ ] GitHub repository with admin access
- [ ] SSL certificate provider access (Let's Encrypt recommended)

---

## Step 1: Configure Kubernetes Cluster and Container Registry

### 1.1 Verify Kubernetes Cluster Access

```bash
# Test cluster connectivity
kubectl cluster-info
kubectl get nodes
kubectl get namespaces

# Check available storage classes
kubectl get storageclass

# Verify metrics server (required for HPA)
kubectl get deployment metrics-server -n kube-system
```

### 1.2 Install Required Cluster Components

#### Install NGINX Ingress Controller
```bash
# For cloud providers (AWS, GCP, Azure)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# For bare metal/on-premises
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/baremetal/deploy.yaml

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

#### Install cert-manager for SSL certificates
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n cert-manager
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-cainjector -n cert-manager
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-webhook -n cert-manager
```

#### Install Metrics Server (if not present)
```bash
# Check if metrics server exists
if ! kubectl get deployment metrics-server -n kube-system &> /dev/null; then
  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
  
  # For development clusters, you might need to add --kubelet-insecure-tls
  kubectl patch deployment metrics-server -n kube-system --type='json' \
    -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
fi

# Wait for metrics server
kubectl wait --for=condition=available --timeout=300s deployment/metrics-server -n kube-system
```

### 1.3 Configure Container Registry

#### Option A: Docker Hub
```bash
# Login to Docker Hub
docker login

# Create Kubernetes secret for registry access
kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=<your-username> \
  --docker-password=<your-password> \
  --docker-email=<your-email> \
  -n remotehive
```

#### Option B: AWS ECR
```bash
# Get ECR login token
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

# Create ECR repositories
aws ecr create-repository --repository-name remotehive/backend-api --region <region>
aws ecr create-repository --repository-name remotehive/autoscraper --region <region>
aws ecr create-repository --repository-name remotehive/admin-panel --region <region>
aws ecr create-repository --repository-name remotehive/public-website --region <region>

# Create Kubernetes secret
kubectl create secret docker-registry regcred \
  --docker-server=<account-id>.dkr.ecr.<region>.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region <region>) \
  -n remotehive
```

#### Option C: Google Container Registry
```bash
# Authenticate with GCR
gcloud auth configure-docker

# Create service account key
gcloud iam service-accounts create remotehive-registry
gcloud projects add-iam-policy-binding <project-id> \
  --member="serviceAccount:remotehive-registry@<project-id>.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
gcloud iam service-accounts keys create key.json \
  --iam-account=remotehive-registry@<project-id>.iam.gserviceaccount.com

# Create Kubernetes secret
kubectl create secret docker-registry regcred \
  --docker-server=gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat key.json)" \
  --docker-email=<your-email> \
  -n remotehive
```

### 1.4 Build and Push Container Images

```bash
# Set your registry URL
export REGISTRY_URL="your-registry-url"  # e.g., "your-username" for Docker Hub
export TAG="v1.0.0"

# Build and push all images
cd /Users/ranjeettiwary/Downloads/developer/RemoteHive_Migration_Package

# Backend API
docker build -t ${REGISTRY_URL}/remotehive-backend:${TAG} -f Dockerfile .
docker push ${REGISTRY_URL}/remotehive-backend:${TAG}

# Autoscraper Service
docker build -t ${REGISTRY_URL}/remotehive-autoscraper:${TAG} -f autoscraper-engine-api/Dockerfile ./autoscraper-service
docker push ${REGISTRY_URL}/remotehive-autoscraper:${TAG}

# Admin Panel
docker build -t ${REGISTRY_URL}/remotehive-admin:${TAG} -f admin-panel/Dockerfile ./remotehive-admin
docker push ${REGISTRY_URL}/remotehive-admin:${TAG}

# Public Website
docker build -t ${REGISTRY_URL}/remotehive-public:${TAG} -f website/Dockerfile ./remotehive-public
docker push ${REGISTRY_URL}/remotehive-public:${TAG}
```

---

## Step 2: Update Domain Names and SSL Certificates

### 2.1 Configure DNS Records

Set up the following DNS A records pointing to your Kubernetes cluster's external IP:

```bash
# Get the external IP of your ingress controller
kubectl get service ingress-nginx-controller -n ingress-nginx

# Note the EXTERNAL-IP and configure these DNS records:
# remotehive.in                    -> <EXTERNAL-IP>
# admin.remotehive.in              -> <EXTERNAL-IP>
# api.remotehive.in                -> <EXTERNAL-IP>
# autoscraper.remotehive.in        -> <EXTERNAL-IP>
```

### 2.2 Update Ingress Configuration

Edit the ingress configuration with your actual domain names:

```bash
# Edit the ingress file
cd k8s/
cp ingress.yaml ingress.yaml.backup

# Update domains in ingress.yaml
sed -i 's/remotehive\.example\.com/remotehive.in/g' ingress.yaml
sed -i 's/admin\.remotehive\.example\.com/admin.remotehive.in/g' ingress.yaml
sed -i 's/api\.remotehive\.example\.com/api.remotehive.in/g' ingress.yaml
sed -i 's/autoscraper\.remotehive\.example\.com/autoscraper.remotehive.in/g' ingress.yaml
```

### 2.3 Configure SSL Certificates

Update the ClusterIssuer configuration:

```yaml
# Add this to your ingress.yaml or create separate file
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@remotehive.in  # Update with your email
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@remotehive.in  # Update with your email
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: nginx
```

### 2.4 Update ConfigMaps with Production URLs

```bash
# Edit configmaps-secrets.yaml
cd k8s/
cp configmaps-secrets.yaml configmaps-secrets.yaml.backup

# Update the ConfigMap with production URLs
sed -i 's/localhost:3000/admin.remotehive.in/g' configmaps-secrets.yaml
sed -i 's/localhost:5173/remotehive.in/g' configmaps-secrets.yaml
sed -i 's/localhost:8000/api.remotehive.in/g' configmaps-secrets.yaml
sed -i 's/localhost:8001/autoscraper.remotehive.in/g' configmaps-secrets.yaml
```

---

## Step 3: Set Up Monitoring Stack (Prometheus/Grafana)

### 3.1 Install Prometheus Operator

```bash
# Add Prometheus community Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create monitoring namespace
kubectl create namespace monitoring

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
  --set grafana.adminPassword=admin123 \
  --set grafana.service.type=ClusterIP

# Wait for deployment
kubectl wait --for=condition=available --timeout=300s deployment/prometheus-kube-prometheus-prometheus-operator -n monitoring
kubectl wait --for=condition=available --timeout=300s deployment/prometheus-grafana -n monitoring
```

### 3.2 Configure Grafana Access

```bash
# Create ingress for Grafana
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana-ingress
  namespace: monitoring
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - grafana.remotehive.in
    secretName: grafana-tls
  rules:
  - host: grafana.remotehive.in
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: prometheus-grafana
            port:
              number: 80
EOF
```

### 3.3 Import RemoteHive Dashboards

```bash
# Apply the monitoring configuration from our k8s manifests
kubectl apply -f k8s/monitoring.yaml

# Get Grafana admin password
kubectl get secret --namespace monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo

# Access Grafana at https://grafana.remotehive.in
# Username: admin
# Password: (from above command)
```

### 3.4 Configure Alerting

```bash
# Create AlertManager configuration
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-config
  namespace: monitoring
type: Opaque
stringData:
  alertmanager.yml: |
    global:
      smtp_smarthost: 'smtp.gmail.com:587'
      smtp_from: 'alerts@remotehive.in'
      smtp_auth_username: 'alerts@remotehive.in'
      smtp_auth_password: 'your-app-password'
    
    route:
      group_by: ['alertname']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 1h
      receiver: 'web.hook'
    
    receivers:
    - name: 'web.hook'
      email_configs:
      - to: 'admin@remotehive.in'
        subject: 'RemoteHive Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
EOF
```

---

## Step 4: Configure CI/CD Secrets in GitHub

### 4.1 Generate Kubernetes Config

```bash
# Create service account for CI/CD
kubectl create serviceaccount remotehive-deployer -n remotehive

# Create ClusterRoleBinding
kubectl create clusterrolebinding remotehive-deployer \
  --clusterrole=cluster-admin \
  --serviceaccount=remotehive:remotehive-deployer

# Get the service account token (Kubernetes 1.24+)
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: remotehive-deployer-token
  namespace: remotehive
  annotations:
    kubernetes.io/service-account.name: remotehive-deployer
type: kubernetes.io/service-account-token
EOF

# Get the token
TOKEN=$(kubectl get secret remotehive-deployer-token -n remotehive -o jsonpath='{.data.token}' | base64 --decode)

# Get cluster info
CLUSTER_NAME=$(kubectl config current-context)
SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
CA_CERT=$(kubectl get secret remotehive-deployer-token -n remotehive -o jsonpath='{.data.ca\.crt}')

# Create kubeconfig for CI/CD
cat <<EOF > kubeconfig-cicd
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: ${CA_CERT}
    server: ${SERVER}
  name: ${CLUSTER_NAME}
contexts:
- context:
    cluster: ${CLUSTER_NAME}
    user: remotehive-deployer
  name: ${CLUSTER_NAME}
current-context: ${CLUSTER_NAME}
users:
- name: remotehive-deployer
  user:
    token: ${TOKEN}
EOF

# Base64 encode the kubeconfig
base64 -i kubeconfig-cicd
```

### 4.2 Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

```bash
# Required secrets:
KUBE_CONFIG_PRODUCTION     # Base64 encoded kubeconfig from above
KUBE_CONFIG_STAGING        # Base64 encoded kubeconfig for staging cluster
DOCKER_USERNAME           # Container registry username
DOCKER_PASSWORD           # Container registry password
REGISTRY_URL              # Container registry URL

# Optional secrets:
SLACK_WEBHOOK             # Slack webhook for notifications
SNYK_TOKEN                # Snyk token for security scanning
SONARQUBE_TOKEN           # SonarQube token for code quality
```

### 4.3 Configure GitHub Environments

```bash
# Create staging environment
gh api repos/:owner/:repo/environments/staging --method PUT --field deployment_branch_policy='null'

# Create production environment with protection rules
gh api repos/:owner/:repo/environments/production --method PUT --field deployment_branch_policy='{"protected_branches":true,"custom_branch_policies":false}'

# Add required reviewers for production
gh api repos/:owner/:repo/environments/production/deployment_protection_rules --method POST --field type='required_reviewers' --field reviewers='[{"type":"User","id":"your-user-id"}]'
```

### 4.4 Update CI/CD Pipeline

Update the GitHub Actions workflow with your specific values:

```bash
# Edit .github/workflows/ci-cd.yml
sed -i 's/your-registry-url/your-actual-registry-url/g' .github/workflows/ci-cd.yml
sed -i 's/your-username/your-actual-username/g' .github/workflows/ci-cd.yml
```

---

## Step 5: Deploy to Staging Environment

### 5.1 Create Staging Namespace

```bash
# Create staging namespace
kubectl create namespace remotehive-staging

# Copy secrets to staging namespace
kubectl get secret regcred -n remotehive -o yaml | \
  sed 's/namespace: remotehive/namespace: remotehive-staging/' | \
  kubectl apply -f -
```

### 5.2 Deploy to Staging

```bash
# Create staging-specific configurations
cp -r k8s k8s-staging
cd k8s-staging

# Update namespace in all files
find . -name "*.yaml" -exec sed -i 's/namespace: remotehive/namespace: remotehive-staging/g' {} \;

# Update domain names for staging
sed -i 's/remotehive\.in/staging.remotehive.in/g' ingress.yaml
sed -i 's/admin\.remotehive\.in/admin-staging.remotehive.in/g' ingress.yaml
sed -i 's/api\.remotehive\.in/api-staging.remotehive.in/g' ingress.yaml
sed -i 's/autoscraper\.remotehive\.in/autoscraper-staging.remotehive.in/g' ingress.yaml

# Deploy to staging
kubectl apply -f namespace.yaml
kubectl apply -f persistent-volumes.yaml
kubectl apply -f configmaps-secrets.yaml
kubectl apply -f mongodb.yaml
kubectl apply -f redis.yaml

# Wait for databases
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n remotehive-staging
kubectl wait --for=condition=available --timeout=300s deployment/redis -n remotehive-staging

# Deploy applications
kubectl apply -f backend-api.yaml
kubectl apply -f autoscraper-service.yaml
kubectl apply -f admin-panel.yaml
kubectl apply -f public-website.yaml
kubectl apply -f celery-workers.yaml
kubectl apply -f ingress.yaml
kubectl apply -f monitoring.yaml
```

### 5.3 Verify Staging Deployment

```bash
# Check pod status
kubectl get pods -n remotehive-staging

# Check services
kubectl get svc -n remotehive-staging

# Check ingress
kubectl get ingress -n remotehive-staging

# Test health endpoints
curl -k https://api-staging.remotehive.in/health
curl -k https://admin-staging.remotehive.in/api/health
curl -k https://staging.remotehive.in/health
curl -k https://autoscraper-staging.remotehive.in/health
```

### 5.4 Run Staging Tests

```bash
# Create test script
cat <<EOF > test-staging.sh
#!/bin/bash
set -e

echo "Testing staging environment..."

# Test API endpoints
echo "Testing Backend API..."
curl -f https://api-staging.remotehive.in/health || exit 1

echo "Testing Autoscraper..."
curl -f https://autoscraper-staging.remotehive.in/health || exit 1

echo "Testing Admin Panel..."
curl -f https://admin-staging.remotehive.in/api/health || exit 1

echo "Testing Public Website..."
curl -f https://staging.remotehive.in/health || exit 1

# Test database connectivity
echo "Testing database connectivity..."
kubectl exec -n remotehive-staging deployment/backend-api -- python -c "from app.database.database import test_connection; test_connection()"

# Test Redis connectivity
echo "Testing Redis connectivity..."
kubectl exec -n remotehive-staging deployment/redis -- redis-cli ping

echo "All staging tests passed!"
EOF

chmod +x test-staging.sh
./test-staging.sh
```

---

## Step 6: Production Deployment

### 6.1 Final Production Deployment

```bash
# Deploy to production using the deployment script
cd k8s/
./deploy.sh

# Or deploy manually step by step
kubectl apply -f namespace.yaml
kubectl apply -f persistent-volumes.yaml
kubectl apply -f configmaps-secrets.yaml
kubectl apply -f mongodb.yaml
kubectl apply -f redis.yaml

# Wait for databases
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n remotehive
kubectl wait --for=condition=available --timeout=300s deployment/redis -n remotehive

# Deploy applications
kubectl apply -f backend-api.yaml
kubectl apply -f autoscraper-service.yaml
kubectl apply -f admin-panel.yaml
kubectl apply -f public-website.yaml
kubectl apply -f celery-workers.yaml
kubectl apply -f ingress.yaml
kubectl apply -f monitoring.yaml
```

### 6.2 Verify Production Deployment

```bash
# Check all pods are running
kubectl get pods -n remotehive

# Check services
kubectl get svc -n remotehive

# Check ingress and certificates
kubectl get ingress -n remotehive
kubectl get certificates -n remotehive

# Test all endpoints
curl https://api.remotehive.in/health
curl https://admin.remotehive.in/api/health
curl https://remotehive.in/health
curl https://autoscraper.remotehive.in/health
```

### 6.3 Post-Deployment Checklist

- [ ] All pods are running and healthy
- [ ] All services are accessible via their domains
- [ ] SSL certificates are valid and auto-renewing
- [ ] Monitoring dashboards are showing data
- [ ] Alerts are configured and working
- [ ] Database backups are scheduled
- [ ] CI/CD pipeline is working
- [ ] Load testing completed
- [ ] Security scanning passed
- [ ] Documentation updated

---

## Troubleshooting Common Issues

### SSL Certificate Issues
```bash
# Check certificate status
kubectl describe certificate remotehive-tls -n remotehive

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# Force certificate renewal
kubectl delete certificate remotehive-tls -n remotehive
kubectl apply -f ingress.yaml
```

### Pod Startup Issues
```bash
# Check pod logs
kubectl logs -n remotehive -l app=backend-api --tail=100

# Describe problematic pods
kubectl describe pod -n remotehive <pod-name>

# Check events
kubectl get events -n remotehive --sort-by='.lastTimestamp'
```

### Database Connection Issues
```bash
# Test MongoDB connection
kubectl exec -n remotehive deployment/mongodb -- mongosh --eval "db.adminCommand('ping')"

# Test Redis connection
kubectl exec -n remotehive deployment/redis -- redis-cli ping

# Check database logs
kubectl logs -n remotehive -l app=mongodb
kubectl logs -n remotehive -l app=redis
```

### Ingress Issues
```bash
# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Test internal connectivity
kubectl run test-pod --image=curlimages/curl -i --tty --rm -- sh
# Inside the pod:
curl http://backend-api.remotehive.svc.cluster.local:8000/health
```

---

## Monitoring and Maintenance

### Daily Checks
- Monitor Grafana dashboards
- Check application logs for errors
- Verify backup completion
- Review resource utilization

### Weekly Tasks
- Update container images
- Review security alerts
- Check certificate expiration
- Performance optimization

### Monthly Tasks
- Security patching
- Capacity planning
- Disaster recovery testing
- Documentation updates

---

## Success Criteria

✅ **Cluster Configuration**
- Kubernetes cluster is operational
- Required components installed (ingress, cert-manager, metrics-server)
- Container registry configured and accessible

✅ **Domain and SSL**
- DNS records pointing to cluster
- SSL certificates issued and valid
- All services accessible via HTTPS

✅ **Monitoring**
- Prometheus collecting metrics
- Grafana dashboards operational
- Alerts configured and tested

✅ **CI/CD**
- GitHub Actions pipeline working
- Secrets configured correctly
- Automated deployments functional

✅ **Staging Environment**
- Staging deployment successful
- All tests passing
- Performance benchmarks met

✅ **Production Deployment**
- All services running and healthy
- Load balancing operational
- Auto-scaling configured
- Backup and recovery tested

Congratulations! Your RemoteHive platform is now production-ready with enterprise-grade infrastructure, monitoring, and deployment automation. 🎉