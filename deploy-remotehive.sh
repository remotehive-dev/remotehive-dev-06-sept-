#!/bin/bash

# RemoteHive Complete Deployment Script
# Supports Docker Compose (development) and Kubernetes (production)
# Author: RemoteHive DevOps Team
# Version: 2.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="remotehive"
DOCKER_REGISTRY="ghcr.io/remotehive"
KUBERNETES_NAMESPACE="remotehive"
DEFAULT_ENVIRONMENT="development"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
ENVIRONMENT="${DEFAULT_ENVIRONMENT}"
SKIP_BUILD=false
SKIP_TESTS=false
CLEANUP=false
VERBOSE=false
DRY_RUN=false
IMAGE_TAG="latest"
DOMAIN="localhost"

# Print functions
print_header() {
    echo -e "\n${PURPLE}================================${NC}"
    echo -e "${PURPLE}  RemoteHive Deployment Script  ${NC}"
    echo -e "${PURPLE}================================${NC}\n"
}

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

print_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${CYAN}[DEBUG]${NC} $1"
    fi
}

# Help function
show_help() {
    cat << EOF
RemoteHive Deployment Script

USAGE:
    $0 [OPTIONS] COMMAND

COMMANDS:
    dev         Deploy for local development (Docker Compose)
    staging     Deploy to staging environment (Kubernetes)
    production  Deploy to production environment (Kubernetes)
    test        Run tests and validation
    cleanup     Clean up resources
    status      Show deployment status
    logs        Show application logs
    shell       Open shell in running container
    backup      Backup databases
    restore     Restore from backup

OPTIONS:
    -e, --environment ENV    Target environment (development|staging|production)
    -t, --tag TAG           Docker image tag (default: latest)
    -d, --domain DOMAIN     Domain name for ingress (default: localhost)
    -r, --registry REGISTRY Docker registry URL
    -n, --namespace NS      Kubernetes namespace
    --skip-build           Skip Docker image building
    --skip-tests           Skip running tests
    --cleanup              Clean up before deployment
    --dry-run              Show what would be done without executing
    --verbose              Enable verbose output
    -h, --help             Show this help message

EXAMPLES:
    # Local development
    $0 dev
    
    # Production deployment with custom domain
    $0 production -d remotehive.com -t v1.2.3
    
    # Staging with cleanup
    $0 staging --cleanup -t develop
    
    # Check status
    $0 status -e production

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -t|--tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -r|--registry)
                DOCKER_REGISTRY="$2"
                shift 2
                ;;
            -n|--namespace)
                KUBERNETES_NAMESPACE="$2"
                shift 2
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --cleanup)
                CLEANUP=true
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
            dev|development)
                COMMAND="dev"
                ENVIRONMENT="development"
                shift
                ;;
            staging)
                COMMAND="staging"
                ENVIRONMENT="staging"
                shift
                ;;
            production|prod)
                COMMAND="production"
                ENVIRONMENT="production"
                shift
                ;;
            test)
                COMMAND="test"
                shift
                ;;
            cleanup)
                COMMAND="cleanup"
                shift
                ;;
            status)
                COMMAND="status"
                shift
                ;;
            logs)
                COMMAND="logs"
                shift
                ;;
            shell)
                COMMAND="shell"
                shift
                ;;
            backup)
                COMMAND="backup"
                shift
                ;;
            restore)
                COMMAND="restore"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Set default command if not provided
    if [[ -z "${COMMAND:-}" ]]; then
        COMMAND="dev"
    fi
}

# Validation functions
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing_tools+=("docker-compose")
    fi
    
    # Check kubectl for Kubernetes deployments
    if [[ "$ENVIRONMENT" != "development" ]] && ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    fi
    
    # Check helm for Kubernetes deployments
    if [[ "$ENVIRONMENT" != "development" ]] && ! command -v helm &> /dev/null; then
        missing_tools+=("helm")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_status "Please install the missing tools and try again."
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
}

check_docker_daemon() {
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
}

check_kubernetes_access() {
    if [[ "$ENVIRONMENT" != "development" ]]; then
        if ! kubectl cluster-info &> /dev/null; then
            print_error "Cannot connect to Kubernetes cluster"
            exit 1
        fi
        print_success "Kubernetes cluster is accessible"
    fi
}

# Environment setup
setup_environment() {
    print_status "Setting up environment: $ENVIRONMENT"
    
    # Create .env file based on environment
    local env_file=".env.${ENVIRONMENT}"
    if [[ ! -f "$env_file" ]]; then
        print_warning "Environment file $env_file not found, creating from template..."
        cp .env.example "$env_file"
    fi
    
    # Source environment variables
    if [[ -f "$env_file" ]]; then
        set -a
        source "$env_file"
        set +a
        print_success "Environment variables loaded from $env_file"
    fi
}

# Build functions
build_images() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        print_warning "Skipping image build"
        return 0
    fi
    
    print_status "Building Docker images..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "[DRY RUN] Would build images with tag: $IMAGE_TAG"
        return 0
    fi
    
    # Build main backend image
    print_status "Building backend image..."
    docker build -t "${DOCKER_REGISTRY}/backend:${IMAGE_TAG}" .
    
    # Build autoscraper service image
    print_status "Building autoscraper image..."
    docker build -t "${DOCKER_REGISTRY}/autoscraper:${IMAGE_TAG}" ./autoscraper-service/
    
    # Build admin panel image
    print_status "Building admin panel image..."
    docker build -t "${DOCKER_REGISTRY}/admin:${IMAGE_TAG}" ./remotehive-admin/
    
    # Build public website image
    print_status "Building public website image..."
    docker build -t "${DOCKER_REGISTRY}/public:${IMAGE_TAG}" ./remotehive-public/
    
    print_success "All images built successfully"
}

push_images() {
    if [[ "$ENVIRONMENT" == "development" ]]; then
        print_debug "Skipping image push for development environment"
        return 0
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "[DRY RUN] Would push images to registry: $DOCKER_REGISTRY"
        return 0
    fi
    
    print_status "Pushing images to registry..."
    
    docker push "${DOCKER_REGISTRY}/backend:${IMAGE_TAG}"
    docker push "${DOCKER_REGISTRY}/autoscraper:${IMAGE_TAG}"
    docker push "${DOCKER_REGISTRY}/admin:${IMAGE_TAG}"
    docker push "${DOCKER_REGISTRY}/public:${IMAGE_TAG}"
    
    print_success "All images pushed successfully"
}

# Test functions
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        print_warning "Skipping tests"
        return 0
    fi
    
    print_status "Running tests..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "[DRY RUN] Would run test suite"
        return 0
    fi
    
    # Run Python tests
    if [[ -f "pytest.ini" ]]; then
        print_status "Running Python tests..."
        python -m pytest tests/ -v --tb=short
    fi
    
    # Run Node.js tests for admin panel
    if [[ -d "remotehive-admin" && -f "remotehive-admin/package.json" ]]; then
        print_status "Running admin panel tests..."
        cd remotehive-admin
        npm test -- --watchAll=false
        cd ..
    fi
    
    # Run Node.js tests for public website
    if [[ -d "remotehive-public" && -f "remotehive-public/package.json" ]]; then
        print_status "Running public website tests..."
        cd remotehive-public
        npm test -- --watchAll=false
        cd ..
    fi
    
    print_success "All tests passed"
}

# Deployment functions
deploy_development() {
    print_status "Deploying to development environment using Docker Compose..."
    
    if [[ "$CLEANUP" == "true" ]]; then
        print_status "Cleaning up existing containers..."
        docker-compose down -v --remove-orphans
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "[DRY RUN] Would run: docker-compose up -d"
        return 0
    fi
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_development_health
    
    print_success "Development environment deployed successfully"
    print_status "Services available at:"
    echo "  - Backend API: http://localhost:8000"
    echo "  - Autoscraper: http://localhost:8001"
    echo "  - Admin Panel: http://localhost:3000"
    echo "  - Public Website: http://localhost:5173"
    echo "  - Nginx (if enabled): http://localhost:80"
}

deploy_kubernetes() {
    print_status "Deploying to $ENVIRONMENT environment using Kubernetes..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "[DRY RUN] Would deploy to Kubernetes namespace: $KUBERNETES_NAMESPACE"
        return 0
    fi
    
    # Create namespace if it doesn't exist
    kubectl create namespace "$KUBERNETES_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Update image tags in Kubernetes manifests
    update_kubernetes_manifests
    
    # Apply Kubernetes manifests in order
    print_status "Applying Kubernetes manifests..."
    
    # Apply in dependency order
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/persistent-volumes.yaml
    kubectl apply -f k8s/configmaps-secrets.yaml
    kubectl apply -f k8s/mongodb.yaml
    kubectl apply -f k8s/redis.yaml
    
    # Wait for databases to be ready
    print_status "Waiting for databases to be ready..."
    kubectl wait --for=condition=ready pod -l app=mongodb -n "$KUBERNETES_NAMESPACE" --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis -n "$KUBERNETES_NAMESPACE" --timeout=300s
    
    # Deploy applications
    kubectl apply -f k8s/backend-api.yaml
    kubectl apply -f k8s/autoscraper-service.yaml
    kubectl apply -f k8s/celery-workers.yaml
    kubectl apply -f k8s/admin-panel.yaml
    kubectl apply -f k8s/public-website.yaml
    
    # Apply ingress and monitoring
    kubectl apply -f k8s/ingress.yaml
    kubectl apply -f k8s/monitoring.yaml
    
    # Wait for deployments to be ready
    print_status "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available deployment --all -n "$KUBERNETES_NAMESPACE" --timeout=600s
    
    # Check deployment health
    check_kubernetes_health
    
    print_success "$ENVIRONMENT environment deployed successfully"
    
    # Show access information
    show_kubernetes_access_info
}

update_kubernetes_manifests() {
    print_status "Updating Kubernetes manifests with image tag: $IMAGE_TAG"
    
    # Update image tags in all deployment files
    local manifest_files=("k8s/backend-api.yaml" "k8s/autoscraper-service.yaml" "k8s/admin-panel.yaml" "k8s/public-website.yaml" "k8s/celery-workers.yaml")
    
    for file in "${manifest_files[@]}"; do
        if [[ -f "$file" ]]; then
            sed -i.bak "s|image: .*:.*|image: ${DOCKER_REGISTRY}/\$(basename \${file%.yaml}):${IMAGE_TAG}|g" "$file"
            print_debug "Updated $file with new image tags"
        fi
    done
    
    # Update domain in ingress if provided
    if [[ "$DOMAIN" != "localhost" && -f "k8s/ingress.yaml" ]]; then
        sed -i.bak "s/host: .*/host: $DOMAIN/g" k8s/ingress.yaml
        print_debug "Updated ingress with domain: $DOMAIN"
    fi
}

# Health check functions
check_development_health() {
    print_status "Checking service health..."
    
    local services=("backend:8000" "autoscraper:8001" "admin:3000" "public:5173")
    local failed_services=()
    
    for service in "${services[@]}"; do
        local name="${service%:*}"
        local port="${service#*:}"
        
        if curl -f -s "http://localhost:$port/health" > /dev/null 2>&1; then
            print_success "$name service is healthy"
        else
            print_warning "$name service health check failed"
            failed_services+=("$name")
        fi
    done
    
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        print_warning "Some services failed health checks: ${failed_services[*]}"
        print_status "Check logs with: $0 logs"
    fi
}

check_kubernetes_health() {
    print_status "Checking Kubernetes deployment health..."
    
    # Check pod status
    kubectl get pods -n "$KUBERNETES_NAMESPACE"
    
    # Check service endpoints
    kubectl get services -n "$KUBERNETES_NAMESPACE"
    
    # Check ingress status
    kubectl get ingress -n "$KUBERNETES_NAMESPACE"
}

show_kubernetes_access_info() {
    print_status "Access Information:"
    
    # Get ingress information
    local ingress_ip
    ingress_ip=$(kubectl get ingress -n "$KUBERNETES_NAMESPACE" -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    
    if [[ "$ingress_ip" != "pending" && -n "$ingress_ip" ]]; then
        echo "  - Application URL: https://$DOMAIN"
        echo "  - Ingress IP: $ingress_ip"
    else
        echo "  - Ingress IP: Pending (check with 'kubectl get ingress -n $KUBERNETES_NAMESPACE')"
    fi
    
    # Show port-forward commands for direct access
    echo "\nDirect access via port-forward:"
    echo "  kubectl port-forward -n $KUBERNETES_NAMESPACE svc/backend-api 8000:8000"
    echo "  kubectl port-forward -n $KUBERNETES_NAMESPACE svc/admin-panel 3000:3000"
    echo "  kubectl port-forward -n $KUBERNETES_NAMESPACE svc/public-website 5173:5173"
}

# Utility functions
show_status() {
    print_status "Deployment Status for $ENVIRONMENT environment:"
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        docker-compose ps
    else
        kubectl get all -n "$KUBERNETES_NAMESPACE"
    fi
}

show_logs() {
    if [[ "$ENVIRONMENT" == "development" ]]; then
        docker-compose logs -f
    else
        kubectl logs -f -l app=backend-api -n "$KUBERNETES_NAMESPACE"
    fi
}

open_shell() {
    if [[ "$ENVIRONMENT" == "development" ]]; then
        docker-compose exec backend bash
    else
        local pod
        pod=$(kubectl get pods -n "$KUBERNETES_NAMESPACE" -l app=backend-api -o jsonpath='{.items[0].metadata.name}')
        kubectl exec -it "$pod" -n "$KUBERNETES_NAMESPACE" -- bash
    fi
}

backup_databases() {
    print_status "Creating database backup..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        # Backup MongoDB
        docker-compose exec -T mongodb mongodump --out /tmp/backup
        docker cp "$(docker-compose ps -q mongodb)":/tmp/backup "$backup_dir/mongodb"
        
        # Backup Redis
        docker-compose exec -T redis redis-cli BGSAVE
        docker cp "$(docker-compose ps -q redis)":/data/dump.rdb "$backup_dir/redis_dump.rdb"
    else
        # Kubernetes backup
        local mongodb_pod
        mongodb_pod=$(kubectl get pods -n "$KUBERNETES_NAMESPACE" -l app=mongodb -o jsonpath='{.items[0].metadata.name}')
        kubectl exec "$mongodb_pod" -n "$KUBERNETES_NAMESPACE" -- mongodump --out /tmp/backup
        kubectl cp "$KUBERNETES_NAMESPACE/$mongodb_pod:/tmp/backup" "$backup_dir/mongodb"
    fi
    
    print_success "Backup created in $backup_dir"
}

cleanup_resources() {
    print_status "Cleaning up resources..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "[DRY RUN] Would clean up $ENVIRONMENT resources"
        return 0
    fi
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        docker-compose down -v --remove-orphans
        docker system prune -f
    else
        kubectl delete namespace "$KUBERNETES_NAMESPACE" --ignore-not-found=true
    fi
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    print_header
    
    # Parse arguments
    parse_args "$@"
    
    # Show configuration
    print_status "Configuration:"
    echo "  Command: $COMMAND"
    echo "  Environment: $ENVIRONMENT"
    echo "  Image Tag: $IMAGE_TAG"
    echo "  Domain: $DOMAIN"
    echo "  Registry: $DOCKER_REGISTRY"
    if [[ "$ENVIRONMENT" != "development" ]]; then
        echo "  Namespace: $KUBERNETES_NAMESPACE"
    fi
    echo ""
    
    # Check prerequisites
    check_prerequisites
    check_docker_daemon
    check_kubernetes_access
    
    # Setup environment
    setup_environment
    
    # Execute command
    case "$COMMAND" in
        "dev")
            build_images
            run_tests
            deploy_development
            ;;
        "staging"|"production")
            build_images
            push_images
            run_tests
            deploy_kubernetes
            ;;
        "test")
            run_tests
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "shell")
            open_shell
            ;;
        "backup")
            backup_databases
            ;;
        "cleanup")
            cleanup_resources
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
    
    print_success "Operation completed successfully!"
}

# Run main function with all arguments
main "$@"