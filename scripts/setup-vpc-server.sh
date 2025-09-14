#!/bin/bash

# RemoteHive VPC Server Setup Script
# This script sets up a fresh Ubuntu server for RemoteHive deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

log "=== RemoteHive VPC Server Setup Started ==="

# Update system packages
log "Updating system packages..."
apt update && apt upgrade -y
success "System packages updated"

# Install essential packages
log "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    build-essential \
    htop \
    tree \
    jq \
    nginx \
    supervisor

success "Essential packages installed"

# Install Python 3.11 and pip
log "Installing Python 3.11..."
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Set Python 3.11 as default
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Install pip for Python 3.11
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

success "Python 3.11 installed"

# Install Node.js 20 LTS
log "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install global npm packages
npm install -g pm2 serve

success "Node.js and global packages installed"

# Install MongoDB (if needed locally)
log "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

success "MongoDB installed and started"

# Install Redis
log "Installing Redis..."
apt install -y redis-server

# Configure Redis
sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

# Start and enable Redis
systemctl restart redis-server
systemctl enable redis-server

success "Redis installed and configured"

# Create application user and directories
log "Setting up application user and directories..."

# Create ubuntu user if it doesn't exist
if ! id "ubuntu" &>/dev/null; then
    useradd -m -s /bin/bash ubuntu
    usermod -aG sudo ubuntu
fi

# Create application directories
mkdir -p /home/ubuntu/RemoteHive
mkdir -p /home/ubuntu/backups
mkdir -p /var/log/remotehive
mkdir -p /var/log/pm2

# Set ownership
chown -R ubuntu:ubuntu /home/ubuntu
chown -R ubuntu:ubuntu /var/log/remotehive
chown -R ubuntu:ubuntu /var/log/pm2

success "Application user and directories created"

# Configure Nginx
log "Configuring Nginx..."

cat > /etc/nginx/sites-available/remotehive << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Admin Panel (Next.js)
    location /admin {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Autoscraper API
    location /autoscraper {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Public Website (React)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/remotehive /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

success "Nginx configured and started"

# Configure firewall
log "Configuring firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

success "Firewall configured"

# Install SSL certificate (Let's Encrypt) - Optional
log "Installing Certbot for SSL certificates..."
apt install -y certbot python3-certbot-nginx

warning "To enable SSL, run: certbot --nginx -d your-domain.com"

# Create log rotation configuration
log "Setting up log rotation..."

cat > /etc/logrotate.d/remotehive << 'EOF'
/var/log/remotehive/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 ubuntu ubuntu
    postrotate
        systemctl reload remotehive-backend || true
        systemctl reload remotehive-autoscraper || true
    endscript
}

/var/log/pm2/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

success "Log rotation configured"

# Create system monitoring script
log "Creating system monitoring script..."

cat > /usr/local/bin/remotehive-monitor << 'EOF'
#!/bin/bash

# RemoteHive System Monitor
# Checks system health and service status

echo "=== RemoteHive System Status ==="
echo "Date: $(date)"
echo ""

echo "=== System Resources ==="
echo "Disk Usage:"
df -h / | tail -1
echo "Memory Usage:"
free -h | grep Mem
echo "Load Average:"
uptime | awk -F'load average:' '{print $2}'
echo ""

echo "=== Service Status ==="
services=("nginx" "mongod" "redis-server" "remotehive-backend" "remotehive-autoscraper")
for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service"; then
        echo "✅ $service: Running"
    else
        echo "❌ $service: Stopped"
    fi
done

echo ""
echo "=== PM2 Status ==="
sudo -u ubuntu pm2 status

echo ""
echo "=== Port Status ==="
netstat -tlnp | grep -E ':(80|443|3000|5173|8000|8001|6379|27017)'
EOF

chmod +x /usr/local/bin/remotehive-monitor

success "System monitoring script created"

# Create backup script
log "Creating backup script..."

cat > /usr/local/bin/remotehive-backup << 'EOF'
#!/bin/bash

# RemoteHive Backup Script

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_BACKUP="$BACKUP_DIR/app_$DATE.tar.gz"
DB_BACKUP="$BACKUP_DIR/mongodb_$DATE.gz"

echo "Creating RemoteHive backup..."

# Backup application files
tar -czf "$APP_BACKUP" -C /home/ubuntu RemoteHive

# Backup MongoDB
mongodump --gzip --archive="$DB_BACKUP" --db remotehive

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete

echo "Backup completed: $APP_BACKUP, $DB_BACKUP"
EOF

chmod +x /usr/local/bin/remotehive-backup

# Add backup to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/remotehive-backup") | crontab -

success "Backup script created and scheduled"

# Final system optimization
log "Applying system optimizations..."

# Increase file limits
cat >> /etc/security/limits.conf << 'EOF'
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF

# Optimize kernel parameters
cat >> /etc/sysctl.conf << 'EOF'
# RemoteHive optimizations
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 65536
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 400000
vm.swappiness = 10
EOF

sysctl -p

success "System optimizations applied"

# Display setup summary
log "=== Setup Summary ==="
success "✅ System packages updated"
success "✅ Python 3.11 installed"
success "✅ Node.js 20 LTS installed"
success "✅ MongoDB installed and running"
success "✅ Redis installed and running"
success "✅ Nginx configured"
success "✅ PM2 installed globally"
success "✅ Firewall configured"
success "✅ Log rotation configured"
success "✅ Monitoring and backup scripts created"
success "✅ System optimizations applied"

log "=== Next Steps ==="
echo "1. Deploy your RemoteHive application using the deployment script"
echo "2. Configure SSL certificate: certbot --nginx -d your-domain.com"
echo "3. Set up GitHub Actions secrets for automated deployment"
echo "4. Test the deployment pipeline"
echo ""
echo "Useful commands:"
echo "  - Monitor system: remotehive-monitor"
echo "  - Manual backup: remotehive-backup"
echo "  - View logs: journalctl -u remotehive-backend -f"
echo "  - PM2 status: sudo -u ubuntu pm2 status"

success "=== RemoteHive VPC Server Setup Completed Successfully ==="