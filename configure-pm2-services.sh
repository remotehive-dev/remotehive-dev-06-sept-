#!/bin/bash

# =============================================================================
# RemoteHive PM2 Service Configuration Script
# =============================================================================
# This script configures PM2 to manage all RemoteHive services properly
# Usage: ./configure-pm2-services.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/home/ubuntu/RemoteHive"
LOGS_DIR="/home/ubuntu/RemoteHive/logs"
PM2_CONFIG="/home/ubuntu/RemoteHive/ecosystem.config.js"

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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Installing PM2..."
        npm install -g pm2
    else
        log_success "PM2 is installed: $(pm2 --version)"
    fi
    
    # Check if project directory exists
    if [[ ! -d "$PROJECT_ROOT" ]]; then
        log_error "Project directory $PROJECT_ROOT does not exist"
        exit 1
    fi
    
    # Create logs directory
    mkdir -p "$LOGS_DIR"
    log_success "Logs directory created: $LOGS_DIR"
}

stop_existing_services() {
    log_info "Stopping existing PM2 services..."
    
    # Stop all PM2 processes
    pm2 stop all || true
    pm2 delete all || true
    
    log_success "All existing PM2 services stopped"
}

start_services() {
    log_info "Starting RemoteHive services with PM2..."
    
    cd "$PROJECT_ROOT"
    
    # Start services using ecosystem config
    if [[ -f "$PM2_CONFIG" ]]; then
        log_info "Using ecosystem configuration: $PM2_CONFIG"
        pm2 start "$PM2_CONFIG"
    else
        log_warning "Ecosystem config not found. Starting services manually..."
        
        # Start backend API
        cd "$PROJECT_ROOT"
        pm2 start "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000" \
            --name "remotehive-backend" \
            --cwd "$PROJECT_ROOT" \
            --log "$LOGS_DIR/backend.log" \
            --error "$LOGS_DIR/backend-error.log" \
            --env-file "$PROJECT_ROOT/.env"
        
        # Start autoscraper service
        cd "$PROJECT_ROOT/autoscraper-service"
        pm2 start "python -m uvicorn app.main:app --host 0.0.0.0 --port 8001" \
            --name "remotehive-autoscraper" \
            --cwd "$PROJECT_ROOT/autoscraper-service" \
            --log "$LOGS_DIR/autoscraper.log" \
            --error "$LOGS_DIR/autoscraper-error.log"
        
        # Start admin panel
        cd "$PROJECT_ROOT/remotehive-admin"
        pm2 start "npm run start" \
            --name "remotehive-admin" \
            --cwd "$PROJECT_ROOT/remotehive-admin" \
            --log "$LOGS_DIR/admin.log" \
            --error "$LOGS_DIR/admin-error.log"
        
        # Start public website
        cd "$PROJECT_ROOT/remotehive-public"
        pm2 start "npm run preview -- --host 0.0.0.0 --port 5173" \
            --name "remotehive-public" \
            --cwd "$PROJECT_ROOT/remotehive-public" \
            --log "$LOGS_DIR/public.log" \
            --error "$LOGS_DIR/public-error.log"
    fi
    
    log_success "All services started with PM2"
}

configure_pm2_startup() {
    log_info "Configuring PM2 startup..."
    
    # Generate startup script
    pm2 startup
    
    # Save current process list
    pm2 save
    
    log_success "PM2 startup configured"
}

verify_services() {
    log_info "Verifying services..."
    
    # Wait for services to start
    sleep 10
    
    # Check PM2 status
    pm2 list
    
    # Check if services are responding
    local all_healthy=true
    
    # Test backend
    if curl -s --connect-timeout 5 http://localhost:8000/health > /dev/null; then
        log_success "✅ Backend API is responding"
    else
        log_error "❌ Backend API is not responding"
        all_healthy=false
    fi
    
    # Test autoscraper
    if curl -s --connect-timeout 5 http://localhost:8001/health > /dev/null; then
        log_success "✅ Autoscraper service is responding"
    else
        log_error "❌ Autoscraper service is not responding"
        all_healthy=false
    fi
    
    # Test admin panel
    if curl -s --connect-timeout 5 http://localhost:3000 > /dev/null; then
        log_success "✅ Admin panel is responding"
    else
        log_error "❌ Admin panel is not responding"
        all_healthy=false
    fi
    
    # Test public website
    if curl -s --connect-timeout 5 http://localhost:5173 > /dev/null; then
        log_success "✅ Public website is responding"
    else
        log_error "❌ Public website is not responding"
        all_healthy=false
    fi
    
    if [[ "$all_healthy" == "true" ]]; then
        log_success "🎉 All services are healthy and responding!"
    else
        log_warning "⚠️  Some services may need attention. Check logs with: pm2 logs"
    fi
}

show_service_info() {
    log_info "Service Information:"
    echo ""
    echo "PM2 Process List:"
    pm2 list
    echo ""
    echo "Service URLs:"
    echo "  • Backend API: http://localhost:8000"
    echo "  • Autoscraper: http://localhost:8001"
    echo "  • Admin Panel: http://localhost:3000"
    echo "  • Public Website: http://localhost:5173"
    echo ""
    echo "Useful PM2 Commands:"
    echo "  • View logs: pm2 logs"
    echo "  • Restart all: pm2 restart all"
    echo "  • Stop all: pm2 stop all"
    echo "  • Monitor: pm2 monit"
    echo "  • Save config: pm2 save"
    echo ""
    echo "Log files location: $LOGS_DIR"
}

# Main execution
main() {
    log_info "Configuring PM2 services for RemoteHive..."
    echo ""
    
    check_prerequisites
    stop_existing_services
    start_services
    configure_pm2_startup
    verify_services
    show_service_info
    
    log_success "PM2 configuration completed!"
}

# Run main function
main "$@"