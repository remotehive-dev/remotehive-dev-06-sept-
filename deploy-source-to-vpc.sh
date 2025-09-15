#!/bin/bash

# =============================================================================
# RemoteHive Source-Based VPC Deployment Script
# =============================================================================
# This script automates the source-based deployment of RemoteHive to a VPC instance
# Usage: ./deploy-source-to-vpc.sh [environment] [--force]
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
DEPLOYMENT_DIR="RemoteHive"
DEFAULT_ENVIRONMENT="production"
FORCE_DEPLOY=false
VPC_HOST="210.79.129.9"
VPC_USER="ubuntu"

# Parse command line arguments
ENVIRONMENT="${1:-$DEFAULT_ENVIRONMENT}"
shift || true

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [environment] [--force]"
            echo "  environment: production (default), staging, development"
            echo "  --force: Skip confirmation prompts"
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
    
    # Check SSH connectivity
    log_info "Testing SSH connectivity to $VPC_HOST..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$VPC_USER@$VPC_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
        log_error "Cannot connect to VPC via SSH"
        log_info "Please ensure:"
        echo "  1. VPC instance is running"
        echo "  2. SSH key is properly configured"
        echo "  3. Security groups allow SSH access"
        exit 1
    fi
    
    log_success "Requirements check passed"
}

setup_vpc_dependencies() {
    log_info "Setting up VPC dependencies..."
    
    ssh -o StrictHostKeyChecking=no "$VPC_USER@$VPC_HOST" << 'EOF'
        # Update system
        sudo apt-get update
        
        # Install Python 3.11 and pip
        if ! command -v python3.11 &> /dev/null; then
            echo "Installing Python 3.11..."
            sudo apt-get install -y software-properties-common
            sudo add-apt-repository -y ppa:deadsnakes/ppa
            sudo apt-get update
            sudo apt-get install -y python3.11 python3.11-pip python3.11-venv python3.11-dev
        fi
        
        # Install Node.js 20
        if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
            echo "Installing Node.js 20..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        # Install MongoDB
        if ! command -v mongod &> /dev/null; then
            echo "Installing MongoDB..."
            wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
            echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
            sudo apt-get update
            sudo apt-get install -y mongodb-org
            sudo systemctl enable mongod
            sudo systemctl start mongod
        fi
        
        # Install Redis
        if ! command -v redis-server &> /dev/null; then
            echo "Installing Redis..."
            sudo apt-get install -y redis-server
            sudo systemctl enable redis-server
            sudo systemctl start redis-server
        fi
        
        # Install PM2 globally
        if ! command -v pm2 &> /dev/null; then
            echo "Installing PM2..."
            sudo npm install -g pm2
        fi
        
        # Install Nginx
        if ! command -v nginx &> /dev/null; then
            echo "Installing Nginx..."
            sudo apt-get install -y nginx
            sudo systemctl enable nginx
        fi
        
        # Install other dependencies
        sudo apt-get install -y git curl wget build-essential
        
        echo "VPC dependencies setup completed"
EOF
    
    log_success "VPC dependencies setup completed"
}

deploy_source_code() {
    log_info "Deploying source code..."
    
    ssh -o StrictHostKeyChecking=no "$VPC_USER@$VPC_HOST" << 'EOF'
        # Clone or update repository
        if [ -d "/home/ubuntu/RemoteHive" ]; then
            cd /home/ubuntu/RemoteHive
            git fetch origin
            git reset --hard origin/main
            git clean -fd
        else
            git clone https://github.com/remotehive-dev/RemoteHive.git /home/ubuntu/RemoteHive
            cd /home/ubuntu/RemoteHive
        fi
        
        # Set proper ownership
        sudo chown -R ubuntu:ubuntu /home/ubuntu/RemoteHive
        
        # Install Python dependencies
        echo "Installing Python dependencies..."
        python3.11 -m pip install --user -r requirements.txt
        
        # Install Node.js dependencies for admin panel
        echo "Building Admin Panel..."
        cd /home/ubuntu/RemoteHive/remotehive-admin
        npm ci
        npm run build
        
        # Install Node.js dependencies for public website
        echo "Building Public Website..."
        cd /home/ubuntu/RemoteHive/remotehive-public
        npm ci
        npm run build
        
        # Return to project root
        cd /home/ubuntu/RemoteHive
        
        echo "Source code deployment completed"
EOF
    
    log_success "Source code deployment completed"
}

setup_environment_config() {
    log_info "Setting up environment configuration..."
    
    ssh -o StrictHostKeyChecking=no "$VPC_USER@$VPC_HOST" << 'EOF'
        cd /home/ubuntu/RemoteHive
        
        # Create .env file if it doesn't exist
        if [[ ! -f .env ]]; then
            # Generate secure passwords
            MONGO_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
            REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
            JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
            
            # Create .env file
            cat > .env << EOL
# Environment
ENVIRONMENT=production
DEBUG=false

# Database
MONGODB_URL=mongodb://localhost:27017/remotehive
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Admin Credentials
ADMIN_EMAIL=admin@remotehive.in
ADMIN_PASSWORD=Ranjeet11\$

# API URLs
BACKEND_API_URL=http://localhost:8000
AUTOSCRAPER_API_URL=http://localhost:8001
ADMIN_PANEL_URL=http://localhost:3000
PUBLIC_WEBSITE_URL=http://localhost:5173

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://210.79.129.9:3000,http://210.79.129.9:5173

# Logging
LOG_LEVEL=INFO
EOL
            
            echo "Environment configuration created with secure passwords"
        else
            echo "Environment configuration already exists"
        fi
EOF
    
    log_success "Environment configuration setup completed"
}

setup_services() {
    log_info "Setting up services..."
    
    ssh -o StrictHostKeyChecking=no "$VPC_USER@$VPC_HOST" << 'EOF'
        cd /home/ubuntu/RemoteHive
        
        # Create logs directory
        mkdir -p /home/ubuntu/RemoteHive/logs
        mkdir -p /home/ubuntu/RemoteHive/autoscraper-service/logs
        mkdir -p /home/ubuntu/RemoteHive/autoscraper-service/data
        
        # Stop existing services
        echo "Stopping existing services..."
        sudo systemctl stop remotehive-backend remotehive-autoscraper || true
        pm2 delete all || true
        
        # Configure systemd services
        echo "Configuring systemd services..."
        sudo cp config/systemd/*.service /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable remotehive-backend remotehive-autoscraper
        
        # Start systemd services
        echo "Starting backend services..."
        sudo systemctl start remotehive-backend
        sudo systemctl start remotehive-autoscraper
        
        # Configure PM2 for frontend services
        echo "Configuring PM2..."
        pm2 start config/pm2/ecosystem.config.js --env production
        pm2 save
        pm2 startup | sudo bash || true
        
        # Setup Nginx configuration
        echo "Setting up Nginx configuration..."
        if [ -f "config/nginx/remotehive.conf" ]; then
            sudo cp config/nginx/remotehive.conf /etc/nginx/sites-available/
            sudo ln -sf /etc/nginx/sites-available/remotehive.conf /etc/nginx/sites-enabled/
            sudo nginx -t && sudo systemctl reload nginx
        fi
        
        echo "Services setup completed"
EOF
    
    log_success "Services setup completed"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    ssh -o StrictHostKeyChecking=no "$VPC_USER@$VPC_HOST" << 'EOF'
        echo "Waiting for services to start..."
        sleep 30
        
        echo "Testing service endpoints..."
        
        # Check systemd services
        if sudo systemctl is-active --quiet remotehive-backend; then
            echo "✅ Backend systemd service is running"
        else
            echo "❌ Backend systemd service failed"
            sudo journalctl -u remotehive-backend --no-pager -n 10
        fi
        
        if sudo systemctl is-active --quiet remotehive-autoscraper; then
            echo "✅ Autoscraper systemd service is running"
        else
            echo "❌ Autoscraper systemd service failed"
            sudo journalctl -u remotehive-autoscraper --no-pager -n 10
        fi
        
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
        
        # Check PM2 processes
        echo "PM2 Process Status:"
        pm2 list
        
        # Test frontend services
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Admin panel is accessible"
        else
            echo "❌ Admin panel is not accessible"
        fi
        
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
    echo "  Deployment Type: Source-based (No Docker)"
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
    echo "  3. Check logs: ssh $VPC_USER@$VPC_HOST 'sudo journalctl -u remotehive-backend -f'"
    echo "  4. Check PM2 logs: ssh $VPC_USER@$VPC_HOST 'pm2 logs'"
}

# Main execution
main() {
    log_info "Starting RemoteHive source-based VPC deployment..."
    log_info "Environment: $ENVIRONMENT"
    
    # Confirmation prompt
    if [[ "$FORCE_DEPLOY" != "true" ]]; then
        echo ""
        echo "This will deploy RemoteHive from source to:"
        echo "  Host: $VPC_HOST"
        echo "  User: $VPC_USER"
        echo "  Environment: $ENVIRONMENT"
        echo "  Method: Source-based (No Docker)"
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
    setup_vpc_dependencies
    deploy_source_code
    setup_environment_config
    setup_services
    verify_deployment
    show_deployment_info
    
    log_success "RemoteHive source-based deployment completed successfully! 🚀"
}

# Run main function
main "$@"