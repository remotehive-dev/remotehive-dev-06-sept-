#!/bin/bash

# RemoteHive Deployment Validation Script
# This script performs comprehensive testing of the deployed RemoteHive platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="remotehive.in"
ENVIRONMENT="production"
NAMESPACE="remotehive"
TIMEOUT=30
VERBOSE=false
SKIP_EXTERNAL=false

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

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

print_test_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    case $result in
        "PASS")
            PASSED_TESTS=$((PASSED_TESTS + 1))
            echo -e "${GREEN}✓${NC} $test_name: $message"
            ;;
        "FAIL")
            FAILED_TESTS=$((FAILED_TESTS + 1))
            echo -e "${RED}✗${NC} $test_name: $message"
            ;;
        "SKIP")
            SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
            echo -e "${YELLOW}⊘${NC} $test_name: $message"
            ;;
    esac
}

# Function to test HTTP endpoint
test_http_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local expected_content="$4"
    
    if [[ "$SKIP_EXTERNAL" == "true" && "$url" =~ ^https?:// ]]; then
        print_test_result "$name" "SKIP" "External endpoint testing disabled"
        return 0
    fi
    
    local response
    local status_code
    
    if response=$(curl -s -w "\n%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null); then
        status_code=$(echo "$response" | tail -n1)
        content=$(echo "$response" | head -n -1)
        
        if [[ "$status_code" == "$expected_status" ]]; then
            if [[ -n "$expected_content" ]]; then
                if echo "$content" | grep -q "$expected_content"; then
                    print_test_result "$name" "PASS" "Status: $status_code, Content matches"
                else
                    print_test_result "$name" "FAIL" "Status: $status_code, Content mismatch"
                    [[ "$VERBOSE" == "true" ]] && echo "Expected: $expected_content" && echo "Got: $content"
                fi
            else
                print_test_result "$name" "PASS" "Status: $status_code"
            fi
        else
            print_test_result "$name" "FAIL" "Expected status: $expected_status, Got: $status_code"
        fi
    else
        print_test_result "$name" "FAIL" "Connection failed or timeout"
    fi
}

# Function to test Kubernetes resource
test_k8s_resource() {
    local name="$1"
    local resource_type="$2"
    local resource_name="$3"
    local namespace="$4"
    local condition="$5"
    
    if kubectl get "$resource_type" "$resource_name" -n "$namespace" >/dev/null 2>&1; then
        if [[ -n "$condition" ]]; then
            if kubectl wait --for="$condition" "$resource_type/$resource_name" -n "$namespace" --timeout=10s >/dev/null 2>&1; then
                print_test_result "$name" "PASS" "Resource exists and condition met"
            else
                print_test_result "$name" "FAIL" "Resource exists but condition not met: $condition"
            fi
        else
            print_test_result "$name" "PASS" "Resource exists"
        fi
    else
        print_test_result "$name" "FAIL" "Resource not found"
    fi
}

# Function to test pod health
test_pod_health() {
    local name="$1"
    local label_selector="$2"
    local namespace="$3"
    
    local pods
    pods=$(kubectl get pods -l "$label_selector" -n "$namespace" --no-headers 2>/dev/null || echo "")
    
    if [[ -z "$pods" ]]; then
        print_test_result "$name" "FAIL" "No pods found with selector: $label_selector"
        return
    fi
    
    local total_pods=0
    local ready_pods=0
    
    while IFS= read -r line; do
        if [[ -n "$line" ]]; then
            total_pods=$((total_pods + 1))
            local ready_status=$(echo "$line" | awk '{print $2}')
            local pod_status=$(echo "$line" | awk '{print $3}')
            
            if [[ "$pod_status" == "Running" ]] && [[ "$ready_status" =~ ^[0-9]+/[0-9]+$ ]]; then
                local ready_count=$(echo "$ready_status" | cut -d'/' -f1)
                local total_count=$(echo "$ready_status" | cut -d'/' -f2)
                if [[ "$ready_count" == "$total_count" ]]; then
                    ready_pods=$((ready_pods + 1))
                fi
            fi
        fi
    done <<< "$pods"
    
    if [[ "$ready_pods" == "$total_pods" ]] && [[ "$total_pods" -gt 0 ]]; then
        print_test_result "$name" "PASS" "$ready_pods/$total_pods pods ready"
    else
        print_test_result "$name" "FAIL" "$ready_pods/$total_pods pods ready"
    fi
}

# Function to test database connectivity
test_database_connectivity() {
    local name="$1"
    local pod_selector="$2"
    local namespace="$3"
    local command="$4"
    
    local pod
    pod=$(kubectl get pods -l "$pod_selector" -n "$namespace" --no-headers -o custom-columns=":metadata.name" | head -n1)
    
    if [[ -z "$pod" ]]; then
        print_test_result "$name" "FAIL" "No pod found with selector: $pod_selector"
        return
    fi
    
    if kubectl exec "$pod" -n "$namespace" -- $command >/dev/null 2>&1; then
        print_test_result "$name" "PASS" "Database connection successful"
    else
        print_test_result "$name" "FAIL" "Database connection failed"
    fi
}

# Function to test service discovery
test_service_discovery() {
    local name="$1"
    local service_name="$2"
    local namespace="$3"
    local port="$4"
    
    # Create a temporary pod for testing
    local test_pod="test-connectivity-$(date +%s)"
    
    kubectl run "$test_pod" --image=curlimages/curl --rm -i --restart=Never --namespace="$namespace" -- \
        curl -s --max-time 10 "http://${service_name}.${namespace}.svc.cluster.local:${port}/health" >/dev/null 2>&1
    
    local exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        print_test_result "$name" "PASS" "Service discovery and connectivity working"
    else
        print_test_result "$name" "FAIL" "Service discovery or connectivity failed"
    fi
}

# Function to test SSL certificates
test_ssl_certificate() {
    local name="$1"
    local domain="$2"
    
    if [[ "$SKIP_EXTERNAL" == "true" ]]; then
        print_test_result "$name" "SKIP" "External SSL testing disabled"
        return 0
    fi
    
    local cert_info
    if cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
        local not_after
        not_after=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        
        if [[ -n "$not_after" ]]; then
            local expiry_date
            expiry_date=$(date -d "$not_after" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$not_after" +%s 2>/dev/null)
            local current_date
            current_date=$(date +%s)
            
            if [[ "$expiry_date" -gt "$current_date" ]]; then
                local days_left=$(( (expiry_date - current_date) / 86400 ))
                print_test_result "$name" "PASS" "Certificate valid, expires in $days_left days"
            else
                print_test_result "$name" "FAIL" "Certificate expired"
            fi
        else
            print_test_result "$name" "FAIL" "Could not parse certificate expiry"
        fi
    else
        print_test_result "$name" "FAIL" "Could not retrieve certificate"
    fi
}

# Function to test HPA
test_hpa() {
    local name="$1"
    local hpa_name="$2"
    local namespace="$3"
    
    if kubectl get hpa "$hpa_name" -n "$namespace" >/dev/null 2>&1; then
        local hpa_status
        hpa_status=$(kubectl get hpa "$hpa_name" -n "$namespace" --no-headers)
        
        if echo "$hpa_status" | grep -q "<unknown>"; then
            print_test_result "$name" "FAIL" "HPA metrics not available"
        else
            print_test_result "$name" "PASS" "HPA is functional"
        fi
    else
        print_test_result "$name" "FAIL" "HPA not found"
    fi
}

# Function to run all tests
run_all_tests() {
    local domain_suffix=""
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        domain_suffix="-staging"
        NAMESPACE="remotehive-staging"
    fi
    
    print_status "Starting comprehensive validation of RemoteHive ${ENVIRONMENT} deployment..."
    print_status "Domain: $DOMAIN"
    print_status "Namespace: $NAMESPACE"
    echo
    
    # Test 1: Kubernetes Resources
    print_status "=== Testing Kubernetes Resources ==="
    test_k8s_resource "Namespace" "namespace" "$NAMESPACE" "" ""
    test_k8s_resource "MongoDB Deployment" "deployment" "mongodb" "$NAMESPACE" "condition=available"
    test_k8s_resource "Redis Deployment" "deployment" "redis" "$NAMESPACE" "condition=available"
    test_k8s_resource "Backend API Deployment" "deployment" "backend-api" "$NAMESPACE" "condition=available"
    test_k8s_resource "Autoscraper Deployment" "deployment" "autoscraper-service" "$NAMESPACE" "condition=available"
    test_k8s_resource "Admin Panel Deployment" "deployment" "admin-panel" "$NAMESPACE" "condition=available"
    test_k8s_resource "Public Website Deployment" "deployment" "public-website" "$NAMESPACE" "condition=available"
    test_k8s_resource "Celery Worker Deployment" "deployment" "celery-worker" "$NAMESPACE" "condition=available"
    test_k8s_resource "Celery Beat Deployment" "deployment" "celery-beat" "$NAMESPACE" "condition=available"
    echo
    
    # Test 2: Pod Health
    print_status "=== Testing Pod Health ==="
    test_pod_health "MongoDB Pods" "app=mongodb" "$NAMESPACE"
    test_pod_health "Redis Pods" "app=redis" "$NAMESPACE"
    test_pod_health "Backend API Pods" "app=backend-api" "$NAMESPACE"
    test_pod_health "Autoscraper Pods" "app=autoscraper-service" "$NAMESPACE"
    test_pod_health "Admin Panel Pods" "app=admin-panel" "$NAMESPACE"
    test_pod_health "Public Website Pods" "app=public-website" "$NAMESPACE"
    test_pod_health "Celery Worker Pods" "app=celery-worker" "$NAMESPACE"
    test_pod_health "Celery Beat Pods" "app=celery-beat" "$NAMESPACE"
    echo
    
    # Test 3: Database Connectivity
    print_status "=== Testing Database Connectivity ==="
    test_database_connectivity "MongoDB Connection" "app=mongodb" "$NAMESPACE" "mongosh --eval 'db.adminCommand(\"ping\")'"
    test_database_connectivity "Redis Connection" "app=redis" "$NAMESPACE" "redis-cli ping"
    echo
    
    # Test 4: Service Discovery (Internal)
    print_status "=== Testing Internal Service Discovery ==="
    test_service_discovery "Backend API Service" "backend-api" "$NAMESPACE" "8000"
    test_service_discovery "Autoscraper Service" "autoscraper-service" "$NAMESPACE" "8001"
    echo
    
    # Test 5: External HTTP Endpoints
    print_status "=== Testing External HTTP Endpoints ==="
    test_http_endpoint "Backend API Health" "https://api${domain_suffix}.${DOMAIN}/health" "200" "healthy"
    test_http_endpoint "Backend API Docs" "https://api${domain_suffix}.${DOMAIN}/docs" "200" "FastAPI"
    test_http_endpoint "Autoscraper Health" "https://autoscraper${domain_suffix}.${DOMAIN}/health" "200" "healthy"
    test_http_endpoint "Admin Panel Health" "https://admin${domain_suffix}.${DOMAIN}/api/health" "200"
    test_http_endpoint "Public Website" "https://${DOMAIN}" "200"
    echo
    
    # Test 6: SSL Certificates
    print_status "=== Testing SSL Certificates ==="
    test_ssl_certificate "API SSL Certificate" "api${domain_suffix}.${DOMAIN}"
    test_ssl_certificate "Admin SSL Certificate" "admin${domain_suffix}.${DOMAIN}"
    test_ssl_certificate "Public Website SSL Certificate" "${DOMAIN}"
    test_ssl_certificate "Autoscraper SSL Certificate" "autoscraper${domain_suffix}.${DOMAIN}"
    echo
    
    # Test 7: Horizontal Pod Autoscaling
    print_status "=== Testing Horizontal Pod Autoscaling ==="
    test_hpa "Backend API HPA" "backend-api-hpa" "$NAMESPACE"
    test_hpa "Autoscraper HPA" "autoscraper-service-hpa" "$NAMESPACE"
    test_hpa "Admin Panel HPA" "admin-panel-hpa" "$NAMESPACE"
    test_hpa "Public Website HPA" "public-website-hpa" "$NAMESPACE"
    test_hpa "Celery Worker HPA" "celery-worker-hpa" "$NAMESPACE"
    echo
    
    # Test 8: Ingress and Load Balancing
    print_status "=== Testing Ingress and Load Balancing ==="
    test_k8s_resource "Main Ingress" "ingress" "remotehive-ingress" "$NAMESPACE" ""
    test_k8s_resource "Internal Ingress" "ingress" "remotehive-internal-ingress" "$NAMESPACE" ""
    echo
    
    # Test 9: Monitoring
    print_status "=== Testing Monitoring ==="
    test_k8s_resource "ServiceMonitor" "servicemonitor" "remotehive-metrics" "$NAMESPACE" ""
    test_http_endpoint "Grafana" "https://grafana.${DOMAIN}" "200"
    echo
    
    # Test 10: Persistent Storage
    print_status "=== Testing Persistent Storage ==="
    test_k8s_resource "MongoDB PVC" "pvc" "mongodb-data" "$NAMESPACE" ""
    test_k8s_resource "Redis PVC" "pvc" "redis-data" "$NAMESPACE" ""
    test_k8s_resource "Uploads PVC" "pvc" "uploads-data" "$NAMESPACE" ""
    test_k8s_resource "Logs PVC" "pvc" "logs-data" "$NAMESPACE" ""
    echo
}

# Function to show test summary
show_test_summary() {
    echo
    print_status "=== Test Summary ==="
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    echo -e "${YELLOW}Skipped: $SKIPPED_TESTS${NC}"
    echo
    
    local success_rate=0
    if [[ $TOTAL_TESTS -gt 0 ]]; then
        success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    fi
    
    echo "Success Rate: ${success_rate}%"
    echo
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        print_success "🎉 All tests passed! RemoteHive deployment is healthy."
    elif [[ $success_rate -ge 80 ]]; then
        print_warning "⚠️  Most tests passed, but some issues detected. Review failed tests."
    else
        print_error "❌ Multiple test failures detected. Deployment may have issues."
    fi
    
    echo
    print_status "Recommendations:"
    if [[ $FAILED_TESTS -gt 0 ]]; then
        echo "  • Review failed tests and check pod logs: kubectl logs -n $NAMESPACE <pod-name>"
        echo "  • Check service status: kubectl get svc -n $NAMESPACE"
        echo "  • Verify ingress configuration: kubectl describe ingress -n $NAMESPACE"
    fi
    
    if [[ $SKIPPED_TESTS -gt 0 ]]; then
        echo "  • Run with external tests enabled for complete validation"
    fi
    
    echo "  • Monitor application logs for any runtime issues"
    echo "  • Set up regular health checks and monitoring alerts"
    echo "  • Test application functionality manually"
}

# Function to show usage
show_usage() {
    cat <<EOF
RemoteHive Deployment Validation Script

Usage: $0 [OPTIONS]

Options:
  -d, --domain DOMAIN      Base domain name (default: remotehive.in)
  -e, --environment ENV    Environment: production or staging (default: production)
  -n, --namespace NS       Kubernetes namespace (auto-detected from environment)
  -t, --timeout SECONDS    HTTP request timeout (default: 30)
  --skip-external          Skip external endpoint and SSL tests
  --verbose                Show detailed output for failed tests
  -h, --help               Show this help message

Examples:
  # Validate production deployment
  $0 -d remotehive.in
  
  # Validate staging deployment
  $0 -d remotehive.in -e staging
  
  # Skip external tests (useful for internal cluster testing)
  $0 -d remotehive.in --skip-external
  
  # Verbose output for debugging
  $0 -d remotehive.in --verbose

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --skip-external)
            SKIP_EXTERNAL=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    print_error "Environment must be 'production' or 'staging'"
    exit 1
fi

# Auto-detect namespace if not specified
if [[ "$ENVIRONMENT" == "staging" && "$NAMESPACE" == "remotehive" ]]; then
    NAMESPACE="remotehive-staging"
fi

# Check kubectl connectivity
if ! kubectl cluster-info >/dev/null 2>&1; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

# Main execution
main() {
    run_all_tests
    show_test_summary
    
    # Exit with appropriate code
    if [[ $FAILED_TESTS -eq 0 ]]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"