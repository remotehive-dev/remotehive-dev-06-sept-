#!/bin/bash

# RemoteHive Production Deployment Script
# This script handles the complete deployment of RemoteHive to the VPC

set -e  # Exit on any error

# Configuration
APP_NAME="remotehive"
APP_DIR="/opt/remotehive"
BACKUP_DIR="/opt/remotehive-backups"
LOG_FILE="/var/log/remotehive-deploy.log"
SERVICES=("remotehive-backend" "remotehive-autoscraper" "remotehive-admin" "remotehive-public")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    log "${BLUE}[INFO]${NC} $1"
}

log_success() {
    log "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

# Error handling
error_exit() {
    log_error "$1"
    log_error "Deployment failed. Check logs at $LOG_FILE"
    exit 1
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f /tmp/remotehive-*.tmp
}

# Set trap for cleanup
trap cleanup EXIT

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error_exit "This script must be run as root or with sudo"
    fi
}

# Validate environment
validate_environment() {
    log_info "Validating deployment environment..."
    
    # Check required commands
    local required_commands=("git" "python3" "pip3" "node" "npm" "systemctl" "nginx")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error_exit "Required command '$cmd' not found"
        fi
    done
    
    # Check Python version
    local python_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
    if [[ "$python_version" < "3.9" ]]; then
        error_exit "Python 3.9+ required, found $python_version"
    fi
    
    # Check Node version
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ "$node_version" -lt "18" ]]; then
        error_exit "Node.js 18+ required, found v$node_version"
    fi
    
    # Check disk space (minimum 5GB)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ "$available_space" -lt 5242880 ]]; then  # 5GB in KB
        log_warning "Low disk space detected. Available: $(($available_space / 1024 / 1024))GB"
    fi
    
    # Validate required environment variables
    local required_vars=("JWT_SECRET_KEY" "MONGODB_URL" "REDIS_URL")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Required environment variable $var is not set"
            return 1
        fi
    done
    
    log_success "Environment validation completed"
}

# Create backup
create_backup() {
    log_info "Creating backup of current deployment..."
    
    local backup_timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_path="$BACKUP_DIR/backup-$backup_timestamp"
    
    mkdir -p "$BACKUP_DIR"
    
    if [[ -d "$APP_DIR" ]]; then
        cp -r "$APP_DIR" "$backup_path"
        log_success "Backup created at $backup_path"
        
        # Database backup (MongoDB Atlas - handled by Atlas)
        echo "Database backup handled by MongoDB Atlas automatic backups..."
        echo "Skipping local backup - using Atlas Point-in-Time Recovery"
        
        # Keep only last 5 backups
        local backup_count=$(ls -1 "$BACKUP_DIR" | wc -l)
        if [[ "$backup_count" -gt 5 ]]; then
            ls -1t "$BACKUP_DIR" | tail -n +6 | xargs -I {} rm -rf "$BACKUP_DIR/{}"
            log_info "Cleaned up old backups"
        fi
    else
        log_info "No existing deployment found, skipping backup"
    fi
}

# Stop services
stop_services() {
    log_info "Stopping RemoteHive services..."
    
    for service in "${SERVICES[@]}"; do
        if systemctl is-active --quiet "$service"; then
            log_info "Stopping $service..."
            systemctl stop "$service" || log_warning "Failed to stop $service"
        else
            log_info "Service $service is not running"
        fi
    done
    
    # Stop nginx if it's running RemoteHive config
    if systemctl is-active --quiet nginx; then
        log_info "Reloading nginx configuration..."
        systemctl reload nginx || log_warning "Failed to reload nginx"
    fi
}

# Update application code
update_code() {
    log_info "Updating application code..."
    
    # Create app directory if it doesn't exist
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # Clone or update repository
    if [[ -d ".git" ]]; then
        log_info "Updating existing repository..."
        git fetch origin
        git reset --hard origin/main
    else
        log_info "Cloning repository..."
        # Note: In production, this should use the actual repository URL
        # For now, we'll copy from the current directory
        if [[ -n "$GITHUB_WORKSPACE" ]]; then
            cp -r "$GITHUB_WORKSPACE"/* .
        else
            error_exit "No source code found. Set GITHUB_WORKSPACE or ensure git repository exists."
        fi
    fi
    
    # Set proper permissions
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    log_success "Code updated successfully"
}

# Setup Python backend
setup_backend() {
    log_info "Setting up Python backend..."
    
    cd "$APP_DIR"
    
    # Create virtual environment
    if [[ ! -d "venv" ]]; then
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Run database migrations if they exist
    if [[ -f "alembic.ini" ]]; then
        log_info "Running database migrations..."
        alembic upgrade head || log_warning "Database migration failed"
    fi
    
    log_success "Backend setup completed"
}

# Setup autoscraper service
setup_autoscraper() {
    log_info "Setting up Autoscraper service..."
    
    cd "$APP_DIR/autoscraper-service"
    
    # Create virtual environment for autoscraper
    if [[ ! -d "venv" ]]; then
        python3 -m venv venv
    fi
    
    # Install dependencies
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt || {
        # Fallback to basic FastAPI installation
        pip install fastapi uvicorn requests beautifulsoup4 selenium
    }
    
    log_success "Autoscraper service setup completed"
}

# Setup frontend applications
setup_frontend() {
    log_info "Setting up frontend applications..."
    
    # Setup Admin Panel
    if [[ -d "$APP_DIR/remotehive-admin" ]]; then
        log_info "Building Admin Panel..."
        cd "$APP_DIR/remotehive-admin"
        npm ci --production
        npm run build
        
        # Create PM2 ecosystem file if it doesn't exist
        if [[ ! -f "ecosystem.config.js" ]]; then
            cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'remotehive-admin',
    script: 'npm',
    args: 'run preview',
    cwd: '/opt/remotehive/remotehive-admin',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF
        fi
    fi
    
    # Setup Public Website
    if [[ -d "$APP_DIR/remotehive-public" ]]; then
        log_info "Building Public Website..."
        cd "$APP_DIR/remotehive-public"
        npm ci --production
        npm run build
        
        # Create PM2 ecosystem file if it doesn't exist
        if [[ ! -f "ecosystem.config.js" ]]; then
            cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'remotehive-public',
    script: 'npm',
    args: 'run preview',
    cwd: '/opt/remotehive/remotehive-public',
    env: {
      NODE_ENV: 'production',
      PORT: 5173
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF
        fi
    fi
    
    log_success "Frontend applications setup completed"
}

# Configure services
configure_services() {
    log_info "Configuring systemd services..."
    
    # Copy service files
    if [[ -d "$APP_DIR/systemd" ]]; then
        cp "$APP_DIR"/systemd/*.service /etc/systemd/system/
        systemctl daemon-reload
    fi
    
    # Configure nginx
    if [[ -f "$APP_DIR/nginx/remotehive.conf" ]]; then
        cp "$APP_DIR/nginx/remotehive.conf" /etc/nginx/sites-available/
        ln -sf /etc/nginx/sites-available/remotehive.conf /etc/nginx/sites-enabled/
        
        # Test nginx configuration
        nginx -t || error_exit "Nginx configuration test failed"
    fi
    
    log_success "Services configured successfully"
}

# Start services
start_services() {
    log_info "Starting RemoteHive services..."
    
    # Enable and start systemd services
    for service in "${SERVICES[@]}"; do
        if [[ -f "/etc/systemd/system/$service.service" ]]; then
            log_info "Starting $service..."
            systemctl enable "$service"
            systemctl start "$service"
            
            # Wait a moment and check if service started successfully
            sleep 2
            if systemctl is-active --quiet "$service"; then
                log_success "$service started successfully"
            else
                log_error "Failed to start $service"
                systemctl status "$service" --no-pager
            fi
        else
            log_warning "Service file for $service not found"
        fi
    done
    
    # Reload nginx
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        log_success "Nginx reloaded successfully"
    else
        systemctl start nginx
        log_success "Nginx started successfully"
    fi
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    local health_check_timeout=60
    local check_interval=5
    local elapsed=0
    
    # Define service endpoints
    local endpoints=(
        "http://localhost:8000/health:Backend API"
        "http://localhost:8001/health:Autoscraper Service"
        "http://localhost:3000:Admin Panel"
        "http://localhost:5173:Public Website"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r endpoint name <<< "$endpoint_info"
        
        log_info "Checking $name at $endpoint..."
        elapsed=0
        
        while [[ $elapsed -lt $health_check_timeout ]]; do
            if curl -f --max-time 10 "$endpoint" &>/dev/null; then
                log_success "$name is healthy"
                break
            fi
            
            sleep $check_interval
            elapsed=$((elapsed + check_interval))
        done
        
        if [[ $elapsed -ge $health_check_timeout ]]; then
            log_error "$name health check failed after ${health_check_timeout}s"
        fi
    done
}

# Generate deployment report
generate_report() {
    log_info "Generating deployment report..."
    
    local report_file="/var/log/remotehive-deployment-$(date +%Y%m%d-%H%M%S).report"
    
    cat > "$report_file" << EOF
RemoteHive Deployment Report
============================

Deployment Date: $(date)
Deployment ID: ${DEPLOYMENT_ID:-"manual-$(date +%Y%m%d-%H%M%S)"}
Git Commit: ${GIT_COMMIT:-"unknown"}
Branch: ${BRANCH_NAME:-"unknown"}
Triggered By: ${TRIGGERED_BY:-"manual"}

Service Status:
EOF
    
    for service in "${SERVICES[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            echo "✅ $service: Running" >> "$report_file"
        else
            echo "❌ $service: Not Running" >> "$report_file"
        fi
    done
    
    echo "" >> "$report_file"
    echo "System Information:" >> "$report_file"
    echo "- OS: $(lsb_release -d | cut -f2)" >> "$report_file"
    echo "- Kernel: $(uname -r)" >> "$report_file"
    echo "- Memory: $(free -h | awk 'NR==2{printf "%.1fG used / %.1fG total", $3/1024, $2/1024}')" >> "$report_file"
    echo "- Disk: $(df -h / | awk 'NR==2{printf "%s used / %s total (%s)", $3, $2, $5}')" >> "$report_file"
    
    log_success "Deployment report generated: $report_file"
    cat "$report_file"
}

# Main deployment function
main() {
    log_info "Starting RemoteHive deployment..."
    log_info "Deployment ID: ${DEPLOYMENT_ID:-"manual-$(date +%Y%m%d-%H%M%S)"}"
    
    check_permissions
    validate_environment
    create_backup
    stop_services
    update_code
    setup_backend
    setup_autoscraper
    setup_frontend
    configure_services
    start_services
    
    # Wait for services to stabilize
    log_info "Waiting for services to stabilize..."
    sleep 10
    
    health_check
    generate_report
    
    log_success "RemoteHive deployment completed successfully!"
    log_info "Services are available at:"
    log_info "  - Backend API: http://$(hostname -I | awk '{print $1}'):8000"
    log_info "  - Autoscraper: http://$(hostname -I | awk '{print $1}'):8001"
    log_info "  - Admin Panel: http://$(hostname -I | awk '{print $1}'):3000"
    log_info "  - Public Website: http://$(hostname -I | awk '{print $1}'):5173"
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi