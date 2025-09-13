#!/bin/bash

# RemoteHive End-to-End Deployment Testing Script
# This script validates the entire deployment pipeline and security configurations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="remotehive"
TEST_TIMEOUT=300
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_DELAY=10

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
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

# Function to check if kubectl is available
check_kubectl() {
    log "Checking kubectl availability..."
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "kubectl is available and connected to cluster"
}

# Function to check if namespace exists
check_namespace() {
    log "Checking namespace '$NAMESPACE'..."
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace '$NAMESPACE' does not exist, creating it..."
        kubectl create namespace "$NAMESPACE"
    fi
    log_success "Namespace '$NAMESPACE' is ready"
}

# Function to deploy configurations
deploy_configurations() {
    log "Deploying RemoteHive configurations..."
    
    # Deploy main application
    if [[ -f "k8s-remotehive.yaml" ]]; then
        log "Applying main RemoteHive configuration..."
        kubectl apply -f k8s-remotehive.yaml
    else
        log_error "k8s-remotehive.yaml not found"
        return 1
    fi
    
    # Deploy monitoring
    if [[ -f "monitoring-config.yml" ]]; then
        log "Applying monitoring configuration..."
        kubectl apply -f monitoring-config.yml
    else
        log_warning "monitoring-config.yml not found, skipping monitoring setup"
    fi
    
    # Deploy high availability configuration
    if [[ -f "ha-config.yml" ]]; then
        log "Applying high availability configuration..."
        kubectl apply -f ha-config.yml
    else
        log_warning "ha-config.yml not found, skipping HA setup"
    fi
    
    log_success "Configurations deployed successfully"
}

# Function to wait for deployments to be ready
wait_for_deployments() {
    log "Waiting for deployments to be ready..."
    
    local deployments=("backend-api" "autoscraper" "admin-panel" "public-website" "nginx-proxy")
    
    for deployment in "${deployments[@]}"; do
        log "Waiting for deployment '$deployment'..."
        if kubectl get deployment "$deployment" -n "$NAMESPACE" &> /dev/null; then
            kubectl rollout status deployment "$deployment" -n "$NAMESPACE" --timeout="${TEST_TIMEOUT}s" || {
                log_error "Deployment '$deployment' failed to become ready"
                return 1
            }
            log_success "Deployment '$deployment' is ready"
        else
            log_warning "Deployment '$deployment' not found, skipping..."
        fi
    done
}

# Function to wait for StatefulSets to be ready
wait_for_statefulsets() {
    log "Waiting for StatefulSets to be ready..."
    
    local statefulsets=("mongodb")
    
    for statefulset in "${statefulsets[@]}"; do
        log "Waiting for StatefulSet '$statefulset'..."
        if kubectl get statefulset "$statefulset" -n "$NAMESPACE" &> /dev/null; then
            kubectl rollout status statefulset "$statefulset" -n "$NAMESPACE" --timeout="${TEST_TIMEOUT}s" || {
                log_error "StatefulSet '$statefulset' failed to become ready"
                return 1
            }
            log_success "StatefulSet '$statefulset' is ready"
        else
            log_warning "StatefulSet '$statefulset' not found, skipping..."
        fi
    done
}

# Function to check pod health
check_pod_health() {
    log "Checking pod health..."
    
    local pods
    pods=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
    
    for pod in $pods; do
        local status
        status=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.status.phase}')
        
        if [[ "$status" == "Running" ]]; then
            log_success "Pod '$pod' is running"
        else
            log_error "Pod '$pod' is in '$status' state"
            kubectl describe pod "$pod" -n "$NAMESPACE"
            return 1
        fi
    done
}

# Function to test service connectivity
test_service_connectivity() {
    log "Testing service connectivity..."
    
    # Get NGINX proxy service IP
    local nginx_ip
    nginx_ip=$(kubectl get svc nginx-proxy -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    
    if [[ -z "$nginx_ip" ]]; then
        # Try to get ClusterIP if LoadBalancer IP is not available
        nginx_ip=$(kubectl get svc nginx-proxy -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")
        if [[ -n "$nginx_ip" ]]; then
            log_warning "Using ClusterIP for testing: $nginx_ip"
        else
            log_error "Cannot get NGINX proxy service IP"
            return 1
        fi
    fi
    
    # Test health endpoints
    local endpoints=("/api/health" "/autoscraper/health" "/admin/" "/")
    
    for endpoint in "${endpoints[@]}"; do
        log "Testing endpoint: $endpoint"
        
        local retry_count=0
        local success=false
        
        while [[ $retry_count -lt $HEALTH_CHECK_RETRIES ]]; do
            if kubectl run test-curl-$RANDOM --rm -i --restart=Never --image=curlimages/curl:latest -n "$NAMESPACE" -- curl -f -s "http://$nginx_ip$endpoint" &> /dev/null; then
                log_success "Endpoint '$endpoint' is accessible"
                success=true
                break
            fi
            
            ((retry_count++))
            log "Retry $retry_count/$HEALTH_CHECK_RETRIES for endpoint '$endpoint'"
            sleep $HEALTH_CHECK_DELAY
        done
        
        if [[ "$success" != "true" ]]; then
            log_error "Endpoint '$endpoint' is not accessible after $HEALTH_CHECK_RETRIES retries"
            return 1
        fi
    done
}

# Function to test database connectivity
test_database_connectivity() {
    log "Testing database connectivity..."
    
    # Test MongoDB connectivity
    log "Testing MongoDB connectivity..."
    if kubectl get pod -l app=mongodb -n "$NAMESPACE" &> /dev/null; then
        local mongodb_pod
        mongodb_pod=$(kubectl get pod -l app=mongodb -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
        
        if kubectl exec "$mongodb_pod" -n "$NAMESPACE" -- mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
            log_success "MongoDB is accessible"
        else
            log_error "MongoDB is not accessible"
            return 1
        fi
    else
        log_warning "MongoDB pod not found, skipping connectivity test"
    fi
    
    # Test Redis connectivity
    log "Testing Redis connectivity..."
    if kubectl get pod -l app=redis -n "$NAMESPACE" &> /dev/null; then
        local redis_pod
        redis_pod=$(kubectl get pod -l app=redis -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
        
        if kubectl exec "$redis_pod" -n "$NAMESPACE" -- redis-cli ping &> /dev/null; then
            log_success "Redis is accessible"
        else
            log_error "Redis is not accessible"
            return 1
        fi
    else
        log_warning "Redis pod not found, skipping connectivity test"
    fi
}

# Function to test security configurations
test_security_configurations() {
    log "Testing security configurations..."
    
    # Check RBAC
    log "Checking RBAC configurations..."
    if kubectl get clusterrole remotehive-role &> /dev/null; then
        log_success "RBAC ClusterRole exists"
    else
        log_warning "RBAC ClusterRole not found"
    fi
    
    if kubectl get clusterrolebinding remotehive-binding &> /dev/null; then
        log_success "RBAC ClusterRoleBinding exists"
    else
        log_warning "RBAC ClusterRoleBinding not found"
    fi
    
    # Check Network Policies
    log "Checking Network Policies..."
    local netpols
    netpols=$(kubectl get networkpolicy -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$netpols" ]]; then
        log_success "Network Policies found: $netpols"
    else
        log_warning "No Network Policies found"
    fi
    
    # Check Pod Security Standards
    log "Checking Pod Security Standards..."
    local pods_with_security_context=0
    local total_pods=0
    
    local pods
    pods=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
    
    for pod in $pods; do
        ((total_pods++))
        local security_context
        security_context=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.securityContext}' 2>/dev/null || echo "")
        
        if [[ -n "$security_context" && "$security_context" != "null" ]]; then
            ((pods_with_security_context++))
        fi
    done
    
    if [[ $total_pods -gt 0 ]]; then
        local security_percentage=$((pods_with_security_context * 100 / total_pods))
        log "Security context coverage: $security_percentage% ($pods_with_security_context/$total_pods pods)"
        
        if [[ $security_percentage -ge 80 ]]; then
            log_success "Good security context coverage"
        else
            log_warning "Low security context coverage"
        fi
    fi
}

# Function to test monitoring setup
test_monitoring_setup() {
    log "Testing monitoring setup..."
    
    # Check Prometheus
    if kubectl get pod -l app=prometheus -n "$NAMESPACE" &> /dev/null; then
        log_success "Prometheus is deployed"
        
        # Test Prometheus health
        local prometheus_pod
        prometheus_pod=$(kubectl get pod -l app=prometheus -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
        
        if kubectl exec "$prometheus_pod" -n "$NAMESPACE" -- wget -q -O- http://localhost:9090/-/healthy &> /dev/null; then
            log_success "Prometheus is healthy"
        else
            log_warning "Prometheus health check failed"
        fi
    else
        log_warning "Prometheus not found"
    fi
    
    # Check Grafana
    if kubectl get pod -l app=grafana -n "$NAMESPACE" &> /dev/null; then
        log_success "Grafana is deployed"
    else
        log_warning "Grafana not found"
    fi
    
    # Check Fluentd
    if kubectl get daemonset fluentd -n "$NAMESPACE" &> /dev/null; then
        log_success "Fluentd DaemonSet is deployed"
    else
        log_warning "Fluentd DaemonSet not found"
    fi
}

# Function to test high availability features
test_high_availability() {
    log "Testing high availability features..."
    
    # Check replica counts
    local deployments
    deployments=$(kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
    
    for deployment in $deployments; do
        local replicas
        replicas=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
        
        if [[ $replicas -gt 1 ]]; then
            log_success "Deployment '$deployment' has $replicas replicas (HA enabled)"
        else
            log_warning "Deployment '$deployment' has only $replicas replica (no HA)"
        fi
    done
    
    # Check Pod Disruption Budgets
    local pdbs
    pdbs=$(kubectl get pdb -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$pdbs" ]]; then
        log_success "Pod Disruption Budgets found: $pdbs"
    else
        log_warning "No Pod Disruption Budgets found"
    fi
    
    # Check Horizontal Pod Autoscalers
    local hpas
    hpas=$(kubectl get hpa -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$hpas" ]]; then
        log_success "Horizontal Pod Autoscalers found: $hpas"
    else
        log_warning "No Horizontal Pod Autoscalers found"
    fi
}

# Function to generate test report
generate_test_report() {
    log "Generating test report..."
    
    local report_file="deployment-test-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "RemoteHive Deployment Test Report"
        echo "Generated on: $(date)"
        echo "Namespace: $NAMESPACE"
        echo "======================================"
        echo ""
        
        echo "PODS STATUS:"
        kubectl get pods -n "$NAMESPACE" -o wide
        echo ""
        
        echo "SERVICES STATUS:"
        kubectl get services -n "$NAMESPACE" -o wide
        echo ""
        
        echo "DEPLOYMENTS STATUS:"
        kubectl get deployments -n "$NAMESPACE" -o wide
        echo ""
        
        echo "STATEFULSETS STATUS:"
        kubectl get statefulsets -n "$NAMESPACE" -o wide
        echo ""
        
        echo "PERSISTENT VOLUMES:"
        kubectl get pv -o wide
        echo ""
        
        echo "PERSISTENT VOLUME CLAIMS:"
        kubectl get pvc -n "$NAMESPACE" -o wide
        echo ""
        
        echo "EVENTS (Last 1 hour):"
        kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -20
        
    } > "$report_file"
    
    log_success "Test report generated: $report_file"
}

# Function to cleanup test resources
cleanup_test_resources() {
    log "Cleaning up test resources..."
    
    # Remove any test pods that might be left behind
    kubectl delete pods -l "run" -n "$NAMESPACE" --ignore-not-found=true
    
    log_success "Test resources cleaned up"
}

# Main execution function
main() {
    log "Starting RemoteHive deployment testing..."
    
    # Pre-flight checks
    check_kubectl
    check_namespace
    
    # Deploy configurations
    deploy_configurations
    
    # Wait for deployments
    wait_for_deployments
    wait_for_statefulsets
    
    # Health checks
    check_pod_health
    
    # Connectivity tests
    test_service_connectivity
    test_database_connectivity
    
    # Security tests
    test_security_configurations
    
    # Monitoring tests
    test_monitoring_setup
    
    # High availability tests
    test_high_availability
    
    # Generate report
    generate_test_report
    
    # Cleanup
    cleanup_test_resources
    
    log_success "All tests completed successfully!"
    log "RemoteHive deployment is ready for production use."
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -t|--timeout)
                TEST_TIMEOUT="$2"
                shift 2
                ;;
            --skip-deploy)
                SKIP_DEPLOY=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  -n, --namespace NAMESPACE    Kubernetes namespace (default: remotehive)"
                echo "  -t, --timeout TIMEOUT       Test timeout in seconds (default: 300)"
                echo "  --skip-deploy               Skip deployment step"
                echo "  -h, --help                  Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run main function
    main
fi