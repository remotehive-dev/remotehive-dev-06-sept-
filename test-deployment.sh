#!/bin/bash

# =============================================================================
# RemoteHive Deployment Testing Script
# =============================================================================
# This script tests the complete RemoteHive deployment to ensure all services
# are running correctly and can communicate with each other
# Usage: ./test-deployment.sh [host] [--verbose]
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HOST="${1:-210.79.129.9}"
VERBOSE=false
TEST_TIMEOUT=30
ADMIN_EMAIL="admin@remotehive.in"
ADMIN_PASSWORD="Ranjeet11\$"

# Parse arguments
shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [host] [--verbose]"
            echo "  host: Target host IP (default: 210.79.129.9)"
            echo "  --verbose: Show detailed output"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

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

log_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1"
    fi
}

test_endpoint() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    log_verbose "Testing: $url"
    
    if response=$(curl -s -w "\n%{http_code}" --connect-timeout $TEST_TIMEOUT "$url" 2>/dev/null); then
        status_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [[ "$status_code" == "$expected_status" ]]; then
            log_success "✅ $description (HTTP $status_code)"
            if [[ "$VERBOSE" == "true" ]]; then
                echo "   Response: $(echo "$body" | head -c 100)..."
            fi
            return 0
        else
            log_error "❌ $description (HTTP $status_code, expected $expected_status)"
            if [[ "$VERBOSE" == "true" ]]; then
                echo "   Response: $body"
            fi
            return 1
        fi
    else
        log_error "❌ $description (Connection failed)"
        return 1
    fi
}

test_ssh_connection() {
    log_info "Testing SSH connection to $HOST..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "ubuntu@$HOST" "echo 'SSH connection successful'" 2>/dev/null; then
        log_success "✅ SSH connection established"
        return 0
    else
        log_error "❌ SSH connection failed"
        return 1
    fi
}

test_services_via_ssh() {
    log_info "Testing services via SSH..."
    
    ssh -o StrictHostKeyChecking=no "ubuntu@$HOST" << 'EOF'
        echo "Checking systemd services..."
        
        # Check systemd services
        for service in remotehive-backend remotehive-autoscraper mongod redis-server nginx; do
            if sudo systemctl is-active --quiet "$service"; then
                echo "✅ $service is running"
            else
                echo "❌ $service is not running"
                sudo systemctl status "$service" --no-pager -l || true
            fi
        done
        
        echo ""
        echo "Checking PM2 processes..."
        pm2 list
        
        echo ""
        echo "Checking port usage..."
        netstat -tlnp | grep -E ":(8000|8001|3000|5173|80|443)" || echo "No services found on expected ports"
        
        echo ""
        echo "Checking disk space..."
        df -h /home/ubuntu/RemoteHive
        
        echo ""
        echo "Checking recent logs..."
        echo "Backend logs:"
        sudo journalctl -u remotehive-backend --no-pager -n 5 || true
        
        echo "Autoscraper logs:"
        sudo journalctl -u remotehive-autoscraper --no-pager -n 5 || true
EOF
}

test_health_endpoints() {
    log_info "Testing health endpoints..."
    
    local all_healthy=true
    
    # Test backend health
    if ! test_endpoint "$BACKEND_URL/health" "Backend API Health"; then
        all_healthy=false
    fi
    
    # Test autoscraper health
    if ! test_endpoint "$AUTOSCRAPER_URL/health" "Autoscraper Service Health"; then
        all_healthy=false
    fi
    
    # Test Nginx health
    if ! test_endpoint "$NGINX_URL/health" "Nginx Health"; then
        all_healthy=false
    fi
    
    if [[ "$all_healthy" == "true" ]]; then
        log_success "All health endpoints are responding"
    else
        log_error "Some health endpoints failed"
        return 1
    fi
}

test_api_endpoints() {
    log_info "Testing API endpoints..."
    
    local all_working=true
    
    # Test backend API endpoints
    if ! test_endpoint "$BACKEND_URL/docs" "Backend API Documentation"; then
        all_working=false
    fi
    
    if ! test_endpoint "$BACKEND_URL/api/v1/jobs" "Backend Jobs API" "200"; then
        all_working=false
    fi
    
    # Test autoscraper endpoints
    if ! test_endpoint "$AUTOSCRAPER_URL/docs" "Autoscraper API Documentation"; then
        all_working=false
    fi
    
    if [[ "$all_working" == "true" ]]; then
        log_success "All API endpoints are working"
    else
        log_error "Some API endpoints failed"
        return 1
    fi
}

test_frontend_services() {
    log_info "Testing frontend services..."
    
    local all_working=true
    
    # Test admin panel
    if ! test_endpoint "$ADMIN_URL" "Admin Panel"; then
        all_working=false
    fi
    
    # Test public website
    if ! test_endpoint "$PUBLIC_URL" "Public Website"; then
        all_working=false
    fi
    
    # Test Nginx proxy
    if ! test_endpoint "$NGINX_URL" "Nginx Reverse Proxy"; then
        all_working=false
    fi
    
    if [[ "$all_working" == "true" ]]; then
        log_success "All frontend services are working"
    else
        log_error "Some frontend services failed"
        return 1
    fi
}

test_database_connectivity() {
    log_info "Testing database connectivity..."
    
    ssh -o StrictHostKeyChecking=no "ubuntu@$HOST" << 'EOF'
        echo "Testing MongoDB connection..."
        if mongosh --eval "db.adminCommand('ping')" --quiet; then
            echo "✅ MongoDB is accessible"
        else
            echo "❌ MongoDB connection failed"
        fi
        
        echo "Testing Redis connection..."
        if redis-cli ping | grep -q "PONG"; then
            echo "✅ Redis is accessible"
        else
            echo "❌ Redis connection failed"
        fi
EOF
}

test_authentication() {
    log_info "Testing authentication system..."
    
    # Test login endpoint
    local login_response
    login_response=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
        --connect-timeout $TEST_TIMEOUT 2>/dev/null || echo "")
    
    if [[ -n "$login_response" ]] && echo "$login_response" | grep -q "access_token"; then
        log_success "✅ Authentication system is working"
        if [[ "$VERBOSE" == "true" ]]; then
            echo "   Login response: $(echo "$login_response" | head -c 100)..."
        fi
    else
        log_error "❌ Authentication system failed"
        if [[ "$VERBOSE" == "true" ]]; then
            echo "   Login response: $login_response"
        fi
        return 1
    fi
}

test_performance() {
    log_info "Testing performance..."
    
    # Test response times
    local backend_time
    backend_time=$(curl -s -w "%{time_total}" -o /dev/null "$BACKEND_URL/health" --connect-timeout $TEST_TIMEOUT 2>/dev/null || echo "timeout")
    
    if [[ "$backend_time" != "timeout" ]]; then
        if (( $(echo "$backend_time < 2.0" | bc -l) )); then
            log_success "✅ Backend response time: ${backend_time}s (Good)"
        else
            log_warning "⚠️  Backend response time: ${backend_time}s (Slow)"
        fi
    else
        log_error "❌ Backend response timeout"
    fi
}

generate_report() {
    log_info "Generating deployment test report..."
    
    local report_file="deployment_test_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
RemoteHive Deployment Test Report
=================================
Date: $(date)
Host: $HOST
Test Duration: $(date -d @$(($(date +%s) - start_time)) -u +%H:%M:%S)

Service URLs:
- Backend API: $BACKEND_URL
- Autoscraper Service: $AUTOSCRAPER_URL
- Admin Panel: $ADMIN_URL
- Public Website: $PUBLIC_URL
- Nginx Proxy: $NGINX_URL

Test Results:
$(cat /tmp/test_results.log 2>/dev/null || echo "No detailed results available")

Next Steps:
1. If tests failed, check service logs: ssh ubuntu@$HOST 'sudo journalctl -u remotehive-backend -f'
2. Verify firewall settings allow access to ports 8000, 8001, 3000, 5173, 80
3. Check PM2 process status: ssh ubuntu@$HOST 'pm2 list'
4. Monitor system resources: ssh ubuntu@$HOST 'htop'

EOF
    
    log_success "Test report saved to: $report_file"
}

# Main execution
main() {
    local start_time=$(date +%s)
    local all_tests_passed=true
    
    log_info "Starting RemoteHive deployment tests..."
    log_info "Target host: $HOST"
    log_info "Verbose mode: $VERBOSE"
    echo ""
    
    # Redirect output to log file for report
    exec > >(tee /tmp/test_results.log)
    exec 2>&1
    
    # Run tests
    if ! test_ssh_connection; then
        log_error "SSH connection failed. Cannot proceed with remote tests."
        all_tests_passed=false
    else
        test_services_via_ssh
        
        if ! test_health_endpoints; then
            all_tests_passed=false
        fi
        
        if ! test_api_endpoints; then
            all_tests_passed=false
        fi
        
        if ! test_frontend_services; then
            all_tests_passed=false
        fi
        
        test_database_connectivity
        
        if ! test_authentication; then
            all_tests_passed=false
        fi
        
        test_performance
    fi
    
    echo ""
    if [[ "$all_tests_passed" == "true" ]]; then
        log_success "🎉 All deployment tests passed! RemoteHive is ready for use."
        echo ""
        echo "Access your RemoteHive instance:"
        echo "  • Admin Panel: $ADMIN_URL"
        echo "  • Public Website: $PUBLIC_URL"
        echo "  • API Documentation: $BACKEND_URL/docs"
        echo "  • Admin Login: $ADMIN_EMAIL / [password]"
    else
        log_error "❌ Some deployment tests failed. Please check the logs and fix issues."
        echo ""
        echo "Troubleshooting:"
        echo "  • Check service logs: ssh ubuntu@$HOST 'sudo journalctl -u remotehive-backend -f'"
        echo "  • Verify PM2 processes: ssh ubuntu@$HOST 'pm2 list'"
        echo "  • Check system resources: ssh ubuntu@$HOST 'htop'"
    fi
    
    generate_report
    
    if [[ "$all_tests_passed" == "true" ]]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"