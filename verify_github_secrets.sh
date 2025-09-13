#!/bin/bash

# RemoteHive GitHub Secrets Verification Script
# This script verifies that all required GitHub secrets are properly configured

set -e

echo "🔍 Verifying GitHub secrets for RemoteHive CI/CD pipeline..."
echo ""

# Check if GitHub CLI is authenticated
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ GitHub CLI not authenticated. Please run: gh auth login"
    exit 1
fi

# Navigate to project directory
cd "$(dirname "$0")"

echo "📍 Checking repository: $(gh repo view --json nameWithOwner -q .nameWithOwner)"
echo ""

# Required secrets
REQUIRED_SECRETS=("VPC_HOST" "VPC_USER" "VPC_SSH_KEY")
OPTIONAL_SECRETS=("SNYK_TOKEN" "SLACK_WEBHOOK" "GITHUB_TOKEN")

# Get list of configured secrets
echo "📋 Configured secrets:"
SECRET_LIST=$(gh secret list --json name -q '.[].name')

echo "$SECRET_LIST"
echo ""

# Check required secrets
echo "✅ Required secrets status:"
MISSING_REQUIRED=0

for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$SECRET_LIST" | grep -q "^$secret$"; then
        echo "   ✅ $secret - CONFIGURED"
    else
        echo "   ❌ $secret - MISSING"
        MISSING_REQUIRED=1
    fi
done

echo ""

# Check optional secrets
echo "📝 Optional secrets status:"
for secret in "${OPTIONAL_SECRETS[@]}"; do
    if echo "$SECRET_LIST" | grep -q "^$secret$"; then
        echo "   ✅ $secret - CONFIGURED"
    else
        echo "   ⚪ $secret - NOT CONFIGURED (optional)"
    fi
done

echo ""

# Final status
if [ $MISSING_REQUIRED -eq 0 ]; then
    echo "🎉 SUCCESS: All required secrets are configured!"
    echo ""
    echo "🚀 Your RemoteHive CI/CD pipeline is ready to use."
    echo ""
    echo "📋 What happens next:"
    echo "   • Push commits to 'main' branch for automatic deployment"
    echo "   • Check GitHub Actions tab for pipeline status"
    echo "   • Access deployed app at http://210.79.128.138:8000"
    echo ""
    echo "🔗 Useful links:"
    echo "   • GitHub Actions: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
    echo "   • Repository Settings: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/settings/secrets/actions"
else
    echo "❌ INCOMPLETE: Some required secrets are missing!"
    echo ""
    echo "🔧 To fix this:"
    echo "   1. Run: ./setup_github_secrets.sh"
    echo "   2. Or manually add secrets via GitHub web interface"
    echo "   3. See: EXACT_GITHUB_SECRETS_CONFIG.md for detailed instructions"
    exit 1
fi

echo ""
echo "📖 For detailed configuration info, see: EXACT_GITHUB_SECRETS_CONFIG.md"