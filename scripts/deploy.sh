#!/bin/bash

# RemoteHive Deployment Script
# This script deploys the RemoteHive application directly to VPC without Docker/Kubernetes

set -e  # Exit on any error

# Configuration
APP_DIR="/home/ubuntu/RemoteHive"
BACKUP_DIR="/home/ubuntu/backups"
LOG_FILE="/var/log/remotehive-deploy.log"
GIT_REPO="https://github.com/YOUR_USERNAME/RemoteHive.git"
BRANCH="${1:-main}"
ENVIRONMENT="${2:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Pre-deployment checks
log "Starting RemoteHive deployment..."
log "Branch: $BRANCH"
log "Environment: $ENVIRONMENT"

# Create necessary directories
sudo mkdir -p "$BACKUP_DIR"
sudo mkdir -p "$(dirname "$LOG_FILE")"
sudo chown ubuntu:ubuntu "$BACKUP_DIR"
sudo touch "$LOG_FILE"
sudo chown ubuntu:ubuntu "$LOG_FILE"

# Function to check service status
check_service() {
    local service_name=$1
    if systemctl is-active --quiet "$service_name"; then
        success "$service_name is running"
        return 0
    else
        warning "$service_name is not running"
        return 1
    fi
}

# Function to backup current deployment
backup_deployment() {
    if [ -d "$APP_DIR" ]; then
        local backup_name="remotehive_backup_$(date +%Y%m%d_%H%M%S)"
        log "Creating backup: $backup_name"
        sudo cp -r "$APP_DIR" "$BACKUP_DIR/$backup_name"
        success "Backup created successfully"
    else
        warning "No existing deployment found to backup"
    fi
}

# Function to stop services
stop_services() {
    log "Stopping RemoteHive services..."
    
    # Stop systemd services
    sudo systemctl stop remotehive-backend || warning "Failed to stop backend service"
    sudo systemctl stop remotehive-autoscraper || warning "Failed to stop autoscraper service"
    
    # Stop PM2 processes
    pm2 stop all || warning "Failed to stop PM2 processes"
    
    success "Services stopped"
}

# Function to start services
start_services() {
    log "Starting RemoteHive services..."
    
    # Start systemd services
    sudo systemctl start remotehive-backend
    sudo systemctl enable remotehive-backend
    
    sudo systemctl start remotehive-autoscraper
    sudo systemctl enable remotehive-autoscraper
    
    # Start PM2 processes
    cd "$APP_DIR"
    pm2 start ecosystem.config.js --env "$ENVIRONMENT"
    pm2 save
    
    success "Services started"
}

# Function to deploy code
deploy_code() {
    log "Deploying code from branch: $BRANCH"
    
    if [ -d "$APP_DIR" ]; then
        cd "$APP_DIR"
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
    else
        log "Cloning repository..."
        git clone "$GIT_REPO" "$APP_DIR"
        cd "$APP_DIR"
        git checkout "$BRANCH"
    fi
    
    success "Code deployed successfully"
}

# Function to install dependencies
install_dependencies() {
    log "Installing Python dependencies..."
    cd "$APP_DIR"
    
    # Install Python dependencies
    python3 -m pip install --user -r requirements.txt
    
    # Install Node.js dependencies for admin panel
    if [ -d "remotehive-admin" ]; then
        log "Installing admin panel dependencies..."
        cd remotehive-admin
        npm ci --production
        npm run build
        cd ..
    fi
    
    # Install Node.js dependencies for public website
    if [ -d "remotehive-public" ]; then
        log "Installing public website dependencies..."
        cd remotehive-public
        npm ci --production
        npm run build
        cd ..
    fi
    
    success "Dependencies installed successfully"
}

# Function to update configuration
update_configuration() {
    log "Updating configuration for environment: $ENVIRONMENT"
    
    cd "$APP_DIR"
    
    # Create environment file
    cat > .env << EOF
MONGODB_URL=${MONGODB_URL}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
REDIS_URL=redis://localhost:6379
ENVIRONMENT=${ENVIRONMENT}
DEBUG=false
CORS_ORIGINS=${CORS_ORIGINS}
SMTP_SERVER=${SMTP_SERVER}
SMTP_PORT=${SMTP_PORT}
SMTP_USERNAME=${SMTP_USERNAME}
SMTP_PASSWORD=${SMTP_PASSWORD}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
EOF
    
    success "Configuration updated"
}

# Function to run health checks
health_check() {
    log "Running health checks..."
    
    sleep 10  # Wait for services to start
    
    # Check backend health
    if curl -f -s http://localhost:8000/health > /dev/null; then
        success "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Check autoscraper health
    if curl -f -s http://localhost:8001/health > /dev/null; then
        success "Autoscraper health check passed"
    else
        error "Autoscraper health check failed"
    fi
    
    # Check service status
    check_service "remotehive-backend"
    check_service "remotehive-autoscraper"
    
    success "All health checks passed"
}

# Function to cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups (keeping last 5)..."
    
    cd "$BACKUP_DIR"
    ls -t remotehive_backup_* 2>/dev/null | tail -n +6 | xargs -r rm -rf
    
    success "Backup cleanup completed"
}

# Main deployment process
main() {
    log "=== RemoteHive Deployment Started ==="
    
    # Pre-deployment backup
    backup_deployment
    
    # Stop services
    stop_services
    
    # Deploy code
    deploy_code
    
    # Install dependencies
    install_dependencies
    
    # Update configuration
    update_configuration
    
    # Start services
    start_services
    
    # Health checks
    health_check
    
    # Cleanup
    cleanup_backups
    
    success "=== RemoteHive Deployment Completed Successfully ==="
    log "Deployment log saved to: $LOG_FILE"
}

# Rollback function
rollback() {
    log "=== Starting Rollback Process ==="
    
    # Find the most recent backup
    local latest_backup=$(ls -t "$BACKUP_DIR"/remotehive_backup_* 2>/dev/null | head -1)
    
    if [ -z "$latest_backup" ]; then
        error "No backup found for rollback"
    fi
    
    log "Rolling back to: $(basename "$latest_backup")"
    
    # Stop services
    stop_services
    
    # Backup current failed deployment
    if [ -d "$APP_DIR" ]; then
        sudo mv "$APP_DIR" "$APP_DIR"_failed_$(date +%Y%m%d_%H%M%S)
    fi
    
    # Restore from backup
    sudo cp -r "$latest_backup" "$APP_DIR"
    sudo chown -R ubuntu:ubuntu "$APP_DIR"
    
    # Start services
    cd "$APP_DIR"
    start_services
    
    # Health checks
    health_check
    
    success "=== Rollback Completed Successfully ==="
}

# Script usage
usage() {
    echo "Usage: $0 [branch] [environment] [action]"
    echo "  branch: Git branch to deploy (default: main)"
    echo "  environment: Deployment environment (default: production)"
    echo "  action: deploy (default) or rollback"
    echo ""
    echo "Examples:"
    echo "  $0                          # Deploy main branch to production"
    echo "  $0 develop staging          # Deploy develop branch to staging"
    echo "  $0 main production rollback # Rollback production deployment"
}

# Parse command line arguments
ACTION="${3:-deploy}"

case "$ACTION" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "help")
        usage
        ;;
    *)
        error "Invalid action: $ACTION. Use 'deploy', 'rollback', or 'help'"
        ;;
esac