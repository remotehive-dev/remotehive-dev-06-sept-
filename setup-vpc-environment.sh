#!/bin/bash

# =============================================================================
# RemoteHive VPC Environment Setup Script
# =============================================================================
# This script sets up all required dependencies on a fresh Ubuntu VPC instance
# for running RemoteHive from source (without Docker)
# Usage: ./setup-vpc-environment.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

check_system() {
    log_info "Checking system requirements..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root"
        log_info "Please run as a regular user with sudo privileges"
        exit 1
    fi
    
    # Check Ubuntu version
    if ! grep -q "Ubuntu" /etc/os-release; then
        log_warning "This script is designed for Ubuntu. Other distributions may not work correctly."
    fi
    
    # Check sudo privileges
    if ! sudo -n true 2>/dev/null; then
        log_info "This script requires sudo privileges. You may be prompted for your password."
    fi
    
    log_success "System check completed"
}

update_system() {
    log_info "Updating system packages..."
    
    sudo apt-get update
    sudo apt-get upgrade -y
    
    # Install essential build tools
    sudo apt-get install -y \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        unzip \
        vim \
        htop \
        tree
    
    log_success "System packages updated"
}

install_python() {
    log_info "Installing Python 3.11..."
    
    if command -v python3.11 &> /dev/null; then
        log_info "Python 3.11 is already installed"
        python3.11 --version
    else
        # Add deadsnakes PPA for Python 3.11
        sudo add-apt-repository -y ppa:deadsnakes/ppa
        sudo apt-get update
        
        # Install Python 3.11 and related packages
        sudo apt-get install -y \
            python3.11 \
            python3.11-pip \
            python3.11-venv \
            python3.11-dev \
            python3.11-distutils
        
        # Set up alternatives for python3
        sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
        
        log_success "Python 3.11 installed successfully"
        python3.11 --version
    fi
    
    # Upgrade pip
    python3.11 -m pip install --user --upgrade pip setuptools wheel
}

install_nodejs() {
    log_info "Installing Node.js 20..."
    
    if command -v node &> /dev/null && [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -ge 20 ]]; then
        log_info "Node.js 20+ is already installed"
        node --version
        npm --version
    else
        # Install Node.js 20 from NodeSource repository
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        
        log_success "Node.js 20 installed successfully"
        node --version
        npm --version
    fi
}

install_mongodb() {
    log_info "Installing MongoDB 7.0..."
    
    if command -v mongod &> /dev/null; then
        log_info "MongoDB is already installed"
        mongod --version | head -1
    else
        # Import MongoDB public GPG key
        wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
        
        # Add MongoDB repository
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        
        # Update package list and install MongoDB
        sudo apt-get update
        sudo apt-get install -y mongodb-org
        
        # Configure MongoDB
        sudo systemctl enable mongod
        sudo systemctl start mongod
        
        # Wait for MongoDB to start
        sleep 5
        
        # Verify MongoDB is running
        if sudo systemctl is-active --quiet mongod; then
            log_success "MongoDB installed and started successfully"
            mongod --version | head -1
        else
            log_error "MongoDB failed to start"
            sudo journalctl -u mongod --no-pager -n 10
            exit 1
        fi
    fi
}

install_redis() {
    log_info "Installing Redis..."
    
    if command -v redis-server &> /dev/null; then
        log_info "Redis is already installed"
        redis-server --version
    else
        # Install Redis
        sudo apt-get install -y redis-server
        
        # Configure Redis
        sudo systemctl enable redis-server
        sudo systemctl start redis-server
        
        # Wait for Redis to start
        sleep 3
        
        # Verify Redis is running
        if sudo systemctl is-active --quiet redis-server; then
            log_success "Redis installed and started successfully"
            redis-server --version
        else
            log_error "Redis failed to start"
            sudo journalctl -u redis-server --no-pager -n 10
            exit 1
        fi
    fi
}

install_pm2() {
    log_info "Installing PM2..."
    
    if command -v pm2 &> /dev/null; then
        log_info "PM2 is already installed"
        pm2 --version
    else
        # Install PM2 globally
        sudo npm install -g pm2
        
        log_success "PM2 installed successfully"
        pm2 --version
    fi
}

install_nginx() {
    log_info "Installing Nginx..."
    
    if command -v nginx &> /dev/null; then
        log_info "Nginx is already installed"
        nginx -v
    else
        # Install Nginx
        sudo apt-get install -y nginx
        
        # Configure Nginx
        sudo systemctl enable nginx
        sudo systemctl start nginx
        
        # Wait for Nginx to start
        sleep 3
        
        # Verify Nginx is running
        if sudo systemctl is-active --quiet nginx; then
            log_success "Nginx installed and started successfully"
            nginx -v
        else
            log_error "Nginx failed to start"
            sudo journalctl -u nginx --no-pager -n 10
            exit 1
        fi
    fi
}

setup_firewall() {
    log_info "Configuring firewall..."
    
    # Enable UFW if not already enabled
    if ! sudo ufw status | grep -q "Status: active"; then
        log_info "Enabling UFW firewall..."
        sudo ufw --force enable
    fi
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow http
    sudo ufw allow https
    
    # Allow RemoteHive service ports
    sudo ufw allow 8000/tcp  # Backend API
    sudo ufw allow 8001/tcp  # Autoscraper Service
    sudo ufw allow 3000/tcp  # Admin Panel
    sudo ufw allow 5173/tcp  # Public Website
    
    log_success "Firewall configured"
    sudo ufw status
}

setup_directories() {
    log_info "Setting up directories..."
    
    # Create application directory
    mkdir -p /home/ubuntu/RemoteHive
    
    # Create log directories
    mkdir -p /home/ubuntu/RemoteHive/logs
    mkdir -p /var/log/remotehive
    sudo chown ubuntu:ubuntu /var/log/remotehive
    
    # Create data directories
    mkdir -p /home/ubuntu/RemoteHive/data
    
    log_success "Directories created"
}

optimize_system() {
    log_info "Optimizing system settings..."
    
    # Increase file descriptor limits
    echo "ubuntu soft nofile 65536" | sudo tee -a /etc/security/limits.conf
    echo "ubuntu hard nofile 65536" | sudo tee -a /etc/security/limits.conf
    
    # Configure swap if not present and system has less than 4GB RAM
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [[ $TOTAL_MEM -lt 4096 ]] && [[ ! -f /swapfile ]]; then
        log_info "Creating swap file for low memory system..."
        sudo fallocate -l 2G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        log_success "Swap file created"
    fi
    
    log_success "System optimization completed"
}

verify_installation() {
    log_info "Verifying installation..."
    
    # Check all required services
    local services=("mongod" "redis-server" "nginx")
    local all_good=true
    
    for service in "${services[@]}"; do
        if sudo systemctl is-active --quiet "$service"; then
            echo "✅ $service is running"
        else
            echo "❌ $service is not running"
            all_good=false
        fi
    done
    
    # Check command availability
    local commands=("python3.11" "node" "npm" "pm2" "mongod" "redis-server" "nginx")
    
    for cmd in "${commands[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            echo "✅ $cmd is available"
        else
            echo "❌ $cmd is not available"
            all_good=false
        fi
    done
    
    if [[ "$all_good" == "true" ]]; then
        log_success "All components verified successfully"
    else
        log_error "Some components failed verification"
        exit 1
    fi
}

show_summary() {
    log_info "Installation Summary:"
    echo ""
    echo "✅ System packages updated"
    echo "✅ Python 3.11 installed"
    echo "✅ Node.js 20 installed"
    echo "✅ MongoDB 7.0 installed and running"
    echo "✅ Redis installed and running"
    echo "✅ PM2 installed"
    echo "✅ Nginx installed and running"
    echo "✅ Firewall configured"
    echo "✅ Directories created"
    echo "✅ System optimized"
    echo ""
    echo "Your VPC instance is now ready for RemoteHive deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Run the deployment script: ./deploy-source-to-vpc.sh"
    echo "2. Or use GitHub Actions for automated deployment"
    echo ""
    echo "Service Status:"
    sudo systemctl status mongod redis-server nginx --no-pager -l
}

# Main execution
main() {
    log_info "Starting RemoteHive VPC environment setup..."
    
    check_system
    update_system
    install_python
    install_nodejs
    install_mongodb
    install_redis
    install_pm2
    install_nginx
    setup_firewall
    setup_directories
    optimize_system
    verify_installation
    show_summary
    
    log_success "RemoteHive VPC environment setup completed successfully! 🚀"
}

# Run main function
main "$@"