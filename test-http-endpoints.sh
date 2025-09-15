#!/bin/bash

# =============================================================================
# RemoteHive HTTP Endpoints Test Script
# =============================================================================
# This script tests RemoteHive services via HTTP without requiring SSH access
# Usage: ./test-http-endpoints.sh [host]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HOST="${1:-210.79.129.9}"
TEST_TIMEOUT=15

# Service endpoints
BACKEND_URL="http://$HOST:8000"
AUTOSCRAPER_URL="http://$HOST:8001"
ADMIN_URL="http://$HOST:3000"
PUBLIC_URL="http://$HOST:5173"
NGINX_URL="http://$HOST"

# Functions
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

test_endpoint() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    echo -n "Testing $description... "
    
    if response=$(curl -s -w "\n%{http_code}" --connect-timeout $TEST_TIMEOUT "$url" 2>/dev/null); then
        status_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [[ "$status_code" == "$expected_status" ]]; then
            echo -e "${GREEN}✅ OK (HTTP $status_code)${NC}"
            return 0
        else
            echo -e "${RED}❌ FAIL (HTTP $status_code, expected $expected_status)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ CONNECTION FAILED${NC}"
        return 1
    fi
}

test_port() {
    local host="$1"
    local port="$2"
    local description="$3"
    
    echo -n "Testing $description (port $port)... "
    
    if timeout 5 bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
        echo -e "${GREEN}✅ OPEN${NC}"
        return 0
    else
        echo -e "${RED}❌ CLOSED/FILTERED${NC}"
        return 1
    fi
}

# Main execution
main() {
    log_info "Testing RemoteHive HTTP endpoints on $HOST"
    echo ""
    
    local all_tests_passed=true
    
    # Test port connectivity first
    log_info "Testing port connectivity..."
    test_port "$HOST" "80" "HTTP (Nginx)" || all_tests_passed=false
    test_port "$HOST" "8000" "Backend API" || all_tests_passed=false
    test_port "$HOST" "8001" "Autoscraper Service" || all_tests_passed=false
    test_port "$HOST" "3000" "Admin Panel" || all_tests_passed=false
    test_port "$HOST" "5173" "Public Website" || all_tests_passed=false
    
    echo ""
    log_info "Testing HTTP endpoints..."
    
    # Test health endpoints
    test_endpoint "$NGINX_URL/health" "Nginx Health Check" || all_tests_passed=false
    test_endpoint "$BACKEND_URL/health" "Backend API Health" || all_tests_passed=false
    test_endpoint "$AUTOSCRAPER_URL/health" "Autoscraper Health" || all_tests_passed=false
    
    # Test API documentation
    test_endpoint "$BACKEND_URL/docs" "Backend API Docs" || all_tests_passed=false
    test_endpoint "$AUTOSCRAPER_URL/docs" "Autoscraper API Docs" || all_tests_passed=false
    
    # Test frontend applications
    test_endpoint "$ADMIN_URL" "Admin Panel" || all_tests_passed=false
    test_endpoint "$PUBLIC_URL" "Public Website" || all_tests_passed=false
    
    # Test API endpoints
    test_endpoint "$BACKEND_URL/api/v1/jobs" "Jobs API Endpoint" || all_tests_passed=false
    
    # Test Nginx proxy routes
    test_endpoint "$NGINX_URL/api/v1/jobs" "Nginx -> Backend Proxy" || all_tests_passed=false
    test_endpoint "$NGINX_URL/autoscraper/health" "Nginx -> Autoscraper Proxy" || all_tests_passed=false
    
    echo ""
    if [[ "$all_tests_passed" == "true" ]]; then
        log_success "🎉 All HTTP endpoint tests passed!"
        echo ""
        echo "RemoteHive services are accessible:"
        echo "  • Main Website: $NGINX_URL"
        echo "  • Admin Panel: $ADMIN_URL"
        echo "  • API Documentation: $BACKEND_URL/docs"
        echo "  • Autoscraper Docs: $AUTOSCRAPER_URL/docs"
        echo ""
        echo "GitHub Actions deployment appears successful! ✅"
    else
        log_error "❌ Some HTTP endpoint tests failed."
        echo ""
        echo "This could indicate:"
        echo "  • GitHub Actions deployment is still in progress"
        echo "  • Deployment failed or services aren't starting"
        echo "  • Firewall blocking access to ports"
        echo "  • VPC instance is not accessible"
        echo ""
        echo "Next steps:"
        echo "  1. Check GitHub Actions workflow status in the repository"
        echo "  2. Wait a few minutes and try again if deployment is in progress"
        echo "  3. Verify VPC instance is running and accessible"
        echo "  4. Check firewall rules allow access to ports 80, 8000, 8001, 3000, 5173"
    fi
    
    if [[ "$all_tests_passed" == "true" ]]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"