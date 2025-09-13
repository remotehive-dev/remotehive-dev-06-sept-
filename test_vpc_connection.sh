#!/bin/bash

# RemoteHive VPC Connection Test Script
# Tests SSH connectivity and VPC accessibility without GitHub CLI

set -e

echo "🔍 Testing RemoteHive VPC Connection and Configuration..."
echo ""

# Configuration
VPC_HOST="210.79.128.138"
VPC_USER="ubuntu"
SSH_KEY_FILE="remotehive_key_github"

# Test 1: Check if SSH key file exists
echo "📋 Test 1: SSH Key File Check"
if [ -f "$SSH_KEY_FILE" ]; then
    echo "   ✅ SSH key file found: $SSH_KEY_FILE"
    
    # Check SSH key format
    if head -1 "$SSH_KEY_FILE" | grep -q "BEGIN OPENSSH PRIVATE KEY"; then
        echo "   ✅ SSH key format is correct (OpenSSH format)"
    else
        echo "   ❌ SSH key format may be incorrect"
        echo "      Expected: -----BEGIN OPENSSH PRIVATE KEY-----"
        echo "      Found: $(head -1 "$SSH_KEY_FILE")"
    fi
else
    echo "   ❌ SSH key file not found: $SSH_KEY_FILE"
    echo "      Make sure the SSH key file exists in the current directory"
    exit 1
fi

echo ""

# Test 2: Check VPC accessibility (ping test)
echo "📋 Test 2: VPC Network Accessibility"
echo "   Testing connection to $VPC_HOST..."
if ping -c 3 -W 5000 "$VPC_HOST" >/dev/null 2>&1; then
    echo "   ✅ VPC is reachable via ping"
else
    echo "   ⚠️  VPC ping failed (may be normal if ICMP is disabled)"
    echo "      This doesn't necessarily mean SSH won't work"
fi

echo ""

# Test 3: SSH connection test
echo "📋 Test 3: SSH Connection Test"
echo "   Testing SSH connection to $VPC_USER@$VPC_HOST..."

# Set proper permissions for SSH key
chmod 600 "$SSH_KEY_FILE"

# Test SSH connection with timeout
if timeout 10 ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=yes "$VPC_USER@$VPC_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
    echo "   ✅ SSH connection successful!"
    echo "   ✅ Authentication with SSH key works"
    SSH_SUCCESS=true
else
    echo "   ❌ SSH connection failed"
    echo "      This could indicate:"
    echo "      - SSH key is incorrect or doesn't match VPC"
    echo "      - VPC is not running or accessible"
    echo "      - Security groups don't allow SSH access"
    echo "      - SSH service is not running on VPC"
    SSH_SUCCESS=false
fi

echo ""

# Test 4: Check if VPC has Docker installed (if SSH works)
if [ "$SSH_SUCCESS" = true ]; then
    echo "📋 Test 4: VPC Docker Installation Check"
    echo "   Checking if Docker is installed on VPC..."
    
    if ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$VPC_USER@$VPC_HOST" "docker --version" 2>/dev/null; then
        echo "   ✅ Docker is installed on VPC"
        
        # Check Docker Compose
        if ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$VPC_USER@$VPC_HOST" "docker-compose --version" 2>/dev/null; then
            echo "   ✅ Docker Compose is installed on VPC"
        else
            echo "   ⚠️  Docker Compose not found on VPC"
        fi
    else
        echo "   ⚠️  Docker not installed or not accessible on VPC"
        echo "      The background Docker installation may still be running"
    fi
else
    echo "📋 Test 4: Skipped (SSH connection failed)"
fi

echo ""

# Test 5: GitHub Secrets Configuration Guide
echo "📋 Test 5: GitHub Secrets Configuration Summary"
echo "   Required GitHub Secrets:"
echo "   • VPC_HOST = $VPC_HOST"
echo "   • VPC_USER = $VPC_USER"
echo "   • VPC_SSH_KEY = [Content of $SSH_KEY_FILE]"
echo ""
echo "   To configure these secrets:"
echo "   1. Go to: https://github.com/remotehive-dev/remotehive-dev-06-sept-/settings/secrets/actions"
echo "   2. Add each secret with the exact names and values above"
echo "   3. For VPC_SSH_KEY, copy the entire content of $SSH_KEY_FILE"

echo ""

# Final Summary
echo "🎯 Test Summary:"
if [ -f "$SSH_KEY_FILE" ] && [ "$SSH_SUCCESS" = true ]; then
    echo "   ✅ All core tests passed!"
    echo "   ✅ Your configuration is ready for GitHub CI/CD"
    echo ""
    echo "   🚀 Next steps:"
    echo "   1. Configure the 3 GitHub secrets as shown above"
    echo "   2. Push a commit to the 'main' branch to trigger deployment"
    echo "   3. Monitor GitHub Actions for deployment progress"
    echo "   4. Access your deployed app at:"
    echo "      • API: http://$VPC_HOST:8000"
    echo "      • Admin: http://$VPC_HOST:3000"
    echo "      • Public: http://$VPC_HOST:5173"
elif [ -f "$SSH_KEY_FILE" ]; then
    echo "   ⚠️  SSH key exists but connection failed"
    echo "   🔧 Troubleshooting needed:"
    echo "   1. Verify VPC is running and accessible"
    echo "   2. Check if SSH key matches the one on VPC"
    echo "   3. Ensure security groups allow SSH (port 22)"
    echo "   4. Try manual SSH: ssh -i $SSH_KEY_FILE $VPC_USER@$VPC_HOST"
else
    echo "   ❌ SSH key file missing"
    echo "   🔧 Required action:"
    echo "   1. Ensure $SSH_KEY_FILE exists in current directory"
    echo "   2. Verify SSH key content and format"
fi

echo ""
echo "📖 For detailed instructions, see:"
echo "   • EXACT_GITHUB_SECRETS_CONFIG.md - Step-by-step setup guide"
echo "   • TEST_GITHUB_SECRETS.md - Comprehensive testing guide"