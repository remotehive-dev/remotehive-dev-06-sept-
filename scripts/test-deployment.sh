#!/bin/bash

# RemoteHive VPC Deployment Test Script
# This script tests the deployment pipeline components

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSH_KEY_PATH="$HOME/.ssh/remotehive-vpc-key"
VPC_USER="ubuntu"
VPC_HOST="${VPC_HOST:-YOUR_VPC_SERVER_IP}"
SSH_PORT="${SSH_PORT:-22}"

echo -e "${BLUE}=== RemoteHive VPC Deployment Test ===${NC}"
echo

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
    else
        echo -e "${RED}✗${NC} $message"
    fi
}

# Test 1: Check SSH key exists
echo -e "${BLUE}1. Checking SSH key...${NC}"
if [ -f "$SSH_KEY_PATH" ]; then
    print_status "OK" "SSH private key found at $SSH_KEY_PATH"
    
    # Check key permissions
    KEY_PERMS=$(stat -f "%A" "$SSH_KEY_PATH" 2>/dev/null || stat -c "%a" "$SSH_KEY_PATH" 2>/dev/null)
    if [ "$KEY_PERMS" = "600" ]; then
        print_status "OK" "SSH key permissions are correct (600)"
    else
        print_status "WARN" "SSH key permissions are $KEY_PERMS, should be 600"
        echo "  Run: chmod 600 $SSH_KEY_PATH"
    fi
else
    print_status "ERROR" "SSH private key not found at $SSH_KEY_PATH"
    echo "  Run: ssh-keygen -t rsa -b 4096 -f $SSH_KEY_PATH -N '' -C 'remotehive-vpc-deployment'"
    exit 1
fi

# Test 2: Check public key
echo
echo -e "${BLUE}2. Checking SSH public key...${NC}"
PUB_KEY_PATH="${SSH_KEY_PATH}.pub"
if [ -f "$PUB_KEY_PATH" ]; then
    print_status "OK" "SSH public key found at $PUB_KEY_PATH"
    echo "  Public key content:"
    echo "  $(cat $PUB_KEY_PATH)"
else
    print_status "ERROR" "SSH public key not found at $PUB_KEY_PATH"
    exit 1
fi

# Test 3: Check VPC host configuration
echo
echo -e "${BLUE}3. Checking VPC configuration...${NC}"
if [ "$VPC_HOST" = "YOUR_VPC_SERVER_IP" ]; then
    print_status "WARN" "VPC_HOST not configured"
    echo "  Please set VPC_HOST environment variable or update this script"
    echo "  Example: export VPC_HOST=192.168.1.100"
else
    print_status "OK" "VPC_HOST configured as: $VPC_HOST"
fi

# Test 4: Test SSH connection (if VPC_HOST is configured)
echo
echo -e "${BLUE}4. Testing SSH connection...${NC}"
if [ "$VPC_HOST" != "YOUR_VPC_SERVER_IP" ]; then
    echo "  Attempting to connect to $VPC_USER@$VPC_HOST:$SSH_PORT..."
    
    if ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p "$SSH_PORT" "$VPC_USER@$VPC_HOST" 'echo "SSH connection successful!" && hostname && whoami' 2>/dev/null; then
        print_status "OK" "SSH connection successful"
    else
        print_status "ERROR" "SSH connection failed"
        echo "  Possible issues:"
        echo "    - VPC server is not running or accessible"
        echo "    - SSH service is not running on the server"
        echo "    - Firewall is blocking SSH connections"
        echo "    - SSH key is not added to server's authorized_keys"
        echo "    - Incorrect VPC_HOST, VPC_USER, or SSH_PORT"
        echo
        echo "  To add your public key to the server:"
        echo "    ssh-copy-id -i $PUB_KEY_PATH $VPC_USER@$VPC_HOST"
        echo "  Or manually:"
        echo "    cat $PUB_KEY_PATH | ssh $VPC_USER@$VPC_HOST 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'"
    fi
else
    print_status "WARN" "Skipping SSH test - VPC_HOST not configured"
fi

# Test 5: Check deployment scripts
echo
echo -e "${BLUE}5. Checking deployment scripts...${NC}"
DEPLOY_SCRIPT="./scripts/deploy.sh"
if [ -f "$DEPLOY_SCRIPT" ]; then
    print_status "OK" "Deployment script found at $DEPLOY_SCRIPT"
    if [ -x "$DEPLOY_SCRIPT" ]; then
        print_status "OK" "Deployment script is executable"
    else
        print_status "WARN" "Deployment script is not executable"
        echo "  Run: chmod +x $DEPLOY_SCRIPT"
    fi
else
    print_status "ERROR" "Deployment script not found at $DEPLOY_SCRIPT"
fi

# Test 6: Check GitHub workflows
echo
echo -e "${BLUE}6. Checking GitHub workflows...${NC}"
WORKFLOW_DIR="./.github/workflows"
if [ -d "$WORKFLOW_DIR" ]; then
    WORKFLOW_COUNT=$(find "$WORKFLOW_DIR" -name "*.yml" -o -name "*.yaml" | wc -l)
    print_status "OK" "Found $WORKFLOW_COUNT GitHub workflow files"
    
    # List workflow files
    echo "  Workflow files:"
    find "$WORKFLOW_DIR" -name "*.yml" -o -name "*.yaml" | while read -r file; do
        echo "    - $(basename "$file")"
    done
else
    print_status "ERROR" "GitHub workflows directory not found at $WORKFLOW_DIR"
fi

# Test 7: Check project structure
echo
echo -e "${BLUE}7. Checking project structure...${NC}"
REQUIRED_DIRS=("app" "remotehive-admin" "remotehive-public" "autoscraper-service")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_status "OK" "Directory '$dir' exists"
    else
        print_status "WARN" "Directory '$dir' not found"
    fi
done

# Test 8: Check configuration files
echo
echo -e "${BLUE}8. Checking configuration files...${NC}"
CONFIG_FILES=("ecosystem.config.js" "requirements.txt" "package.json")
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "OK" "Configuration file '$file' exists"
    else
        print_status "WARN" "Configuration file '$file' not found"
    fi
done

# Summary
echo
echo -e "${BLUE}=== Test Summary ===${NC}"
echo
echo "Next steps to complete the deployment setup:"
echo
echo "1. Configure your VPC server IP:"
echo "   export VPC_HOST=YOUR_ACTUAL_VPC_IP"
echo
echo "2. Add your SSH public key to the VPC server:"
echo "   ssh-copy-id -i $PUB_KEY_PATH ubuntu@YOUR_VPC_IP"
echo
echo "3. Set up GitHub repository secrets:"
echo "   - VPC_HOST: Your VPC server IP address"
echo "   - VPC_USER: ubuntu (or your server username)"
echo "   - VPC_SSH_KEY: Content of $SSH_KEY_PATH"
echo "   - MONGODB_URL: Your MongoDB Atlas connection string"
echo "   - JWT_SECRET_KEY: Random secret for JWT signing"
echo
echo "4. Push your code to GitHub to trigger deployment:"
echo "   git push origin main"
echo
echo "5. Monitor deployment in GitHub Actions:"
echo "   https://github.com/YOUR_USERNAME/YOUR_REPO/actions"
echo
echo "For detailed instructions, see:"
echo "  - docs/github-vpc-deployment-guide.md"
echo "  - docs/github-secrets-configuration.md"
echo

if [ "$VPC_HOST" != "YOUR_VPC_SERVER_IP" ]; then
    echo -e "${GREEN}✓ Ready to test deployment with VPC server at $VPC_HOST${NC}"
else
    echo -e "${YELLOW}⚠ Configure VPC_HOST to test actual deployment${NC}"
fi