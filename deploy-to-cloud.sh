#!/bin/bash

# RemoteHive Cloud Deployment Script
# Usage: ./deploy-to-cloud.sh [production|staging]

set -e

# Configuration
CLOUD_IP="210.79.129.170"
SSH_KEY="remotehive_key_new"
DEPLOYMENT_USER="ubuntu"
ENVIRONMENT=${1:-production}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 RemoteHive Cloud Deployment Script${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Target: ${CLOUD_IP}"
echo -e "Environment: ${ENVIRONMENT}"
echo -e "SSH Key: ${SSH_KEY}"
echo ""

# Function to run commands on remote server
run_remote() {
    ssh -i "${SSH_KEY}" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${DEPLOYMENT_USER}@${CLOUD_IP}" "$1"
}

# Function to copy files to remote server
copy_to_remote() {
    scp -i "${SSH_KEY}" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -r "$1" "${DEPLOYMENT_USER}@${CLOUD_IP}:$2"
}

echo -e "${YELLOW}Step 1: Testing SSH Connection...${NC}"
if run_remote "echo 'SSH connection successful'"; then
    echo -e "${GREEN}✅ SSH connection established${NC}"
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    echo -e "${RED}Please ensure the SSH public key is added to the cloud instance${NC}"
    echo -e "${RED}Refer to CLOUD_DEPLOYMENT_INSTRUCTIONS.md for manual setup${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 2: Installing Dependencies...${NC}"
run_remote "sudo apt-get update && sudo apt-get install -y docker.io docker-compose git curl"
run_remote "sudo systemctl start docker && sudo systemctl enable docker"
run_remote "sudo usermod -aG docker ${DEPLOYMENT_USER}"
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "${YELLOW}Step 3: Creating Deployment Directory...${NC}"
run_remote "sudo mkdir -p /opt/remotehive"
run_remote "sudo chown ${DEPLOYMENT_USER}:${DEPLOYMENT_USER} /opt/remotehive"
run_remote "cd /opt/remotehive && rm -rf RemoteHive_Migration_Package || true"
echo -e "${GREEN}✅ Deployment directory created${NC}"

echo -e "${YELLOW}Step 4: Copying Application Files...${NC}"
# Create a temporary deployment package
echo "Creating deployment package..."
mkdir -p ./deployment_package

# Copy essential files
cp docker-compose.yml ./deployment_package/
cp -r app ./deployment_package/

# Copy frontend directories excluding node_modules
if [ -d "remotehive-admin" ]; then
    rsync -av --exclude='node_modules' --exclude='.next' --exclude='dist' admin-panel/ ./deployment_package/admin-panel/
fi

if [ -d "remotehive-public" ]; then
    rsync -av --exclude='node_modules' --exclude='dist' --exclude='build' website/ ./deployment_package/website/
fi

cp -r k8s ./deployment_package/
cp -r nginx ./deployment_package/
cp requirements.txt ./deployment_package/
cp .env.${ENVIRONMENT} ./deployment_package/.env
cp Dockerfile* ./deployment_package/

# Copy the deployment package to remote server
copy_to_remote "./deployment_package" "/opt/remotehive/"
run_remote "cd /opt/remotehive && mv deployment_package RemoteHive_Migration_Package"
echo -e "${GREEN}✅ Application files copied${NC}"

echo -e "${YELLOW}Step 5: Configuring Environment...${NC}"
# Update environment variables for cloud deployment
run_remote "cd /opt/remotehive/RemoteHive_Migration_Package && sed -i 's/localhost/${CLOUD_IP}/g' .env"
run_remote "cd /opt/remotehive/RemoteHive_Migration_Package && sed -i 's/127.0.0.1/${CLOUD_IP}/g' .env"
echo -e "${GREEN}✅ Environment configured${NC}"

echo -e "${YELLOW}Step 6: Building and Starting Services...${NC}"
run_remote "cd /opt/remotehive/RemoteHive_Migration_Package && docker-compose down || true"
run_remote "cd /opt/remotehive/RemoteHive_Migration_Package && docker-compose build"
run_remote "cd /opt/remotehive/RemoteHive_Migration_Package && docker-compose up -d"
echo -e "${GREEN}✅ Services started${NC}"

echo -e "${YELLOW}Step 7: Waiting for Services to Start...${NC}"
sleep 30

echo -e "${YELLOW}Step 8: Verifying Deployment...${NC}"
echo "Checking service status..."
run_remote "cd /opt/remotehive/RemoteHive_Migration_Package && docker-compose ps"

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}======================${NC}"
echo -e "Backend API: http://${CLOUD_IP}:8000"
echo -e "API Docs: http://${CLOUD_IP}:8000/docs"
echo -e "Admin Panel: http://${CLOUD_IP}:3000"
echo -e "Public Website: http://${CLOUD_IP}:5173"
echo -e "Autoscraper API: http://${CLOUD_IP}:8001"
echo -e "Autoscraper Docs: http://${CLOUD_IP}:8001/docs"
echo ""
echo -e "${BLUE}Default Admin Credentials:${NC}"
echo -e "Email: admin@remotehive.in"
echo -e "Password: Ranjeet11$"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Configure your domain DNS to point to ${CLOUD_IP}"
echo -e "2. Set up SSL certificates for production"
echo -e "3. Configure firewall rules and security groups"
echo -e "4. Set up monitoring and logging"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo -e "View logs: ssh -i ${SSH_KEY} ${DEPLOYMENT_USER}@${CLOUD_IP} 'cd /opt/remotehive/RemoteHive_Migration_Package && docker-compose logs'"
echo -e "Restart services: ssh -i ${SSH_KEY} ${DEPLOYMENT_USER}@${CLOUD_IP} 'cd /opt/remotehive/RemoteHive_Migration_Package && docker-compose restart'"
echo -e "Stop services: ssh -i ${SSH_KEY} ${DEPLOYMENT_USER}@${CLOUD_IP} 'cd /opt/remotehive/RemoteHive_Migration_Package && docker-compose down'"

# Cleanup local deployment package
rm -rf ./deployment_package

echo -e "${GREEN}Deployment script completed successfully!${NC}"