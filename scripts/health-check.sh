#!/bin/bash

# RemoteHive Health Check Script
# This script performs comprehensive health checks on all RemoteHive services

set -e  # Exit on any error

# Configuration
APP_NAME="remotehive"
APP_DIR="/opt/remotehive"
LOG_FILE="/var/log/remotehive-health.log"
SERVICES=("remotehive-backend" "remotehive-autoscraper" "remotehive-admin" "remotehive-public")
HEALTH_CHECK_TIMEOUT=30
CHECK_INTERVAL=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check results
HEALTH_STATUS="HEALTHY"
FAILED_CHECKS=0
WARNING_CHECKS=0

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
    ((WARNING_CHECKS++))
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
    ((FAILED_CHECKS++))
    HEALTH_STATUS="UNHEALTHY"
}

# Show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
  -v, --verbose            Show detailed output
  -q, --quiet              Suppress non-essential output
  -j, --json               Output results in JSON format
  -t, --timeout SECONDS    Set health check timeout (default: 30)
  -c, --continuous         Run continuous health monitoring
  -i, --interval SECONDS   Set check interval for continuous mode (default: 60)
  -s, --service SERVICE    Check specific service only
  -h, --help               Show this help message

Examples:
  $0                       # Run all health checks
  $0 --verbose             # Run with detailed output
  $0 --json                # Output in JSON format
  $0 --service backend     # Check only backend service
  $0 --continuous          # Run continuous monitoring

EOF
}

# Parse command line arguments
parse_arguments() {
    VERBOSE=false
    QUIET=false
    JSON_OUTPUT=false
    CONTINUOUS=false
    CHECK_INTERVAL_CONTINUOUS=60
    SPECIFIC_SERVICE=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -q|--quiet)
                QUIET=true
                shift
                ;;
            -j|--json)
                JSON_OUTPUT=true
                shift
                ;;
            -t|--timeout)
                HEALTH_CHECK_TIMEOUT="$2"
                shift 2
                ;;
            -c|--continuous)
                CONTINUOUS=true
                shift
                ;;
            -i|--interval)
                CHECK_INTERVAL_CONTINUOUS="$2"
                shift 2
                ;;
            -s|--service)
                SPECIFIC_SERVICE="$2"
                shift 2
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

# Check system resources
check_system_resources() {
    if [[ "$QUIET" != "true" ]]; then
        log_info "Checking system resources..."
    fi
    
    # Check memory usage
    local memory_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        log_error "High memory usage: ${memory_usage}%"
    elif (( $(echo "$memory_usage > 80" | bc -l) )); then
        log_warning "Memory usage is high: ${memory_usage}%"
    elif [[ "$VERBOSE" == "true" ]]; then
        log_success "Memory usage: ${memory_usage}%"
    fi
    
    # Check disk usage
    local disk_usage=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        log_error "High disk usage: ${disk_usage}%"
    elif [[ $disk_usage -gt 80 ]]; then
        log_warning "Disk usage is high: ${disk_usage}%"
    elif [[ "$VERBOSE" == "true" ]]; then
        log_success "Disk usage: ${disk_usage}%"
    fi
    
    # Check CPU load
    local cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local load_percentage=$(echo "scale=1; $cpu_load * 100 / $cpu_cores" | bc)
    
    if (( $(echo "$load_percentage > 90" | bc -l) )); then
        log_error "High CPU load: ${load_percentage}% (${cpu_load}/${cpu_cores})"
    elif (( $(echo "$load_percentage > 70" | bc -l) )); then
        log_warning "CPU load is high: ${load_percentage}% (${cpu_load}/${cpu_cores})"
    elif [[ "$VERBOSE" == "true" ]]; then
        log_success "CPU load: ${load_percentage}% (${cpu_load}/${cpu_cores})"
    fi
}

# Check systemd services
check_systemd_services() {
    if [[ "$QUIET" != "true" ]]; then
        log_info "Checking systemd services..."
    fi
    
    for service in "${SERVICES[@]}"; do
        if [[ -n "$SPECIFIC_SERVICE" ]] && [[ "$service" != *"$SPECIFIC_SERVICE"* ]]; then
            continue
        fi
        
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            if [[ "$VERBOSE" == "true" ]] || [[ "$QUIET" != "true" ]]; then
                log_success "Service $service is running"
            fi
            
            # Check if service is enabled
            if ! systemctl is-enabled --quiet "$service" 2>/dev/null; then
                log_warning "Service $service is not enabled for auto-start"
            fi
        else
            log_error "Service $service is not running"
            
            # Show service status if verbose
            if [[ "$VERBOSE" == "true" ]]; then
                systemctl status "$service" --no-pager --lines=5 2>/dev/null || true
            fi
        fi
    done
}

# Check network connectivity
check_network_connectivity() {
    if [[ "$QUIET" != "true" ]]; then
        log_info "Checking network connectivity..."
    fi
    
    # Check internet connectivity
    if ping -c 1 8.8.8.8 &>/dev/null; then
        if [[ "$VERBOSE" == "true" ]]; then
            log_success "Internet connectivity: OK"
        fi
    else
        log_error "No internet connectivity"
    fi
    
    # Check DNS resolution
    if nslookup google.com &>/dev/null; then
        if [[ "$VERBOSE" == "true" ]]; then
            log_success "DNS resolution: OK"
        fi
    else
        log_error "DNS resolution failed"
    fi
}

# Check port availability
check_ports() {
    if [[ "$QUIET" != "true" ]]; then
        log_info "Checking port availability..."
    fi
    
    local ports=("8000:Backend API" "8001:Autoscraper Service" "3000:Admin Panel" "5173:Public Website")
    
    for port_info in "${ports[@]}"; do
        IFS=':' read -r port name <<< "$port_info"
        
        if [[ -n "$SPECIFIC_SERVICE" ]]; then
            case "$SPECIFIC_SERVICE" in
                "backend") [[ "$port" != "8000" ]] && continue ;;
                "autoscraper") [[ "$port" != "8001" ]] && continue ;;
                "admin") [[ "$port" != "3000" ]] && continue ;;
                "public") [[ "$port" != "5173" ]] && continue ;;
            esac
        fi
        
        if netstat -tlnp | grep -q ":$port "; then
            if [[ "$VERBOSE" == "true" ]] || [[ "$QUIET" != "true" ]]; then
                log_success "Port $port ($name) is listening"
            fi
        else
            log_error "Port $port ($name) is not listening"
        fi
    done
}

# Check HTTP endpoints
check_http_endpoints() {
    if [[ "$QUIET" != "true" ]]; then
        log_info "Checking HTTP endpoints..."
    fi
    
    local endpoints=(
        "http://localhost:8000/health:Backend API Health"
        "http://localhost:8000/docs:Backend API Docs"
        "http://localhost:8001/health:Autoscraper Health"
        "http://localhost:8001/docs:Autoscraper Docs"
        "http://localhost:3000:Admin Panel"
        "http://localhost:5173:Public Website"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r endpoint name <<< "$endpoint_info"
        
        if [[ -n "$SPECIFIC_SERVICE" ]]; then
            case "$SPECIFIC_SERVICE" in
                "backend") [[ "$endpoint" != *"8000"* ]] && continue ;;
                "autoscraper") [[ "$endpoint" != *"8001"* ]] && continue ;;
                "admin") [[ "$endpoint" != *"3000"* ]] && continue ;;
                "public") [[ "$endpoint" != *"5173"* ]] && continue ;;
            esac
        fi
        
        local elapsed=0
        local success=false
        
        while [[ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]]; do
            if curl -f --max-time 5 --connect-timeout 5 "$endpoint" &>/dev/null; then
                if [[ "$VERBOSE" == "true" ]] || [[ "$QUIET" != "true" ]]; then
                    log_success "$name is responding"
                fi
                success=true
                break
            fi
            
            sleep $CHECK_INTERVAL
            elapsed=$((elapsed + CHECK_INTERVAL))
        done
        
        if [[ "$success" != "true" ]]; then
            log_error "$name is not responding after ${HEALTH_CHECK_TIMEOUT}s"
        fi
    done
}

# Check database connectivity (if applicable)
check_database() {
    if [[ "$QUIET" != "true" ]]; then
        log_info "Checking database connectivity..."
    fi
    
    # Check PostgreSQL if it's running
    if systemctl is-active --quiet postgresql 2>/dev/null; then
        if sudo -u postgres psql -c "SELECT 1;" &>/dev/null; then
            if [[ "$VERBOSE" == "true" ]]; then
                log_success "PostgreSQL is accessible"
            fi
        else
            log_error "PostgreSQL is not accessible"
        fi
    elif [[ "$VERBOSE" == "true" ]]; then
        log_info "PostgreSQL is not running (may be using external database)"
    fi
}

# Check log files for errors
check_logs() {
    if [[ "$QUIET" != "true" ]]; then
        log_info "Checking recent logs for errors..."
    fi
    
    # Check systemd journal for RemoteHive services
    local recent_errors=$(journalctl -u "remotehive-*" --since "1 hour ago" --no-pager | grep -i "error\|failed\|exception" | wc -l)
    
    if [[ $recent_errors -gt 10 ]]; then
        log_error "High number of recent errors in logs: $recent_errors"
        if [[ "$VERBOSE" == "true" ]]; then
            log_info "Recent errors:"
            journalctl -u "remotehive-*" --since "1 hour ago" --no-pager | grep -i "error\|failed\|exception" | tail -5
        fi
    elif [[ $recent_errors -gt 0 ]]; then
        log_warning "Some recent errors in logs: $recent_errors"
    elif [[ "$VERBOSE" == "true" ]]; then
        log_success "No recent errors in logs"
    fi
}

# Check SSL certificates (if applicable)
check_ssl_certificates() {
    if [[ "$QUIET" != "true" ]] && [[ "$VERBOSE" == "true" ]]; then
        log_info "Checking SSL certificates..."
    fi
    
    # Check if there are any SSL certificates
    if [[ -d "/etc/letsencrypt/live" ]]; then
        local cert_dirs=$(find /etc/letsencrypt/live -mindepth 1 -maxdepth 1 -type d 2>/dev/null)
        
        for cert_dir in $cert_dirs; do
            local domain=$(basename "$cert_dir")
            local cert_file="$cert_dir/cert.pem"
            
            if [[ -f "$cert_file" ]]; then
                local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
                local expiry_timestamp=$(date -d "$expiry_date" +%s)
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                if [[ $days_until_expiry -lt 7 ]]; then
                    log_error "SSL certificate for $domain expires in $days_until_expiry days"
                elif [[ $days_until_expiry -lt 30 ]]; then
                    log_warning "SSL certificate for $domain expires in $days_until_expiry days"
                elif [[ "$VERBOSE" == "true" ]]; then
                    log_success "SSL certificate for $domain is valid ($days_until_expiry days remaining)"
                fi
            fi
        done
    elif [[ "$VERBOSE" == "true" ]]; then
        log_info "No SSL certificates found"
    fi
}

# Generate JSON output
generate_json_output() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local hostname=$(hostname)
    local public_ip=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "unknown")
    
    cat << EOF
{
  "timestamp": "$timestamp",
  "hostname": "$hostname",
  "public_ip": "$public_ip",
  "overall_status": "$HEALTH_STATUS",
  "failed_checks": $FAILED_CHECKS,
  "warning_checks": $WARNING_CHECKS,
  "services": {
EOF
    
    local first=true
    for service in "${SERVICES[@]}"; do
        if [[ "$first" != "true" ]]; then
            echo ","
        fi
        first=false
        
        local status="stopped"
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            status="running"
        fi
        
        echo -n "    \"$service\": \"$status\""
    done
    
    echo
    echo "  },"
    echo "  \"endpoints\": {"
    
    local endpoints=("8000:backend" "8001:autoscraper" "3000:admin" "5173:public")
    first=true
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r port name <<< "$endpoint_info"
        
        if [[ "$first" != "true" ]]; then
            echo ","
        fi
        first=false
        
        local status="down"
        if curl -f --max-time 5 "http://localhost:$port" &>/dev/null; then
            status="up"
        fi
        
        echo -n "    \"$name\": \"$status\""
    done
    
    echo
    echo "  }"
    echo "}"
}

# Main health check function
run_health_checks() {
    if [[ "$JSON_OUTPUT" != "true" ]] && [[ "$QUIET" != "true" ]]; then
        log_info "Starting RemoteHive health checks..."
    fi
    
    # Reset counters
    FAILED_CHECKS=0
    WARNING_CHECKS=0
    HEALTH_STATUS="HEALTHY"
    
    check_system_resources
    check_systemd_services
    check_network_connectivity
    check_ports
    check_http_endpoints
    check_database
    check_logs
    check_ssl_certificates
    
    # Generate output
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        generate_json_output
    else
        if [[ "$QUIET" != "true" ]]; then
            echo
            log_info "Health check summary:"
            log_info "  Overall Status: $HEALTH_STATUS"
            log_info "  Failed Checks: $FAILED_CHECKS"
            log_info "  Warning Checks: $WARNING_CHECKS"
        fi
        
        # Set exit code based on health status
        if [[ "$HEALTH_STATUS" == "UNHEALTHY" ]]; then
            exit 1
        elif [[ $WARNING_CHECKS -gt 0 ]]; then
            exit 2
        else
            exit 0
        fi
    fi
}

# Continuous monitoring mode
run_continuous_monitoring() {
    log_info "Starting continuous health monitoring (interval: ${CHECK_INTERVAL_CONTINUOUS}s)"
    log_info "Press Ctrl+C to stop"
    
    while true; do
        echo "==================== $(date) ===================="
        run_health_checks
        echo
        sleep "$CHECK_INTERVAL_CONTINUOUS"
    done
}

# Main function
main() {
    parse_arguments "$@"
    
    # Install bc if not available (for floating point calculations)
    if ! command -v bc &> /dev/null; then
        if [[ "$VERBOSE" == "true" ]]; then
            log_info "Installing bc for calculations..."
        fi
        
        if command -v apt &> /dev/null; then
            apt update && apt install -y bc
        elif command -v yum &> /dev/null; then
            yum install -y bc
        fi
    fi
    
    if [[ "$CONTINUOUS" == "true" ]]; then
        run_continuous_monitoring
    else
        run_health_checks
    fi
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi