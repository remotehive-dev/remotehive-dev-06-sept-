#!/bin/bash

# RemoteHive Deployment Script
# Supports Docker Compose and Kubernetes deployments
# Usage: ./deploy.sh [docker|k8s] [dev|staging|prod] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PLATFORM="docker"
ENVIRONMENT="dev"
NAMESPACE="remotehive"
VERSION="latest"
BUILD_IMAGES=false
PUSH_IMAGES=false
WAIT_FOR_READY=true
DRY_RUN=false
VERBOSE=false

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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
    echo -e "${RED}[ERROR]${NC} $1"
}

log_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1"
    fi
}

# Help function
show_help() {
    cat << EOF
RemoteHive Deployment Script

Usage: $0 [PLATFORM] [ENVIRONMENT] [OPTIONS]

PLATFORM:
    docker      Deploy using Docker Compose (default)
    k8s         Deploy to Kubernetes

ENVIRONMENT:
    dev         Development environment (default)
    staging     Staging environment
    prod        Production environment

OPTIONS:
    -n, --namespace NAMESPACE    Kubernetes namespace (default: remotehive)
    -v, --version VERSION        Image version tag (default: latest)
    -b, --build                  Build Docker images before deployment
    -p, --push                   Push images to registry (requires build)
    --no-wait                    Don't wait for services to be ready
    --dry-run                    Show what would be deployed without executing
    --verbose                    Enable verbose logging
    -h, --help                   Show this help message

Examples:
    $0 docker dev                           # Deploy to Docker Compose (dev)
    $0 k8s prod -b -p -v v1.2.3            # Build, push and deploy to K8s (prod)
    $0 docker staging --build               # Build and deploy to Docker (staging)
    $0 k8s dev --dry-run                    # Show K8s deployment plan

Environment Variables:
    DOCKER_REGISTRY     Docker registry URL (default: docker.io)
    DOCKER_USERNAME     Docker registry username
    DOCKER_PASSWORD     Docker registry password
    KUBECONFIG          Kubernetes config file path
    REMOTEHIVE_ENV      Override environment detection

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
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            -b|--build)
                BUILD_IMAGES=true
                shift
                ;;
            -p|--push)
                PUSH_IMAGES=true
                BUILD_IMAGES=true  # Push requires build
                shift
                ;;
            --no-wait)
                WAIT_FOR_READY=false
                shift
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

# Load environment variables
load_environment() {
    log_info "Loading environment configuration..."
    
    # Load base environment file
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        log_verbose "Loading base .env file"
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
    fi
    
    # Load environment-specific file
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [[ -f "$ENV_FILE" ]]; then
        log_verbose "Loading environment-specific file: $ENV_FILE"
        set -a
        source "$ENV_FILE"
        set +a
    fi
    
    # Override with REMOTEHIVE_ENV if set
    if [[ -n "$REMOTEHIVE_ENV" ]]; then
        ENVIRONMENT="$REMOTEHIVE_ENV"
        log_verbose "Environment overridden by REMOTEHIVE_ENV: $ENVIRONMENT"
    fi
    
    log_success "Environment configuration loaded"
}

# Build Docker images
build_images() {
    if [[ "$BUILD_IMAGES" != "true" ]]; then
        return 0
    fi
    
    log_info "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Set registry prefix
    REGISTRY_PREFIX=""
    if [[ -n "$DOCKER_REGISTRY" && "$DOCKER_REGISTRY" != "docker.io" ]]; then
        REGISTRY_PREFIX="$DOCKER_REGISTRY/"
    fi
    
    # Build images
    IMAGES=(
        "remotehive-backend:$VERSION"
        "remotehive-autoscraper:$VERSION"
        "remotehive-admin:$VERSION"
        "remotehive-public:$VERSION"
        "remotehive-celery:$VERSION"
    )
    
    for image in "${IMAGES[@]}"; do
        service_name=$(echo "$image" | cut -d':' -f1 | sed 's/remotehive-//')
        full_image_name="${REGISTRY_PREFIX}${image}"
        
        log_info "Building $full_image_name..."
        
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would build: $full_image_name"
            continue
        fi
        
        case $service_name in
            "backend")
                docker build -t "$full_image_name" -f Dockerfile .
                ;;
            "autoscraper")
                docker build -t "$full_image_name" -f autoscraper-service/Dockerfile ./autoscraper-service
                ;;
            "admin")
                docker build -t "$full_image_name" -f remotehive-admin/Dockerfile ./remotehive-admin
                ;;
            "public")
                docker build -t "$full_image_name" -f remotehive-public/Dockerfile ./remotehive-public
                ;;
            "celery")
                docker build -t "$full_image_name" -f Dockerfile.celery .
                ;;
        esac
        
        log_success "Built $full_image_name"
    done
    
    log_success "All images built successfully"
}

# Push Docker images
push_images() {
    if [[ "$PUSH_IMAGES" != "true" ]]; then
        return 0
    fi
    
    log_info "Pushing Docker images..."
    
    # Login to registry if credentials provided
    if [[ -n "$DOCKER_USERNAME" && -n "$DOCKER_PASSWORD" ]]; then
        log_info "Logging into Docker registry..."
        echo "$DOCKER_PASSWORD" | docker login "${DOCKER_REGISTRY:-docker.io}" -u "$DOCKER_USERNAME" --password-stdin
    fi
    
    # Set registry prefix
    REGISTRY_PREFIX=""
    if [[ -n "$DOCKER_REGISTRY" && "$DOCKER_REGISTRY" != "docker.io" ]]; then
        REGISTRY_PREFIX="$DOCKER_REGISTRY/"
    fi
    
    # Push images
    IMAGES=(
        "remotehive-backend:$VERSION"
        "remotehive-autoscraper:$VERSION"
        "remotehive-admin:$VERSION"
        "remotehive-public:$VERSION"
        "remotehive-celery:$VERSION"
    )
    
    for image in "${IMAGES[@]}"; do
        full_image_name="${REGISTRY_PREFIX}${image}"
        
        log_info "Pushing $full_image_name..."
        
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would push: $full_image_name"
            continue
        fi
        
        docker push "$full_image_name"
        log_success "Pushed $full_image_name"
    done
    
    log_success "All images pushed successfully"
}

# Deploy with Docker Compose
deploy_docker() {
    log_info "Deploying with Docker Compose..."
    
    cd "$PROJECT_ROOT"
    
    # Determine compose file
    COMPOSE_FILE="docker-compose.yml"
    case $ENVIRONMENT in
        "dev")
            COMPOSE_FILE="docker-compose.dev.yml"
            ;;
        "staging")
            COMPOSE_FILE="docker-compose.staging.yml"
            ;;
        "prod")
            COMPOSE_FILE="docker-compose.yml"
            ;;
    esac
    
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    log_info "Using compose file: $COMPOSE_FILE"
    
    # Export environment variables for compose
    export REMOTEHIVE_VERSION="$VERSION"
    export REMOTEHIVE_ENV="$ENVIRONMENT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would execute: docker-compose -f $COMPOSE_FILE up -d"
        return 0
    fi
    
    # Deploy services
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$COMPOSE_FILE" up -d
    else
        docker compose -f "$COMPOSE_FILE" up -d
    fi
    
    log_success "Docker Compose deployment completed"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    cd "$PROJECT_ROOT"
    
    # Check if k8s directory exists
    if [[ ! -d "k8s" ]]; then
        log_error "Kubernetes manifests directory not found: k8s/"
        exit 1
    fi
    
    # Create namespace if it doesn't exist
    if [[ "$DRY_RUN" != "true" ]]; then
        kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
        log_success "Namespace $NAMESPACE ready"
    else
        log_info "[DRY RUN] Would create namespace: $NAMESPACE"
    fi
    
    # Apply manifests in order
    MANIFEST_ORDER=(
        "namespace.yaml"
        "configmaps-secrets.yaml"
        "persistent-volumes.yaml"
        "mongodb.yaml"
        "redis.yaml"
        "backend-api.yaml"
        "autoscraper-service.yaml"
        "celery-workers.yaml"
        "admin-panel.yaml"
        "public-website.yaml"
        "ingress.yaml"
        "monitoring.yaml"
    )
    
    for manifest in "${MANIFEST_ORDER[@]}"; do
        manifest_path="k8s/$manifest"
        
        if [[ ! -f "$manifest_path" ]]; then
            log_warning "Manifest not found, skipping: $manifest_path"
            continue
        fi
        
        log_info "Applying manifest: $manifest"
        
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would apply: $manifest_path"
            continue
        fi
        
        # Replace placeholders in manifest
        temp_manifest="/tmp/remotehive-$manifest"
        sed -e "s/{{NAMESPACE}}/$NAMESPACE/g" \
            -e "s/{{VERSION}}/$VERSION/g" \
            -e "s/{{ENVIRONMENT}}/$ENVIRONMENT/g" \
            "$manifest_path" > "$temp_manifest"
        
        kubectl apply -f "$temp_manifest" -n "$NAMESPACE"
        rm -f "$temp_manifest"
        
        log_success "Applied $manifest"
    done
    
    log_success "Kubernetes deployment completed"
}

# Wait for services to be ready
wait_for_services() {
    if [[ "$WAIT_FOR_READY" != "true" || "$DRY_RUN" == "true" ]]; then
        return 0
    fi
    
    log_info "Waiting for services to be ready..."
    
    if [[ "$PLATFORM" == "docker" ]]; then
        # Wait for Docker Compose services
        local max_attempts=30
        local attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            log_verbose "Health check attempt $attempt/$max_attempts"
            
            # Check backend health
            if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
                log_success "Backend service is ready"
                break
            fi
            
            if [[ $attempt -eq $max_attempts ]]; then
                log_warning "Backend service not ready after $max_attempts attempts"
                break
            fi
            
            sleep 10
            ((attempt++))
        done
        
    elif [[ "$PLATFORM" == "k8s" ]]; then
        # Wait for Kubernetes deployments
        log_info "Waiting for Kubernetes deployments..."
        
        kubectl wait --for=condition=available --timeout=300s deployment --all -n "$NAMESPACE"
        
        log_success "All Kubernetes deployments are ready"
    fi
}

# Show deployment status
show_status() {
    log_info "Deployment Status:"
    
    if [[ "$PLATFORM" == "docker" ]]; then
        echo
        log_info "Docker Compose Services:"
        if command -v docker-compose &> /dev/null; then
            docker-compose ps
        else
            docker compose ps
        fi
        
        echo
        log_info "Access URLs:"
        echo "  Backend API:    http://localhost:8000"
        echo "  Autoscraper:    http://localhost:8001"
        echo "  Admin Panel:    http://localhost:3000"
        echo "  Public Website: http://localhost:5173"
        echo "  API Docs:       http://localhost:8000/docs"
        
    elif [[ "$PLATFORM" == "k8s" ]]; then
        echo
        log_info "Kubernetes Resources:"
        kubectl get all -n "$NAMESPACE"
        
        echo
        log_info "Ingress Information:"
        kubectl get ingress -n "$NAMESPACE"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f /tmp/remotehive-*.yaml
}

# Main deployment function
main() {
    log_info "Starting RemoteHive deployment..."
    log_info "Platform: $PLATFORM"
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Execute deployment steps
    check_prerequisites
    load_environment
    build_images
    push_images
    
    if [[ "$PLATFORM" == "docker" ]]; then
        deploy_docker
    elif [[ "$PLATFORM" == "k8s" ]]; then
        deploy_kubernetes
    fi
    
    wait_for_services
    
    if [[ "$DRY_RUN" != "true" ]]; then
        show_status
    fi
    
    log_success "RemoteHive deployment completed successfully!"
}

# Parse arguments and run main function
parse_args "$@"
main