#!/bin/bash

# RemoteHive Deployment Testing Script
# This script tests all services and endpoints to ensure proper deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_TIMEOUT=30
RETRY_COUNT=3
RETRY_DELAY=5

# Service endpoints
BACKEND_URL="http://localhost:8000"
AUTOSCRAPER_URL="http://localhost:8001"
ADMIN_URL="http://localhost:3000"
PUBLIC_URL="http://localhost:5173"
MONGO_EXPRESS_URL="http://localhost:8081"
REDIS_COMMANDER_URL="http://localhost:8082"
MAILHOG_URL="http://localhost:8025"
PROMETHEUS_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3001"

# Test results
TEST_RESULTS=()
FAILED_TESTS=()
PASSED_TESTS=()

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

# Helper functions
wait_for_service() {
    local url=$1
    local service_name=$2
    local timeout=${3:-$DEFAULT_TIMEOUT}
    local count=0
    
    log_info "Waiting for $service_name to be ready..."
    
    while [ $count -lt $timeout ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_success "$service_name is ready"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    
    log_error "$service_name failed to start within $timeout seconds"
    return 1
}

test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    local retry_count=${4:-$RETRY_COUNT}
    
    log_info "Testing: $description"
    
    for i in $(seq 1 $retry_count); do
        local response=$(curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null || echo "000")
        
        if [ "$response" = "$expected_status" ]; then
            log_success "✓ $description (HTTP $response)"
            PASSED_TESTS+=("$description")
            return 0
        fi
        
        if [ $i -lt $retry_count ]; then
            log_warning "Attempt $i failed (HTTP $response), retrying in $RETRY_DELAY seconds..."
            sleep $RETRY_DELAY
        fi
    done
    
    log_error "✗ $description (HTTP $response)"
    FAILED_TESTS+=("$description")
    return 1
}

test_json_endpoint() {
    local url=$1
    local description=$2
    local expected_field=$3
    
    log_info "Testing: $description"
    
    local response=$(curl -s "$url" 2>/dev/null)
    
    if [ -z "$response" ]; then
        log_error "✗ $description (No response)"
        FAILED_TESTS+=("$description")
        return 1
    fi
    
    if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
        log_success "✓ $description"
        PASSED_TESTS+=("$description")
        return 0
    else
        log_error "✗ $description (Missing field: $expected_field)"
        FAILED_TESTS+=("$description")
        return 1
    fi
}

test_database_connection() {
    local service=$1
    local description=$2
    
    log_info "Testing: $description"
    
    if docker-compose exec -T "$service" echo "Connection test" > /dev/null 2>&1; then
        log_success "✓ $description"
        PASSED_TESTS+=("$description")
        return 0
    else
        log_error "✗ $description"
        FAILED_TESTS+=("$description")
        return 1
    fi
}

test_docker_services() {
    log_info "Testing Docker services status..."
    
    local services=("backend" "autoscraper" "admin" "public" "mongodb" "redis" "celery-worker" "celery-beat")
    
    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up"; then
            log_success "✓ Docker service: $service"
            PASSED_TESTS+=("Docker service: $service")
        else
            log_error "✗ Docker service: $service"
            FAILED_TESTS+=("Docker service: $service")
        fi
    done
}

test_kubernetes_services() {
    local namespace=${1:-"remotehive-prod"}
    
    log_info "Testing Kubernetes services in namespace: $namespace..."
    
    if ! kubectl get namespace "$namespace" > /dev/null 2>&1; then
        log_warning "Namespace $namespace not found, skipping Kubernetes tests"
        return 0
    fi
    
    local deployments=$(kubectl get deployments -n "$namespace" -o jsonpath='{.items[*].metadata.name}')
    
    for deployment in $deployments; do
        local ready=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.status.readyReplicas}')
        local desired=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.replicas}')
        
        if [ "$ready" = "$desired" ] && [ "$ready" != "" ]; then
            log_success "✓ K8s deployment: $deployment ($ready/$desired ready)"
            PASSED_TESTS+=("K8s deployment: $deployment")
        else
            log_error "✗ K8s deployment: $deployment ($ready/$desired ready)"
            FAILED_TESTS+=("K8s deployment: $deployment")
        fi
    done
}

test_authentication() {
    log_info "Testing authentication endpoints..."
    
    # Test login endpoint
    local login_response=$(curl -s -X POST "$BACKEND_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@remotehive.in","password":"Ranjeet11$"}' \
        2>/dev/null)
    
    if echo "$login_response" | jq -e '.access_token' > /dev/null 2>&1; then
        log_success "✓ Authentication: Login successful"
        PASSED_TESTS+=("Authentication: Login")
        
        # Extract token for further tests
        local token=$(echo "$login_response" | jq -r '.access_token')
        
        # Test protected endpoint
        local profile_response=$(curl -s -H "Authorization: Bearer $token" "$BACKEND_URL/auth/me" 2>/dev/null)
        
        if echo "$profile_response" | jq -e '.email' > /dev/null 2>&1; then
            log_success "✓ Authentication: Protected endpoint access"
            PASSED_TESTS+=("Authentication: Protected endpoint")
        else
            log_error "✗ Authentication: Protected endpoint access"
            FAILED_TESTS+=("Authentication: Protected endpoint")
        fi
    else
        log_error "✗ Authentication: Login failed"
        FAILED_TESTS+=("Authentication: Login")
    fi
}

test_database_operations() {
    log_info "Testing database operations..."
    
    # Test MongoDB connection
    if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log_success "✓ MongoDB: Connection successful"
        PASSED_TESTS+=("MongoDB: Connection")
        
        # Test database creation
        if docker-compose exec -T mongodb mongosh remotehive --eval "db.test.insertOne({test: true})" > /dev/null 2>&1; then
            log_success "✓ MongoDB: Write operation successful"
            PASSED_TESTS+=("MongoDB: Write operation")
            
            # Cleanup test data
            docker-compose exec -T mongodb mongosh remotehive --eval "db.test.deleteMany({test: true})" > /dev/null 2>&1
        else
            log_error "✗ MongoDB: Write operation failed"
            FAILED_TESTS+=("MongoDB: Write operation")
        fi
    else
        log_error "✗ MongoDB: Connection failed"
        FAILED_TESTS+=("MongoDB: Connection")
    fi
    
    # Test Redis connection
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        log_success "✓ Redis: Connection successful"
        PASSED_TESTS+=("Redis: Connection")
        
        # Test Redis operations
        if docker-compose exec -T redis redis-cli set test_key test_value > /dev/null 2>&1; then
            log_success "✓ Redis: Write operation successful"
            PASSED_TESTS+=("Redis: Write operation")
            
            # Cleanup test data
            docker-compose exec -T redis redis-cli del test_key > /dev/null 2>&1
        else
            log_error "✗ Redis: Write operation failed"
            FAILED_TESTS+=("Redis: Write operation")
        fi
    else
        log_error "✗ Redis: Connection failed"
        FAILED_TESTS+=("Redis: Connection")
    fi
}

test_celery_tasks() {
    log_info "Testing Celery task processing..."
    
    # Check if Celery worker is running
    if docker-compose exec -T celery-worker celery -A app.tasks.celery_app inspect active > /dev/null 2>&1; then
        log_success "✓ Celery: Worker is active"
        PASSED_TESTS+=("Celery: Worker active")
    else
        log_error "✗ Celery: Worker is not responding"
        FAILED_TESTS+=("Celery: Worker active")
    fi
    
    # Check if Celery beat is running
    if docker-compose ps celery-beat | grep -q "Up"; then
        log_success "✓ Celery: Beat scheduler is running"
        PASSED_TESTS+=("Celery: Beat scheduler")
    else
        log_error "✗ Celery: Beat scheduler is not running"
        FAILED_TESTS+=("Celery: Beat scheduler")
    fi
}

test_api_endpoints() {
    log_info "Testing API endpoints..."
    
    # Backend API endpoints
    test_endpoint "$BACKEND_URL/health" 200 "Backend: Health check"
    test_endpoint "$BACKEND_URL/docs" 200 "Backend: API documentation"
    test_json_endpoint "$BACKEND_URL/" "message" "Backend: Root endpoint"
    
    # Autoscraper API endpoints
    test_endpoint "$AUTOSCRAPER_URL/health" 200 "Autoscraper: Health check"
    test_endpoint "$AUTOSCRAPER_URL/docs" 200 "Autoscraper: API documentation"
    test_json_endpoint "$AUTOSCRAPER_URL/" "message" "Autoscraper: Root endpoint"
}

test_frontend_applications() {
    log_info "Testing frontend applications..."
    
    # Admin panel
    test_endpoint "$ADMIN_URL" 200 "Admin Panel: Home page"
    test_endpoint "$ADMIN_URL/api/health" 200 "Admin Panel: Health check"
    
    # Public website
    test_endpoint "$PUBLIC_URL" 200 "Public Website: Home page"
    test_endpoint "$PUBLIC_URL/health" 200 "Public Website: Health check"
}

test_monitoring_services() {
    log_info "Testing monitoring services..."
    
    # Development monitoring services
    if docker-compose ps mongo-express | grep -q "Up"; then
        test_endpoint "$MONGO_EXPRESS_URL" 200 "Mongo Express: Web interface"
    fi
    
    if docker-compose ps redis-commander | grep -q "Up"; then
        test_endpoint "$REDIS_COMMANDER_URL" 200 "Redis Commander: Web interface"
    fi
    
    if docker-compose ps mailhog | grep -q "Up"; then
        test_endpoint "$MAILHOG_URL" 200 "MailHog: Web interface"
    fi
    
    if docker-compose ps prometheus | grep -q "Up"; then
        test_endpoint "$PROMETHEUS_URL" 200 "Prometheus: Web interface"
    fi
    
    if docker-compose ps grafana | grep -q "Up"; then
        test_endpoint "$GRAFANA_URL" 200 "Grafana: Web interface"
    fi
}

test_performance() {
    log_info "Testing performance metrics..."
    
    # Test response times
    local start_time=$(date +%s%N)
    curl -s "$BACKEND_URL/health" > /dev/null
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $response_time -lt 1000 ]; then
        log_success "✓ Performance: Backend response time ${response_time}ms"
        PASSED_TESTS+=("Performance: Backend response time")
    else
        log_warning "⚠ Performance: Backend response time ${response_time}ms (slow)"
        FAILED_TESTS+=("Performance: Backend response time")
    fi
}

generate_report() {
    echo
    echo "=========================================="
    echo "         DEPLOYMENT TEST REPORT"
    echo "=========================================="
    echo
    
    local total_tests=$((${#PASSED_TESTS[@]} + ${#FAILED_TESTS[@]}))
    local success_rate=0
    
    if [ $total_tests -gt 0 ]; then
        success_rate=$(( ${#PASSED_TESTS[@]} * 100 / total_tests ))
    fi
    
    echo -e "${BLUE}Total Tests:${NC} $total_tests"
    echo -e "${GREEN}Passed:${NC} ${#PASSED_TESTS[@]}"
    echo -e "${RED}Failed:${NC} ${#FAILED_TESTS[@]}"
    echo -e "${YELLOW}Success Rate:${NC} $success_rate%"
    echo
    
    if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
        echo -e "${RED}Failed Tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "  ${RED}✗${NC} $test"
        done
        echo
    fi
    
    if [ ${#PASSED_TESTS[@]} -gt 0 ]; then
        echo -e "${GREEN}Passed Tests:${NC}"
        for test in "${PASSED_TESTS[@]}"; do
            echo -e "  ${GREEN}✓${NC} $test"
        done
        echo
    fi
    
    # Generate recommendations
    if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
        echo -e "${YELLOW}Recommendations:${NC}"
        echo "1. Check service logs: docker-compose logs [service-name]"
        echo "2. Verify environment variables in .env file"
        echo "3. Ensure all required ports are available"
        echo "4. Check database connections and credentials"
        echo "5. Verify network connectivity between services"
        echo
    fi
    
    # Exit with error if any tests failed
    if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
        exit 1
    fi
}

# Main execution
main() {
    local environment=${1:-"docker"}
    local namespace=${2:-"remotehive-prod"}
    
    echo "=========================================="
    echo "    RemoteHive Deployment Testing"
    echo "=========================================="
    echo "Environment: $environment"
    echo "Timestamp: $(date)"
    echo
    
    # Check prerequisites
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed, some tests will be skipped"
    fi
    
    case $environment in
        "docker")
            log_info "Testing Docker deployment..."
            
            # Wait for services to be ready
            wait_for_service "$BACKEND_URL/health" "Backend API" 60
            wait_for_service "$AUTOSCRAPER_URL/health" "Autoscraper API" 60
            wait_for_service "$ADMIN_URL" "Admin Panel" 60
            wait_for_service "$PUBLIC_URL" "Public Website" 60
            
            # Run tests
            test_docker_services
            test_api_endpoints
            test_frontend_applications
            test_database_operations
            test_celery_tasks
            test_authentication
            test_monitoring_services
            test_performance
            ;;
            
        "kubernetes")
            log_info "Testing Kubernetes deployment..."
            
            if ! command -v kubectl &> /dev/null; then
                log_error "kubectl is required for Kubernetes testing"
                exit 1
            fi
            
            test_kubernetes_services "$namespace"
            
            # Port forward for testing (if needed)
            # kubectl port-forward svc/backend 8000:8000 -n "$namespace" &
            # PORT_FORWARD_PID=$!
            # trap "kill $PORT_FORWARD_PID" EXIT
            
            # Run basic tests
            test_api_endpoints
            test_authentication
            ;;
            
        *)
            log_error "Unknown environment: $environment"
            echo "Usage: $0 [docker|kubernetes] [namespace]"
            exit 1
            ;;
    esac
    
    # Generate final report
    generate_report
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi