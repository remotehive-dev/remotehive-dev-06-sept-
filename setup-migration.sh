#!/bin/bash

# RemoteHive Migration Package Setup Script
# This script sets up the complete migration environment with security, monitoring, and real-time sync

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="remotehive"
REGISTRY="ghcr.io/remotehive"
KUBE_CONFIG_PATH="$HOME/.kube/config"
REMOTE_HOST="210.79.129.193"
REMOTE_USER="ubuntu"
SSH_KEY="./remotehive_key_new"

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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        print_warning "Helm is not installed. Installing Helm..."
        curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    fi
    
    # Check SSH key
    if [[ ! -f "$SSH_KEY" ]]; then
        print_error "SSH key not found at $SSH_KEY"
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# Function to setup Kubernetes namespace
setup_namespace() {
    print_status "Setting up Kubernetes namespace..."
    
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Set default namespace
    kubectl config set-context --current --namespace=$NAMESPACE
    
    print_success "Namespace $NAMESPACE created and set as default"
}

# Function to setup secrets
setup_secrets() {
    print_status "Setting up secrets..."
    
    # Create Docker registry secret
    read -p "Enter Docker registry username: " DOCKER_USERNAME
    read -s -p "Enter Docker registry password: " DOCKER_PASSWORD
    echo
    
    kubectl create secret docker-registry regcred \
        --docker-server=$REGISTRY \
        --docker-username=$DOCKER_USERNAME \
        --docker-password=$DOCKER_PASSWORD \
        --docker-email=$DOCKER_USERNAME@remotehive.com \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Create SSH key secret for remote access
    kubectl create secret generic ssh-key \
        --from-file=ssh-privatekey=$SSH_KEY \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Create MongoDB credentials
    MONGO_PASSWORD=$(openssl rand -base64 32)
    kubectl create secret generic mongodb-secret \
        --from-literal=username=admin \
        --from-literal=password=$MONGO_PASSWORD \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Create Redis password
    REDIS_PASSWORD=$(openssl rand -base64 32)
    kubectl create secret generic redis-secret \
        --from-literal=password=$REDIS_PASSWORD \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Create JWT secret
    JWT_SECRET=$(openssl rand -base64 64)
    kubectl create secret generic jwt-secret \
        --from-literal=secret=$JWT_SECRET \
        --dry-run=client -o yaml | kubectl apply -f -
    
    print_success "Secrets created successfully"
}

# Function to deploy monitoring stack
deploy_monitoring() {
    print_status "Deploying monitoring stack..."
    
    # Apply monitoring configuration
    kubectl apply -f monitoring-config.yml
    
    # Wait for monitoring pods to be ready
    print_status "Waiting for monitoring pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=prometheus --timeout=300s
    kubectl wait --for=condition=ready pod -l app=grafana --timeout=300s
    
    # Get Grafana admin password
    GRAFANA_PASSWORD=$(kubectl get secret grafana-secret -o jsonpath="{.data.admin-password}" | base64 --decode)
    
    print_success "Monitoring stack deployed successfully"
    print_status "Grafana admin password: $GRAFANA_PASSWORD"
}

# Function to deploy high availability configuration
deploy_ha_config() {
    print_status "Deploying high availability configuration..."
    
    # Apply HA configuration
    kubectl apply -f ha-config.yml
    
    # Wait for deployments to be ready
    print_status "Waiting for HA deployments to be ready..."
    kubectl wait --for=condition=available deployment --all --timeout=600s
    
    print_success "High availability configuration deployed successfully"
}

# Function to deploy real-time sync service
deploy_sync_service() {
    print_status "Deploying real-time sync service..."
    
    # Build sync service Docker image
    print_status "Building sync service Docker image..."
    cd sync-service
    docker build -t $REGISTRY/sync-service:latest .
    docker push $REGISTRY/sync-service:latest
    cd ..
    
    # Apply sync service configuration
    kubectl apply -f realtime-sync.yml
    
    # Wait for sync service to be ready
    print_status "Waiting for sync service to be ready..."
    kubectl wait --for=condition=ready pod -l app=sync-service --timeout=300s
    
    print_success "Real-time sync service deployed successfully"
}

# Function to setup remote Docker environment
setup_remote_docker() {
    print_status "Setting up Docker environment on remote server..."
    
    # Copy Docker Compose file to remote server
    scp -i $SSH_KEY docker-compose.remotehive.yml $REMOTE_USER@$REMOTE_HOST:~/
    
    # Setup Docker on remote server
    ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST << 'EOF'
        # Update system
        sudo apt-get update
        
        # Install Docker if not present
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
        fi
        
        # Install Docker Compose if not present
        if ! command -v docker-compose &> /dev/null; then
            sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        # Create necessary directories
        mkdir -p mongodb-init
        
        # Start services
        docker-compose -f docker-compose.remotehive.yml up -d
        
        echo "Remote Docker environment setup completed"
EOF
    
    print_success "Remote Docker environment setup completed"
}

# Function to setup GitHub Actions
setup_github_actions() {
    print_status "Setting up GitHub Actions workflow..."
    
    # Create .github/workflows directory if it doesn't exist
    mkdir -p .github/workflows
    
    # The deploy.yml file should already exist
    if [[ -f ".github/workflows/deploy.yml" ]]; then
        print_success "GitHub Actions workflow is already configured"
    else
        print_error "GitHub Actions workflow file not found"
        exit 1
    fi
    
    print_status "Please configure the following secrets in your GitHub repository:"
    echo "  - KUBE_CONFIG: Base64 encoded kubeconfig file"
    echo "  - DOCKER_USERNAME: Docker registry username"
    echo "  - DOCKER_PASSWORD: Docker registry password"
    echo "  - SLACK_WEBHOOK_URL: Slack webhook URL for notifications"
}

# Function to run deployment tests
run_tests() {
    print_status "Running deployment tests..."
    
    # Make test script executable
    chmod +x test-deployment.sh
    
    # Run tests
    ./test-deployment.sh
    
    print_success "Deployment tests completed"
}

# Function to display service URLs
display_service_urls() {
    print_status "Getting service URLs..."
    
    # Get LoadBalancer IPs or NodePort URLs
    echo "Service URLs:"
    
    # Grafana
    GRAFANA_URL=$(kubectl get svc grafana -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "<pending>")
    if [[ "$GRAFANA_URL" != "<pending>" ]]; then
        echo "  Grafana: http://$GRAFANA_URL:3000"
    else
        GRAFANA_PORT=$(kubectl get svc grafana -o jsonpath='{.spec.ports[0].nodePort}')
        echo "  Grafana: http://<node-ip>:$GRAFANA_PORT"
    fi
    
    # Prometheus
    PROMETHEUS_URL=$(kubectl get svc prometheus -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "<pending>")
    if [[ "$PROMETHEUS_URL" != "<pending>" ]]; then
        echo "  Prometheus: http://$PROMETHEUS_URL:9090"
    else
        PROMETHEUS_PORT=$(kubectl get svc prometheus -o jsonpath='{.spec.ports[0].nodePort}')
        echo "  Prometheus: http://<node-ip>:$PROMETHEUS_PORT"
    fi
    
    # Sync Service
    SYNC_URL=$(kubectl get svc sync-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "<pending>")
    if [[ "$SYNC_URL" != "<pending>" ]]; then
        echo "  Sync Service: http://$SYNC_URL:8080"
    else
        SYNC_PORT=$(kubectl get svc sync-service -o jsonpath='{.spec.ports[0].nodePort}')
        echo "  Sync Service: http://<node-ip>:$SYNC_PORT"
    fi
    
    echo
    print_status "Use 'kubectl get nodes -o wide' to get node IPs for NodePort services"
}

# Function to cleanup (optional)
cleanup() {
    print_warning "This will delete all RemoteHive resources. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Cleaning up RemoteHive resources..."
        kubectl delete namespace $NAMESPACE --ignore-not-found=true
        print_success "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Main function
main() {
    echo "RemoteHive Migration Package Setup"
    echo "==================================="
    echo
    
    case "${1:-setup}" in
        "setup")
            check_prerequisites
            setup_namespace
            setup_secrets
            deploy_monitoring
            deploy_ha_config
            deploy_sync_service
            setup_remote_docker
            setup_github_actions
            run_tests
            display_service_urls
            print_success "RemoteHive migration setup completed successfully!"
            ;;
        "monitoring")
            deploy_monitoring
            ;;
        "ha")
            deploy_ha_config
            ;;
        "sync")
            deploy_sync_service
            ;;
        "remote")
            setup_remote_docker
            ;;
        "test")
            run_tests
            ;;
        "urls")
            display_service_urls
            ;;
        "cleanup")
            cleanup
            ;;
        "help")
            echo "Usage: $0 [command]"
            echo "Commands:"
            echo "  setup     - Full setup (default)"
            echo "  monitoring - Deploy monitoring stack only"
            echo "  ha        - Deploy HA configuration only"
            echo "  sync      - Deploy sync service only"
            echo "  remote    - Setup remote Docker environment only"
            echo "  test      - Run deployment tests only"
            echo "  urls      - Display service URLs"
            echo "  cleanup   - Remove all resources"
            echo "  help      - Show this help"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"