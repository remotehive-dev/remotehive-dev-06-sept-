#!/bin/bash

# RemoteHive Monitoring Script
# This script monitors system health, application performance, and sends alerts

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="/var/log/remotehive"
MONITORING_LOG="$LOG_DIR/monitoring.log"
ALERT_LOG="$LOG_DIR/alerts.log"
METRICS_DIR="/var/lib/remotehive/metrics"
CONFIG_FILE="$PROJECT_ROOT/config/monitoring.conf"

# Service configuration
SERVICES=("remotehive-backend" "remotehive-autoscraper")
FRONTEND_SERVICES=("remotehive-admin" "remotehive-public")
PORTS=(8000 8001 3000 5173)
HEALTH_ENDPOINTS=(
    "http://localhost:8000/health"
    "http://localhost:8001/health"
    "http://localhost:3000"
    "http://localhost:5173"
)

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
LOAD_THRESHOLD=5.0
RESPONSE_TIME_THRESHOLD=5000  # milliseconds
ERROR_RATE_THRESHOLD=5  # percentage

# Alert configuration
ALERT_EMAIL="admin@remotehive.com"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
ALERT_COOLDOWN=300  # 5 minutes
LAST_ALERT_FILE="/tmp/remotehive_last_alert"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$MONITORING_LOG"
}

log_info() {
    log "INFO" "$@"
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_warn() {
    log "WARN" "$@"
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
    log "ERROR" "$@"
    echo -e "${RED}[ERROR]${NC} $*"
}

log_success() {
    log "SUCCESS" "$@"
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

setup_directories() {
    sudo mkdir -p "$LOG_DIR" "$METRICS_DIR"
    sudo chown -R "$(whoami):$(whoami)" "$LOG_DIR" "$METRICS_DIR" 2>/dev/null || true
    chmod 755 "$LOG_DIR" "$METRICS_DIR"
}

get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

get_unix_timestamp() {
    date '+%s'
}

# Check if alert cooldown period has passed
can_send_alert() {
    local alert_type="$1"
    local cooldown_file="${LAST_ALERT_FILE}_${alert_type}"
    
    if [[ -f "$cooldown_file" ]]; then
        local last_alert=$(cat "$cooldown_file")
        local current_time=$(get_unix_timestamp)
        local time_diff=$((current_time - last_alert))
        
        if [[ $time_diff -lt $ALERT_COOLDOWN ]]; then
            return 1
        fi
    fi
    
    echo "$(get_unix_timestamp)" > "$cooldown_file"
    return 0
}

# =============================================================================
# SYSTEM MONITORING FUNCTIONS
# =============================================================================

check_system_resources() {
    log_info "Checking system resources..."
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//' | cut -d'%' -f1)
    cpu_usage=${cpu_usage%.*}  # Remove decimal part
    
    # Memory usage
    local memory_info=$(free | grep Mem)
    local total_mem=$(echo $memory_info | awk '{print $2}')
    local used_mem=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$((used_mem * 100 / total_mem))
    
    # Disk usage
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    # Load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    # Log metrics
    echo "$(get_timestamp),cpu,$cpu_usage" >> "$METRICS_DIR/system_metrics.csv"
    echo "$(get_timestamp),memory,$memory_usage" >> "$METRICS_DIR/system_metrics.csv"
    echo "$(get_timestamp),disk,$disk_usage" >> "$METRICS_DIR/system_metrics.csv"
    echo "$(get_timestamp),load,$load_avg" >> "$METRICS_DIR/system_metrics.csv"
    
    # Check thresholds and alert
    if [[ $cpu_usage -gt $CPU_THRESHOLD ]]; then
        send_alert "high_cpu" "High CPU usage: ${cpu_usage}%"
    fi
    
    if [[ $memory_usage -gt $MEMORY_THRESHOLD ]]; then
        send_alert "high_memory" "High memory usage: ${memory_usage}%"
    fi
    
    if [[ $disk_usage -gt $DISK_THRESHOLD ]]; then
        send_alert "high_disk" "High disk usage: ${disk_usage}%"
    fi
    
    if (( $(echo "$load_avg > $LOAD_THRESHOLD" | bc -l) )); then
        send_alert "high_load" "High system load: $load_avg"
    fi
    
    log_info "System resources: CPU=${cpu_usage}%, Memory=${memory_usage}%, Disk=${disk_usage}%, Load=${load_avg}"
}

check_services() {
    log_info "Checking system services..."
    
    for service in "${SERVICES[@]}"; do
        if systemctl is-active --quiet "$service"; then
            log_success "Service $service is running"
            echo "$(get_timestamp),$service,1" >> "$METRICS_DIR/service_status.csv"
        else
            log_error "Service $service is not running"
            echo "$(get_timestamp),$service,0" >> "$METRICS_DIR/service_status.csv"
            send_alert "service_down" "Service $service is not running"
        fi
    done
}

check_frontend_services() {
    log_info "Checking frontend services..."
    
    # Check PM2 processes
    if command -v pm2 >/dev/null 2>&1; then
        local pm2_status=$(pm2 jlist 2>/dev/null || echo "[]")
        
        for service in "${FRONTEND_SERVICES[@]}"; do
            local service_status=$(echo "$pm2_status" | jq -r ".[] | select(.name == \"$service\") | .pm2_env.status" 2>/dev/null || echo "stopped")
            
            if [[ "$service_status" == "online" ]]; then
                log_success "Frontend service $service is running"
                echo "$(get_timestamp),$service,1" >> "$METRICS_DIR/frontend_status.csv"
            else
                log_error "Frontend service $service is not running (status: $service_status)"
                echo "$(get_timestamp),$service,0" >> "$METRICS_DIR/frontend_status.csv"
                send_alert "frontend_down" "Frontend service $service is not running"
            fi
        done
    else
        log_warn "PM2 not found, skipping frontend service checks"
    fi
}

check_ports() {
    log_info "Checking application ports..."
    
    for port in "${PORTS[@]}"; do
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            log_success "Port $port is listening"
            echo "$(get_timestamp),port_$port,1" >> "$METRICS_DIR/port_status.csv"
        else
            log_error "Port $port is not listening"
            echo "$(get_timestamp),port_$port,0" >> "$METRICS_DIR/port_status.csv"
            send_alert "port_down" "Port $port is not listening"
        fi
    done
}

check_health_endpoints() {
    log_info "Checking health endpoints..."
    
    for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
        local start_time=$(date +%s%3N)
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$endpoint" 2>/dev/null || echo "000")
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        echo "$(get_timestamp),$endpoint,$response_code,$response_time" >> "$METRICS_DIR/endpoint_metrics.csv"
        
        if [[ "$response_code" == "200" ]]; then
            log_success "Endpoint $endpoint is healthy (${response_time}ms)"
            
            if [[ $response_time -gt $RESPONSE_TIME_THRESHOLD ]]; then
                send_alert "slow_response" "Slow response from $endpoint: ${response_time}ms"
            fi
        else
            log_error "Endpoint $endpoint is unhealthy (HTTP $response_code)"
            send_alert "endpoint_down" "Endpoint $endpoint returned HTTP $response_code"
        fi
    done
}

check_database() {
    log_info "Checking database connectivity..."
    
    # Check PostgreSQL connection
    if command -v psql >/dev/null 2>&1; then
        local db_host="${DB_HOST:-localhost}"
        local db_port="${DB_PORT:-5432}"
        local db_name="${DB_NAME:-remotehive}"
        local db_user="${DB_USER:-postgres}"
        
        if PGPASSWORD="${DB_PASSWORD:-}" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -c "SELECT 1;" >/dev/null 2>&1; then
            log_success "Database connection successful"
            echo "$(get_timestamp),database,1" >> "$METRICS_DIR/database_status.csv"
        else
            log_error "Database connection failed"
            echo "$(get_timestamp),database,0" >> "$METRICS_DIR/database_status.csv"
            send_alert "database_down" "Database connection failed"
        fi
    else
        log_warn "psql not found, skipping database check"
    fi
}

check_redis() {
    log_info "Checking Redis connectivity..."
    
    if command -v redis-cli >/dev/null 2>&1; then
        local redis_host="${REDIS_HOST:-localhost}"
        local redis_port="${REDIS_PORT:-6379}"
        
        if redis-cli -h "$redis_host" -p "$redis_port" ping >/dev/null 2>&1; then
            log_success "Redis connection successful"
            echo "$(get_timestamp),redis,1" >> "$METRICS_DIR/redis_status.csv"
        else
            log_error "Redis connection failed"
            echo "$(get_timestamp),redis,0" >> "$METRICS_DIR/redis_status.csv"
            send_alert "redis_down" "Redis connection failed"
        fi
    else
        log_warn "redis-cli not found, skipping Redis check"
    fi
}

check_ssl_certificates() {
    log_info "Checking SSL certificates..."
    
    local domains=("remotehive.com" "admin.remotehive.com" "api.remotehive.com")
    
    for domain in "${domains[@]}"; do
        if command -v openssl >/dev/null 2>&1; then
            local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
            
            if [[ -n "$cert_info" ]]; then
                local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
                local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                echo "$(get_timestamp),$domain,$days_until_expiry" >> "$METRICS_DIR/ssl_status.csv"
                
                if [[ $days_until_expiry -lt 30 ]]; then
                    send_alert "ssl_expiry" "SSL certificate for $domain expires in $days_until_expiry days"
                elif [[ $days_until_expiry -lt 7 ]]; then
                    send_alert "ssl_critical" "SSL certificate for $domain expires in $days_until_expiry days (CRITICAL)"
                fi
                
                log_info "SSL certificate for $domain expires in $days_until_expiry days"
            else
                log_warn "Could not check SSL certificate for $domain"
            fi
        fi
    done
}

check_log_errors() {
    log_info "Checking for recent errors in logs..."
    
    local log_files=(
        "/var/log/nginx/error.log"
        "$LOG_DIR/app.log"
        "$LOG_DIR/autoscraper.log"
        "/var/log/syslog"
    )
    
    local error_count=0
    local since_time=$(date -d '5 minutes ago' '+%Y-%m-%d %H:%M:%S')
    
    for log_file in "${log_files[@]}"; do
        if [[ -f "$log_file" ]]; then
            local recent_errors=$(grep -i "error\|critical\|fatal" "$log_file" 2>/dev/null | wc -l || echo "0")
            error_count=$((error_count + recent_errors))
            
            if [[ $recent_errors -gt 0 ]]; then
                log_warn "Found $recent_errors recent errors in $log_file"
            fi
        fi
    done
    
    echo "$(get_timestamp),log_errors,$error_count" >> "$METRICS_DIR/error_metrics.csv"
    
    if [[ $error_count -gt 10 ]]; then
        send_alert "high_errors" "High error count in logs: $error_count errors"
    fi
    
    log_info "Total recent errors found: $error_count"
}

# =============================================================================
# ALERT FUNCTIONS
# =============================================================================

send_alert() {
    local alert_type="$1"
    local message="$2"
    local timestamp=$(get_timestamp)
    
    # Check cooldown
    if ! can_send_alert "$alert_type"; then
        log_info "Alert cooldown active for $alert_type, skipping alert"
        return 0
    fi
    
    log_warn "ALERT: $message"
    echo "[$timestamp] [$alert_type] $message" >> "$ALERT_LOG"
    
    # Send email alert
    if [[ -n "$ALERT_EMAIL" ]] && command -v mail >/dev/null 2>&1; then
        echo "Alert: $message\n\nTimestamp: $timestamp\nHost: $(hostname)\nAlert Type: $alert_type" | \
            mail -s "RemoteHive Alert: $alert_type" "$ALERT_EMAIL" 2>/dev/null || \
            log_error "Failed to send email alert"
    fi
    
    # Send Slack alert
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        local payload=$(cat <<EOF
{
    "text": "🚨 RemoteHive Alert",
    "attachments": [
        {
            "color": "danger",
            "fields": [
                {
                    "title": "Alert Type",
                    "value": "$alert_type",
                    "short": true
                },
                {
                    "title": "Message",
                    "value": "$message",
                    "short": false
                },
                {
                    "title": "Host",
                    "value": "$(hostname)",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$timestamp",
                    "short": true
                }
            ]
        }
    ]
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK" >/dev/null 2>&1 || \
            log_error "Failed to send Slack alert"
    fi
}

# =============================================================================
# REPORTING FUNCTIONS
# =============================================================================

generate_report() {
    local report_file="$METRICS_DIR/monitoring_report_$(date +%Y%m%d_%H%M%S).json"
    
    log_info "Generating monitoring report..."
    
    cat > "$report_file" <<EOF
{
    "timestamp": "$(get_timestamp)",
    "host": "$(hostname)",
    "uptime": "$(uptime -p)",
    "system": {
        "cpu_usage": "$(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//')",
        "memory_usage": "$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')",
        "disk_usage": "$(df / | tail -1 | awk '{print $5}')",
        "load_average": "$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')"
    },
    "services": {
EOF
    
    # Add service status
    local first=true
    for service in "${SERVICES[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$report_file"
        fi
        
        local status="stopped"
        if systemctl is-active --quiet "$service"; then
            status="running"
        fi
        
        echo -n "        \"$service\": \"$status\"" >> "$report_file"
    done
    
    cat >> "$report_file" <<EOF

    },
    "ports": {
EOF
    
    # Add port status
    first=true
    for port in "${PORTS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$report_file"
        fi
        
        local status="closed"
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            status="open"
        fi
        
        echo -n "        \"$port\": \"$status\"" >> "$report_file"
    done
    
    cat >> "$report_file" <<EOF

    },
    "health_checks": {
EOF
    
    # Add health check status
    first=true
    for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$report_file"
        fi
        
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$endpoint" 2>/dev/null || echo "000")
        local status="unhealthy"
        if [[ "$response_code" == "200" ]]; then
            status="healthy"
        fi
        
        echo -n "        \"$endpoint\": \"$status\"" >> "$report_file"
    done
    
    echo "" >> "$report_file"
    echo "    }" >> "$report_file"
    echo "}" >> "$report_file"
    
    log_success "Monitoring report generated: $report_file"
}

cleanup_old_metrics() {
    log_info "Cleaning up old metrics files..."
    
    # Keep metrics for 30 days
    find "$METRICS_DIR" -name "*.csv" -mtime +30 -delete 2>/dev/null || true
    find "$METRICS_DIR" -name "monitoring_report_*.json" -mtime +7 -delete 2>/dev/null || true
    
    # Rotate logs if they're too large (>100MB)
    for log_file in "$MONITORING_LOG" "$ALERT_LOG"; do
        if [[ -f "$log_file" ]] && [[ $(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0) -gt 104857600 ]]; then
            mv "$log_file" "${log_file}.old"
            touch "$log_file"
            log_info "Rotated log file: $log_file"
        fi
    done
}

# =============================================================================
# MAIN FUNCTIONS
# =============================================================================

run_monitoring_checks() {
    log_info "Starting monitoring checks..."
    
    check_system_resources
    check_services
    check_frontend_services
    check_ports
    check_health_endpoints
    check_database
    check_redis
    check_ssl_certificates
    check_log_errors
    
    log_success "Monitoring checks completed"
}

run_continuous_monitoring() {
    local interval="${1:-300}"  # Default 5 minutes
    
    log_info "Starting continuous monitoring (interval: ${interval}s)..."
    
    while true; do
        run_monitoring_checks
        generate_report
        cleanup_old_metrics
        
        log_info "Sleeping for $interval seconds..."
        sleep "$interval"
    done
}

show_status() {
    echo "RemoteHive Monitoring Status"
    echo "============================"
    echo
    
    # System resources
    echo "System Resources:"
    echo "  CPU Usage: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//')%"
    echo "  Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
    echo "  Disk Usage: $(df / | tail -1 | awk '{print $5}')"
    echo "  Load Average: $(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')"
    echo
    
    # Services
    echo "Services:"
    for service in "${SERVICES[@]}"; do
        if systemctl is-active --quiet "$service"; then
            echo -e "  $service: ${GREEN}Running${NC}"
        else
            echo -e "  $service: ${RED}Stopped${NC}"
        fi
    done
    echo
    
    # Ports
    echo "Ports:"
    for port in "${PORTS[@]}"; do
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            echo -e "  Port $port: ${GREEN}Open${NC}"
        else
            echo -e "  Port $port: ${RED}Closed${NC}"
        fi
    done
    echo
    
    # Health endpoints
    echo "Health Endpoints:"
    for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$endpoint" 2>/dev/null || echo "000")
        if [[ "$response_code" == "200" ]]; then
            echo -e "  $endpoint: ${GREEN}Healthy${NC}"
        else
            echo -e "  $endpoint: ${RED}Unhealthy (HTTP $response_code)${NC}"
        fi
    done
}

show_help() {
    cat <<EOF
RemoteHive Monitoring Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  check           Run monitoring checks once
  monitor         Run continuous monitoring (default interval: 5 minutes)
  status          Show current system status
  report          Generate monitoring report
  cleanup         Clean up old metrics and logs
  help            Show this help message

Options:
  --interval SECONDS    Set monitoring interval for continuous mode (default: 300)
  --config FILE         Use custom configuration file
  --log-level LEVEL     Set log level (DEBUG, INFO, WARN, ERROR)

Examples:
  $0 check                    # Run checks once
  $0 monitor --interval 60    # Monitor every minute
  $0 status                   # Show current status
  $0 report                   # Generate report

Configuration:
  Edit $CONFIG_FILE to customize monitoring settings.

Logs:
  Monitoring log: $MONITORING_LOG
  Alert log: $ALERT_LOG
  Metrics directory: $METRICS_DIR

EOF
}

# =============================================================================
# MAIN SCRIPT
# =============================================================================

main() {
    # Setup
    setup_directories
    
    # Parse command line arguments
    local command="${1:-check}"
    local interval=300
    
    case "$command" in
        "check")
            run_monitoring_checks
            ;;
        "monitor")
            if [[ "${2:-}" == "--interval" ]] && [[ -n "${3:-}" ]]; then
                interval="$3"
            fi
            run_continuous_monitoring "$interval"
            ;;
        "status")
            show_status
            ;;
        "report")
            generate_report
            ;;
        "cleanup")
            cleanup_old_metrics
            ;;
        "help"|"--help"|"")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'log_info "Monitoring script interrupted"; exit 0' INT TERM

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi