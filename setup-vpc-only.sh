#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

echo "=============================================================================="
echo "                    RemoteHive VPC Credentials Setup"
echo "=============================================================================="
echo ""

# Setup VPC credentials
if ! setup_vpc_credentials; then
    log_error "VPC setup incomplete. Please check your credentials and try again."
    exit 1
fi

log_success "VPC credentials setup completed! 🚀"
echo ""
echo "Next steps:"
echo "1. Run 'source ~/.zshrc' to load the credentials"
echo "2. Test connection with: ssh \$VPC_USER@\$VPC_HOST"
echo "3. Deploy using: bash deploy-to-vpc.sh"