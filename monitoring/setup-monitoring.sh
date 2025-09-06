#!/bin/bash

# RemoteHive Monitoring Setup Script
# This script sets up comprehensive monitoring and observability for RemoteHive

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MONITORING_DIR="$SCRIPT_DIR"
ENVIRONMENT="${ENVIRONMENT:-development}"
DRY_RUN="${DRY_RUN:-false}"
VERBOSE="${VERBOSE:-false}"

# Default configuration
DEFAULT_GRAFANA_ADMIN_PASSWORD="admin123"
DEFAULT_ELASTICSEARCH_PASSWORD="elastic123"
DEFAULT_KIBANA_PASSWORD="kibana123"

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

print_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1"
    fi
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] [COMMAND]

Commands:
  setup           Set up monitoring infrastructure (default)
  start           Start monitoring services
  stop            Stop monitoring services
  restart         Restart monitoring services
  status          Show status of monitoring services
  logs            Show logs from monitoring services
  cleanup         Clean up monitoring resources
  reset           Reset monitoring data and configurations
  backup          Backup monitoring data
  restore         Restore monitoring data from backup

Options:
  -e, --environment ENV    Environment (development|staging|production) [default: development]
  -d, --dry-run           Show what would be done without executing
  -v, --verbose           Enable verbose output
  -h, --help              Show this help message
  --grafana-password PWD  Set Grafana admin password [default: admin123]
  --elastic-password PWD  Set Elasticsearch password [default: elastic123]
  --kibana-password PWD   Set Kibana password [default: kibana123]
  --skip-deps            Skip dependency checks
  --force                Force operation even if services are running

Environment Variables:
  ENVIRONMENT            Environment name
  DRY_RUN               Enable dry run mode
  VERBOSE               Enable verbose output
  GRAFANA_ADMIN_PASSWORD Grafana admin password
  ELASTICSEARCH_PASSWORD Elasticsearch password
  KIBANA_PASSWORD       Kibana password

Examples:
  $0 setup                           # Set up monitoring with defaults
  $0 -e production start             # Start monitoring in production mode
  $0 --dry-run setup                 # Show what setup would do
  $0 --verbose logs                  # Show logs with verbose output
  $0 cleanup --force                 # Force cleanup even if services running

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check for required commands
    local required_commands=("docker" "docker-compose")
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    # Check for kubectl if in Kubernetes mode
    if [[ "$ENVIRONMENT" == "production" ]] && ! command -v kubectl &> /dev/null; then
        missing_deps+=("kubectl")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        print_error "Please install the missing dependencies and try again."
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check available disk space (minimum 5GB)
    local available_space
    available_space=$(df "$MONITORING_DIR" | awk 'NR==2 {print $4}')
    local min_space=$((5 * 1024 * 1024)) # 5GB in KB
    
    if [[ $available_space -lt $min_space ]]; then
        print_warning "Low disk space. Available: $(($available_space / 1024 / 1024))GB, Recommended: 5GB+"
    fi
    
    print_success "Prerequisites check completed"
}

# Function to create directories
create_directories() {
    print_status "Creating monitoring directories..."
    
    local directories=(
        "$MONITORING_DIR/data/prometheus"
        "$MONITORING_DIR/data/grafana"
        "$MONITORING_DIR/data/elasticsearch"
        "$MONITORING_DIR/data/kibana"
        "$MONITORING_DIR/data/logstash"
        "$MONITORING_DIR/data/alertmanager"
        "$MONITORING_DIR/data/jaeger"
        "$MONITORING_DIR/logs"
        "$MONITORING_DIR/backups"
    )
    
    for dir in "${directories[@]}"; do
        if [[ "$DRY_RUN" == "true" ]]; then
            print_verbose "Would create directory: $dir"
        else
            mkdir -p "$dir"
            print_verbose "Created directory: $dir"
        fi
    done
    
    # Set proper permissions
    if [[ "$DRY_RUN" == "false" ]]; then
        # Elasticsearch needs specific permissions
        chmod 777 "$MONITORING_DIR/data/elasticsearch" 2>/dev/null || true
        # Grafana needs specific permissions
        chmod 777 "$MONITORING_DIR/data/grafana" 2>/dev/null || true
    fi
    
    print_success "Directories created successfully"
}

# Function to generate environment file
generate_env_file() {
    print_status "Generating monitoring environment file..."
    
    local env_file="$MONITORING_DIR/.env"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_verbose "Would create environment file: $env_file"
        return
    fi
    
    cat > "$env_file" << EOF
# RemoteHive Monitoring Environment Configuration
# Generated on $(date)

# Environment
ENVIRONMENT=$ENVIRONMENT
CLUSTER_NAME=remotehive-cluster
DATACENTER=local

# Grafana Configuration
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-$DEFAULT_GRAFANA_ADMIN_PASSWORD}
GRAFANA_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-$DEFAULT_GRAFANA_ADMIN_PASSWORD}
GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-$DEFAULT_GRAFANA_ADMIN_PASSWORD}

# Elasticsearch Configuration
ELASTICSEARCH_PASSWORD=${ELASTICSEARCH_PASSWORD:-$DEFAULT_ELASTICSEARCH_PASSWORD}
ELASTIC_PASSWORD=${ELASTICSEARCH_PASSWORD:-$DEFAULT_ELASTICSEARCH_PASSWORD}
ELASTICSEARCH_USERNAME=elastic

# Kibana Configuration
KIBANA_PASSWORD=${KIBANA_PASSWORD:-$DEFAULT_KIBANA_PASSWORD}
KIBANA_USERNAME=kibana
KIBANA_ELASTICSEARCH_USERNAME=kibana
KIBANA_ELASTICSEARCH_PASSWORD=${KIBANA_PASSWORD:-$DEFAULT_KIBANA_PASSWORD}

# Jaeger Configuration
JAEGER_AGENT_HOST=jaeger-agent
JAEGER_AGENT_PORT=6831
JAEGER_SAMPLER_TYPE=const
JAEGER_SAMPLER_PARAM=1

# Prometheus Configuration
PROMETHEUS_RETENTION_TIME=30d
PROMETHEUS_RETENTION_SIZE=10GB

# AlertManager Configuration
ALERTMANAGER_CLUSTER_PEER=

# Network Configuration
MONITORING_NETWORK=remotehive-monitoring

# Data Paths
PROMETHEUS_DATA_PATH=./data/prometheus
GRAFANA_DATA_PATH=./data/grafana
ELASTICSEARCH_DATA_PATH=./data/elasticsearch
KIBANA_DATA_PATH=./data/kibana
LOGSTASH_DATA_PATH=./data/logstash
ALERTMANAGER_DATA_PATH=./data/alertmanager
JAEGER_DATA_PATH=./data/jaeger

# External Services (RemoteHive)
REMOTEHIVE_BACKEND_URL=http://remotehive-backend:8000
REMOTEHIVE_AUTOSCRAPER_URL=http://remotehive-autoscraper:8001
REMOTEHIVE_ADMIN_URL=http://remotehive-admin:3000
REMOTEHIVE_PUBLIC_URL=http://remotehive-public:5173
REMOTEHIVE_REDIS_URL=redis://redis:6379
REMOTEHIVE_MONGODB_URL=mongodb://mongodb:27017

# Notification Configuration (customize as needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=alerts@remotehive.com

SLACK_WEBHOOK_URL=
SLACK_CHANNEL=#alerts

PAGERDUTY_INTEGRATION_KEY=

# Security
ENABLE_SECURITY=true
ENABLE_TLS=false

EOF
    
    print_success "Environment file generated: $env_file"
}

# Function to setup monitoring services
setup_monitoring() {
    print_status "Setting up RemoteHive monitoring infrastructure..."
    
    # Create directories
    create_directories
    
    # Generate environment file
    generate_env_file
    
    # Copy configuration files if they don't exist
    local config_files=(
        "prometheus/prometheus.yml"
        "prometheus/rules/remotehive-alerts.yml"
        "grafana/provisioning/dashboards/dashboard.yml"
        "grafana/provisioning/datasources/datasource.yml"
        "grafana/dashboards/remotehive-overview.json"
        "alertmanager/alertmanager.yml"
        "alertmanager/templates/default.tmpl"
        "logstash/pipeline/logstash.conf"
        "logstash/templates/remotehive-template.json"
        "filebeat/filebeat.yml"
    )
    
    for config_file in "${config_files[@]}"; do
        local src_file="$MONITORING_DIR/$config_file"
        if [[ ! -f "$src_file" ]]; then
            print_warning "Configuration file missing: $config_file"
            print_warning "Please ensure all configuration files are in place."
        else
            print_verbose "Configuration file found: $config_file"
        fi
    done
    
    print_success "Monitoring setup completed"
    print_status "Next steps:"
    echo "  1. Review and customize configuration files in $MONITORING_DIR"
    echo "  2. Run '$0 start' to start monitoring services"
    echo "  3. Access Grafana at http://localhost:3001 (admin/admin123)"
    echo "  4. Access Kibana at http://localhost:5601"
    echo "  5. Access Prometheus at http://localhost:9090"
    echo "  6. Access AlertManager at http://localhost:9093"
}

# Function to start monitoring services
start_monitoring() {
    print_status "Starting RemoteHive monitoring services..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_verbose "Would start monitoring services using docker-compose"
        return
    fi
    
    cd "$MONITORING_DIR"
    
    # Check if services are already running
    if docker-compose -f docker-compose.monitoring.yml ps | grep -q "Up"; then
        print_warning "Some monitoring services are already running"
        if [[ "${FORCE:-false}" != "true" ]]; then
            print_error "Use --force to restart running services"
            exit 1
        fi
    fi
    
    # Start services
    print_status "Starting monitoring stack..."
    docker-compose -f docker-compose.monitoring.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_service_health
    
    print_success "Monitoring services started successfully"
    show_service_urls
}

# Function to stop monitoring services
stop_monitoring() {
    print_status "Stopping RemoteHive monitoring services..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_verbose "Would stop monitoring services using docker-compose"
        return
    fi
    
    cd "$MONITORING_DIR"
    docker-compose -f docker-compose.monitoring.yml down
    
    print_success "Monitoring services stopped"
}

# Function to restart monitoring services
restart_monitoring() {
    print_status "Restarting RemoteHive monitoring services..."
    stop_monitoring
    sleep 5
    start_monitoring
}

# Function to check service health
check_service_health() {
    print_status "Checking service health..."
    
    local services=(
        "prometheus:9090:/api/v1/status/config"
        "grafana:3001:/api/health"
        "alertmanager:9093:/api/v1/status"
        "elasticsearch:9200:/_cluster/health"
        "kibana:5601:/api/status"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service port endpoint <<< "$service_info"
        
        print_verbose "Checking $service health..."
        
        local max_attempts=30
        local attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            if curl -s -f "http://localhost:$port$endpoint" > /dev/null 2>&1; then
                print_success "$service is healthy"
                break
            fi
            
            if [[ $attempt -eq $max_attempts ]]; then
                print_warning "$service health check failed after $max_attempts attempts"
            else
                print_verbose "$service not ready, attempt $attempt/$max_attempts"
                sleep 2
            fi
            
            ((attempt++))
        done
    done
}

# Function to show service status
show_status() {
    print_status "RemoteHive Monitoring Services Status:"
    
    cd "$MONITORING_DIR"
    docker-compose -f docker-compose.monitoring.yml ps
    
    echo
    print_status "Service URLs:"
    show_service_urls
}

# Function to show service URLs
show_service_urls() {
    cat << EOF

📊 Monitoring Dashboard URLs:
  • Grafana:       http://localhost:3001 (admin/admin123)
  • Prometheus:    http://localhost:9090
  • AlertManager:  http://localhost:9093
  • Kibana:        http://localhost:5601
  • Jaeger:        http://localhost:16686
  • Elasticsearch: http://localhost:9200

📈 Metrics Endpoints:
  • Node Exporter: http://localhost:9100/metrics
  • cAdvisor:      http://localhost:8080/metrics
  • Redis Exporter: http://localhost:9121/metrics

EOF
}

# Function to show logs
show_logs() {
    local service="${1:-}"
    
    cd "$MONITORING_DIR"
    
    if [[ -n "$service" ]]; then
        print_status "Showing logs for $service..."
        docker-compose -f docker-compose.monitoring.yml logs -f "$service"
    else
        print_status "Showing logs for all monitoring services..."
        docker-compose -f docker-compose.monitoring.yml logs -f
    fi
}

# Function to cleanup monitoring resources
cleanup_monitoring() {
    print_status "Cleaning up RemoteHive monitoring resources..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_verbose "Would clean up monitoring resources"
        return
    fi
    
    cd "$MONITORING_DIR"
    
    # Stop and remove containers
    docker-compose -f docker-compose.monitoring.yml down -v --remove-orphans
    
    # Remove unused networks
    docker network prune -f
    
    # Remove unused volumes (with confirmation)
    if [[ "${FORCE:-false}" == "true" ]]; then
        docker volume prune -f
    else
        print_warning "Use --force to also remove Docker volumes"
    fi
    
    print_success "Monitoring resources cleaned up"
}

# Function to reset monitoring data
reset_monitoring() {
    print_status "Resetting RemoteHive monitoring data..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_verbose "Would reset monitoring data"
        return
    fi
    
    # Stop services first
    stop_monitoring
    
    # Remove data directories
    local data_dirs=(
        "$MONITORING_DIR/data/prometheus"
        "$MONITORING_DIR/data/grafana"
        "$MONITORING_DIR/data/elasticsearch"
        "$MONITORING_DIR/data/kibana"
        "$MONITORING_DIR/data/logstash"
        "$MONITORING_DIR/data/alertmanager"
        "$MONITORING_DIR/data/jaeger"
    )
    
    for dir in "${data_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            print_verbose "Removing data directory: $dir"
            rm -rf "$dir"
        fi
    done
    
    # Recreate directories
    create_directories
    
    print_success "Monitoring data reset completed"
}

# Function to backup monitoring data
backup_monitoring() {
    local backup_name="monitoring-backup-$(date +%Y%m%d-%H%M%S)"
    local backup_dir="$MONITORING_DIR/backups/$backup_name"
    
    print_status "Creating monitoring backup: $backup_name"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_verbose "Would create backup: $backup_dir"
        return
    fi
    
    mkdir -p "$backup_dir"
    
    # Backup configuration files
    cp -r "$MONITORING_DIR"/{prometheus,grafana,alertmanager,logstash,filebeat} "$backup_dir/" 2>/dev/null || true
    
    # Backup data directories
    cp -r "$MONITORING_DIR/data" "$backup_dir/" 2>/dev/null || true
    
    # Create backup info
    cat > "$backup_dir/backup-info.txt" << EOF
Backup created: $(date)
Environment: $ENVIRONMENT
Backup type: Full monitoring backup
Services included: Prometheus, Grafana, AlertManager, Elasticsearch, Kibana, Logstash, Jaeger
EOF
    
    # Create compressed archive
    cd "$MONITORING_DIR/backups"
    tar -czf "$backup_name.tar.gz" "$backup_name"
    rm -rf "$backup_name"
    
    print_success "Backup created: $MONITORING_DIR/backups/$backup_name.tar.gz"
}

# Function to restore monitoring data
restore_monitoring() {
    local backup_file="${1:-}"
    
    if [[ -z "$backup_file" ]]; then
        print_error "Please specify a backup file to restore"
        print_status "Available backups:"
        ls -la "$MONITORING_DIR/backups/"*.tar.gz 2>/dev/null || print_warning "No backups found"
        exit 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_status "Restoring monitoring from backup: $backup_file"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_verbose "Would restore from backup: $backup_file"
        return
    fi
    
    # Stop services
    stop_monitoring
    
    # Extract backup
    local temp_dir
    temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Restore files
    local backup_dir
    backup_dir=$(find "$temp_dir" -maxdepth 1 -type d -name "monitoring-backup-*" | head -1)
    
    if [[ -n "$backup_dir" ]]; then
        # Restore configuration
        cp -r "$backup_dir"/{prometheus,grafana,alertmanager,logstash,filebeat} "$MONITORING_DIR/" 2>/dev/null || true
        
        # Restore data
        cp -r "$backup_dir/data" "$MONITORING_DIR/" 2>/dev/null || true
        
        print_success "Monitoring restored from backup"
    else
        print_error "Invalid backup file format"
        exit 1
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
}

# Main function
main() {
    local command="setup"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN="true"
                shift
                ;;
            -v|--verbose)
                VERBOSE="true"
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            --grafana-password)
                GRAFANA_ADMIN_PASSWORD="$2"
                shift 2
                ;;
            --elastic-password)
                ELASTICSEARCH_PASSWORD="$2"
                shift 2
                ;;
            --kibana-password)
                KIBANA_PASSWORD="$2"
                shift 2
                ;;
            --skip-deps)
                SKIP_DEPS="true"
                shift
                ;;
            --force)
                FORCE="true"
                shift
                ;;
            setup|start|stop|restart|status|logs|cleanup|reset|backup|restore)
                command="$1"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Check prerequisites (unless skipped)
    if [[ "${SKIP_DEPS:-false}" != "true" ]]; then
        check_prerequisites
    fi
    
    # Execute command
    case $command in
        setup)
            setup_monitoring
            ;;
        start)
            start_monitoring
            ;;
        stop)
            stop_monitoring
            ;;
        restart)
            restart_monitoring
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$@"
            ;;
        cleanup)
            cleanup_monitoring
            ;;
        reset)
            reset_monitoring
            ;;
        backup)
            backup_monitoring
            ;;
        restore)
            restore_monitoring "$@"
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"