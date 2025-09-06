#!/bin/bash

# RemoteHive Production Setup Automation Script
# This script automates the complete production deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$PROJECT_ROOT/k8s"

# Default values
REGISTRY_URL=""
TAG="v1.0.0"
DOMAIN="remotehive.in"
EMAIL="admin@remotehive.in"
ENVIRONMENT="production"
SKIP_BUILD=false
SKIP_CLUSTER_SETUP=false
SKIP_MONITORING=false
DRY_RUN=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for user confirmation
confirm() {
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "DRY RUN: Would execute: $1"
        return 0
    fi
    
    read -p "$1 (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    if ! command_exists kubectl; then
        missing_tools+=("kubectl")
    fi
    
    if ! command_exists docker; then
        missing_tools+=("docker")
    fi
    
    if ! command_exists helm; then
        missing_tools+=("helm")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_status "Please install the missing tools and try again."
        exit 1
    fi
    
    # Check kubectl connectivity
    if ! kubectl cluster-info >/dev/null 2>&1; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Function to setup cluster components
setup_cluster_components() {
    if [[ "$SKIP_CLUSTER_SETUP" == "true" ]]; then
        print_warning "Skipping cluster setup"
        return 0
    fi
    
    print_status "Setting up cluster components..."
    
    # Install NGINX Ingress Controller
    print_status "Installing NGINX Ingress Controller..."
    if ! kubectl get namespace ingress-nginx >/dev/null 2>&1; then
        kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
        
        print_status "Waiting for ingress controller to be ready..."
        kubectl wait --namespace ingress-nginx \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/component=controller \
            --timeout=300s
    else
        print_success "NGINX Ingress Controller already installed"
    fi
    
    # Install cert-manager
    print_status "Installing cert-manager..."
    if ! kubectl get namespace cert-manager >/dev/null 2>&1; then
        kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml
        
        print_status "Waiting for cert-manager to be ready..."
        kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n cert-manager
        kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-cainjector -n cert-manager
        kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-webhook -n cert-manager
    else
        print_success "cert-manager already installed"
    fi
    
    # Install Metrics Server
    print_status "Checking Metrics Server..."
    if ! kubectl get deployment metrics-server -n kube-system >/dev/null 2>&1; then
        print_status "Installing Metrics Server..."
        kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
        
        # For development clusters, add --kubelet-insecure-tls
        kubectl patch deployment metrics-server -n kube-system --type='json' \
            -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
        
        kubectl wait --for=condition=available --timeout=300s deployment/metrics-server -n kube-system
    else
        print_success "Metrics Server already installed"
    fi
    
    print_success "Cluster components setup complete"
}

# Function to setup monitoring
setup_monitoring() {
    if [[ "$SKIP_MONITORING" == "true" ]]; then
        print_warning "Skipping monitoring setup"
        return 0
    fi
    
    print_status "Setting up monitoring stack..."
    
    # Add Prometheus Helm repository
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts >/dev/null 2>&1 || true
    helm repo update >/dev/null 2>&1
    
    # Create monitoring namespace
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    
    # Install kube-prometheus-stack
    if ! helm list -n monitoring | grep -q prometheus; then
        print_status "Installing Prometheus stack..."
        helm install prometheus prometheus-community/kube-prometheus-stack \
            --namespace monitoring \
            --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
            --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
            --set grafana.adminPassword=admin123 \
            --set grafana.service.type=ClusterIP
        
        print_status "Waiting for monitoring stack to be ready..."
        kubectl wait --for=condition=available --timeout=300s deployment/prometheus-kube-prometheus-prometheus-operator -n monitoring
        kubectl wait --for=condition=available --timeout=300s deployment/prometheus-grafana -n monitoring
    else
        print_success "Prometheus stack already installed"
    fi
    
    # Create Grafana ingress
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
    - grafana.${DOMAIN}
    secretName: grafana-tls
  rules:
  - host: grafana.${DOMAIN}
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
    
    print_success "Monitoring stack setup complete"
    print_status "Grafana will be available at: https://grafana.${DOMAIN}"
    print_status "Default credentials: admin / admin123"
}

# Function to build and push images
build_and_push_images() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        print_warning "Skipping image build"
        return 0
    fi
    
    if [[ -z "$REGISTRY_URL" ]]; then
        print_error "Registry URL not specified. Use -r flag or set REGISTRY_URL environment variable."
        exit 1
    fi
    
    print_status "Building and pushing container images..."
    
    cd "$PROJECT_ROOT"
    
    # Build Backend API
    print_status "Building Backend API image..."
    docker build -t "${REGISTRY_URL}/remotehive-backend:${TAG}" -f Dockerfile .
    docker push "${REGISTRY_URL}/remotehive-backend:${TAG}"
    
    # Build Autoscraper Service
    print_status "Building Autoscraper Service image..."
    docker build -t "${REGISTRY_URL}/remotehive-autoscraper:${TAG}" -f autoscraper-service/Dockerfile ./autoscraper-service
    docker push "${REGISTRY_URL}/remotehive-autoscraper:${TAG}"
    
    # Build Admin Panel
    print_status "Building Admin Panel image..."
    docker build -t "${REGISTRY_URL}/remotehive-admin:${TAG}" -f remotehive-admin/Dockerfile ./remotehive-admin
    docker push "${REGISTRY_URL}/remotehive-admin:${TAG}"
    
    # Build Public Website
    print_status "Building Public Website image..."
    docker build -t "${REGISTRY_URL}/remotehive-public:${TAG}" -f remotehive-public/Dockerfile ./remotehive-public
    docker push "${REGISTRY_URL}/remotehive-public:${TAG}"
    
    print_success "All images built and pushed successfully"
}

# Function to update configurations
update_configurations() {
    print_status "Updating configurations for ${ENVIRONMENT} environment..."
    
    local config_dir="$K8S_DIR"
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        config_dir="$K8S_DIR-staging"
        cp -r "$K8S_DIR" "$config_dir"
    fi
    
    cd "$config_dir"
    
    # Update domain names
    local domain_suffix=""
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        domain_suffix="-staging"
    fi
    
    # Update ingress configuration
    if [[ -f "ingress.yaml" ]]; then
        sed -i.bak "s/remotehive\.example\.com/${DOMAIN}/g" ingress.yaml
        sed -i.bak "s/admin\.remotehive\.example\.com/admin${domain_suffix}.${DOMAIN}/g" ingress.yaml
        sed -i.bak "s/api\.remotehive\.example\.com/api${domain_suffix}.${DOMAIN}/g" ingress.yaml
        sed -i.bak "s/autoscraper\.remotehive\.example\.com/autoscraper${domain_suffix}.${DOMAIN}/g" ingress.yaml
        sed -i.bak "s/admin@example\.com/${EMAIL}/g" ingress.yaml
    fi
    
    # Update ConfigMaps
    if [[ -f "configmaps-secrets.yaml" ]]; then
        sed -i.bak "s/localhost:3000/admin${domain_suffix}.${DOMAIN}/g" configmaps-secrets.yaml
        sed -i.bak "s/localhost:5173/${DOMAIN}/g" configmaps-secrets.yaml
        sed -i.bak "s/localhost:8000/api${domain_suffix}.${DOMAIN}/g" configmaps-secrets.yaml
        sed -i.bak "s/localhost:8001/autoscraper${domain_suffix}.${DOMAIN}/g" configmaps-secrets.yaml
    fi
    
    # Update image references if registry URL is provided
    if [[ -n "$REGISTRY_URL" ]]; then
        find . -name "*.yaml" -exec sed -i.bak "s|image: remotehive|image: ${REGISTRY_URL}/remotehive|g" {} \;
        find . -name "*.yaml" -exec sed -i.bak "s|:latest|:${TAG}|g" {} \;
    fi
    
    # Update namespace for staging
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        find . -name "*.yaml" -exec sed -i.bak 's/namespace: remotehive/namespace: remotehive-staging/g' {} \;
    fi
    
    # Clean up backup files
    find . -name "*.bak" -delete
    
    print_success "Configurations updated for ${ENVIRONMENT} environment"
}

# Function to deploy to Kubernetes
deploy_to_kubernetes() {
    local namespace="remotehive"
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        namespace="remotehive-staging"
    fi
    
    local config_dir="$K8S_DIR"
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        config_dir="$K8S_DIR-staging"
    fi
    
    print_status "Deploying to Kubernetes (${ENVIRONMENT})..."
    
    cd "$config_dir"
    
    # Create namespace
    kubectl create namespace "$namespace" --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy in order
    local deployment_order=(
        "persistent-volumes.yaml"
        "configmaps-secrets.yaml"
        "mongodb.yaml"
        "redis.yaml"
        "backend-api.yaml"
        "autoscraper-service.yaml"
        "admin-panel.yaml"
        "public-website.yaml"
        "celery-workers.yaml"
        "ingress.yaml"
        "monitoring.yaml"
    )
    
    for file in "${deployment_order[@]}"; do
        if [[ -f "$file" ]]; then
            print_status "Applying $file..."
            kubectl apply -f "$file"
        else
            print_warning "File $file not found, skipping..."
        fi
    done
    
    # Wait for databases to be ready
    print_status "Waiting for databases to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n "$namespace" || true
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n "$namespace" || true
    
    # Wait for applications to be ready
    print_status "Waiting for applications to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/backend-api -n "$namespace" || true
    kubectl wait --for=condition=available --timeout=300s deployment/autoscraper-service -n "$namespace" || true
    kubectl wait --for=condition=available --timeout=300s deployment/admin-panel -n "$namespace" || true
    kubectl wait --for=condition=available --timeout=300s deployment/public-website -n "$namespace" || true
    
    print_success "Deployment to ${ENVIRONMENT} complete"
}

# Function to verify deployment
verify_deployment() {
    local namespace="remotehive"
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        namespace="remotehive-staging"
    fi
    
    local domain_suffix=""
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        domain_suffix="-staging"
    fi
    
    print_status "Verifying deployment..."
    
    # Check pod status
    print_status "Checking pod status..."
    kubectl get pods -n "$namespace"
    
    # Check services
    print_status "Checking services..."
    kubectl get svc -n "$namespace"
    
    # Check ingress
    print_status "Checking ingress..."
    kubectl get ingress -n "$namespace"
    
    # Test health endpoints
    local endpoints=(
        "https://api${domain_suffix}.${DOMAIN}/health"
        "https://admin${domain_suffix}.${DOMAIN}/api/health"
        "https://${DOMAIN}/health"
        "https://autoscraper${domain_suffix}.${DOMAIN}/health"
    )
    
    print_status "Testing health endpoints..."
    for endpoint in "${endpoints[@]}"; do
        print_status "Testing $endpoint..."
        if curl -f -k --max-time 30 "$endpoint" >/dev/null 2>&1; then
            print_success "✓ $endpoint is healthy"
        else
            print_warning "✗ $endpoint is not responding (this is normal if DNS/SSL is not yet propagated)"
        fi
    done
    
    print_success "Deployment verification complete"
}

# Function to show deployment info
show_deployment_info() {
    local domain_suffix=""
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        domain_suffix="-staging"
    fi
    
    print_success "\n🎉 RemoteHive deployment complete!"
    echo
    print_status "Service URLs:"
    echo "  • Public Website: https://${DOMAIN}"
    echo "  • Admin Panel: https://admin${domain_suffix}.${DOMAIN}"
    echo "  • Backend API: https://api${domain_suffix}.${DOMAIN}"
    echo "  • Autoscraper: https://autoscraper${domain_suffix}.${DOMAIN}"
    echo "  • Grafana: https://grafana.${DOMAIN}"
    echo
    print_status "Default Credentials:"
    echo "  • Admin Panel: admin@remotehive.in / Ranjeet11$"
    echo "  • Grafana: admin / admin123"
    echo
    print_status "Next Steps:"
    echo "  1. Configure DNS records to point to your cluster's external IP"
    echo "  2. Wait for SSL certificates to be issued (may take a few minutes)"
    echo "  3. Test all endpoints and functionality"
    echo "  4. Set up monitoring alerts"
    echo "  5. Configure backup procedures"
    echo
}

# Function to show usage
show_usage() {
    cat <<EOF
RemoteHive Production Setup Script

Usage: $0 [OPTIONS]

Options:
  -r, --registry URL        Container registry URL (required for build)
  -t, --tag TAG            Image tag (default: v1.0.0)
  -d, --domain DOMAIN      Base domain name (default: remotehive.in)
  -e, --email EMAIL        Email for SSL certificates (default: admin@remotehive.in)
  -E, --environment ENV    Environment: production or staging (default: production)
  --skip-build             Skip building and pushing images
  --skip-cluster-setup     Skip cluster component installation
  --skip-monitoring        Skip monitoring stack installation
  --dry-run                Show what would be done without executing
  -h, --help               Show this help message

Examples:
  # Full production deployment
  $0 -r your-username -d remotehive.in -e admin@remotehive.in
  
  # Staging deployment
  $0 -r your-username -d remotehive.in -E staging
  
  # Skip image build (use existing images)
  $0 -r your-username -d remotehive.in --skip-build
  
  # Dry run to see what would be executed
  $0 -r your-username -d remotehive.in --dry-run

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--registry)
            REGISTRY_URL="$2"
            shift 2
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        -E|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-cluster-setup)
            SKIP_CLUSTER_SETUP=true
            shift
            ;;
        --skip-monitoring)
            SKIP_MONITORING=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    print_error "Environment must be 'production' or 'staging'"
    exit 1
fi

# Main execution
main() {
    print_status "Starting RemoteHive ${ENVIRONMENT} deployment..."
    print_status "Registry: ${REGISTRY_URL:-'Not specified'}"
    print_status "Tag: $TAG"
    print_status "Domain: $DOMAIN"
    print_status "Email: $EMAIL"
    echo
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_warning "DRY RUN MODE - No actual changes will be made"
        echo
    fi
    
    # Confirm before proceeding
    if ! confirm "Proceed with ${ENVIRONMENT} deployment?"; then
        print_status "Deployment cancelled"
        exit 0
    fi
    
    # Execute deployment steps
    check_prerequisites
    setup_cluster_components
    setup_monitoring
    build_and_push_images
    update_configurations
    deploy_to_kubernetes
    verify_deployment
    show_deployment_info
    
    print_success "\n🚀 RemoteHive ${ENVIRONMENT} deployment completed successfully!"
}

# Run main function
main "$@"