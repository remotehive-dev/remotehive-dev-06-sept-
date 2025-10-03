#!/bin/bash

# RemoteHive Kubernetes Deployment Script
# This script handles complete deployment of RemoteHive to Kubernetes
# Supports development, staging, and production environments

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$SCRIPT_DIR"
MANIFESTS_DIR="$K8S_DIR/manifests"
CONFIGS_DIR="$K8S_DIR/configs"
SECRETS_DIR="$K8S_DIR/secrets"

# Default values
ENVIRONMENT="development"
NAMESPACE="remotehive"
REGISTRY=""
TAG="latest"
DOMAIN=""
DRY_RUN=false
VERBOSE=false
FORCE=false
SKIP_BUILD=false
SKIP_PUSH=false
SKIP_TESTS=false
WAIT_TIMEOUT=600
KUBECTL_TIMEOUT=300

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Logging functions
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
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1"
    fi
}

# Progress indicator
show_progress() {
    local pid=$1
    local message=$2
    local spin='-\|/'
    local i=0
    
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) %4 ))
        printf "\r${CYAN}[${spin:$i:1}]${NC} $message"
        sleep 0.1
    done
    printf "\r${GREEN}[✓]${NC} $message\n"
}

# Error handling
error_exit() {
    log_error "$1"
    exit 1
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add cleanup logic here
}

# Set up trap for cleanup
trap cleanup EXIT

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("kubectl" "docker" "helm")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error_exit "Required command '$cmd' not found. Please install it first."
        fi
        log_debug "Found command: $cmd"
    done
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        error_exit "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error_exit "Docker daemon is not running. Please start Docker first."
    fi
    
    log_success "All prerequisites satisfied"
}

# Validate environment
validate_environment() {
    log_info "Validating environment configuration..."
    
    case "$ENVIRONMENT" in
        development|staging|production)
            log_debug "Environment: $ENVIRONMENT"
            ;;
        *)
            error_exit "Invalid environment: $ENVIRONMENT. Must be development, staging, or production."
            ;;
    esac
    
    # Check required environment variables for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if [[ -z "$REGISTRY" ]]; then
            error_exit "Registry must be specified for production deployment"
        fi
        if [[ -z "$DOMAIN" ]]; then
            error_exit "Domain must be specified for production deployment"
        fi
    fi
    
    # Validate namespace
    if [[ ! "$NAMESPACE" =~ ^[a-z0-9]([-a-z0-9]*[a-z0-9])?$ ]]; then
        error_exit "Invalid namespace: $NAMESPACE. Must be a valid Kubernetes namespace name."
    fi
    
    log_success "Environment validation passed"
}

# Check if namespace exists
check_namespace() {
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_debug "Namespace '$NAMESPACE' exists"
        return 0
    else
        log_debug "Namespace '$NAMESPACE' does not exist"
        return 1
    fi
}

# =============================================================================
# KUBERNETES FUNCTIONS
# =============================================================================

# Create namespace
create_namespace() {
    log_info "Creating namespace '$NAMESPACE'..."
    
    if check_namespace; then
        log_warning "Namespace '$NAMESPACE' already exists"
        return 0
    fi
    
    kubectl create namespace "$NAMESPACE"
    kubectl label namespace "$NAMESPACE" environment="$ENVIRONMENT"
    
    log_success "Namespace '$NAMESPACE' created"
}

# Apply ConfigMaps
apply_configmaps() {
    log_info "Applying ConfigMaps..."
    
    local config_files=("$CONFIGS_DIR"/*.yaml)
    if [[ ${#config_files[@]} -eq 0 ]] || [[ ! -f "${config_files[0]}" ]]; then
        log_warning "No ConfigMap files found in $CONFIGS_DIR"
        return 0
    fi
    
    for config_file in "${config_files[@]}"; do
        if [[ -f "$config_file" ]]; then
            log_debug "Applying ConfigMap: $(basename "$config_file")"
            kubectl apply -f "$config_file" -n "$NAMESPACE"
        fi
    done
    
    log_success "ConfigMaps applied"
}

# Apply Secrets
apply_secrets() {
    log_info "Applying Secrets..."
    
    local secret_files=("$SECRETS_DIR"/*.yaml)
    if [[ ${#secret_files[@]} -eq 0 ]] || [[ ! -f "${secret_files[0]}" ]]; then
        log_warning "No Secret files found in $SECRETS_DIR"
        return 0
    fi
    
    for secret_file in "${secret_files[@]}"; do
        if [[ -f "$secret_file" ]]; then
            log_debug "Applying Secret: $(basename "$secret_file")"
            kubectl apply -f "$secret_file" -n "$NAMESPACE"
        fi
    done
    
    log_success "Secrets applied"
}

# Apply PersistentVolumes
apply_persistent_volumes() {
    log_info "Applying PersistentVolumes..."
    
    local pv_files=("$MANIFESTS_DIR"/pv-*.yaml "$MANIFESTS_DIR"/pvc-*.yaml)
    local applied=false
    
    for pv_file in "${pv_files[@]}"; do
        if [[ -f "$pv_file" ]]; then
            log_debug "Applying PV/PVC: $(basename "$pv_file")"
            kubectl apply -f "$pv_file" -n "$NAMESPACE"
            applied=true
        fi
    done
    
    if [[ "$applied" == "true" ]]; then
        log_success "PersistentVolumes applied"
    else
        log_warning "No PersistentVolume files found"
    fi
}

# Deploy services
deploy_services() {
    log_info "Deploying services..."
    
    # Define deployment order
    local services=("mongodb" "redis" "backend" "autoscraper" "celery-worker" "celery-beat" "admin" "public" "nginx")
    
    for service in "${services[@]}"; do
        deploy_service "$service"
    done
    
    log_success "All services deployed"
}

# Deploy individual service
deploy_service() {
    local service=$1
    log_info "Deploying service: $service"
    
    # Apply deployment
    local deployment_file="$MANIFESTS_DIR/deployment-$service.yaml"
    if [[ -f "$deployment_file" ]]; then
        kubectl apply -f "$deployment_file" -n "$NAMESPACE"
        log_debug "Applied deployment for $service"
    else
        log_warning "Deployment file not found for $service: $deployment_file"
    fi
    
    # Apply service
    local service_file="$MANIFESTS_DIR/service-$service.yaml"
    if [[ -f "$service_file" ]]; then
        kubectl apply -f "$service_file" -n "$NAMESPACE"
        log_debug "Applied service for $service"
    else
        log_debug "Service file not found for $service (may not be needed)"
    fi
    
    # Apply HPA if exists
    local hpa_file="$MANIFESTS_DIR/hpa-$service.yaml"
    if [[ -f "$hpa_file" ]]; then
        kubectl apply -f "$hpa_file" -n "$NAMESPACE"
        log_debug "Applied HPA for $service"
    fi
}

# Apply Ingress
apply_ingress() {
    log_info "Applying Ingress..."
    
    local ingress_files=("$MANIFESTS_DIR"/ingress-*.yaml)
    local applied=false
    
    for ingress_file in "${ingress_files[@]}"; do
        if [[ -f "$ingress_file" ]]; then
            # Replace domain placeholder if specified
            if [[ -n "$DOMAIN" ]]; then
                sed "s/{{DOMAIN}}/$DOMAIN/g" "$ingress_file" | kubectl apply -f - -n "$NAMESPACE"
            else
                kubectl apply -f "$ingress_file" -n "$NAMESPACE"
            fi
            log_debug "Applied Ingress: $(basename "$ingress_file")"
            applied=true
        fi
    done
    
    if [[ "$applied" == "true" ]]; then
        log_success "Ingress applied"
    else
        log_warning "No Ingress files found"
    fi
}

# Wait for deployments
wait_for_deployments() {
    log_info "Waiting for deployments to be ready..."
    
    local deployments
    deployments=$(kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
    
    if [[ -z "$deployments" ]]; then
        log_warning "No deployments found in namespace $NAMESPACE"
        return 0
    fi
    
    for deployment in $deployments; do
        log_debug "Waiting for deployment: $deployment"
        if ! kubectl rollout status deployment/"$deployment" -n "$NAMESPACE" --timeout="${WAIT_TIMEOUT}s"; then
            log_error "Deployment $deployment failed to become ready"
            return 1
        fi
    done
    
    log_success "All deployments are ready"
}

# =============================================================================
# DOCKER FUNCTIONS
# =============================================================================

# Build Docker images
build_images() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        log_info "Skipping image build (--skip-build specified)"
        return 0
    fi
    
    log_info "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build main backend image
    log_debug "Building backend image..."
    docker build -t "${REGISTRY}remotehive-backend:${TAG}" -f Dockerfile.prod --target production .
    
    # Build autoscraper image
    log_debug "Building autoscraper image..."
    docker build -t "${REGISTRY}remotehive-autoscraper:${TAG}" -f autoscraper-engine-api/Dockerfile autoscraper-engine-api/
    
    # Build admin image
    log_debug "Building admin image..."
    docker build -t "${REGISTRY}remotehive-admin:${TAG}" -f admin-panel/Dockerfile admin-panel/
    
    # Build public image
    log_debug "Building public image..."
    docker build -t "${REGISTRY}remotehive-public:${TAG}" -f website/Dockerfile website/
    
    log_success "Docker images built successfully"
}

# Push Docker images
push_images() {
    if [[ "$SKIP_PUSH" == "true" ]]; then
        log_info "Skipping image push (--skip-push specified)"
        return 0
    fi
    
    if [[ -z "$REGISTRY" ]]; then
        log_warning "No registry specified, skipping image push"
        return 0
    fi
    
    log_info "Pushing Docker images to registry..."
    
    local images=("backend" "autoscraper" "admin" "public")
    
    for image in "${images[@]}"; do
        log_debug "Pushing image: ${REGISTRY}remotehive-${image}:${TAG}"
        docker push "${REGISTRY}remotehive-${image}:${TAG}"
    done
    
    log_success "Docker images pushed successfully"
}

# =============================================================================
# TESTING FUNCTIONS
# =============================================================================

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_info "Skipping tests (--skip-tests specified)"
        return 0
    fi
    
    log_info "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run backend tests
    log_debug "Running backend tests..."
    if [[ -f "pytest.ini" ]] || [[ -f "pyproject.toml" ]]; then
        python -m pytest tests/ -v --tb=short
    else
        log_warning "No pytest configuration found, skipping backend tests"
    fi
    
    # Run frontend tests
    log_debug "Running admin panel tests..."
    if [[ -f "admin-panel/package.json" ]]; then
        cd admin-panel
        npm test -- --watchAll=false
        cd ..
    fi
    
    log_debug "Running public website tests..."
    if [[ -f "website/package.json" ]]; then
        cd website
        npm test -- --watchAll=false
        cd ..
    fi
    
    log_success "All tests passed"
}

# =============================================================================
# MONITORING FUNCTIONS
# =============================================================================

# Check deployment health
check_health() {
    log_info "Checking deployment health..."
    
    # Check pod status
    log_debug "Checking pod status..."
    kubectl get pods -n "$NAMESPACE" -o wide
    
    # Check service status
    log_debug "Checking service status..."
    kubectl get services -n "$NAMESPACE"
    
    # Check ingress status
    log_debug "Checking ingress status..."
    kubectl get ingress -n "$NAMESPACE"
    
    # Check for failed pods
    local failed_pods
    failed_pods=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase=Failed -o jsonpath='{.items[*].metadata.name}')
    
    if [[ -n "$failed_pods" ]]; then
        log_error "Found failed pods: $failed_pods"
        return 1
    fi
    
    # Check for pending pods
    local pending_pods
    pending_pods=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase=Pending -o jsonpath='{.items[*].metadata.name}')
    
    if [[ -n "$pending_pods" ]]; then
        log_warning "Found pending pods: $pending_pods"
    fi
    
    log_success "Deployment health check completed"
}

# Show deployment status
show_status() {
    log_info "Deployment Status for namespace: $NAMESPACE"
    echo
    
    echo "Pods:"
    kubectl get pods -n "$NAMESPACE" -o wide
    echo
    
    echo "Services:"
    kubectl get services -n "$NAMESPACE"
    echo
    
    echo "Ingress:"
    kubectl get ingress -n "$NAMESPACE"
    echo
    
    echo "PersistentVolumeClaims:"
    kubectl get pvc -n "$NAMESPACE"
    echo
    
    if [[ "$VERBOSE" == "true" ]]; then
        echo "ConfigMaps:"
        kubectl get configmaps -n "$NAMESPACE"
        echo
        
        echo "Secrets:"
        kubectl get secrets -n "$NAMESPACE"
        echo
        
        echo "Events:"
        kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp'
    fi
}

# Show logs
show_logs() {
    local service=${1:-}
    
    if [[ -z "$service" ]]; then
        log_info "Available services:"
        kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}'
        echo
        return 0
    fi
    
    log_info "Showing logs for service: $service"
    kubectl logs -f deployment/"$service" -n "$NAMESPACE"
}

# =============================================================================
# CLEANUP FUNCTIONS
# =============================================================================

# Clean up deployment
cleanup_deployment() {
    log_warning "Cleaning up deployment in namespace: $NAMESPACE"
    
    if [[ "$FORCE" != "true" ]]; then
        read -p "Are you sure you want to delete all resources in namespace '$NAMESPACE'? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Cleanup cancelled"
            return 0
        fi
    fi
    
    # Delete all resources in namespace
    kubectl delete all --all -n "$NAMESPACE"
    kubectl delete pvc --all -n "$NAMESPACE"
    kubectl delete configmaps --all -n "$NAMESPACE"
    kubectl delete secrets --all -n "$NAMESPACE"
    
    # Delete namespace if it's not default
    if [[ "$NAMESPACE" != "default" ]] && [[ "$NAMESPACE" != "kube-system" ]]; then
        kubectl delete namespace "$NAMESPACE"
    fi
    
    log_success "Cleanup completed"
}

# =============================================================================
# MAIN FUNCTIONS
# =============================================================================

# Full deployment
full_deploy() {
    log_info "Starting full deployment to $ENVIRONMENT environment..."
    
    check_prerequisites
    validate_environment
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN MODE - No actual changes will be made"
        return 0
    fi
    
    run_tests
    build_images
    push_images
    
    create_namespace
    apply_configmaps
    apply_secrets
    apply_persistent_volumes
    deploy_services
    apply_ingress
    
    wait_for_deployments
    check_health
    
    log_success "Deployment completed successfully!"
    show_status
}

# Update deployment
update_deploy() {
    log_info "Updating deployment in $ENVIRONMENT environment..."
    
    check_prerequisites
    validate_environment
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN MODE - No actual changes will be made"
        return 0
    fi
    
    build_images
    push_images
    
    # Update deployments with new images
    local deployments
    deployments=$(kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
    
    for deployment in $deployments; do
        log_debug "Updating deployment: $deployment"
        kubectl set image deployment/"$deployment" -n "$NAMESPACE" "$deployment"="${REGISTRY}remotehive-${deployment}:${TAG}"
    done
    
    wait_for_deployments
    check_health
    
    log_success "Update completed successfully!"
}

# Rollback deployment
rollback_deploy() {
    local revision=${1:-}
    
    log_info "Rolling back deployment..."
    
    if [[ -z "$revision" ]]; then
        log_info "Available rollback revisions:"
        kubectl rollout history deployment -n "$NAMESPACE"
        return 0
    fi
    
    local deployments
    deployments=$(kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
    
    for deployment in $deployments; do
        log_debug "Rolling back deployment: $deployment to revision $revision"
        kubectl rollout undo deployment/"$deployment" -n "$NAMESPACE" --to-revision="$revision"
    done
    
    wait_for_deployments
    check_health
    
    log_success "Rollback completed successfully!"
}

# =============================================================================
# HELP FUNCTION
# =============================================================================

show_help() {
    cat << EOF
RemoteHive Kubernetes Deployment Script

USAGE:
    $0 [COMMAND] [OPTIONS]

COMMANDS:
    deploy          Full deployment (default)
    update          Update existing deployment
    rollback [REV]  Rollback to previous revision
    status          Show deployment status
    logs [SERVICE]  Show logs for service
    health          Check deployment health
    cleanup         Clean up deployment
    help            Show this help message

OPTIONS:
    -e, --environment ENV    Environment (development|staging|production) [default: development]
    -n, --namespace NS       Kubernetes namespace [default: remotehive]
    -r, --registry REG       Docker registry URL
    -t, --tag TAG           Docker image tag [default: latest]
    -d, --domain DOMAIN     Domain name for ingress
    --dry-run               Show what would be done without making changes
    --skip-build            Skip Docker image build
    --skip-push             Skip Docker image push
    --skip-tests            Skip running tests
    --force                 Skip confirmation prompts
    --timeout SECONDS       Wait timeout for deployments [default: 600]
    -v, --verbose           Verbose output
    -h, --help              Show this help message

EXAMPLES:
    # Deploy to development
    $0 deploy
    
    # Deploy to production
    $0 deploy -e production -r myregistry.com/ -d remotehive.com
    
    # Update deployment
    $0 update -e staging -t v1.2.3
    
    # Check status
    $0 status -n remotehive-prod
    
    # Show logs
    $0 logs backend
    
    # Rollback to previous version
    $0 rollback 2
    
    # Clean up
    $0 cleanup --force

EOF
}

# =============================================================================
# ARGUMENT PARSING
# =============================================================================

# Parse command line arguments
parse_args() {
    local command="deploy"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            deploy|update|rollback|status|logs|health|cleanup|help)
                command="$1"
                shift
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -r|--registry)
                REGISTRY="$2"
                # Ensure registry ends with /
                if [[ "$REGISTRY" != */ ]]; then
                    REGISTRY="$REGISTRY/"
                fi
                shift 2
                ;;
            -t|--tag)
                TAG="$2"
                shift 2
                ;;
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
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
            --force)
                FORCE=true
                shift
                ;;
            --timeout)
                WAIT_TIMEOUT="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                # Handle rollback revision or service name for logs
                if [[ "$command" == "rollback" ]] || [[ "$command" == "logs" ]]; then
                    break
                else
                    log_error "Unknown option: $1"
                    show_help
                    exit 1
                fi
                ;;
        esac
    done
    
    # Execute command
    case "$command" in
        deploy)
            full_deploy
            ;;
        update)
            update_deploy
            ;;
        rollback)
            rollback_deploy "$1"
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$1"
            ;;
        health)
            check_health
            ;;
        cleanup)
            cleanup_deployment
            ;;
        help)
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

# Main function
main() {
    log_info "RemoteHive Kubernetes Deployment Script"
    log_info "======================================"
    
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
    parse_args "$@"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi