#!/bin/bash

# =============================================================================
# RemoteHive Environment Configuration Manager
# =============================================================================
# This script manages environment-specific configurations for RemoteHive
# Supports development, staging, and production environments
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
CONFIG_DIR="$PROJECT_ROOT/config"
ENV_DIR="$PROJECT_ROOT"
LOG_FILE="$PROJECT_ROOT/config-manager.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SUPPORTED_ENVIRONMENTS=("development" "staging" "production")
CURRENT_ENVIRONMENT="development"
VERBOSE=false
DRY_RUN=false
FORCE=false
BACKUP_CONFIGS=true
VALIDATE_CONFIGS=true

# =============================================================================
# Utility Functions
# =============================================================================

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "DEBUG")
            if [[ "$VERBOSE" == "true" ]]; then
                echo -e "${BLUE}[DEBUG]${NC} $message"
            fi
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
    esac
    
    # Log to file
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Progress indicator
show_progress() {
    local current="$1"
    local total="$2"
    local description="$3"
    local percentage=$((current * 100 / total))
    local bar_length=50
    local filled_length=$((percentage * bar_length / 100))
    
    printf "\r${CYAN}Progress:${NC} ["
    for ((i=0; i<filled_length; i++)); do printf "█"; done
    for ((i=filled_length; i<bar_length; i++)); do printf "░"; done
    printf "] %d%% - %s" "$percentage" "$description"
    
    if [[ "$current" -eq "$total" ]]; then
        printf "\n"
    fi
}

# Error handling
handle_error() {
    local exit_code=$?
    local line_number=$1
    log "ERROR" "An error occurred on line $line_number. Exit code: $exit_code"
    cleanup
    exit $exit_code
}

# Cleanup function
cleanup() {
    log "DEBUG" "Performing cleanup..."
    # Remove temporary files if any
    if [[ -d "$PROJECT_ROOT/tmp" ]]; then
        rm -rf "$PROJECT_ROOT/tmp"
    fi
}

# Trap errors
trap 'handle_error $LINENO' ERR
trap cleanup EXIT

# =============================================================================
# Validation Functions
# =============================================================================

# Validate environment
validate_environment() {
    local env="$1"
    
    log "DEBUG" "Validating environment: $env"
    
    if [[ ! " ${SUPPORTED_ENVIRONMENTS[*]} " =~ " $env " ]]; then
        log "ERROR" "Unsupported environment: $env"
        log "INFO" "Supported environments: ${SUPPORTED_ENVIRONMENTS[*]}"
        return 1
    fi
    
    return 0
}

# Validate configuration file
validate_config_file() {
    local config_file="$1"
    
    log "DEBUG" "Validating configuration file: $config_file"
    
    if [[ ! -f "$config_file" ]]; then
        log "ERROR" "Configuration file not found: $config_file"
        return 1
    fi
    
    # Check for required variables
    local required_vars=(
        "ENVIRONMENT"
        "MONGODB_URL"
        "REDIS_URL"
        "JWT_SECRET_KEY"
        "SECRET_KEY"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$config_file"; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log "ERROR" "Missing required variables in $config_file: ${missing_vars[*]}"
        return 1
    fi
    
    # Check for sensitive data in non-production environments
    if [[ "$CURRENT_ENVIRONMENT" != "production" ]]; then
        local sensitive_patterns=(
            "password.*=.*[^changeme]"
            "secret.*=.*[^changeme]"
            "key.*=.*[^changeme]"
        )
        
        for pattern in "${sensitive_patterns[@]}"; do
            if grep -qi "$pattern" "$config_file"; then
                log "WARN" "Potential sensitive data found in $config_file"
                break
            fi
        done
    fi
    
    log "SUCCESS" "Configuration file validation passed: $config_file"
    return 0
}

# Validate secrets
validate_secrets() {
    local env="$1"
    
    log "DEBUG" "Validating secrets for environment: $env"
    
    if [[ "$env" == "production" ]]; then
        # In production, ensure no default/placeholder values
        local config_file="$ENV_DIR/.env.$env"
        
        local placeholder_patterns=(
            "changeme"
            "your-"
            "placeholder"
            "example"
            "test_"
        )
        
        for pattern in "${placeholder_patterns[@]}"; do
            if grep -qi "$pattern" "$config_file"; then
                log "ERROR" "Placeholder values found in production config: $pattern"
                return 1
            fi
        done
    fi
    
    return 0
}

# =============================================================================
# Configuration Management Functions
# =============================================================================

# Create backup of current configuration
backup_config() {
    local env="$1"
    local backup_dir="$PROJECT_ROOT/config-backups"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    
    log "INFO" "Creating backup of current configuration..."
    
    mkdir -p "$backup_dir"
    
    if [[ -f "$ENV_DIR/.env" ]]; then
        cp "$ENV_DIR/.env" "$backup_dir/.env.backup.$timestamp"
        log "DEBUG" "Backed up .env to $backup_dir/.env.backup.$timestamp"
    fi
    
    if [[ -f "$ENV_DIR/.env.$env" ]]; then
        cp "$ENV_DIR/.env.$env" "$backup_dir/.env.$env.backup.$timestamp"
        log "DEBUG" "Backed up .env.$env to $backup_dir/.env.$env.backup.$timestamp"
    fi
    
    log "SUCCESS" "Configuration backup completed"
}

# Switch environment configuration
switch_environment() {
    local target_env="$1"
    
    log "INFO" "Switching to $target_env environment..."
    
    # Validate target environment
    if ! validate_environment "$target_env"; then
        return 1
    fi
    
    local source_config="$ENV_DIR/.env.$target_env"
    local target_config="$ENV_DIR/.env"
    
    # Check if source configuration exists
    if [[ ! -f "$source_config" ]]; then
        log "ERROR" "Configuration file not found: $source_config"
        return 1
    fi
    
    # Validate configuration
    if [[ "$VALIDATE_CONFIGS" == "true" ]]; then
        if ! validate_config_file "$source_config"; then
            return 1
        fi
        
        if ! validate_secrets "$target_env"; then
            return 1
        fi
    fi
    
    # Create backup if enabled
    if [[ "$BACKUP_CONFIGS" == "true" ]]; then
        backup_config "$target_env"
    fi
    
    # Switch configuration
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would copy $source_config to $target_config"
    else
        cp "$source_config" "$target_config"
        log "SUCCESS" "Switched to $target_env environment"
    fi
    
    CURRENT_ENVIRONMENT="$target_env"
}

# Generate configuration template
generate_config_template() {
    local env="$1"
    local template_file="$ENV_DIR/.env.$env.template"
    
    log "INFO" "Generating configuration template for $env environment..."
    
    cat > "$template_file" << EOF
# =============================================================================
# RemoteHive $env Environment Configuration Template
# =============================================================================
# Copy this file to .env.$env and fill in the actual values
# =============================================================================

# Environment
ENVIRONMENT=$env
DEBUG=false
LOG_LEVEL=INFO

# Application URLs
BACKEND_API_URL=https://api$([ "$env" != "production" ] && echo "-$env").remotehive.in
AUTOSCRAPER_API_URL=https://scraper$([ "$env" != "production" ] && echo "-$env").remotehive.in
ADMIN_PANEL_URL=https://admin$([ "$env" != "production" ] && echo "-$env").remotehive.in
PUBLIC_WEBSITE_URL=https://$([ "$env" != "production" ] && echo "$env.")remotehive.in

# Database Configuration
MONGODB_URL=mongodb://mongodb-$env:27017/remotehive_$env
REDIS_URL=redis://redis-$env:6379/0

# Security (CHANGE THESE VALUES)
JWT_SECRET_KEY=changeme_jwt_secret_key_$env
SECRET_KEY=changeme_secret_key_$env
SECURITY_PASSWORD_SALT=changeme_salt_$env

# External APIs (CHANGE THESE VALUES)
CLERK_SECRET_KEY=changeme_clerk_secret_key
SUPABASE_URL=changeme_supabase_url
SUPABASE_ANON_KEY=changeme_supabase_anon_key

# Email Configuration (CHANGE THESE VALUES)
SMTP_USERNAME=changeme_smtp_username
SMTP_PASSWORD=changeme_smtp_password

# Add other configuration variables as needed...
EOF

    log "SUCCESS" "Configuration template generated: $template_file"
}

# Validate all configurations
validate_all_configs() {
    log "INFO" "Validating all environment configurations..."
    
    local validation_errors=0
    
    for env in "${SUPPORTED_ENVIRONMENTS[@]}"; do
        local config_file="$ENV_DIR/.env.$env"
        
        if [[ -f "$config_file" ]]; then
            log "INFO" "Validating $env configuration..."
            
            if ! validate_config_file "$config_file"; then
                ((validation_errors++))
            fi
            
            if ! validate_secrets "$env"; then
                ((validation_errors++))
            fi
        else
            log "WARN" "Configuration file not found: $config_file"
        fi
    done
    
    if [[ $validation_errors -eq 0 ]]; then
        log "SUCCESS" "All configurations are valid"
        return 0
    else
        log "ERROR" "Found $validation_errors validation errors"
        return 1
    fi
}

# Show current configuration
show_current_config() {
    log "INFO" "Current environment configuration:"
    
    if [[ -f "$ENV_DIR/.env" ]]; then
        local current_env=$(grep "^ENVIRONMENT=" "$ENV_DIR/.env" | cut -d'=' -f2 || echo "unknown")
        echo -e "${CYAN}Current Environment:${NC} $current_env"
        echo -e "${CYAN}Configuration File:${NC} $ENV_DIR/.env"
        
        # Show key configuration values (non-sensitive)
        local display_vars=(
            "ENVIRONMENT"
            "DEBUG"
            "LOG_LEVEL"
            "BACKEND_API_URL"
            "ADMIN_PANEL_URL"
            "PUBLIC_WEBSITE_URL"
        )
        
        echo -e "${CYAN}Key Configuration Values:${NC}"
        for var in "${display_vars[@]}"; do
            local value=$(grep "^$var=" "$ENV_DIR/.env" | cut -d'=' -f2- || echo "not set")
            echo -e "  ${YELLOW}$var:${NC} $value"
        done
    else
        log "WARN" "No active configuration found (.env file missing)"
    fi
}

# List available configurations
list_configs() {
    log "INFO" "Available environment configurations:"
    
    for env in "${SUPPORTED_ENVIRONMENTS[@]}"; do
        local config_file="$ENV_DIR/.env.$env"
        local status="❌ Missing"
        local size="-"
        
        if [[ -f "$config_file" ]]; then
            status="✅ Available"
            size=$(du -h "$config_file" | cut -f1)
        fi
        
        echo -e "  ${YELLOW}$env:${NC} $status (Size: $size)"
    done
}

# =============================================================================
# Service Configuration Functions
# =============================================================================

# Update service configurations
update_service_configs() {
    local env="$1"
    
    log "INFO" "Updating service configurations for $env environment..."
    
    # Update Docker Compose configuration
    update_docker_compose_config "$env"
    
    # Update Kubernetes configuration
    update_kubernetes_config "$env"
    
    # Update application configurations
    update_application_configs "$env"
    
    log "SUCCESS" "Service configurations updated for $env environment"
}

# Update Docker Compose configuration
update_docker_compose_config() {
    local env="$1"
    local compose_file="$PROJECT_ROOT/docker-compose.$env.yml"
    
    log "DEBUG" "Updating Docker Compose configuration: $compose_file"
    
    if [[ -f "$compose_file" ]]; then
        # Update environment file reference
        sed -i.bak "s/env_file: .env.*/env_file: .env.$env/g" "$compose_file"
        log "DEBUG" "Updated Docker Compose env_file reference"
    else
        log "WARN" "Docker Compose file not found: $compose_file"
    fi
}

# Update Kubernetes configuration
update_kubernetes_config() {
    local env="$1"
    local k8s_dir="$PROJECT_ROOT/k8s"
    
    log "DEBUG" "Updating Kubernetes configurations for $env environment"
    
    if [[ -d "$k8s_dir" ]]; then
        # Update namespace in Kubernetes manifests
        find "$k8s_dir" -name "*.yaml" -o -name "*.yml" | while read -r file; do
            if grep -q "namespace:" "$file"; then
                sed -i.bak "s/namespace: remotehive-.*/namespace: remotehive-$env/g" "$file"
            fi
        done
        log "DEBUG" "Updated Kubernetes namespace references"
    else
        log "WARN" "Kubernetes directory not found: $k8s_dir"
    fi
}

# Update application configurations
update_application_configs() {
    local env="$1"
    
    log "DEBUG" "Updating application configurations for $env environment"
    
    # Update frontend API configurations
    local admin_api_config="$PROJECT_ROOT/admin-panel/src/lib/api.ts"
    local public_api_config="$PROJECT_ROOT/website/src/lib/api.ts"
    
    if [[ -f "$admin_api_config" ]]; then
        # Update API base URL in admin panel
        local api_url="https://api$([ "$env" != "production" ] && echo "-$env").remotehive.in"
        sed -i.bak "s|baseURL: ['\"].*['\"]|baseURL: '$api_url'|g" "$admin_api_config"
        log "DEBUG" "Updated admin panel API configuration"
    fi
    
    if [[ -f "$public_api_config" ]]; then
        # Update API base URL in public website
        local api_url="https://api$([ "$env" != "production" ] && echo "-$env").remotehive.in"
        sed -i.bak "s|baseURL: ['\"].*['\"]|baseURL: '$api_url'|g" "$public_api_config"
        log "DEBUG" "Updated public website API configuration"
    fi
}

# =============================================================================
# Security Functions
# =============================================================================

# Generate secure secrets
generate_secrets() {
    local env="$1"
    
    log "INFO" "Generating secure secrets for $env environment..."
    
    # Generate JWT secret
    local jwt_secret=$(openssl rand -base64 32)
    
    # Generate application secret
    local app_secret=$(openssl rand -base64 32)
    
    # Generate password salt
    local password_salt=$(openssl rand -base64 16)
    
    log "INFO" "Generated secrets (add these to your .env.$env file):"
    echo -e "${YELLOW}JWT_SECRET_KEY=${NC}$jwt_secret"
    echo -e "${YELLOW}SECRET_KEY=${NC}$app_secret"
    echo -e "${YELLOW}SECURITY_PASSWORD_SALT=${NC}$password_salt"
    
    # Optionally update the configuration file
    if [[ "$FORCE" == "true" ]]; then
        local config_file="$ENV_DIR/.env.$env"
        if [[ -f "$config_file" ]]; then
            sed -i.bak "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=$jwt_secret/g" "$config_file"
            sed -i.bak "s/SECRET_KEY=.*/SECRET_KEY=$app_secret/g" "$config_file"
            sed -i.bak "s/SECURITY_PASSWORD_SALT=.*/SECURITY_PASSWORD_SALT=$password_salt/g" "$config_file"
            log "SUCCESS" "Updated secrets in $config_file"
        fi
    fi
}

# Encrypt configuration file
encrypt_config() {
    local config_file="$1"
    local encrypted_file="$config_file.enc"
    
    log "INFO" "Encrypting configuration file: $config_file"
    
    if [[ ! -f "$config_file" ]]; then
        log "ERROR" "Configuration file not found: $config_file"
        return 1
    fi
    
    # Use GPG for encryption (requires GPG to be set up)
    if command -v gpg >/dev/null 2>&1; then
        gpg --symmetric --cipher-algo AES256 --output "$encrypted_file" "$config_file"
        log "SUCCESS" "Configuration encrypted: $encrypted_file"
    else
        log "ERROR" "GPG not available for encryption"
        return 1
    fi
}

# Decrypt configuration file
decrypt_config() {
    local encrypted_file="$1"
    local config_file="${encrypted_file%.enc}"
    
    log "INFO" "Decrypting configuration file: $encrypted_file"
    
    if [[ ! -f "$encrypted_file" ]]; then
        log "ERROR" "Encrypted file not found: $encrypted_file"
        return 1
    fi
    
    # Use GPG for decryption
    if command -v gpg >/dev/null 2>&1; then
        gpg --decrypt --output "$config_file" "$encrypted_file"
        log "SUCCESS" "Configuration decrypted: $config_file"
    else
        log "ERROR" "GPG not available for decryption"
        return 1
    fi
}

# =============================================================================
# Main Functions
# =============================================================================

# Show usage information
show_usage() {
    cat << EOF
RemoteHive Environment Configuration Manager

Usage: $0 [OPTIONS] COMMAND [ARGS]

COMMANDS:
    switch <env>              Switch to specified environment (development|staging|production)
    validate [env]            Validate configuration(s)
    list                      List available configurations
    current                   Show current configuration
    template <env>            Generate configuration template
    secrets <env>             Generate secure secrets for environment
    encrypt <file>            Encrypt configuration file
    decrypt <file>            Decrypt configuration file
    update <env>              Update service configurations for environment
    backup [env]              Create backup of configuration(s)

OPTIONS:
    -v, --verbose             Enable verbose output
    -d, --dry-run             Show what would be done without making changes
    -f, --force               Force operation without confirmation
    --no-backup               Skip creating backups
    --no-validate             Skip configuration validation
    -h, --help                Show this help message

EXAMPLES:
    $0 switch production      Switch to production environment
    $0 validate               Validate all configurations
    $0 template staging       Generate staging configuration template
    $0 secrets production     Generate secrets for production
    $0 -v -d switch staging   Dry run switch to staging with verbose output

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            --no-backup)
                BACKUP_CONFIGS=false
                shift
                ;;
            --no-validate)
                VALIDATE_CONFIGS=false
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            switch|validate|list|current|template|secrets|encrypt|decrypt|update|backup)
                COMMAND="$1"
                shift
                break
                ;;
            -*)
                log "ERROR" "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                log "ERROR" "Unknown command: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Store remaining arguments
    ARGS=("$@")
}

# Main function
main() {
    log "INFO" "RemoteHive Configuration Manager started"
    log "DEBUG" "Script directory: $SCRIPT_DIR"
    log "DEBUG" "Project root: $PROJECT_ROOT"
    
    # Create necessary directories
    mkdir -p "$CONFIG_DIR" "$PROJECT_ROOT/config-backups" "$PROJECT_ROOT/tmp"
    
    # Execute command
    case "${COMMAND:-}" in
        "switch")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                log "ERROR" "Environment required for switch command"
                show_usage
                exit 1
            fi
            switch_environment "${ARGS[0]}"
            ;;
        "validate")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                validate_all_configs
            else
                validate_config_file "$ENV_DIR/.env.${ARGS[0]}"
            fi
            ;;
        "list")
            list_configs
            ;;
        "current")
            show_current_config
            ;;
        "template")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                log "ERROR" "Environment required for template command"
                show_usage
                exit 1
            fi
            generate_config_template "${ARGS[0]}"
            ;;
        "secrets")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                log "ERROR" "Environment required for secrets command"
                show_usage
                exit 1
            fi
            generate_secrets "${ARGS[0]}"
            ;;
        "encrypt")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                log "ERROR" "File required for encrypt command"
                show_usage
                exit 1
            fi
            encrypt_config "${ARGS[0]}"
            ;;
        "decrypt")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                log "ERROR" "File required for decrypt command"
                show_usage
                exit 1
            fi
            decrypt_config "${ARGS[0]}"
            ;;
        "update")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                log "ERROR" "Environment required for update command"
                show_usage
                exit 1
            fi
            update_service_configs "${ARGS[0]}"
            ;;
        "backup")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                for env in "${SUPPORTED_ENVIRONMENTS[@]}"; do
                    backup_config "$env"
                done
            else
                backup_config "${ARGS[0]}"
            fi
            ;;
        "")
            log "ERROR" "No command specified"
            show_usage
            exit 1
            ;;
        *)
            log "ERROR" "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
    
    log "SUCCESS" "Configuration management completed successfully"
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Parse arguments and run main function
    parse_arguments "$@"
    main
fi