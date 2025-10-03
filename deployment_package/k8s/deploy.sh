#!/bin/bash

# RemoteHive Kubernetes Deployment Script
# This script deploys the entire RemoteHive platform to Kubernetes

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="remotehive"
KUBECTL_TIMEOUT="300s"
DOCKER_REGISTRY="remotehive"  # Change this to your Docker registry
IMAGE_TAG="latest"  # Change this to your desired tag

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

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    print_success "kubectl is available"
}

# Function to check if cluster is accessible
check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    print_success "Kubernetes cluster is accessible"
}

# Function to build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Build Backend API
    print_status "Building Backend API image..."
    docker build -t ${DOCKER_REGISTRY}/backend-api:${IMAGE_TAG} .
    docker push ${DOCKER_REGISTRY}/backend-api:${IMAGE_TAG}
    
    # Build Autoscraper Service
    print_status "Building Autoscraper Service image..."
    docker build -t ${DOCKER_REGISTRY}/autoscraper-service:${IMAGE_TAG} ./autoscraper-engine-api/
    docker push ${DOCKER_REGISTRY}/autoscraper-service:${IMAGE_TAG}
    
    # Build Admin Panel
    print_status "Building Admin Panel image..."
    docker build -t ${DOCKER_REGISTRY}/admin-panel:${IMAGE_TAG} ./admin-panel/
    docker push ${DOCKER_REGISTRY}/admin-panel:${IMAGE_TAG}
    
    # Build Public Website
    print_status "Building Public Website image..."
    docker build -t ${DOCKER_REGISTRY}/public-website:${IMAGE_TAG} ./website/
    docker push ${DOCKER_REGISTRY}/public-website:${IMAGE_TAG}
    
    print_success "All images built and pushed successfully"
}

# Function to create namespace
create_namespace() {
    print_status "Creating namespace: ${NAMESPACE}"
    kubectl apply -f k8s/namespace.yaml
    print_success "Namespace created/updated"
}

# Function to deploy persistent volumes
deploy_persistent_volumes() {
    print_status "Deploying persistent volumes..."
    kubectl apply -f k8s/persistent-volumes.yaml
    print_success "Persistent volumes deployed"
}

# Function to deploy ConfigMaps and Secrets
deploy_config_secrets() {
    print_status "Deploying ConfigMaps and Secrets..."
    kubectl apply -f k8s/configmaps-secrets.yaml
    print_success "ConfigMaps and Secrets deployed"
}

# Function to deploy databases
deploy_databases() {
    print_status "Deploying databases..."
    
    # Deploy MongoDB
    kubectl apply -f k8s/mongodb.yaml
    print_status "Waiting for MongoDB to be ready..."
    kubectl wait --for=condition=available --timeout=${KUBECTL_TIMEOUT} deployment/mongodb -n ${NAMESPACE}
    
    # Deploy Redis
    kubectl apply -f k8s/redis.yaml
    print_status "Waiting for Redis to be ready..."
    kubectl wait --for=condition=available --timeout=${KUBECTL_TIMEOUT} deployment/redis -n ${NAMESPACE}
    
    print_success "Databases deployed and ready"
}

# Function to deploy application services
deploy_applications() {
    print_status "Deploying application services..."
    
    # Deploy Backend API
    kubectl apply -f k8s/backend-api.yaml
    print_status "Waiting for Backend API to be ready..."
    kubectl wait --for=condition=available --timeout=${KUBECTL_TIMEOUT} deployment/backend-api -n ${NAMESPACE}
    
    # Deploy Autoscraper Service
    kubectl apply -f k8s/autoscraper-service.yaml
    print_status "Waiting for Autoscraper Service to be ready..."
    kubectl wait --for=condition=available --timeout=${KUBECTL_TIMEOUT} deployment/autoscraper-service -n ${NAMESPACE}
    
    # Deploy Admin Panel
    kubectl apply -f k8s/admin-panel.yaml
    print_status "Waiting for Admin Panel to be ready..."
    kubectl wait --for=condition=available --timeout=${KUBECTL_TIMEOUT} deployment/admin-panel -n ${NAMESPACE}
    
    # Deploy Public Website
    kubectl apply -f k8s/public-website.yaml
    print_status "Waiting for Public Website to be ready..."
    kubectl wait --for=condition=available --timeout=${KUBECTL_TIMEOUT} deployment/public-website -n ${NAMESPACE}
    
    print_success "Application services deployed and ready"
}

# Function to deploy Celery workers
deploy_celery() {
    print_status "Deploying Celery workers..."
    kubectl apply -f k8s/celery-workers.yaml
    print_status "Waiting for Celery workers to be ready..."
    kubectl wait --for=condition=available --timeout=${KUBECTL_TIMEOUT} deployment/celery-worker -n ${NAMESPACE}
    kubectl wait --for=condition=available --timeout=${KUBECTL_TIMEOUT} deployment/celery-beat -n ${NAMESPACE}
    print_success "Celery workers deployed and ready"
}

# Function to deploy ingress
deploy_ingress() {
    print_status "Deploying ingress..."
    kubectl apply -f k8s/ingress.yaml
    print_success "Ingress deployed"
}

# Function to deploy monitoring
deploy_monitoring() {
    print_status "Deploying monitoring..."
    kubectl apply -f k8s/monitoring.yaml
    print_success "Monitoring deployed"
}

# Function to check deployment status
check_deployment_status() {
    print_status "Checking deployment status..."
    
    echo "\n=== Pods Status ==="
    kubectl get pods -n ${NAMESPACE}
    
    echo "\n=== Services Status ==="
    kubectl get services -n ${NAMESPACE}
    
    echo "\n=== Ingress Status ==="
    kubectl get ingress -n ${NAMESPACE}
    
    echo "\n=== PVC Status ==="
    kubectl get pvc -n ${NAMESPACE}
    
    echo "\n=== HPA Status ==="
    kubectl get hpa -n ${NAMESPACE}
    
    print_success "Deployment status check completed"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check if all pods are running
    local failed_pods=$(kubectl get pods -n ${NAMESPACE} --field-selector=status.phase!=Running --no-headers 2>/dev/null | wc -l)
    if [ "$failed_pods" -gt 0 ]; then
        print_warning "Some pods are not in Running state"
        kubectl get pods -n ${NAMESPACE} --field-selector=status.phase!=Running
    else
        print_success "All pods are running"
    fi
    
    # Check service endpoints
    print_status "Checking service endpoints..."
    kubectl get endpoints -n ${NAMESPACE}
    
    print_success "Health checks completed"
}

# Function to display access information
display_access_info() {
    print_status "Deployment completed! Access information:"
    
    echo "\n=== Service URLs ==="
    echo "Public Website: https://remotehive.in"
    echo "Admin Panel: https://admin.remotehive.in"
    echo "Backend API: https://api.remotehive.in"
    echo "Autoscraper API: https://autoscraper.remotehive.in"
    
    echo "\n=== Local Port Forwarding (for testing) ==="
    echo "Backend API: kubectl port-forward -n ${NAMESPACE} svc/backend-api 8000:8000"
    echo "Admin Panel: kubectl port-forward -n ${NAMESPACE} svc/admin-panel 3000:3000"
    echo "Public Website: kubectl port-forward -n ${NAMESPACE} svc/public-website 5173:80"
    echo "Autoscraper: kubectl port-forward -n ${NAMESPACE} svc/autoscraper-service 8001:8001"
    
    echo "\n=== Useful Commands ==="
    echo "View logs: kubectl logs -n ${NAMESPACE} -l app=<service-name> -f"
    echo "Scale service: kubectl scale -n ${NAMESPACE} deployment/<service-name> --replicas=<count>"
    echo "Delete deployment: kubectl delete -f k8s/"
    
    print_success "RemoteHive platform deployed successfully!"
}

# Function to cleanup deployment
cleanup_deployment() {
    print_warning "Cleaning up existing deployment..."
    kubectl delete -f k8s/ --ignore-not-found=true
    print_success "Cleanup completed"
}

# Main deployment function
main() {
    print_status "Starting RemoteHive Kubernetes deployment..."
    
    # Parse command line arguments
    SKIP_BUILD=false
    CLEANUP=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --cleanup)
                CLEANUP=true
                shift
                ;;
            --registry)
                DOCKER_REGISTRY="$2"
                shift 2
                ;;
            --tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-build    Skip building and pushing Docker images"
                echo "  --cleanup       Clean up existing deployment before deploying"
                echo "  --registry      Docker registry (default: remotehive)"
                echo "  --tag           Image tag (default: latest)"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Pre-flight checks
    check_kubectl
    check_cluster
    
    # Cleanup if requested
    if [ "$CLEANUP" = true ]; then
        cleanup_deployment
    fi
    
    # Build and push images if not skipped
    if [ "$SKIP_BUILD" = false ]; then
        build_and_push_images
    fi
    
    # Deploy components in order
    create_namespace
    deploy_persistent_volumes
    deploy_config_secrets
    deploy_databases
    deploy_applications
    deploy_celery
    deploy_ingress
    deploy_monitoring
    
    # Post-deployment checks
    check_deployment_status
    run_health_checks
    display_access_info
}

# Run main function
main "$@"