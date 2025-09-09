#!/bin/bash

# =============================================================================
# RemoteHive Enhanced Deployment Script
# =============================================================================
# This script provides comprehensive deployment automation for RemoteHive
# Supports both Docker Compose and Kubernetes deployments
# Author: RemoteHive DevOps Team
# Version: 2.0.0
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION AND VARIABLES
# =============================================================================

# Script metadata
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"
SCRIPT_VERSION="2.0.0"
LOG_FILE="${SCRIPT_DIR}/deployment-$(date +%Y%m%d-%H%M%S).log"

# Default configuration
DEFAULT_ENVIRONMENT="staging"
DEFAULT_DEPLOYMENT_TYPE="docker-compose"
DEFAULT_REGISTRY="ghcr.io"
DEFAULT_IMAGE_PREFIX="remotehive/remotehive"
DEFAULT_NAMESPACE="remotehive"
DEFAULT_DOMAIN="remotehive.local"

# Configuration variables
ENVIRONMENT="${ENVIRONMENT:-$DEFAULT_ENVIRONMENT}"
DEPLOYMENT_TYPE="${DEPLOYMENT_TYPE:-$DEFAULT_DEPLOYMENT_TYPE}"
REGISTRY="${REGISTRY:-$DEFAULT_REGISTRY}"
IMAGE_PREFIX="${IMAGE_PREFIX:-$DEFAULT_IMAGE_PREFIX}"
NAMESPACE="${NAMESPACE:-$DEFAULT_NAMESPACE}"
DOMAIN="${DOMAIN:-$DEFAULT_DOMAIN}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Feature flags
DRY_RUN=false
VERBOSE=false
FORCE=false
SKIP_BUILD=false
SKIP_PUSH=false
SKIP_TESTS=false
SKIP_BACKUP=false
HEALTH_CHECK_ONLY=false
ROLLBACK=false
CLEANUP_ONLY=false
MONITORING_ENABLED=true
SECURITY_SCAN=true

# Service configuration
declare -A SERVICES=(
    ["backend-api"]="8000"
    ["autoscraper-service"]="8001"
    ["admin-panel"]="3000"
    ["public-website"]="5173"
)

declare -A DATABASE_SERVICES=(
    ["mongodb"]="27017"
    ["redis"]="6379"
)

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Logging functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_debug() { [[ "$VERBOSE" == "true" ]] && log "DEBUG" "$@" || true; }

# Progress indicator
show_progress() {
    local message="$1"
    local duration="${2:-3}"
    
    echo -n "$message"
    for ((i=1; i<=duration; i++)); do
        echo -n "."
        sleep 1
    done
    echo " Done!"
}

# Error handling
handle_error() {
    local exit_code=$?
    local line_number=$1
    log_error "Script failed at line $line_number with exit code $exit_code"
    
    if [[ "$ROLLBACK" == "true" ]]; then
        log_info "Initiating rollback..."
        rollback_deployment
    fi
    
    cleanup_on_exit
    exit $exit_code
}

trap 'handle_error $LINENO' ERR

# Cleanup function
cleanup_on_exit() {
    log_info "Performing cleanup..."
    
    # Remove temporary files
    find "$SCRIPT_DIR" -name "*.tmp" -type f -delete 2>/dev/null || true
    
    # Clean up Docker resources if needed
    if [[ "$DEPLOYMENT_TYPE" == "docker-compose" ]]; then
        docker system prune -f --volumes 2>/dev/null || true
    fi
    
    log_info "Cleanup completed"
}

trap cleanup_on_exit EXIT

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

validate_environment() {
    log_info "Validating deployment environment..."
    
    case "$ENVIRONMENT" in
        development|staging|production)
            log_info "Environment '$ENVIRONMENT' is valid"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
            exit 1
            ;;
    esac
}

validate_deployment_type() {
    log_info "Validating deployment type..."
    
    case "$DEPLOYMENT_TYPE" in
        docker-compose|kubernetes)
            log_info "Deployment type '$DEPLOYMENT_TYPE' is valid"
            ;;
        *)
            log_error "Invalid deployment type: $DEPLOYMENT_TYPE. Must be one of: docker-compose, kubernetes"
            exit 1
            ;;
    esac
}

validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check required commands
    local required_commands=("docker" "curl" "jq")
    
    if [[ "$DEPLOYMENT_TYPE" == "docker-compose" ]]; then
        required_commands+=("docker-compose")
    elif [[ "$DEPLOYMENT_TYPE" == "kubernetes" ]]; then
        required_commands+=("kubectl" "helm")
    fi
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command '$cmd' not found"
            exit 1
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check Kubernetes cluster (if applicable)
    if [[ "$DEPLOYMENT_TYPE" == "kubernetes" ]]; then
        if ! kubectl cluster-info &> /dev/null; then
            log_error "Cannot connect to Kubernetes cluster"
            exit 1
        fi
    fi
    
    log_info "All prerequisites validated successfully"
}

validate_configuration() {
    log_info "Validating configuration files..."
    
    # Check environment file
    if [[ ! -f ".env.${ENVIRONMENT}" ]] && [[ ! -f ".env" ]]; then
        log_error "Environment configuration file not found"
        exit 1
    fi
    
    # Check deployment files
    if [[ "$DEPLOYMENT_TYPE" == "docker-compose" ]]; then
        if [[ ! -f "docker-compose.yml" ]]; then
            log_error "docker-compose.yml not found"
            exit 1
        fi
    elif [[ "$DEPLOYMENT_TYPE" == "kubernetes" ]]; then
        if [[ ! -d "k8s" ]]; then
            log_error "Kubernetes manifests directory 'k8s' not found"
            exit 1
        fi
    fi
    
    log_info "Configuration validation completed"
}

# =============================================================================
# SECURITY FUNCTIONS
# =============================================================================

run_security_scan() {
    if [[ "$SECURITY_SCAN" != "true" ]]; then
        log_info "Security scan disabled, skipping..."
        return 0
    fi
    
    log_info "Running security vulnerability scan..."
    
    # Scan Docker images
    for service in "${!SERVICES[@]}"; do
        local image="${REGISTRY}/${IMAGE_PREFIX}-${service}:${IMAGE_TAG}"
        
        log_info "Scanning image: $image"
        
        if command -v trivy &> /dev/null; then
            trivy image --severity HIGH,CRITICAL "$image" || {
                log_warn "Security vulnerabilities found in $image"
                if [[ "$FORCE" != "true" ]]; then
                    log_error "Deployment aborted due to security vulnerabilities. Use --force to override."
                    exit 1
                fi
            }
        else
            log_warn "Trivy not installed, skipping image security scan"
        fi
    done
    
    log_info "Security scan completed"
}

validate_secrets() {
    log_info "Validating secrets and sensitive configuration..."
    
    local env_file=".env.${ENVIRONMENT}"
    [[ ! -f "$env_file" ]] && env_file=".env"
    
    if [[ -f "$env_file" ]]; then
        # Check for placeholder values
        local placeholders=("changeme" "your-secret" "your-key" "localhost" "example.com")
        
        for placeholder in "${placeholders[@]}"; do
            if grep -q "$placeholder" "$env_file"; then
                log_warn "Found placeholder value '$placeholder' in $env_file"
                if [[ "$ENVIRONMENT" == "production" ]]; then
                    log_error "Placeholder values not allowed in production"
                    exit 1
                fi
            fi
        done
    fi
    
    log_info "Secrets validation completed"
}

# =============================================================================
# BACKUP FUNCTIONS
# =============================================================================

create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log_info "Backup disabled, skipping..."
        return 0
    fi
    
    log_info "Creating backup before deployment..."
    
    local backup_dir="backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    if [[ "$DEPLOYMENT_TYPE" == "docker-compose" ]]; then
        # Backup Docker volumes
        log_info "Backing up Docker volumes..."
        
        for volume in $(docker volume ls -q | grep remotehive); do
            log_debug "Backing up volume: $volume"
            docker run --rm -v "$volume:/data" -v "$(pwd)/$backup_dir:/backup" alpine tar czf "/backup/${volume}.tar.gz" -C /data . || {
                log_warn "Failed to backup volume: $volume"
            }
        done
        
    elif [[ "$DEPLOYMENT_TYPE" == "kubernetes" ]]; then
        # Backup Kubernetes resources
        log_info "Backing up Kubernetes resources..."
        
        kubectl get all -n "$NAMESPACE" -o yaml > "$backup_dir/k8s-resources.yaml" || {
            log_warn "Failed to backup Kubernetes resources"
        }
        
        # Backup persistent volumes
        kubectl get pv -o yaml > "$backup_dir/persistent-volumes.yaml" || {
            log_warn "Failed to backup persistent volumes"
        }
    fi
    
    log_info "Backup created in: $backup_dir"
}

rollback_deployment() {
    log_info "Rolling back deployment..."
    
    if [[ "$DEPLOYMENT_TYPE" == "docker-compose" ]]; then
        log_info "Rolling back Docker Compose deployment..."
        
        # Stop current services
        docker-compose down || true
        
        # Restore from backup (if available)
        local latest_backup=$(find backups -type d -name "*" | sort -r | head -n1)
        if [[ -n "$latest_backup" ]]; then
            log_info "Restoring from backup: $latest_backup"
            # Restore volumes from backup
            for backup_file in "$latest_backup"/*.tar.gz; do
                if [[ -f "$backup_file" ]]; then
                    local volume_name=$(basename "$backup_file" .tar.gz)
                    log_debug "Restoring volume: $volume_name"
                    docker run --rm -v "$volume_name:/data" -v "$(pwd)/$backup_file:/backup.tar.gz" alpine sh -c "cd /data && tar xzf /backup.tar.gz" || {
                        log_warn "Failed to restore volume: $volume_name"
                    }
                fi
            done
        fi
        
    elif [[ "$DEPLOYMENT_TYPE" == "kubernetes" ]]; then
        log_info "Rolling back Kubernetes deployment..."
        
        # Rollback deployments
        for service in "${!SERVICES[@]}"; do
            kubectl rollout undo deployment/"$service" -n "$NAMESPACE" || {
                log_warn "Failed to rollback deployment: $service"
            }
        done
    fi
    
    log_info "Rollback completed"
}

# =============================================================================
# BUILD AND PUSH FUNCTIONS
# =============================================================================

build_images() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        log_info "Build disabled, skipping..."
        return 0
    fi
    
    log_info "Building Docker images..."
    
    # Build backend API
    log_info "Building backend-api image..."
    docker build -t "${REGISTRY}/${IMAGE_PREFIX}-backend-api:${IMAGE_TAG}" . || {
        log_error "Failed to build backend-api image"
        exit 1
    }
    
    # Build autoscraper service
    log_info "Building autoscraper-service image..."
    docker build -t "${REGISTRY}/${IMAGE_PREFIX}-autoscraper-service:${IMAGE_TAG}" autoscraper-service/ || {
        log_error "Failed to build autoscraper-service image"
        exit 1
    }
    
    # Build admin panel
    log_info "Building admin-panel image..."
    docker build -t "${REGISTRY}/${IMAGE_PREFIX}-admin-panel:${IMAGE_TAG}" remotehive-admin/ || {
        log_error "Failed to build admin-panel image"
        exit 1
    }
    
    # Build public website
    log_info "Building public-website image..."
    docker build -t "${REGISTRY}/${IMAGE_PREFIX}-public-website:${IMAGE_TAG}" remotehive-public/ || {
        log_error "Failed to build public-website image"
        exit 1
    }
    
    log_info "All images built successfully"
}

push_images() {
    if [[ "$SKIP_PUSH" == "true" ]]; then
        log_info "Push disabled, skipping..."
        return 0
    fi
    
    log_info "Pushing Docker images to registry..."
    
    for service in "${!SERVICES[@]}"; do
        local image="${REGISTRY}/${IMAGE_PREFIX}-${service}:${IMAGE_TAG}"
        log_info "Pushing image: $image"
        
        docker push "$image" || {
            log_error "Failed to push image: $image"
            exit 1
        }
    done
    
    log_info "All images pushed successfully"
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

deploy_docker_compose() {
    log_info "Deploying with Docker Compose..."
    
    # Set environment file
    local env_file=".env.${ENVIRONMENT}"
    [[ ! -f "$env_file" ]] && env_file=".env"
    
    # Export environment variables
    if [[ -f "$env_file" ]]; then
        log_info "Loading environment from: $env_file"
        set -a
        source "$env_file"
        set +a
    fi
    
    # Set image tags
    export BACKEND_API_IMAGE="${REGISTRY}/${IMAGE_PREFIX}-backend-api:${IMAGE_TAG}"
    export AUTOSCRAPER_SERVICE_IMAGE="${REGISTRY}/${IMAGE_PREFIX}-autoscraper-service:${IMAGE_TAG}"
    export ADMIN_PANEL_IMAGE="${REGISTRY}/${IMAGE_PREFIX}-admin-panel:${IMAGE_TAG}"
    export PUBLIC_WEBSITE_IMAGE="${REGISTRY}/${IMAGE_PREFIX}-public-website:${IMAGE_TAG}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry run mode - would execute: docker-compose up -d"
        return 0
    fi
    
    # Pull latest images
    log_info "Pulling latest images..."
    docker-compose pull || {
        log_warn "Failed to pull some images, continuing with local images"
    }
    
    # Deploy services
    log_info "Starting services..."
    docker-compose up -d || {
        log_error "Failed to start services"
        exit 1
    }
    
    # Wait for services to be ready
    wait_for_services_docker_compose
    
    log_info "Docker Compose deployment completed successfully"
}

deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry run mode - would apply Kubernetes manifests"
        kubectl apply --dry-run=client -f k8s/ || {
            log_error "Kubernetes manifest validation failed"
            exit 1
        }
        return 0
    fi
    
    # Create namespace if it doesn't exist
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f - || {
        log_info "Namespace '$NAMESPACE' already exists or failed to create"
    }
    
    # Apply Kubernetes manifests
    log_info "Applying Kubernetes manifests..."
    
    # Apply in order: namespace, configmaps/secrets, persistent volumes, databases, services, ingress
    local manifest_order=(
        "k8s/namespace.yaml"
        "k8s/configmaps-secrets.yaml"
        "k8s/persistent-volumes.yaml"
        "k8s/mongodb.yaml"
        "k8s/redis.yaml"
        "k8s/backend-api.yaml"
        "k8s/autoscraper-service.yaml"
        "k8s/admin-panel.yaml"
        "k8s/public-website.yaml"
        "k8s/celery-workers.yaml"
        "k8s/ingress.yaml"
    )
    
    for manifest in "${manifest_order[@]}"; do
        if [[ -f "$manifest" ]]; then
            log_info "Applying manifest: $manifest"
            kubectl apply -f "$manifest" || {
                log_error "Failed to apply manifest: $manifest"
                exit 1
            }
        else
            log_warn "Manifest not found: $manifest"
        fi
    done
    
    # Wait for deployments to be ready
    wait_for_services_kubernetes
    
    # Deploy monitoring if enabled
    if [[ "$MONITORING_ENABLED" == "true" ]]; then
        deploy_monitoring_kubernetes
    fi
    
    log_info "Kubernetes deployment completed successfully"
}

deploy_monitoring_kubernetes() {
    log_info "Deploying monitoring stack..."
    
    # Create monitoring namespace
    kubectl create namespace "${NAMESPACE}-monitoring" --dry-run=client -o yaml | kubectl apply -f - || {
        log_info "Monitoring namespace already exists or failed to create"
    }
    
    # Apply monitoring manifests
    if [[ -d "k8s/monitoring" ]]; then
        kubectl apply -f k8s/monitoring/ || {
            log_warn "Failed to deploy some monitoring components"
        }
        
        # Wait for monitoring services
        kubectl rollout status deployment/prometheus -n "${NAMESPACE}-monitoring" --timeout=300s || {
            log_warn "Prometheus deployment timeout"
        }
        
        kubectl rollout status deployment/grafana -n "${NAMESPACE}-monitoring" --timeout=300s || {
            log_warn "Grafana deployment timeout"
        }
        
        log_info "Monitoring stack deployed successfully"
    else
        log_warn "Monitoring manifests not found in k8s/monitoring/"
    fi
}

# =============================================================================
# HEALTH CHECK FUNCTIONS
# =============================================================================

wait_for_services_docker_compose() {
    log_info "Waiting for Docker Compose services to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        local all_healthy=true
        
        for service in "${!SERVICES[@]}"; do
            local port="${SERVICES[$service]}"
            
            if ! curl -f -s "http://localhost:${port}/health" > /dev/null 2>&1; then
                log_debug "Service $service (port $port) not ready yet"
                all_healthy=false
            else
                log_debug "Service $service (port $port) is healthy"
            fi
        done
        
        if [[ "$all_healthy" == "true" ]]; then
            log_info "All services are healthy!"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "Services failed to become healthy within timeout"
    return 1
}

wait_for_services_kubernetes() {
    log_info "Waiting for Kubernetes services to be ready..."
    
    # Wait for deployments to be ready
    for service in "${!SERVICES[@]}"; do
        log_info "Waiting for deployment/$service to be ready..."
        kubectl rollout status deployment/"$service" -n "$NAMESPACE" --timeout=600s || {
            log_error "Deployment $service failed to become ready"
            return 1
        }
    done
    
    # Additional health checks
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        local all_healthy=true
        
        for service in "${!SERVICES[@]}"; do
            local pod_name=$(kubectl get pods -n "$NAMESPACE" -l app="$service" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
            
            if [[ -n "$pod_name" ]]; then
                if ! kubectl exec -n "$NAMESPACE" "$pod_name" -- curl -f -s "http://localhost:${SERVICES[$service]}/health" > /dev/null 2>&1; then
                    log_debug "Service $service not ready yet"
                    all_healthy=false
                else
                    log_debug "Service $service is healthy"
                fi
            else
                log_debug "Pod for service $service not found"
                all_healthy=false
            fi
        done
        
        if [[ "$all_healthy" == "true" ]]; then
            log_info "All services are healthy!"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "Services failed to become healthy within timeout"
    return 1
}

run_health_checks() {
    log_info "Running comprehensive health checks..."
    
    if [[ "$DEPLOYMENT_TYPE" == "docker-compose" ]]; then
        run_health_checks_docker_compose
    elif [[ "$DEPLOYMENT_TYPE" == "kubernetes" ]]; then
        run_health_checks_kubernetes
    fi
}

run_health_checks_docker_compose() {
    log_info "Running Docker Compose health checks..."
    
    # Check service status
    log_info "Checking service status..."
    docker-compose ps
    
    # Test API endpoints
    for service in "${!SERVICES[@]}"; do
        local port="${SERVICES[$service]}"
        local url="http://localhost:${port}"
        
        log_info "Testing $service at $url"
        
        # Health endpoint
        if curl -f -s "${url}/health" > /dev/null; then
            log_info "✓ $service health check passed"
        else
            log_error "✗ $service health check failed"
        fi
        
        # API endpoint (if applicable)
        if [[ "$service" == "backend-api" ]]; then
            if curl -f -s "${url}/api/v1/health" > /dev/null; then
                log_info "✓ $service API endpoint accessible"
            else
                log_warn "✗ $service API endpoint not accessible"
            fi
        fi
    done
    
    # Check database connectivity
    log_info "Checking database connectivity..."
    
    # MongoDB
    if docker-compose exec -T backend-api python -c "from app.database.database import get_database; print('MongoDB connected:', get_database() is not None)" 2>/dev/null; then
        log_info "✓ MongoDB connectivity check passed"
    else
        log_warn "✗ MongoDB connectivity check failed"
    fi
    
    # Redis
    if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
        log_info "✓ Redis connectivity check passed"
    else
        log_warn "✗ Redis connectivity check failed"
    fi
}

run_health_checks_kubernetes() {
    log_info "Running Kubernetes health checks..."
    
    # Check pod status
    log_info "Checking pod status..."
    kubectl get pods -n "$NAMESPACE" -o wide
    
    # Check service status
    log_info "Checking service status..."
    kubectl get services -n "$NAMESPACE"
    
    # Check ingress status
    log_info "Checking ingress status..."
    kubectl get ingress -n "$NAMESPACE" || log_warn "No ingress found"
    
    # Test service endpoints
    for service in "${!SERVICES[@]}"; do
        local port="${SERVICES[$service]}"
        
        log_info "Testing $service (port $port)"
        
        # Port forward and test
        kubectl port-forward -n "$NAMESPACE" "service/$service" "$port:$port" &
        local pf_pid=$!
        
        sleep 5
        
        if curl -f -s "http://localhost:${port}/health" > /dev/null; then
            log_info "✓ $service health check passed"
        else
            log_warn "✗ $service health check failed"
        fi
        
        kill $pf_pid 2>/dev/null || true
    done
}

# =============================================================================
# TESTING FUNCTIONS
# =============================================================================

run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_info "Tests disabled, skipping..."
        return 0
    fi
    
    log_info "Running integration tests..."
    
    # Backend tests
    if [[ -f "pytest.ini" ]] && [[ -d "app/tests" ]]; then
        log_info "Running backend tests..."
        python -m pytest app/tests/ -v --tb=short || {
            log_error "Backend tests failed"
            if [[ "$FORCE" != "true" ]]; then
                exit 1
            fi
        }
    fi
    
    # Frontend tests
    for frontend_app in "remotehive-admin" "remotehive-public"; do
        if [[ -d "$frontend_app" ]] && [[ -f "$frontend_app/package.json" ]]; then
            log_info "Running tests for $frontend_app..."
            (cd "$frontend_app" && npm test -- --watchAll=false) || {
                log_error "Tests failed for $frontend_app"
                if [[ "$FORCE" != "true" ]]; then
                    exit 1
                fi
            }
        fi
    done
    
    log_info "All tests completed successfully"
}

# =============================================================================
# CLEANUP FUNCTIONS
# =============================================================================

cleanup_deployment() {
    log_info "Cleaning up deployment resources..."
    
    if [[ "$DEPLOYMENT_TYPE" == "docker-compose" ]]; then
        log_info "Stopping Docker Compose services..."
        docker-compose down --volumes --remove-orphans || true
        
        # Clean up unused images
        docker image prune -f || true
        
    elif [[ "$DEPLOYMENT_TYPE" == "kubernetes" ]]; then
        log_info "Cleaning up Kubernetes resources..."
        
        # Delete namespace (this will delete all resources in the namespace)
        kubectl delete namespace "$NAMESPACE" --ignore-not-found=true || true
        
        # Clean up monitoring namespace
        kubectl delete namespace "${NAMESPACE}-monitoring" --ignore-not-found=true || true
    fi
    
    log_info "Cleanup completed"
}

# =============================================================================
# MAIN FUNCTIONS
# =============================================================================

show_usage() {
    cat << EOF
Usage: $SCRIPT_NAME [OPTIONS]

RemoteHive Enhanced Deployment Script v$SCRIPT_VERSION

OPTIONS:
    -e, --environment ENV       Deployment environment (development|staging|production) [default: $DEFAULT_ENVIRONMENT]
    -t, --deployment-type TYPE  Deployment type (docker-compose|kubernetes) [default: $DEFAULT_DEPLOYMENT_TYPE]
    -r, --registry REGISTRY     Docker registry [default: $DEFAULT_REGISTRY]
    -p, --image-prefix PREFIX   Image prefix [default: $DEFAULT_IMAGE_PREFIX]
    -n, --namespace NAMESPACE   Kubernetes namespace [default: $DEFAULT_NAMESPACE]
    -d, --domain DOMAIN         Application domain [default: $DEFAULT_DOMAIN]
    -g, --image-tag TAG         Docker image tag [default: latest]
    
    --dry-run                   Show what would be done without executing
    --verbose                   Enable verbose logging
    --force                     Force deployment (skip validations)
    --skip-build                Skip Docker image building
    --skip-push                 Skip Docker image pushing
    --skip-tests                Skip running tests
    --skip-backup               Skip creating backup
    --health-check-only         Only run health checks
    --rollback                  Rollback to previous deployment
    --cleanup-only              Only cleanup resources
    --no-monitoring             Disable monitoring stack deployment
    --no-security-scan          Disable security vulnerability scanning
    
    -h, --help                  Show this help message
    -v, --version               Show script version

EXAMPLES:
    # Deploy to staging with Docker Compose
    $SCRIPT_NAME --environment staging --deployment-type docker-compose
    
    # Deploy to production with Kubernetes
    $SCRIPT_NAME --environment production --deployment-type kubernetes
    
    # Dry run deployment
    $SCRIPT_NAME --dry-run --verbose
    
    # Force deployment without tests
    $SCRIPT_NAME --force --skip-tests
    
    # Rollback deployment
    $SCRIPT_NAME --rollback
    
    # Cleanup resources
    $SCRIPT_NAME --cleanup-only
    
    # Health check only
    $SCRIPT_NAME --health-check-only

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -t|--deployment-type)
                DEPLOYMENT_TYPE="$2"
                shift 2
                ;;
            -r|--registry)
                REGISTRY="$2"
                shift 2
                ;;
            -p|--image-prefix)
                IMAGE_PREFIX="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -g|--image-tag)
                IMAGE_TAG="$2"
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
            --force)
                FORCE=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-push)
                SKIP_PUSH=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --health-check-only)
                HEALTH_CHECK_ONLY=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            --cleanup-only)
                CLEANUP_ONLY=true
                shift
                ;;
            --no-monitoring)
                MONITORING_ENABLED=false
                shift
                ;;
            --no-security-scan)
                SECURITY_SCAN=false
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -v|--version)
                echo "$SCRIPT_NAME version $SCRIPT_VERSION"
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

main() {
    log_info "Starting RemoteHive deployment script v$SCRIPT_VERSION"
    log_info "Environment: $ENVIRONMENT"
    log_info "Deployment Type: $DEPLOYMENT_TYPE"
    log_info "Registry: $REGISTRY"
    log_info "Image Prefix: $IMAGE_PREFIX"
    log_info "Namespace: $NAMESPACE"
    log_info "Domain: $DOMAIN"
    log_info "Image Tag: $IMAGE_TAG"
    log_info "Log File: $LOG_FILE"
    
    # Handle special modes
    if [[ "$CLEANUP_ONLY" == "true" ]]; then
        cleanup_deployment
        exit 0
    fi
    
    if [[ "$ROLLBACK" == "true" ]]; then
        rollback_deployment
        exit 0
    fi
    
    if [[ "$HEALTH_CHECK_ONLY" == "true" ]]; then
        run_health_checks
        exit 0
    fi
    
    # Validation phase
    log_info "=== VALIDATION PHASE ==="
    validate_environment
    validate_deployment_type
    validate_prerequisites
    validate_configuration
    validate_secrets
    
    # Security phase
    if [[ "$SECURITY_SCAN" == "true" ]]; then
        log_info "=== SECURITY PHASE ==="
        run_security_scan
    fi
    
    # Backup phase
    log_info "=== BACKUP PHASE ==="
    create_backup
    
    # Build phase
    log_info "=== BUILD PHASE ==="
    build_images
    push_images
    
    # Test phase
    log_info "=== TEST PHASE ==="
    run_tests
    
    # Deployment phase
    log_info "=== DEPLOYMENT PHASE ==="
    if [[ "$DEPLOYMENT_TYPE" == "docker-compose" ]]; then
        deploy_docker_compose
    elif [[ "$DEPLOYMENT_TYPE" == "kubernetes" ]]; then
        deploy_kubernetes
    fi
    
    # Health check phase
    log_info "=== HEALTH CHECK PHASE ==="
    run_health_checks
    
    log_info "=== DEPLOYMENT COMPLETED SUCCESSFULLY ==="
    log_info "Environment: $ENVIRONMENT"
    log_info "Deployment Type: $DEPLOYMENT_TYPE"
    log_info "Services deployed: ${!SERVICES[*]}"
    log_info "Log file: $LOG_FILE"
    
    if [[ "$DEPLOYMENT_TYPE" == "docker-compose" ]]; then
        log_info "Access URLs:"
        for service in "${!SERVICES[@]}"; do
            log_info "  $service: http://localhost:${SERVICES[$service]}"
        done
    elif [[ "$DEPLOYMENT_TYPE" == "kubernetes" ]]; then
        log_info "Kubernetes resources deployed in namespace: $NAMESPACE"
        log_info "Use 'kubectl get all -n $NAMESPACE' to view resources"
    fi
}

# =============================================================================
# SCRIPT ENTRY POINT
# =============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_arguments "$@"
    main
fi