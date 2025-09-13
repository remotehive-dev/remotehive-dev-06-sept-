#!/bin/bash

# RemoteHive GitHub Secrets Setup Script
# This script sets up the exact GitHub secrets needed for CI/CD pipeline

set -e

echo "🚀 Setting up GitHub secrets for RemoteHive CI/CD pipeline..."

# Check if GitHub CLI is authenticated
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ GitHub CLI not authenticated. Please run: gh auth login"
    exit 1
fi

# Navigate to project directory
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"

# Set VPC_HOST secret
echo "🔧 Setting VPC_HOST secret..."
echo "210.79.128.138" | gh secret set VPC_HOST

# Set VPC_USER secret
echo "🔧 Setting VPC_USER secret..."
echo "ubuntu" | gh secret set VPC_USER

# Set VPC_SSH_KEY secret from the working SSH key file
echo "🔧 Setting VPC_SSH_KEY secret..."
if [ -f "remotehive_key_new" ]; then
    gh secret set VPC_SSH_KEY < remotehive_key_new
    echo "✅ VPC_SSH_KEY set from remotehive_key_new - WORKING KEY"
else
    echo "❌ Error: remotehive_key_new file not found!"
    echo "   Make sure the SSH key file exists in the current directory."
    exit 1
fi

echo ""
echo "✅ All mandatory secrets configured successfully!"
echo ""
echo "📋 Configured secrets:"
echo "   • VPC_HOST = 210.79.128.138"
echo "   • VPC_USER = ubuntu"
echo "   • VPC_SSH_KEY = [Content from remotehive_key_new - WORKING KEY]"
echo ""
echo "🎯 Your RemoteHive CI/CD pipeline is now ready!"
echo ""
echo "📝 Optional secrets (configure manually if needed):"
echo "   • SNYK_TOKEN - for security scanning"
echo "   • SLACK_WEBHOOK - for deployment notifications"
echo ""
echo "🚀 Next steps:"
echo "   1. Push a commit to the 'main' branch"
echo "   2. Check GitHub Actions tab for pipeline execution"
echo "   3. Access your deployed app at http://210.79.128.138:8000"
echo ""
echo "📖 For detailed instructions, see: EXACT_GITHUB_SECRETS_CONFIG.md"