#!/bin/bash

# RemoteHive Rollback Script
# Handles emergency rollbacks for Docker Compose and Kubernetes deployments
# Usage: ./rollback.sh [docker|k8s] [environment] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PLATFORM="docker"
ENVIRONMENT="prod"
NAMESPACE="remotehive"
TARGET_VERSION=""
BACKUP_DATA=true
FORCE_ROLLBACK=false
DRY_RUN=false
VERBOSE=false
ROLLBACK_TIMEOUT=300

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
ROLLBACK_LOG="$BACKUP_DIR/rollback-$(date +%Y%m%d-%H%M%S).log"

# Logging functions
log_info() {
    local message="$1"
    echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$ROLLBACK_LOG"
}

log_success() {
    local message="$1"
    echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$ROLLBACK_LOG"
}

log_warning() {
    local message="$1"
    echo -e "${YELLOW}[WARNING]${NC} $message" | tee -a "$ROLLBACK_LOG"
}

log_error() {
    local message="$1"
    echo -e "${RED}[ERROR]${NC} $message" | tee -a "$ROLLBACK_LOG"
}

log_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        local message="$1"
        echo -e "${BLUE}[VERBOSE]${NC} $message" | tee -a "$ROLLBACK_LOG"
    fi
}

# Help function
show_help() {
    cat << EOF
RemoteHive Rollback Script

Usage: $0 [PLATFORM] [ENVIRONMENT] [OPTIONS]

PLATFORM:
    docker      Rollback Docker Compose deployment (default)
    k8s         Rollback Kubernetes deployment

ENVIRONMENT:
    dev         Development environment
    staging     Staging environment
    prod        Production environment (default)

OPTIONS:
    -v, --version VERSION        Target version to rollback to (required)
    -n, --namespace NAMESPACE    Kubernetes namespace (default: remotehive)
    --no-backup                  Skip data backup before rollback
    --force                      Force rollback without confirmation
    --timeout SECONDS            Rollback timeout in seconds (default: 300)
    --dry-run                    Show what would be rolled back
    --verbose                    Enable verbose logging
    -h, --help                   Show this help message

Examples:
    $0 docker prod -v v1.2.2                    # Rollback Docker to v1.2.2
    $0 k8s staging -v v1.1.0 --force           # Force rollback K8s to v1.1.0
    $0 docker prod -v v1.2.2 --no-backup       # Rollback without backup
    $0 k8s prod -v v1.1.0 --dry-run            # Show rollback plan

Environment Variables:
    DOCKER_REGISTRY     Docker registry URL
    KUBECONFIG          Kubernetes config file path
    ROLLBACK_TIMEOUT    Override default timeout

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            docker|k8s)
                PLATFORM="$1"
                shift
                ;;
            dev|staging|prod)
                ENVIRONMENT="$1"
                shift
                ;;
            -v|--version)
                TARGET_VERSION="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            --no-backup)
                BACKUP_DATA=false
                shift
                ;;
            --force)
                FORCE_ROLLBACK=true
                shift
                ;;
            --timeout)
                ROLLBACK_TIMEOUT="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Validate required arguments
    if [[ -z "$TARGET_VERSION" ]]; then
        log_error "Target version is required. Use -v or --version option."
        show_help
        exit 1
    fi
}

# Initialize backup directory and logging
init_logging() {
    mkdir -p "$BACKUP_DIR"
    
    log_info "RemoteHive Rollback Script Started"
    log_info "Timestamp: $(date)"
    log_info "Platform: $PLATFORM"
    log_info "Environment: $ENVIRONMENT"
    log_info "Target Version: $TARGET_VERSION"
    log_info "Backup Data: $BACKUP_DATA"
    log_info "Force Rollback: $FORCE_ROLLBACK"
    log_info "Dry Run: $DRY_RUN"
    log_info "Log File: $ROLLBACK_LOG"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose for docker platform
    if [[ "$PLATFORM" == "docker" ]]; then
        if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
            log_error "Docker Compose is not installed or not in PATH"
            exit 1
        fi
    fi
    
    # Check kubectl for k8s platform
    if [[ "$PLATFORM" == "k8s" ]]; then
        if ! command -v kubectl &> /dev/null; then
            log_error "kubectl is not installed or not in PATH"
            exit 1
        fi
        
        # Check cluster connectivity
        if ! kubectl cluster-info &> /dev/null; then
            log_error "Cannot connect to Kubernetes cluster"
            exit 1
        fi
    fi
    
    log_success "Prerequisites check passed"
}

# Get current deployment version
get_current_version() {
    log_info "Getting current deployment version..."
    
    local current_version="unknown"
    
    if [[ "$PLATFORM" == "docker" ]]; then
        # Try to get version from running container labels
        if command -v docker-compose &> /dev/null; then
            current_version=$(docker-compose ps -q backend 2>/dev/null | head -1 | xargs docker inspect --format '{{ index .Config.Labels "version" }}' 2>/dev/null || echo "unknown")
        else
            current_version=$(docker compose ps -q backend 2>/dev/null | head -1 | xargs docker inspect --format '{{ index .Config.Labels "version" }}' 2>/dev/null || echo "unknown")
        fi
    elif [[ "$PLATFORM" == "k8s" ]]; then
        # Get version from deployment image tag
        current_version=$(kubectl get deployment backend-api -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null | cut -d':' -f2 || echo "unknown")
    fi
    
    log_info "Current version: $current_version"
    echo "$current_version"
}

# Confirm rollback
confirm_rollback() {
    if [[ "$FORCE_ROLLBACK" == "true" || "$DRY_RUN" == "true" ]]; then
        return 0
    fi
    
    local current_version
    current_version=$(get_current_version)
    
    echo
    log_warning "ROLLBACK CONFIRMATION REQUIRED"
    echo "  Platform: $PLATFORM"
    echo "  Environment: $ENVIRONMENT"
    echo "  Current Version: $current_version"
    echo "  Target Version: $TARGET_VERSION"
    echo "  Backup Data: $BACKUP_DATA"
    echo
    
    read -p "Are you sure you want to proceed with the rollback? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
    
    log_info "Rollback confirmed by user"
}

# Backup current data
backup_data() {
    if [[ "$BACKUP_DATA" != "true" || "$DRY_RUN" == "true" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would backup current data"
        fi
        return 0
    fi
    
    log_info "Creating data backup before rollback..."
    
    local backup_timestamp
    backup_timestamp=$(date +%Y%m%d-%H%M%S)
    local data_backup_dir="$BACKUP_DIR/data-backup-$backup_timestamp"
    
    mkdir -p "$data_backup_dir"
    
    if [[ "$PLATFORM" == "docker" ]]; then
        # Backup Docker volumes
        log_info "Backing up Docker volumes..."
        
        # MongoDB data
        if docker volume ls | grep -q "mongodb_data"; then
            log_verbose "Backing up MongoDB data"
            docker run --rm -v mongodb_data:/data -v "$data_backup_dir":/backup alpine tar czf /backup/mongodb_data.tar.gz -C /data .
        fi
        
        # Redis data
        if docker volume ls | grep -q "redis_data"; then
            log_verbose "Backing up Redis data"
            docker run --rm -v redis_data:/data -v "$data_backup_dir":/backup alpine tar czf /backup/redis_data.tar.gz -C /data .
        fi
        
        # Celery beat data
        if docker volume ls | grep -q "celery_beat_data"; then
            log_verbose "Backing up Celery beat data"
            docker run --rm -v celery_beat_data:/data -v "$data_backup_dir":/backup alpine tar czf /backup/celery_beat_data.tar.gz -C /data .
        fi
        
    elif [[ "$PLATFORM" == "k8s" ]]; then
        # Backup Kubernetes persistent volumes
        log_info "Backing up Kubernetes persistent volumes..."
        
        # MongoDB backup
        log_verbose "Creating MongoDB backup"
        kubectl exec -n "$NAMESPACE" deployment/mongodb -- mongodump --out /tmp/backup
        kubectl cp "$NAMESPACE/$(kubectl get pods -n "$NAMESPACE" -l app=mongodb -o jsonpath='{.items[0].metadata.name}')":/tmp/backup "$data_backup_dir/mongodb-backup"
        
        # Redis backup
        log_verbose "Creating Redis backup"
        kubectl exec -n "$NAMESPACE" deployment/redis -- redis-cli BGSAVE
        kubectl cp "$NAMESPACE/$(kubectl get pods -n "$NAMESPACE" -l app=redis -o jsonpath='{.items[0].metadata.name}')":/data/dump.rdb "$data_backup_dir/redis-dump.rdb"
    fi
    
    log_success "Data backup completed: $data_backup_dir"
}

# Rollback Docker Compose deployment
rollback_docker() {
    log_info "Rolling back Docker Compose deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Determine compose file
    local compose_file="docker-compose.yml"
    case $ENVIRONMENT in
        "dev")
            compose_file="docker-compose.dev.yml"
            ;;
        "staging")
            compose_file="docker-compose.staging.yml"
            ;;
        "prod")
            compose_file="docker-compose.yml"
            ;;
    esac
    
    if [[ ! -f "$compose_file" ]]; then
        log_error "Compose file not found: $compose_file"
        exit 1
    fi
    
    # Export target version
    export REMOTEHIVE_VERSION="$TARGET_VERSION"
    export REMOTEHIVE_ENV="$ENVIRONMENT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would rollback using: $compose_file with version $TARGET_VERSION"
        return 0
    fi
    
    # Stop current services
    log_info "Stopping current services..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$compose_file" down
    else
        docker compose -f "$compose_file" down
    fi
    
    # Pull target version images
    log_info "Pulling target version images..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$compose_file" pull
    else
        docker compose -f "$compose_file" pull
    fi
    
    # Start services with target version
    log_info "Starting services with target version..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$compose_file" up -d
    else
        docker compose -f "$compose_file" up -d
    fi
    
    log_success "Docker Compose rollback completed"
}

# Rollback Kubernetes deployment
rollback_kubernetes() {
    log_info "Rolling back Kubernetes deployment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would rollback Kubernetes deployments to version $TARGET_VERSION"
        return 0
    fi
    
    # Get all deployments in namespace
    local deployments
    deployments=$(kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
    
    if [[ -z "$deployments" ]]; then
        log_error "No deployments found in namespace: $NAMESPACE"
        exit 1
    fi
    
    # Update each deployment with target version
    for deployment in $deployments; do
        log_info "Rolling back deployment: $deployment"
        
        # Get current image name without tag
        local image_name
        image_name=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' | cut -d':' -f1)
        
        # Update deployment with target version
        kubectl set image deployment/"$deployment" "$deployment"="$image_name:$TARGET_VERSION" -n "$NAMESPACE"
        
        log_verbose "Updated $deployment to use $image_name:$TARGET_VERSION"
    done
    
    # Wait for rollout to complete
    log_info "Waiting for rollback to complete..."
    for deployment in $deployments; do
        kubectl rollout status deployment/"$deployment" -n "$NAMESPACE" --timeout="${ROLLBACK_TIMEOUT}s"
    done
    
    log_success "Kubernetes rollback completed"
}

# Verify rollback
verify_rollback() {
    if [[ "$DRY_RUN" == "true" ]]; then
        return 0
    fi
    
    log_info "Verifying rollback..."
    
    local verification_failed=false
    
    if [[ "$PLATFORM" == "docker" ]]; then
        # Check Docker Compose services
        log_info "Checking Docker Compose services..."
        
        # Wait for services to be healthy
        local max_attempts=30
        local attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            log_verbose "Health check attempt $attempt/$max_attempts"
            
            if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
                log_success "Backend service is healthy"
                break
            fi
            
            if [[ $attempt -eq $max_attempts ]]; then
                log_error "Backend service health check failed"
                verification_failed=true
                break
            fi
            
            sleep 10
            ((attempt++))
        done
        
    elif [[ "$PLATFORM" == "k8s" ]]; then
        # Check Kubernetes deployments
        log_info "Checking Kubernetes deployments..."
        
        if ! kubectl wait --for=condition=available --timeout=300s deployment --all -n "$NAMESPACE"; then
            log_error "Some deployments are not ready"
            verification_failed=true
        fi
    fi
    
    # Verify version
    local current_version
    current_version=$(get_current_version)
    
    if [[ "$current_version" == "$TARGET_VERSION" ]]; then
        log_success "Version verification passed: $current_version"
    else
        log_error "Version verification failed. Expected: $TARGET_VERSION, Got: $current_version"
        verification_failed=true
    fi
    
    if [[ "$verification_failed" == "true" ]]; then
        log_error "Rollback verification failed"
        exit 1
    fi
    
    log_success "Rollback verification completed successfully"
}

# Show rollback status
show_status() {
    log_info "Rollback Status:"
    
    if [[ "$PLATFORM" == "docker" ]]; then
        echo
        log_info "Docker Compose Services:"
        if command -v docker-compose &> /dev/null; then
            docker-compose ps
        else
            docker compose ps
        fi
        
    elif [[ "$PLATFORM" == "k8s" ]]; then
        echo
        log_info "Kubernetes Deployments:"
        kubectl get deployments -n "$NAMESPACE" -o wide
        
        echo
        log_info "Pod Status:"
        kubectl get pods -n "$NAMESPACE"
    fi
}

# Cleanup function
cleanup() {
    log_info "Rollback script completed"
}

# Main rollback function
main() {
    init_logging
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Execute rollback steps
    check_prerequisites
    confirm_rollback
    backup_data
    
    if [[ "$PLATFORM" == "docker" ]]; then
        rollback_docker
    elif [[ "$PLATFORM" == "k8s" ]]; then
        rollback_kubernetes
    fi
    
    verify_rollback
    
    if [[ "$DRY_RUN" != "true" ]]; then
        show_status
    fi
    
    log_success "RemoteHive rollback completed successfully!"
    log_info "Rollback log saved to: $ROLLBACK_LOG"
}

# Parse arguments and run main function
parse_args "$@"
main