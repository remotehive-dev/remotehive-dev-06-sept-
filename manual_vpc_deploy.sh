#!/bin/bash

# Manual VPC Deployment Script for RemoteHive
# This script deploys RemoteHive to VPC server 210.79.129.9

set -e  # Exit on any error

VPC_HOST="210.79.129.9"
VPC_USER="ubuntu"  # Assuming Ubuntu server
REMOTE_DIR="/opt/remotehive"
LOCAL_DIR="$(pwd)"
SSH_KEY="$HOME/.ssh/remotehive-vpc-key"

echo "🚀 Starting manual deployment to VPC server $VPC_HOST"

# Function to check if SSH key exists
check_ssh_key() {
    if [ ! -f "$SSH_KEY" ]; then
        echo "❌ RemoteHive VPC SSH key not found at $SSH_KEY"
        echo "Please ensure the SSH key exists and has proper permissions."
        exit 1
    fi
    
    # Set proper permissions for SSH key
    chmod 600 "$SSH_KEY"
    echo "✅ SSH key found and permissions set"
}

# Function to test SSH connectivity
test_ssh_connection() {
    echo "🔍 Testing SSH connection to $VPC_HOST..."
    if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o BatchMode=yes $VPC_USER@$VPC_HOST "echo 'SSH connection successful'" 2>/dev/null; then
        echo "✅ SSH connection successful"
        return 0
    else
        echo "❌ SSH connection failed. Please check:"
        echo "   1. SSH key is added to the server"
        echo "   2. Server is accessible"
        echo "   3. Username is correct (currently using: $VPC_USER)"
        echo "   4. SSH key path: $SSH_KEY"
        return 1
    fi
}

# Function to create remote directory structure
setup_remote_directory() {
    echo "📁 Setting up remote directory structure..."
    ssh -i "$SSH_KEY" $VPC_USER@$VPC_HOST "sudo mkdir -p $REMOTE_DIR && sudo chown $VPC_USER:$VPC_USER $REMOTE_DIR"
}

# Function to sync files to VPC
sync_files() {
    echo "📤 Syncing files to VPC server..."
    rsync -avz --progress \
        -e "ssh -i $SSH_KEY" \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='.env.local' \
        --exclude='redis-stable' \
        --exclude='remotehive-dev-06-sept-' \
        $LOCAL_DIR/ $VPC_USER@$VPC_HOST:$REMOTE_DIR/
}

# Function to install dependencies on VPC
install_dependencies() {
    echo "📦 Installing dependencies on VPC server..."
    ssh -i "$SSH_KEY" $VPC_USER@$VPC_HOST << 'EOF'
cd /opt/remotehive

# Update system packages
sudo apt update

# Install Python 3.11 if not present
if ! command -v python3.11 &> /dev/null; then
    sudo apt install -y software-properties-common
    sudo add-apt-repository -y ppa:deadsnakes/ppa
    sudo apt update
    sudo apt install -y python3.11 python3.11-venv python3.11-dev
fi

# Install Node.js 20 if not present
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | cut -d'v' -f2)" -lt "20" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install Redis if not present
if ! command -v redis-server &> /dev/null; then
    sudo apt install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
fi

echo "✅ Dependencies installation completed"
EOF
}

# Function to setup Python environment
setup_python_env() {
    echo "🐍 Setting up Python environment..."
    ssh -i "$SSH_KEY" $VPC_USER@$VPC_HOST << 'EOF'
cd /opt/remotehive

# Create virtual environment
if [ ! -d "venv" ]; then
    python3.11 -m venv venv
fi

# Activate virtual environment and install requirements
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Python environment setup completed"
EOF
}

# Function to setup frontend applications
setup_frontend() {
    echo "🌐 Setting up frontend applications..."
    ssh -i "$SSH_KEY" $VPC_USER@$VPC_HOST << 'EOF'
cd /opt/remotehive

# Setup Admin Panel
if [ -d "remotehive-admin" ]; then
    cd remotehive-admin
    npm install
    npm run build
    cd ..
fi

# Setup Public Website
if [ -d "remotehive-public" ]; then
    cd remotehive-public
    npm install
    npm run build
    cd ..
fi

echo "✅ Frontend setup completed"
EOF
}

# Function to configure services
configure_services() {
    echo "⚙️ Configuring services..."
    ssh -i "$SSH_KEY" $VPC_USER@$VPC_HOST << 'EOF'
cd /opt/remotehive

# Copy systemd service files
if [ -d "config/systemd" ]; then
    sudo cp config/systemd/*.service /etc/systemd/system/
    sudo systemctl daemon-reload
fi

# Copy nginx configuration
if [ -f "config/nginx/remotehive.conf" ]; then
    sudo cp config/nginx/remotehive.conf /etc/nginx/sites-available/
    sudo ln -sf /etc/nginx/sites-available/remotehive.conf /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
fi

echo "✅ Services configuration completed"
EOF
}

# Function to start services
start_services() {
    echo "🚀 Starting services..."
    ssh -i "$SSH_KEY" $VPC_USER@$VPC_HOST << 'EOF'
cd /opt/remotehive

# Start backend services using systemd
sudo systemctl enable remotehive-backend
sudo systemctl start remotehive-backend

sudo systemctl enable remotehive-autoscraper
sudo systemctl start remotehive-autoscraper

# Start frontend services using PM2
if [ -f "config/pm2/ecosystem.config.js" ]; then
    pm2 start config/pm2/ecosystem.config.js
    pm2 save
    pm2 startup
fi

echo "✅ Services started successfully"
EOF
}

# Function to check service status
check_services() {
    echo "🔍 Checking service status..."
    ssh -i "$SSH_KEY" $VPC_USER@$VPC_HOST << 'EOF'
echo "Backend Service Status:"
sudo systemctl status remotehive-backend --no-pager -l

echo "\nAutoscraper Service Status:"
sudo systemctl status remotehive-autoscraper --no-pager -l

echo "\nPM2 Process Status:"
pm2 status

echo "\nNginx Status:"
sudo systemctl status nginx --no-pager -l

echo "\nPort Status:"
sudo netstat -tlnp | grep -E ':(8000|8001|3000|5173|80|443)'
EOF
}

# Main deployment flow
main() {
    echo "🎯 RemoteHive Manual VPC Deployment"
    echo "===================================="
    
    check_ssh_key
    
    if ! test_ssh_connection; then
        echo "❌ Deployment aborted due to SSH connection failure"
        exit 1
    fi
    
    setup_remote_directory
    sync_files
    install_dependencies
    setup_python_env
    setup_frontend
    configure_services
    start_services
    
    echo "\n🎉 Deployment completed!"
    echo "Checking service status..."
    check_services
    
    echo "\n📋 Next steps:"
    echo "1. Check if services are running: curl http://$VPC_HOST:8000/health"
    echo "2. Access Admin Panel: http://$VPC_HOST:3000"
    echo "3. Access Public Website: http://$VPC_HOST:5173"
    echo "4. Check logs: ssh $VPC_USER@$VPC_HOST 'sudo journalctl -u remotehive-backend -f'"
}

# Run main function
main "$@"