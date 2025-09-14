#!/bin/bash

# RemoteHive VPC Setup Script
# This script prepares a fresh VPC instance for RemoteHive deployment

set -e  # Exit on any error

# Configuration
APP_NAME="remotehive"
APP_DIR="/opt/remotehive"
APP_USER="remotehive"
NGINX_USER="www-data"
LOG_FILE="/var/log/remotehive-setup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    log "${BLUE}[INFO]${NC} $1"
}

log_success() {
    log "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

# Error handling
error_exit() {
    log_error "$1"
    log_error "VPC setup failed. Check logs at $LOG_FILE"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error_exit "This script must be run as root"
    fi
}

# Detect OS and set package manager
detect_os() {
    log_info "Detecting operating system..."
    
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VERSION=$VERSION_ID
    else
        error_exit "Cannot detect operating system"
    fi
    
    log_info "Detected OS: $OS $VERSION"
    
    # Set package manager based on OS
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        PKG_MANAGER="apt"
        PKG_UPDATE="apt update"
        PKG_INSTALL="apt install -y"
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Amazon Linux"* ]]; then
        PKG_MANAGER="yum"
        PKG_UPDATE="yum update -y"
        PKG_INSTALL="yum install -y"
    else
        error_exit "Unsupported operating system: $OS"
    fi
}

# Update system packages
update_system() {
    log_info "Updating system packages..."
    
    $PKG_UPDATE || error_exit "Failed to update package lists"
    
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        apt upgrade -y || error_exit "Failed to upgrade packages"
    fi
    
    log_success "System packages updated"
}

# Install essential packages
install_essential_packages() {
    log_info "Installing essential packages..."
    
    local packages=()
    
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        packages=(
            "curl" "wget" "git" "unzip" "software-properties-common"
            "build-essential" "ca-certificates" "gnupg" "lsb-release"
            "htop" "nano" "vim" "tree" "jq" "fail2ban" "ufw"
        )
    elif [[ "$PKG_MANAGER" == "yum" ]]; then
        packages=(
            "curl" "wget" "git" "unzip" "gcc" "gcc-c++" "make"
            "ca-certificates" "htop" "nano" "vim" "tree" "jq"
        )
    fi
    
    for package in "${packages[@]}"; do
        log_info "Installing $package..."
        $PKG_INSTALL "$package" || log_warning "Failed to install $package"
    done
    
    log_success "Essential packages installed"
}

# Install Python 3.9+
install_python() {
    log_info "Installing Python 3.9+..."
    
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        # Add deadsnakes PPA for latest Python versions
        add-apt-repository ppa:deadsnakes/ppa -y
        apt update
        
        $PKG_INSTALL python3.11 python3.11-venv python3.11-dev python3-pip
        
        # Set Python 3.11 as default python3
        update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
        
    elif [[ "$PKG_MANAGER" == "yum" ]]; then
        $PKG_INSTALL python3 python3-pip python3-devel
    fi
    
    # Upgrade pip
    python3 -m pip install --upgrade pip
    
    # Verify Python installation
    local python_version=$(python3 --version | cut -d' ' -f2)
    log_success "Python $python_version installed"
    
    # Install common Python packages
    pip3 install virtualenv setuptools wheel
}

# Install Node.js 18+
install_nodejs() {
    log_info "Installing Node.js 18+..."
    
    # Install Node.js using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    $PKG_INSTALL nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Verify installation
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    log_success "Node.js $node_version and npm $npm_version installed"
}

# Install and configure Nginx
install_nginx() {
    log_info "Installing and configuring Nginx..."
    
    $PKG_INSTALL nginx
    
    # Enable and start Nginx
    systemctl enable nginx
    systemctl start nginx
    
    # Create basic configuration
    cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    location / {
        return 200 'RemoteHive VPC Setup Complete';
        add_header Content-Type text/plain;
    }
    
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Test and reload Nginx
    nginx -t || error_exit "Nginx configuration test failed"
    systemctl reload nginx
    
    log_success "Nginx installed and configured"
}

# Install and configure PostgreSQL (optional)
install_postgresql() {
    log_info "Installing PostgreSQL..."
    
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        $PKG_INSTALL postgresql postgresql-contrib
    elif [[ "$PKG_MANAGER" == "yum" ]]; then
        $PKG_INSTALL postgresql-server postgresql-contrib
        postgresql-setup initdb
    fi
    
    # Enable and start PostgreSQL
    systemctl enable postgresql
    systemctl start postgresql
    
    # Create RemoteHive database and user
    sudo -u postgres psql << 'EOF'
CREATE DATABASE remotehive;
CREATE USER remotehive WITH ENCRYPTED PASSWORD 'remotehive_password_change_me';
GRANT ALL PRIVILEGES ON DATABASE remotehive TO remotehive;
\q
EOF
    
    log_success "PostgreSQL installed and configured"
    log_warning "Remember to change the default database password!"
}

# Create application user and directories
setup_app_structure() {
    log_info "Setting up application structure..."
    
    # Create application user
    if ! id "$APP_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d "$APP_DIR" "$APP_USER"
        log_success "Created application user: $APP_USER"
    else
        log_info "Application user already exists: $APP_USER"
    fi
    
    # Create directories
    mkdir -p "$APP_DIR"
    mkdir -p "/opt/remotehive-backups"
    mkdir -p "/var/log/remotehive"
    mkdir -p "/etc/remotehive"
    
    # Set permissions
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    chown -R "$APP_USER:$APP_USER" "/opt/remotehive-backups"
    chown -R "$APP_USER:$APP_USER" "/var/log/remotehive"
    
    # Create log rotation configuration
    cat > /etc/logrotate.d/remotehive << 'EOF'
/var/log/remotehive/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 remotehive remotehive
    postrotate
        systemctl reload remotehive-* || true
    endscript
}
EOF
    
    log_success "Application structure created"
}

# Configure firewall
setup_firewall() {
    log_info "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian with UFW
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        
        # Allow SSH
        ufw allow ssh
        
        # Allow HTTP and HTTPS
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        # Allow application ports
        ufw allow 3000/tcp comment 'RemoteHive Admin Panel'
        ufw allow 5173/tcp comment 'RemoteHive Public Website'
        ufw allow 8000/tcp comment 'RemoteHive Backend API'
        ufw allow 8001/tcp comment 'RemoteHive Autoscraper'
        
        # Enable firewall
        ufw --force enable
        
        log_success "UFW firewall configured"
        
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL with firewalld
        systemctl enable firewalld
        systemctl start firewalld
        
        # Allow services
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        
        # Allow application ports
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --permanent --add-port=5173/tcp
        firewall-cmd --permanent --add-port=8000/tcp
        firewall-cmd --permanent --add-port=8001/tcp
        
        firewall-cmd --reload
        
        log_success "Firewalld configured"
    else
        log_warning "No supported firewall found. Manual configuration required."
    fi
}

# Configure fail2ban
setup_fail2ban() {
    log_info "Configuring fail2ban..."
    
    if command -v fail2ban-server &> /dev/null; then
        # Create custom jail configuration
        cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF
        
        # Enable and start fail2ban
        systemctl enable fail2ban
        systemctl start fail2ban
        
        log_success "Fail2ban configured"
    else
        log_warning "Fail2ban not installed. Consider installing for additional security."
    fi
}

# Setup SSH security
setup_ssh_security() {
    log_info "Configuring SSH security..."
    
    # Backup original SSH config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Apply security settings
    cat >> /etc/ssh/sshd_config << 'EOF'

# RemoteHive Security Settings
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 2
Protocol 2
X11Forwarding no
AllowTcpForwarding no
EOF
    
    # Test SSH configuration
    sshd -t || {
        log_error "SSH configuration test failed, restoring backup"
        cp /etc/ssh/sshd_config.backup /etc/ssh/sshd_config
        return 1
    }
    
    # Restart SSH service
    systemctl restart sshd
    
    log_success "SSH security configured"
    log_warning "Ensure you have SSH key access before disconnecting!"
}

# Install monitoring tools
install_monitoring() {
    log_info "Installing monitoring tools..."
    
    # Install system monitoring packages
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        $PKG_INSTALL htop iotop nethogs ncdu
    elif [[ "$PKG_MANAGER" == "yum" ]]; then
        $PKG_INSTALL htop iotop nethogs ncdu
    fi
    
    # Create system monitoring script
    cat > /usr/local/bin/remotehive-monitor << 'EOF'
#!/bin/bash

# RemoteHive System Monitor

echo "=== RemoteHive System Status ==="
echo "Date: $(date)"
echo

echo "=== System Load ==="
uptime
echo

echo "=== Memory Usage ==="
free -h
echo

echo "=== Disk Usage ==="
df -h /
echo

echo "=== RemoteHive Services ==="
for service in remotehive-backend remotehive-autoscraper remotehive-admin remotehive-public; do
    if systemctl is-active --quiet "$service" 2>/dev/null; then
        echo "✅ $service: Running"
    else
        echo "❌ $service: Not Running"
    fi
done
echo

echo "=== Network Connections ==="
netstat -tlnp | grep -E ":(3000|5173|8000|8001)"
echo

echo "=== Recent Logs ==="
journalctl -u remotehive-* --since "1 hour ago" --no-pager | tail -10
EOF
    
    chmod +x /usr/local/bin/remotehive-monitor
    
    log_success "Monitoring tools installed"
}

# Create deployment user and SSH setup
setup_deployment_user() {
    log_info "Setting up deployment user..."
    
    # Create deployment user
    if ! id "deploy" &>/dev/null; then
        useradd -m -s /bin/bash deploy
        usermod -aG sudo deploy
        
        # Create SSH directory
        mkdir -p /home/deploy/.ssh
        chmod 700 /home/deploy/.ssh
        chown deploy:deploy /home/deploy/.ssh
        
        # Create authorized_keys file (to be populated by GitHub Actions)
        touch /home/deploy/.ssh/authorized_keys
        chmod 600 /home/deploy/.ssh/authorized_keys
        chown deploy:deploy /home/deploy/.ssh/authorized_keys
        
        log_success "Deployment user 'deploy' created"
        log_info "Add your GitHub Actions public key to /home/deploy/.ssh/authorized_keys"
    else
        log_info "Deployment user 'deploy' already exists"
    fi
}

# Generate system information report
generate_system_report() {
    local report_file="/var/log/remotehive-vpc-setup-$(date +%Y%m%d-%H%M%S).report"
    
    log_info "Generating system setup report..."
    
    cat > "$report_file" << EOF
RemoteHive VPC Setup Report
===========================

Setup Date: $(date)
Hostname: $(hostname)
Public IP: $(curl -s ifconfig.me || echo "Unable to detect")
Private IP: $(hostname -I | awk '{print $1}')

System Information:
- OS: $(lsb_release -d | cut -f2)
- Kernel: $(uname -r)
- Architecture: $(uname -m)
- CPU Cores: $(nproc)
- Memory: $(free -h | awk 'NR==2{printf "%.1fG total", $2/1024}')
- Disk: $(df -h / | awk 'NR==2{printf "%s total, %s available", $2, $4}')

Installed Software:
- Python: $(python3 --version)
- Node.js: $(node --version)
- npm: $(npm --version)
- Nginx: $(nginx -v 2>&1 | cut -d' ' -f3)
- Git: $(git --version | cut -d' ' -f3)

Services Status:
- Nginx: $(systemctl is-active nginx)
- PostgreSQL: $(systemctl is-active postgresql 2>/dev/null || echo "not installed")
- Fail2ban: $(systemctl is-active fail2ban 2>/dev/null || echo "not installed")
- UFW: $(ufw status | head -1)

Network Configuration:
- Open Ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000, 5173, 8000, 8001
- Firewall: $(ufw status | head -1)

Next Steps:
1. Add GitHub Actions public key to /home/deploy/.ssh/authorized_keys
2. Configure domain name and SSL certificates
3. Update database passwords
4. Run first deployment

EOF
    
    log_success "System setup report generated: $report_file"
    cat "$report_file"
}

# Main setup function
main() {
    log_info "Starting RemoteHive VPC setup..."
    log_info "This will prepare the server for RemoteHive deployment"
    
    check_root
    detect_os
    update_system
    install_essential_packages
    install_python
    install_nodejs
    install_nginx
    
    # Optional: Install PostgreSQL
    read -p "Install PostgreSQL database? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_postgresql
    fi
    
    setup_app_structure
    setup_firewall
    setup_fail2ban
    setup_ssh_security
    install_monitoring
    setup_deployment_user
    
    log_success "RemoteHive VPC setup completed successfully!"
    
    generate_system_report
    
    log_info "Server is ready for RemoteHive deployment"
    log_info "Public IP: $(curl -s ifconfig.me || echo 'Unable to detect')"
    log_info "Next: Add your GitHub Actions public key and run your first deployment"
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi