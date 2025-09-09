#!/bin/bash

# =============================================================================
# RemoteHive VPC Deployment Script
# =============================================================================
# This script automates the deployment of RemoteHive to a VPC instance
# Usage: ./deploy-to-vpc.sh [environment] [--force] [--k8s]
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="remotehive-deployment"
DEFAULT_ENVIRONMENT="production"
USE_KUBERNETES=false
FORCE_DEPLOY=false

# Parse command line arguments
ENVIRONMENT="${1:-$DEFAULT_ENVIRONMENT}"
shift || true

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --k8s|--kubernetes)
            USE_KUBERNETES=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [environment] [--force] [--k8s]"
            echo "  environment: production (default), staging, development"
            echo "  --force: Skip confirmation prompts"
            echo "  --k8s: Deploy to Kubernetes instead of Docker Compose"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check if required environment variables are set
    if [[ -z "$VPC_HOST" ]]; then
        log_error "VPC_HOST environment variable is not set"
        echo "Please set: export VPC_HOST=your-vpc-ip-or-hostname"
        exit 1
    fi
    
    if [[ -z "$VPC_USER" ]]; then
        log_error "VPC_USER environment variable is not set"
        echo "Please set: export VPC_USER=your-vpc-username"
        exit 1
    fi
    
    # Check if SSH key exists
    if [[ ! -f ~/.ssh/id_rsa ]] && [[ -z "$VPC_SSH_KEY_PATH" ]]; then
        log_error "SSH key not found. Please ensure ~/.ssh/id_rsa exists or set VPC_SSH_KEY_PATH"
        exit 1
    fi
    
    # Check SSH connectivity
    log_info "Testing SSH connectivity to $VPC_HOST..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$VPC_USER@$VPC_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
        log_error "Cannot connect to VPC via SSH"
        log_info "Please ensure:"
        echo "  1. VPC instance is running"
        echo "  2. SSH key is properly configured"
        echo "  3. Security groups allow SSH access"
        exit 1
    fi
    
    log_success "Requirements check passed"
}

setup_vpc_environment() {
    log_info "Setting up VPC environment..."
    
    # Install Docker and Docker Compose if not present
    ssh "$VPC_USER@$VPC_HOST" << 'EOF'
        # Update system
        sudo apt-get update
        
        # Install Docker if not present
        if ! command -v docker &> /dev/null; then
            echo "Installing Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
        fi
        
        # Install Docker Compose if not present
        if ! command -v docker-compose &> /dev/null; then
            echo "Installing Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        # Create deployment directory
        mkdir -p ~/remotehive-deployment
        
        echo "VPC environment setup completed"
EOF
    
    log_success "VPC environment setup completed"
}

setup_kubernetes() {
    if [[ "$USE_KUBERNETES" == "true" ]]; then
        log_info "Setting up Kubernetes environment..."
        
        ssh "$VPC_USER@$VPC_HOST" << 'EOF'
            # Install kubectl if not present
            if ! command -v kubectl &> /dev/null; then
                echo "Installing kubectl..."
                curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
                chmod +x kubectl
                sudo mv kubectl /usr/local/bin/
            fi
            
            # Install k3s if not present (lightweight Kubernetes)
            if ! command -v k3s &> /dev/null; then
                echo "Installing k3s..."
                curl -sfL https://get.k3s.io | sh -
                sudo chmod 644 /etc/rancher/k3s/k3s.yaml
                export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
                echo 'export KUBECONFIG=/etc/rancher/k3s/k3s.yaml' >> ~/.bashrc
            fi
            
            echo "Kubernetes environment setup completed"
EOF
        
        log_success "Kubernetes environment setup completed"
    fi
}

copy_deployment_files() {
    log_info "Copying deployment files to VPC..."
    
    # Copy all necessary files
    scp -r "$SCRIPT_DIR/k8s/" "$VPC_USER@$VPC_HOST:~/$DEPLOYMENT_DIR/"
    scp "$SCRIPT_DIR/docker-compose.yml" "$VPC_USER@$VPC_HOST:~/$DEPLOYMENT_DIR/"
    scp "$SCRIPT_DIR/.env.example" "$VPC_USER@$VPC_HOST:~/$DEPLOYMENT_DIR/"
    
    # Copy additional scripts if they exist
    if [[ -f "$SCRIPT_DIR/k8s/deploy.sh" ]]; then
        scp "$SCRIPT_DIR/k8s/deploy.sh" "$VPC_USER@$VPC_HOST:~/$DEPLOYMENT_DIR/"
    fi
    
    log_success "Deployment files copied successfully"
}

setup_environment_config() {
    log_info "Setting up environment configuration..."
    
    ssh "$VPC_USER@$VPC_HOST" << EOF
        cd ~/$DEPLOYMENT_DIR
        
        # Create .env file if it doesn't exist
        if [[ ! -f .env ]]; then
            cp .env.example .env
            
            # Generate secure passwords
            MONGO_PASSWORD=\$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
            REDIS_PASSWORD=\$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
            JWT_SECRET=\$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
            NEXTAUTH_SECRET=\$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
            
            # Update .env file with generated passwords
            sed -i "s/your-secure-mongo-password/\$MONGO_PASSWORD/g" .env
            sed -i "s/your-secure-redis-password/\$REDIS_PASSWORD/g" .env
            sed -i "s/your-super-secret-jwt-key-change-in-production-min-32-chars/\$JWT_SECRET/g" .env
            sed -i "s/your-nextauth-secret-change-in-production/\$NEXTAUTH_SECRET/g" .env
            
            # Update environment to production
            sed -i "s/ENVIRONMENT=production/ENVIRONMENT=$ENVIRONMENT/g" .env
            
            echo "Environment configuration created with secure passwords"
        else
            echo "Environment configuration already exists"
        fi
EOF
    
    log_success "Environment configuration setup completed"
}

deploy_with_docker_compose() {
    log_info "Deploying with Docker Compose..."
    
    ssh "$VPC_USER@$VPC_HOST" << 'EOF'
        cd ~/remotehive-deployment
        
        # Pull latest images
        echo "Pulling latest Docker images..."
        docker-compose pull
        
        # Stop existing services
        echo "Stopping existing services..."
        docker-compose down --remove-orphans
        
        # Start services
        echo "Starting services..."
        docker-compose up -d
        
        # Wait for services to be ready
        echo "Waiting for services to start..."
        sleep 30
        
        # Check service status
        echo "Checking service status..."
        docker-compose ps
        
        # Run database migrations if needed
        echo "Running database migrations..."
        docker-compose exec -T backend-api python -m alembic upgrade head || echo "Migration skipped or failed"
        
        echo "Docker Compose deployment completed"
EOF
    
    log_success "Docker Compose deployment completed"
}

deploy_with_kubernetes() {
    log_info "Deploying with Kubernetes..."
    
    ssh "$VPC_USER@$VPC_HOST" << 'EOF'
        cd ~/remotehive-deployment
        export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
        
        # Apply Kubernetes manifests in order
        echo "Applying Kubernetes manifests..."
        
        # Create namespace
        kubectl apply -f k8s/namespace.yaml
        
        # Apply persistent volumes
        kubectl apply -f k8s/persistent-volumes.yaml
        
        # Deploy databases
        kubectl apply -f k8s/mongodb.yaml
        kubectl apply -f k8s/redis.yaml
        
        # Wait for databases to be ready
        echo "Waiting for databases to be ready..."
        kubectl wait --for=condition=ready pod -l app=mongodb -n remotehive --timeout=300s
        kubectl wait --for=condition=ready pod -l app=redis -n remotehive --timeout=300s
        
        # Deploy applications
        kubectl apply -f k8s/backend-api.yaml
        kubectl apply -f k8s/autoscraper-service.yaml
        kubectl apply -f k8s/admin-panel.yaml
        kubectl apply -f k8s/public-website.yaml
        kubectl apply -f k8s/celery-workers.yaml
        
        # Apply ingress
        kubectl apply -f k8s/ingress.yaml
        
        # Wait for deployments to be ready
        echo "Waiting for deployments to be ready..."
        kubectl rollout status deployment/backend-api -n remotehive --timeout=300s
        kubectl rollout status deployment/autoscraper-service -n remotehive --timeout=300s
        kubectl rollout status deployment/admin-panel -n remotehive --timeout=300s
        kubectl rollout status deployment/public-website -n remotehive --timeout=300s
        
        # Show deployment status
        echo "Deployment status:"
        kubectl get pods -n remotehive
        kubectl get services -n remotehive
        
        echo "Kubernetes deployment completed"
EOF
    
    log_success "Kubernetes deployment completed"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    ssh "$VPC_USER@$VPC_HOST" << 'EOF'
        cd ~/remotehive-deployment
        
        echo "Testing service endpoints..."
        
        # Test backend API
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            echo "✅ Backend API is healthy"
        else
            echo "❌ Backend API health check failed"
        fi
        
        # Test autoscraper service
        if curl -f http://localhost:8001/health > /dev/null 2>&1; then
            echo "✅ Autoscraper service is healthy"
        else
            echo "❌ Autoscraper service health check failed"
        fi
        
        # Test admin panel
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Admin panel is accessible"
        else
            echo "❌ Admin panel is not accessible"
        fi
        
        # Test public website
        if curl -f http://localhost:5173 > /dev/null 2>&1; then
            echo "✅ Public website is accessible"
        else
            echo "❌ Public website is not accessible"
        fi
        
        echo "Deployment verification completed"
EOF
    
    log_success "Deployment verification completed"
}

show_deployment_info() {
    log_info "Deployment Information:"
    echo "  Environment: $ENVIRONMENT"
    echo "  VPC Host: $VPC_HOST"
    echo "  Deployment Type: $([ "$USE_KUBERNETES" == "true" ] && echo "Kubernetes" || echo "Docker Compose")"
    echo ""
    echo "Service URLs:"
    echo "  Backend API: http://$VPC_HOST:8000"
    echo "  Autoscraper Service: http://$VPC_HOST:8001"
    echo "  Admin Panel: http://$VPC_HOST:3000"
    echo "  Public Website: http://$VPC_HOST:5173"
    echo ""
    echo "To access the services:"
    echo "  1. Ensure your security groups allow access to these ports"
    echo "  2. Use the admin credentials: admin@remotehive.in / Ranjeet11\$"
    echo "  3. Check logs: ssh $VPC_USER@$VPC_HOST 'cd $DEPLOYMENT_DIR && docker-compose logs'"
}

# Main execution
main() {
    log_info "Starting RemoteHive VPC deployment..."
    log_info "Environment: $ENVIRONMENT"
    
    # Confirmation prompt
    if [[ "$FORCE_DEPLOY" != "true" ]]; then
        echo ""
        echo "This will deploy RemoteHive to:"
        echo "  Host: $VPC_HOST"
        echo "  User: $VPC_USER"
        echo "  Environment: $ENVIRONMENT"
        echo "  Method: $([ "$USE_KUBERNETES" == "true" ] && echo "Kubernetes" || echo "Docker Compose")"
        echo ""
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Execute deployment steps
    check_requirements
    setup_vpc_environment
    
    if [[ "$USE_KUBERNETES" == "true" ]]; then
        setup_kubernetes
    fi
    
    copy_deployment_files
    setup_environment_config
    
    if [[ "$USE_KUBERNETES" == "true" ]]; then
        deploy_with_kubernetes
    else
        deploy_with_docker_compose
    fi
    
    verify_deployment
    show_deployment_info
    
    log_success "RemoteHive deployment completed successfully! 🚀"
}

# Run main function
main "$@"