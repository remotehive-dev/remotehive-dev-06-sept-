#!/bin/bash

# =============================================================================
# RemoteHive Deployment Setup Script
# =============================================================================
# This script helps configure the deployment environment for RemoteHive
# Usage: ./setup-deployment.sh
# =============================================================================

set -e

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

generate_secure_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-50
}

setup_environment_file() {
    log_info "Setting up environment configuration..."
    
    if [[ -f .env ]]; then
        log_warning "Environment file .env already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing .env file"
            return 0
        fi
    fi
    
    # Copy from example
    cp .env.example .env
    
    # Generate secure passwords
    MONGO_PASSWORD=$(generate_secure_password)
    REDIS_PASSWORD=$(generate_secure_password)
    JWT_SECRET=$(generate_jwt_secret)
    NEXTAUTH_SECRET=$(generate_secure_password)
    
    # Update .env file with generated passwords
    sed -i.bak "s/your-secure-mongo-password/$MONGO_PASSWORD/g" .env
    sed -i.bak "s/your-secure-redis-password/$REDIS_PASSWORD/g" .env
    sed -i.bak "s/your-super-secret-jwt-key-change-in-production-min-32-chars/$JWT_SECRET/g" .env
    sed -i.bak "s/your-nextauth-secret-change-in-production/$NEXTAUTH_SECRET/g" .env
    
    # Remove backup file
    rm -f .env.bak
    
    log_success "Environment file created with secure passwords"
    log_warning "Please update the following in .env file:"
    echo "  - SMTP_USERNAME and SMTP_PASSWORD for email functionality"
    echo "  - CLERK_SECRET_KEY for authentication"
    echo "  - GOOGLE_MAPS_API_KEY for location services"
    echo "  - SUPABASE_URL and SUPABASE_ANON_KEY if using Supabase"
}

setup_vpc_credentials() {
    log_info "Setting up VPC deployment credentials..."
    
    # Check if environment variables are already set
    if [[ -n "$VPC_HOST" ]] && [[ -n "$VPC_USER" ]]; then
        log_success "VPC credentials already configured:"
        echo "  VPC_HOST: $VPC_HOST"
        echo "  VPC_USER: $VPC_USER"
        return 0
    fi
    
    echo ""
    echo "Please provide your VPC deployment credentials:"
    echo ""
    
    # Get VPC host
    read -p "VPC Host (IP address or hostname): " vpc_host
    if [[ -z "$vpc_host" ]]; then
        log_error "VPC host is required"
        return 1
    fi
    
    # Get VPC user
    read -p "VPC Username (default: ubuntu): " vpc_user
    vpc_user=${vpc_user:-ubuntu}
    
    # Get SSH key path
    read -p "SSH Key Path (default: ~/.ssh/id_rsa): " ssh_key_path
    ssh_key_path=${ssh_key_path:-~/.ssh/id_rsa}
    
    # Expand tilde
    ssh_key_path=$(eval echo $ssh_key_path)
    
    # Check if SSH key exists
    if [[ ! -f "$ssh_key_path" ]]; then
        log_error "SSH key not found at: $ssh_key_path"
        log_info "Please ensure your SSH key exists or provide the correct path"
        return 1
    fi
    
    # Test SSH connection
    log_info "Testing SSH connection to $vpc_host..."
    if ssh -o ConnectTimeout=10 -o BatchMode=yes -i "$ssh_key_path" "$vpc_user@$vpc_host" "echo 'SSH connection successful'" 2>/dev/null; then
        log_success "SSH connection test passed"
    else
        log_warning "SSH connection test failed"
        log_info "This might be due to:"
        echo "  1. VPC instance not running"
        echo "  2. Incorrect credentials"
        echo "  3. Security group restrictions"
        echo "  4. SSH key not authorized"
        echo ""
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    # Save to shell profile
    echo ""
    log_info "Adding VPC credentials to your shell profile..."
    
    # Determine shell profile file
    if [[ -f ~/.zshrc ]]; then
        PROFILE_FILE=~/.zshrc
    elif [[ -f ~/.bashrc ]]; then
        PROFILE_FILE=~/.bashrc
    elif [[ -f ~/.bash_profile ]]; then
        PROFILE_FILE=~/.bash_profile
    else
        PROFILE_FILE=~/.profile
    fi
    
    # Add environment variables
    echo "" >> "$PROFILE_FILE"
    echo "# RemoteHive VPC Deployment Credentials" >> "$PROFILE_FILE"
    echo "export VPC_HOST=\"$vpc_host\"" >> "$PROFILE_FILE"
    echo "export VPC_USER=\"$vpc_user\"" >> "$PROFILE_FILE"
    echo "export VPC_SSH_KEY_PATH=\"$ssh_key_path\"" >> "$PROFILE_FILE"
    
    # Export for current session
    export VPC_HOST="$vpc_host"
    export VPC_USER="$vpc_user"
    export VPC_SSH_KEY_PATH="$ssh_key_path"
    
    log_success "VPC credentials saved to $PROFILE_FILE"
    log_info "Please run 'source $PROFILE_FILE' or restart your terminal to load the credentials"
}

setup_github_secrets() {
    log_info "GitHub Secrets Setup Guide"
    echo ""
    echo "To enable CI/CD deployment, add these secrets to your GitHub repository:"
    echo ""
    echo "1. Go to your GitHub repository"
    echo "2. Navigate to Settings > Secrets and variables > Actions"
    echo "3. Add the following repository secrets:"
    echo ""
    echo "   VPC_HOST: ${VPC_HOST:-your-vpc-ip-or-hostname}"
    echo "   VPC_USER: ${VPC_USER:-your-vpc-username}"
    echo "   VPC_SSH_KEY: (content of your private SSH key)"
    echo "   GHCR_TOKEN: (GitHub token with packages:write permission)"
    echo ""
    echo "4. To get your SSH private key content:"
    if [[ -n "$VPC_SSH_KEY_PATH" ]]; then
        echo "   cat $VPC_SSH_KEY_PATH"
    else
        echo "   cat ~/.ssh/id_rsa"
    fi
    echo ""
    echo "5. To create a GitHub token:"
    echo "   - Go to GitHub Settings > Developer settings > Personal access tokens"
    echo "   - Generate new token (classic)"
    echo "   - Select 'write:packages' scope"
    echo "   - Copy the token and add it as GHCR_TOKEN secret"
    echo ""
}

check_docker_installation() {
    log_info "Checking Docker installation..."
    
    if command -v docker &> /dev/null; then
        log_success "Docker is installed: $(docker --version)"
    else
        log_warning "Docker is not installed"
        echo "Please install Docker from: https://docs.docker.com/get-docker/"
        return 1
    fi
    
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose is installed: $(docker-compose --version)"
    else
        log_warning "Docker Compose is not installed"
        echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
        return 1
    fi
    
    # Test Docker daemon
    if docker info &> /dev/null; then
        log_success "Docker daemon is running"
    else
        log_warning "Docker daemon is not running"
        echo "Please start Docker daemon"
        return 1
    fi
    
    return 0
}

show_deployment_summary() {
    log_info "Deployment Setup Summary"
    echo ""
    echo "✅ Environment file configured: .env"
    echo "✅ VPC credentials configured"
    echo "✅ Deployment script ready: ./deploy-to-vpc.sh"
    echo ""
    echo "Next steps:"
    echo "1. Review and update .env file with your specific configurations"
    echo "2. Set up GitHub secrets for CI/CD (if using GitHub Actions)"
    echo "3. Deploy to VPC:"
    echo "   ./deploy-to-vpc.sh production"
    echo ""
    echo "For Kubernetes deployment:"
    echo "   ./deploy-to-vpc.sh production --k8s"
    echo ""
    echo "For more information, see DEPLOYMENT_GUIDE.md"
}

# Main execution
main() {
    echo "=============================================================================="
    echo "                    RemoteHive Deployment Setup"
    echo "=============================================================================="
    echo ""
    
    # Check Docker installation
    if ! check_docker_installation; then
        log_error "Docker setup incomplete. Please install Docker and try again."
        exit 1
    fi
    
    echo ""
    
    # Setup environment file
    setup_environment_file
    
    echo ""
    
    # Setup VPC credentials
    if ! setup_vpc_credentials; then
        log_error "VPC setup incomplete. Please check your credentials and try again."
        exit 1
    fi
    
    echo ""
    
    # Show GitHub secrets guide
    setup_github_secrets
    
    echo ""
    
    # Show summary
    show_deployment_summary
    
    log_success "RemoteHive deployment setup completed! 🚀"
}

# Run main function
main "$@"