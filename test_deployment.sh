#!/bin/bash

# RemoteHive CI/CD Pipeline Test Script
# This script tests the complete deployment pipeline

set -e  # Exit on any error

echo "🚀 Starting RemoteHive CI/CD Pipeline Test"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPC_HOST="210.79.128.138"
VPC_USER="ubuntu"
SSH_KEY="./remotehive_key_github"
REPO_URL="https://github.com/remotehive-dev/remotehive-dev-06-sept-.git"
APP_PORT="8000"
ADMIN_PORT="3000"
PUBLIC_PORT="5173"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to test SSH connection
test_ssh_connection() {
    print_status "Testing SSH connection to VPC..."
    
    if [ ! -f "$SSH_KEY" ]; then
        print_error "SSH key not found: $SSH_KEY"
        return 1
    fi
    
    # Set correct permissions for SSH key
    chmod 600 "$SSH_KEY"
    
    # Test SSH connection
    if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$VPC_USER@$VPC_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        print_success "SSH connection to VPC established"
        return 0
    else
        print_error "Failed to connect to VPC via SSH"
        return 1
    fi
}

# Function to check Docker installation on VPC
check_docker_on_vpc() {
    print_status "Checking Docker installation on VPC..."
    
    if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VPC_USER@$VPC_HOST" "docker --version && docker-compose --version" >/dev/null 2>&1; then
        print_success "Docker and Docker Compose are installed on VPC"
        return 0
    else
        print_error "Docker or Docker Compose not found on VPC"
        return 1
    fi
}

# Function to check if services are running on VPC
check_services_on_vpc() {
    print_status "Checking RemoteHive services on VPC..."
    
    # Check if ports are accessible
    local services_running=0
    
    # Check main API (port 8000)
    if curl -s --connect-timeout 5 "http://$VPC_HOST:$APP_PORT/health" >/dev/null 2>&1; then
        print_success "Main API service is running (port $APP_PORT)"
        ((services_running++))
    else
        print_warning "Main API service not accessible (port $APP_PORT)"
    fi
    
    # Check admin panel (port 3000)
    if curl -s --connect-timeout 5 "http://$VPC_HOST:$ADMIN_PORT" >/dev/null 2>&1; then
        print_success "Admin Panel is running (port $ADMIN_PORT)"
        ((services_running++))
    else
        print_warning "Admin Panel not accessible (port $ADMIN_PORT)"
    fi
    
    # Check public website (port 5173)
    if curl -s --connect-timeout 5 "http://$VPC_HOST:$PUBLIC_PORT" >/dev/null 2>&1; then
        print_success "Public Website is running (port $PUBLIC_PORT)"
        ((services_running++))
    else
        print_warning "Public Website not accessible (port $PUBLIC_PORT)"
    fi
    
    if [ $services_running -gt 0 ]; then
        print_success "$services_running RemoteHive services are running"
        return 0
    else
        print_error "No RemoteHive services are accessible"
        return 1
    fi
}

# Function to test GitHub Actions workflow
test_github_actions() {
    print_status "Checking GitHub Actions workflow..."
    
    if command_exists gh; then
        # Check if user is authenticated
        if gh auth status >/dev/null 2>&1; then
            # List recent workflow runs
            print_status "Recent GitHub Actions runs:"
            gh run list --limit 5 --repo "remotehive-dev/remotehive-dev-06-sept-" || print_warning "Could not fetch workflow runs"
        else
            print_warning "GitHub CLI not authenticated. Run 'gh auth login' to check workflows"
        fi
    else
        print_warning "GitHub CLI not installed. Install with 'brew install gh' to check workflows"
    fi
}

# Function to create a test commit
create_test_commit() {
    print_status "Creating test commit to trigger CI/CD..."
    
    # Create a simple test file
    local test_file="deployment_test_$(date +%s).txt"
    echo "Deployment test at $(date)" > "$test_file"
    
    # Check if we're in a git repository
    if [ -d ".git" ]; then
        git add "$test_file"
        git commit -m "Test deployment pipeline - $(date)"
        
        print_success "Test commit created: $test_file"
        print_status "Push this commit to trigger the CI/CD pipeline:"
        echo "  git push origin main"
    else
        print_warning "Not in a git repository. Test file created: $test_file"
    fi
}

# Function to monitor deployment
monitor_deployment() {
    print_status "Monitoring deployment progress..."
    
    if command_exists gh && gh auth status >/dev/null 2>&1; then
        print_status "Watching latest workflow run..."
        gh run watch --repo "remotehive-dev/remotehive-dev-06-sept-" || print_warning "Could not monitor workflow"
    else
        print_status "Manual monitoring: Check https://github.com/remotehive-dev/remotehive-dev-06-sept-/actions"
    fi
}

# Main execution
main() {
    echo
    print_status "Starting comprehensive CI/CD pipeline test..."
    echo
    
    # Test 1: SSH Connection
    if ! test_ssh_connection; then
        print_error "SSH connection test failed. Please check your SSH key and VPC configuration."
        exit 1
    fi
    echo
    
    # Test 2: Docker Installation
    if ! check_docker_on_vpc; then
        print_error "Docker installation test failed. Please ensure Docker is installed on the VPC."
        exit 1
    fi
    echo
    
    # Test 3: Service Status
    check_services_on_vpc
    echo
    
    # Test 4: GitHub Actions
    test_github_actions
    echo
    
    # Test 5: Create Test Commit (optional)
    read -p "Do you want to create a test commit to trigger the CI/CD pipeline? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_test_commit
        echo
        
        read -p "Do you want to monitor the deployment? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            monitor_deployment
        fi
    fi
    
    echo
    print_success "CI/CD pipeline test completed!"
    echo
    print_status "Next steps:"
    echo "  1. If services are not running, check the deployment logs"
    echo "  2. Verify GitHub secrets are configured correctly"
    echo "  3. Test the application functionality at:"
    echo "     - Main API: http://$VPC_HOST:$APP_PORT"
    echo "     - Admin Panel: http://$VPC_HOST:$ADMIN_PORT"
    echo "     - Public Website: http://$VPC_HOST:$PUBLIC_PORT"
    echo
}

# Run main function
main "$@"