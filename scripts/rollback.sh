#!/bin/bash

# RemoteHive Rollback Script
# This script handles emergency rollback of RemoteHive deployment

set -e  # Exit on any error

# Configuration
APP_NAME="remotehive"
APP_DIR="/opt/remotehive"
BACKUP_DIR="/opt/remotehive-backups"
LOG_FILE="/var/log/remotehive-rollback.log"
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
    log_error "Rollback failed. Check logs at $LOG_FILE"
    exit 1
}

# Show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
  -b, --backup BACKUP_ID    Rollback to specific backup (e.g., backup-20231201-143022)
  -l, --list               List available backups
  -f, --force              Force rollback without confirmation
  -h, --help               Show this help message

Examples:
  $0 --list                          # List available backups
  $0 --backup backup-20231201-143022 # Rollback to specific backup
  $0 --force                         # Rollback to latest backup without confirmation

EOF
}

# Parse command line arguments
parse_arguments() {
    BACKUP_ID=""
    LIST_BACKUPS=false
    FORCE_ROLLBACK=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -b|--backup)
                BACKUP_ID="$2"
                shift 2
                ;;
            -l|--list)
                LIST_BACKUPS=true
                shift
                ;;
            -f|--force)
                FORCE_ROLLBACK=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error_exit "This script must be run as root or with sudo"
    fi
}

# List available backups
list_backups() {
    log_info "Available backups:"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_warning "No backup directory found at $BACKUP_DIR"
        return 1
    fi
    
    local backups=()
    while IFS= read -r -d '' backup; do
        backups+=("$(basename "$backup")")
    done < <(find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup-*" -print0 | sort -z)
    
    if [[ ${#backups[@]} -eq 0 ]]; then
        log_warning "No backups found in $BACKUP_DIR"
        return 1
    fi
    
    echo
    printf "%-25s %-20s %-15s\n" "Backup ID" "Date" "Size"
    printf "%-25s %-20s %-15s\n" "-------------------------" "--------------------" "---------------"
    
    for backup in "${backups[@]}"; do
        local backup_path="$BACKUP_DIR/$backup"
        local backup_date=$(echo "$backup" | sed 's/backup-//; s/-/ /')
        local backup_size=$(du -sh "$backup_path" 2>/dev/null | cut -f1 || echo "Unknown")
        
        printf "%-25s %-20s %-15s\n" "$backup" "$backup_date" "$backup_size"
    done
    
    echo
    log_info "Latest backup: ${backups[-1]}"
}

# Get latest backup
get_latest_backup() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        error_exit "No backup directory found at $BACKUP_DIR"
    fi
    
    local latest_backup=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup-*" | sort | tail -n 1)
    
    if [[ -z "$latest_backup" ]]; then
        error_exit "No backups found in $BACKUP_DIR"
    fi
    
    echo "$(basename "$latest_backup")"
}

# Validate backup
validate_backup() {
    local backup_id="$1"
    local backup_path="$BACKUP_DIR/$backup_id"
    
    if [[ ! -d "$backup_path" ]]; then
        error_exit "Backup not found: $backup_path"
    fi
    
    # Check if backup contains essential files
    local essential_files=("requirements.txt" "app" "autoscraper-service")
    for file in "${essential_files[@]}"; do
        if [[ ! -e "$backup_path/$file" ]]; then
            log_warning "Essential file/directory missing in backup: $file"
        fi
    done
    
    log_success "Backup validation completed: $backup_id"
}

# Confirm rollback
confirm_rollback() {
    local backup_id="$1"
    
    if [[ "$FORCE_ROLLBACK" == "true" ]]; then
        return 0
    fi
    
    echo
    log_warning "⚠️  ROLLBACK CONFIRMATION ⚠️"
    log_warning "This will rollback RemoteHive to backup: $backup_id"
    log_warning "Current deployment will be stopped and replaced."
    echo
    
    read -p "Are you sure you want to proceed? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
}

# Create emergency backup of current state
create_emergency_backup() {
    log_info "Creating emergency backup of current state..."
    
    local emergency_backup="emergency-$(date +%Y%m%d-%H%M%S)"
    local emergency_path="$BACKUP_DIR/$emergency_backup"
    
    if [[ -d "$APP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        cp -r "$APP_DIR" "$emergency_path"
        log_success "Emergency backup created: $emergency_backup"
    else
        log_warning "No current deployment found to backup"
    fi
}

# Stop services
stop_services() {
    log_info "Stopping RemoteHive services..."
    
    for service in "${SERVICES[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            log_info "Stopping $service..."
            systemctl stop "$service" || log_warning "Failed to stop $service"
        else
            log_info "Service $service is not running"
        fi
    done
    
    log_success "Services stopped"
}

# Restore from backup
restore_backup() {
    local backup_id="$1"
    local backup_path="$BACKUP_DIR/$backup_id"
    
    log_info "Restoring from backup: $backup_id"
    
    # Remove current deployment
    if [[ -d "$APP_DIR" ]]; then
        rm -rf "$APP_DIR"
    fi
    
    # Restore from backup
    cp -r "$backup_path" "$APP_DIR"
    
    # Set proper permissions
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    log_success "Backup restored successfully"
}

# Restore database (if applicable)
restore_database() {
    log_info "Checking for database backup..."
    
    local db_backup="$BACKUP_DIR/db-$(echo "$BACKUP_ID" | sed 's/backup-//')"
    
    if [[ -f "$db_backup.sql" ]]; then
        log_info "Restoring database from $db_backup.sql"
        
        # This is a placeholder - actual database restoration depends on your setup
        # For PostgreSQL: psql -d remotehive < "$db_backup.sql"
        # For MySQL: mysql remotehive < "$db_backup.sql"
        # For SQLite: cp "$db_backup.db" "$APP_DIR/database.db"
        
        log_warning "Database restoration not implemented - manual intervention may be required"
    else
        log_info "No database backup found, skipping database restoration"
    fi
}

# Start services
start_services() {
    log_info "Starting RemoteHive services..."
    
    # Reload systemd in case service files changed
    systemctl daemon-reload
    
    # Start services
    for service in "${SERVICES[@]}"; do
        if [[ -f "/etc/systemd/system/$service.service" ]]; then
            log_info "Starting $service..."
            systemctl start "$service"
            
            # Wait and check if service started successfully
            sleep 3
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
    fi
}

# Health check after rollback
health_check() {
    log_info "Performing post-rollback health checks..."
    
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
    
    local failed_checks=0
    
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
            ((failed_checks++))
        fi
    done
    
    if [[ $failed_checks -gt 0 ]]; then
        log_warning "$failed_checks service(s) failed health checks"
        return 1
    else
        log_success "All services passed health checks"
        return 0
    fi
}

# Generate rollback report
generate_rollback_report() {
    local backup_id="$1"
    local report_file="/var/log/remotehive-rollback-$(date +%Y%m%d-%H%M%S).report"
    
    log_info "Generating rollback report..."
    
    cat > "$report_file" << EOF
RemoteHive Rollback Report
==========================

Rollback Date: $(date)
Rolled Back To: $backup_id
Triggered By: ${USER:-"unknown"}
Reason: ${ROLLBACK_REASON:-"Not specified"}

Service Status After Rollback:
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
    echo "- Memory: $(free -h | awk 'NR==2{printf "%.1fG used / %.1fG total", $3/1024, $2/1024}')" >> "$report_file"
    echo "- Disk: $(df -h / | awk 'NR==2{printf "%s used / %s total (%s)", $3, $2, $5}')" >> "$report_file"
    
    log_success "Rollback report generated: $report_file"
    cat "$report_file"
}

# Main rollback function
main() {
    log_info "Starting RemoteHive rollback process..."
    
    check_permissions
    
    # Handle list backups option
    if [[ "$LIST_BACKUPS" == "true" ]]; then
        list_backups
        exit 0
    fi
    
    # Determine backup to use
    if [[ -z "$BACKUP_ID" ]]; then
        BACKUP_ID=$(get_latest_backup)
        log_info "No backup specified, using latest: $BACKUP_ID"
    fi
    
    validate_backup "$BACKUP_ID"
    confirm_rollback "$BACKUP_ID"
    
    create_emergency_backup
    stop_services
    restore_backup "$BACKUP_ID"
    restore_database
    start_services
    
    # Wait for services to stabilize
    log_info "Waiting for services to stabilize..."
    sleep 10
    
    if health_check; then
        log_success "RemoteHive rollback completed successfully!"
        log_info "Rolled back to: $BACKUP_ID"
    else
        log_error "Rollback completed but some services failed health checks"
        log_error "Manual intervention may be required"
    fi
    
    generate_rollback_report "$BACKUP_ID"
    
    log_info "Services are available at:"
    log_info "  - Backend API: http://$(hostname -I | awk '{print $1}'):8000"
    log_info "  - Autoscraper: http://$(hostname -I | awk '{print $1}'):8001"
    log_info "  - Admin Panel: http://$(hostname -I | awk '{print $1}'):3000"
    log_info "  - Public Website: http://$(hostname -I | awk '{print $1}'):5173"
}

# Parse arguments and run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_arguments "$@"
    main
fi