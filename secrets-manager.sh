#!/bin/bash

# =============================================================================
# RemoteHive Secrets Management System
# =============================================================================
# This script manages sensitive configuration data for RemoteHive
# Supports encryption, rotation, and secure distribution of secrets
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
SECRETS_DIR="$PROJECT_ROOT/secrets"
VAULT_DIR="$PROJECT_ROOT/vault"
LOG_FILE="$PROJECT_ROOT/secrets-manager.log"

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
ENCRYPTION_METHOD="gpg"
KEY_LENGTH=32
VERBOSE=false
DRY_RUN=false
FORCE=false
ROTATE_SECRETS=false
BACKUP_SECRETS=true

# Secret categories
SECRET_CATEGORIES=(
    "database"
    "authentication"
    "external_apis"
    "email"
    "encryption"
    "certificates"
    "monitoring"
)

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
        "SECURITY")
            echo -e "${PURPLE}[SECURITY]${NC} $message"
            ;;
    esac
    
    # Log to file (excluding sensitive information)
    if [[ "$level" != "DEBUG" || "$VERBOSE" == "true" ]]; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

# Secure random generation
generate_secure_random() {
    local length="$1"
    local charset="${2:-A-Za-z0-9}"
    
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 $((length * 3 / 4)) | tr -d "=+/" | cut -c1-${length}
    elif [[ -c /dev/urandom ]]; then
        tr -dc "$charset" < /dev/urandom | head -c${length}
    else
        log "ERROR" "No secure random source available"
        return 1
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
    
    # Remove temporary files
    if [[ -d "$PROJECT_ROOT/tmp" ]]; then
        find "$PROJECT_ROOT/tmp" -name "*.tmp" -delete 2>/dev/null || true
    fi
    
    # Clear sensitive variables
    unset MASTER_KEY
    unset TEMP_SECRET
}

# Trap errors
trap 'handle_error $LINENO' ERR
trap cleanup EXIT

# =============================================================================
# Encryption Functions
# =============================================================================

# Initialize encryption
init_encryption() {
    log "INFO" "Initializing encryption system..."
    
    mkdir -p "$SECRETS_DIR" "$VAULT_DIR"
    
    case "$ENCRYPTION_METHOD" in
        "gpg")
            init_gpg_encryption
            ;;
        "age")
            init_age_encryption
            ;;
        *)
            log "ERROR" "Unsupported encryption method: $ENCRYPTION_METHOD"
            return 1
            ;;
    esac
}

# Initialize GPG encryption
init_gpg_encryption() {
    log "DEBUG" "Initializing GPG encryption..."
    
    if ! command -v gpg >/dev/null 2>&1; then
        log "ERROR" "GPG not found. Please install GPG for encryption."
        return 1
    fi
    
    local key_id="remotehive-secrets@$(hostname)"
    local key_file="$VAULT_DIR/gpg-key-id"
    
    # Check if key already exists
    if [[ -f "$key_file" ]]; then
        local existing_key=$(cat "$key_file")
        if gpg --list-secret-keys "$existing_key" >/dev/null 2>&1; then
            log "DEBUG" "GPG key already exists: $existing_key"
            return 0
        fi
    fi
    
    # Generate new GPG key
    log "INFO" "Generating new GPG key for secrets encryption..."
    
    cat > "$PROJECT_ROOT/tmp/gpg-key-config" << EOF
Key-Type: RSA
Key-Length: 4096
Subkey-Type: RSA
Subkey-Length: 4096
Name-Real: RemoteHive Secrets
Name-Email: $key_id
Expire-Date: 2y
Passphrase: 
%commit
EOF
    
    if gpg --batch --generate-key "$PROJECT_ROOT/tmp/gpg-key-config"; then
        echo "$key_id" > "$key_file"
        log "SUCCESS" "GPG key generated successfully"
    else
        log "ERROR" "Failed to generate GPG key"
        return 1
    fi
    
    rm -f "$PROJECT_ROOT/tmp/gpg-key-config"
}

# Initialize Age encryption
init_age_encryption() {
    log "DEBUG" "Initializing Age encryption..."
    
    if ! command -v age >/dev/null 2>&1; then
        log "ERROR" "Age not found. Please install Age for encryption."
        return 1
    fi
    
    local key_file="$VAULT_DIR/age-key.txt"
    
    if [[ ! -f "$key_file" ]]; then
        log "INFO" "Generating new Age key for secrets encryption..."
        age-keygen -o "$key_file"
        chmod 600 "$key_file"
        log "SUCCESS" "Age key generated successfully"
    fi
}

# Encrypt data
encrypt_data() {
    local data="$1"
    local output_file="$2"
    
    case "$ENCRYPTION_METHOD" in
        "gpg")
            encrypt_with_gpg "$data" "$output_file"
            ;;
        "age")
            encrypt_with_age "$data" "$output_file"
            ;;
        *)
            log "ERROR" "Unsupported encryption method: $ENCRYPTION_METHOD"
            return 1
            ;;
    esac
}

# Encrypt with GPG
encrypt_with_gpg() {
    local data="$1"
    local output_file="$2"
    local key_id=$(cat "$VAULT_DIR/gpg-key-id")
    
    echo "$data" | gpg --trust-model always --encrypt --armor --recipient "$key_id" --output "$output_file"
}

# Encrypt with Age
encrypt_with_age() {
    local data="$1"
    local output_file="$2"
    local public_key=$(grep "public key:" "$VAULT_DIR/age-key.txt" | cut -d' ' -f3)
    
    echo "$data" | age --encrypt --recipient "$public_key" --output "$output_file"
}

# Decrypt data
decrypt_data() {
    local input_file="$1"
    
    case "$ENCRYPTION_METHOD" in
        "gpg")
            decrypt_with_gpg "$input_file"
            ;;
        "age")
            decrypt_with_age "$input_file"
            ;;
        *)
            log "ERROR" "Unsupported encryption method: $ENCRYPTION_METHOD"
            return 1
            ;;
    esac
}

# Decrypt with GPG
decrypt_with_gpg() {
    local input_file="$1"
    gpg --quiet --decrypt "$input_file"
}

# Decrypt with Age
decrypt_with_age() {
    local input_file="$1"
    age --decrypt --identity "$VAULT_DIR/age-key.txt" "$input_file"
}

# =============================================================================
# Secret Generation Functions
# =============================================================================

# Generate database secrets
generate_database_secrets() {
    local env="$1"
    
    log "INFO" "Generating database secrets for $env environment..."
    
    local secrets=(
        "MONGODB_USERNAME:$(generate_secure_random 16)"
        "MONGODB_PASSWORD:$(generate_secure_random 32)"
        "REDIS_PASSWORD:$(generate_secure_random 32)"
        "DATABASE_ENCRYPTION_KEY:$(generate_secure_random 32)"
    )
    
    for secret in "${secrets[@]}"; do
        local key=$(echo "$secret" | cut -d':' -f1)
        local value=$(echo "$secret" | cut -d':' -f2)
        store_secret "$env" "database" "$key" "$value"
    done
}

# Generate authentication secrets
generate_authentication_secrets() {
    local env="$1"
    
    log "INFO" "Generating authentication secrets for $env environment..."
    
    local secrets=(
        "JWT_SECRET_KEY:$(generate_secure_random 64)"
        "JWT_REFRESH_SECRET:$(generate_secure_random 64)"
        "SECRET_KEY:$(generate_secure_random 64)"
        "SECURITY_PASSWORD_SALT:$(generate_secure_random 32)"
        "SESSION_SECRET:$(generate_secure_random 32)"
        "CSRF_SECRET:$(generate_secure_random 32)"
    )
    
    for secret in "${secrets[@]}"; do
        local key=$(echo "$secret" | cut -d':' -f1)
        local value=$(echo "$secret" | cut -d':' -f2)
        store_secret "$env" "authentication" "$key" "$value"
    done
}

# Generate external API secrets
generate_external_api_secrets() {
    local env="$1"
    
    log "INFO" "Generating external API secret placeholders for $env environment..."
    
    local secrets=(
        "CLERK_SECRET_KEY:changeme_clerk_secret_key_$env"
        "SUPABASE_ANON_KEY:changeme_supabase_anon_key_$env"
        "SUPABASE_SERVICE_ROLE_KEY:changeme_supabase_service_key_$env"
        "OPENAI_API_KEY:changeme_openai_api_key_$env"
        "STRIPE_SECRET_KEY:changeme_stripe_secret_key_$env"
        "SENDGRID_API_KEY:changeme_sendgrid_api_key_$env"
    )
    
    for secret in "${secrets[@]}"; do
        local key=$(echo "$secret" | cut -d':' -f1)
        local value=$(echo "$secret" | cut -d':' -f2)
        store_secret "$env" "external_apis" "$key" "$value"
    done
}

# Generate email secrets
generate_email_secrets() {
    local env="$1"
    
    log "INFO" "Generating email secret placeholders for $env environment..."
    
    local secrets=(
        "SMTP_USERNAME:changeme_smtp_username_$env"
        "SMTP_PASSWORD:changeme_smtp_password_$env"
        "EMAIL_ENCRYPTION_KEY:$(generate_secure_random 32)"
    )
    
    for secret in "${secrets[@]}"; do
        local key=$(echo "$secret" | cut -d':' -f1)
        local value=$(echo "$secret" | cut -d':' -f2)
        store_secret "$env" "email" "$key" "$value"
    done
}

# Generate encryption secrets
generate_encryption_secrets() {
    local env="$1"
    
    log "INFO" "Generating encryption secrets for $env environment..."
    
    local secrets=(
        "FIELD_ENCRYPTION_KEY:$(generate_secure_random 32)"
        "FILE_ENCRYPTION_KEY:$(generate_secure_random 32)"
        "BACKUP_ENCRYPTION_KEY:$(generate_secure_random 32)"
        "API_ENCRYPTION_KEY:$(generate_secure_random 32)"
    )
    
    for secret in "${secrets[@]}"; do
        local key=$(echo "$secret" | cut -d':' -f1)
        local value=$(echo "$secret" | cut -d':' -f2)
        store_secret "$env" "encryption" "$key" "$value"
    done
}

# Generate monitoring secrets
generate_monitoring_secrets() {
    local env="$1"
    
    log "INFO" "Generating monitoring secret placeholders for $env environment..."
    
    local secrets=(
        "GRAFANA_ADMIN_PASSWORD:$(generate_secure_random 16)"
        "PROMETHEUS_AUTH_TOKEN:$(generate_secure_random 32)"
        "ALERTMANAGER_AUTH_TOKEN:$(generate_secure_random 32)"
        "MONITORING_API_KEY:$(generate_secure_random 32)"
    )
    
    for secret in "${secrets[@]}"; do
        local key=$(echo "$secret" | cut -d':' -f1)
        local value=$(echo "$secret" | cut -d':' -f2)
        store_secret "$env" "monitoring" "$key" "$value"
    done
}

# =============================================================================
# Secret Storage Functions
# =============================================================================

# Store secret
store_secret() {
    local env="$1"
    local category="$2"
    local key="$3"
    local value="$4"
    
    local secret_dir="$SECRETS_DIR/$env/$category"
    local secret_file="$secret_dir/$key.enc"
    
    mkdir -p "$secret_dir"
    
    log "DEBUG" "Storing secret: $env/$category/$key"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would store secret: $env/$category/$key"
        return 0
    fi
    
    # Encrypt and store the secret
    if encrypt_data "$value" "$secret_file"; then
        chmod 600 "$secret_file"
        log "DEBUG" "Secret stored successfully: $key"
    else
        log "ERROR" "Failed to store secret: $key"
        return 1
    fi
    
    # Update secret index
    update_secret_index "$env" "$category" "$key"
}

# Retrieve secret
retrieve_secret() {
    local env="$1"
    local category="$2"
    local key="$3"
    
    local secret_file="$SECRETS_DIR/$env/$category/$key.enc"
    
    if [[ ! -f "$secret_file" ]]; then
        log "ERROR" "Secret not found: $env/$category/$key"
        return 1
    fi
    
    log "DEBUG" "Retrieving secret: $env/$category/$key"
    
    if ! decrypt_data "$secret_file"; then
        log "ERROR" "Failed to decrypt secret: $key"
        return 1
    fi
}

# Update secret index
update_secret_index() {
    local env="$1"
    local category="$2"
    local key="$3"
    
    local index_file="$SECRETS_DIR/$env/.index"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Create or update index entry
    local entry="$category/$key:$timestamp"
    
    if [[ -f "$index_file" ]]; then
        # Remove existing entry if present
        grep -v "^$category/$key:" "$index_file" > "$index_file.tmp" || true
        mv "$index_file.tmp" "$index_file"
    fi
    
    echo "$entry" >> "$index_file"
    sort "$index_file" -o "$index_file"
}

# List secrets
list_secrets() {
    local env="$1"
    local category="${2:-}"
    
    log "INFO" "Listing secrets for $env environment$([ -n "$category" ] && echo " in $category category")"
    
    local secrets_path="$SECRETS_DIR/$env"
    
    if [[ ! -d "$secrets_path" ]]; then
        log "WARN" "No secrets found for environment: $env"
        return 0
    fi
    
    if [[ -n "$category" ]]; then
        local category_path="$secrets_path/$category"
        if [[ -d "$category_path" ]]; then
            echo -e "${CYAN}Category: $category${NC}"
            find "$category_path" -name "*.enc" -exec basename {} .enc \; | sort | while read -r secret; do
                echo -e "  ${YELLOW}$secret${NC}"
            done
        else
            log "WARN" "Category not found: $category"
        fi
    else
        for cat_dir in "$secrets_path"/*/; do
            if [[ -d "$cat_dir" ]]; then
                local cat_name=$(basename "$cat_dir")
                if [[ "$cat_name" != "." ]]; then
                    echo -e "${CYAN}Category: $cat_name${NC}"
                    find "$cat_dir" -name "*.enc" -exec basename {} .enc \; | sort | while read -r secret; do
                        echo -e "  ${YELLOW}$secret${NC}"
                    done
                fi
            fi
        done
    fi
}

# =============================================================================
# Secret Rotation Functions
# =============================================================================

# Rotate secrets
rotate_secrets() {
    local env="$1"
    local category="${2:-}"
    
    log "INFO" "Rotating secrets for $env environment$([ -n "$category" ] && echo " in $category category")"
    
    if [[ "$BACKUP_SECRETS" == "true" ]]; then
        backup_secrets "$env" "$category"
    fi
    
    if [[ -n "$category" ]]; then
        rotate_category_secrets "$env" "$category"
    else
        for cat in "${SECRET_CATEGORIES[@]}"; do
            if [[ -d "$SECRETS_DIR/$env/$cat" ]]; then
                rotate_category_secrets "$env" "$cat"
            fi
        done
    fi
    
    log "SUCCESS" "Secret rotation completed for $env environment"
}

# Rotate category secrets
rotate_category_secrets() {
    local env="$1"
    local category="$2"
    
    log "INFO" "Rotating $category secrets for $env environment..."
    
    case "$category" in
        "database")
            generate_database_secrets "$env"
            ;;
        "authentication")
            generate_authentication_secrets "$env"
            ;;
        "encryption")
            generate_encryption_secrets "$env"
            ;;
        "monitoring")
            generate_monitoring_secrets "$env"
            ;;
        *)
            log "WARN" "Automatic rotation not supported for category: $category"
            ;;
    esac
}

# =============================================================================
# Backup and Recovery Functions
# =============================================================================

# Backup secrets
backup_secrets() {
    local env="$1"
    local category="${2:-}"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_dir="$PROJECT_ROOT/secrets-backups/$timestamp"
    
    log "INFO" "Creating backup of secrets..."
    
    mkdir -p "$backup_dir"
    
    if [[ -n "$category" ]]; then
        local source_dir="$SECRETS_DIR/$env/$category"
        if [[ -d "$source_dir" ]]; then
            cp -r "$source_dir" "$backup_dir/$env-$category"
            log "DEBUG" "Backed up $category secrets for $env"
        fi
    else
        if [[ -d "$SECRETS_DIR/$env" ]]; then
            cp -r "$SECRETS_DIR/$env" "$backup_dir/$env"
            log "DEBUG" "Backed up all secrets for $env"
        fi
    fi
    
    # Create backup manifest
    cat > "$backup_dir/manifest.txt" << EOF
Backup created: $(date)
Environment: $env
Category: ${category:-all}
Encryption method: $ENCRYPTION_METHOD
Backup directory: $backup_dir
EOF
    
    log "SUCCESS" "Secrets backup created: $backup_dir"
}

# =============================================================================
# Export Functions
# =============================================================================

# Export secrets to environment file
export_to_env() {
    local env="$1"
    local output_file="$2"
    
    log "INFO" "Exporting secrets to environment file: $output_file"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would export secrets to: $output_file"
        return 0
    fi
    
    # Create temporary file
    local temp_file="$PROJECT_ROOT/tmp/export.tmp"
    
    echo "# RemoteHive $env Environment Secrets" > "$temp_file"
    echo "# Generated on $(date)" >> "$temp_file"
    echo "# WARNING: This file contains sensitive information" >> "$temp_file"
    echo "" >> "$temp_file"
    
    # Export secrets by category
    for category in "${SECRET_CATEGORIES[@]}"; do
        local category_dir="$SECRETS_DIR/$env/$category"
        
        if [[ -d "$category_dir" ]]; then
            echo "# $category secrets" >> "$temp_file"
            
            find "$category_dir" -name "*.enc" | while read -r secret_file; do
                local key=$(basename "$secret_file" .enc)
                local value
                
                if value=$(decrypt_data "$secret_file"); then
                    echo "$key=$value" >> "$temp_file"
                else
                    log "WARN" "Failed to decrypt secret: $key"
                fi
            done
            
            echo "" >> "$temp_file"
        fi
    done
    
    # Move to final location
    mv "$temp_file" "$output_file"
    chmod 600 "$output_file"
    
    log "SUCCESS" "Secrets exported to: $output_file"
    log "SECURITY" "Remember to secure and delete the exported file after use"
}

# Export secrets to Kubernetes secrets
export_to_k8s() {
    local env="$1"
    local namespace="remotehive-$env"
    local output_dir="$PROJECT_ROOT/k8s/secrets"
    
    log "INFO" "Exporting secrets to Kubernetes manifests..."
    
    mkdir -p "$output_dir"
    
    # Export secrets by category
    for category in "${SECRET_CATEGORIES[@]}"; do
        local category_dir="$SECRETS_DIR/$env/$category"
        
        if [[ -d "$category_dir" ]]; then
            local k8s_secret_file="$output_dir/$env-$category-secrets.yaml"
            
            cat > "$k8s_secret_file" << EOF
apiVersion: v1
kind: Secret
metadata:
  name: $category-secrets
  namespace: $namespace
type: Opaque
data:
EOF
            
            find "$category_dir" -name "*.enc" | while read -r secret_file; do
                local key=$(basename "$secret_file" .enc)
                local value
                
                if value=$(decrypt_data "$secret_file"); then
                    local encoded_value=$(echo -n "$value" | base64 -w 0)
                    echo "  $key: $encoded_value" >> "$k8s_secret_file"
                else
                    log "WARN" "Failed to decrypt secret: $key"
                fi
            done
            
            log "DEBUG" "Created Kubernetes secret manifest: $k8s_secret_file"
        fi
    done
    
    log "SUCCESS" "Kubernetes secret manifests created in: $output_dir"
}

# =============================================================================
# Main Functions
# =============================================================================

# Show usage information
show_usage() {
    cat << EOF
RemoteHive Secrets Management System

Usage: $0 [OPTIONS] COMMAND [ARGS]

COMMANDS:
    init                      Initialize encryption system
    generate <env> [category] Generate secrets for environment
    store <env> <cat> <key>   Store a secret (value from stdin)
    get <env> <cat> <key>     Retrieve a secret
    list <env> [category]     List secrets
    rotate <env> [category]   Rotate secrets
    backup <env> [category]   Backup secrets
    export-env <env> <file>   Export secrets to environment file
    export-k8s <env>          Export secrets to Kubernetes manifests

OPTIONS:
    -v, --verbose             Enable verbose output
    -d, --dry-run             Show what would be done without making changes
    -f, --force               Force operation without confirmation
    --no-backup               Skip creating backups during rotation
    --encryption <method>     Encryption method (gpg|age, default: gpg)
    -h, --help                Show this help message

EXAMPLES:
    $0 init                           Initialize encryption system
    $0 generate production            Generate all secrets for production
    $0 generate staging database      Generate database secrets for staging
    $0 list production                List all production secrets
    $0 rotate production auth         Rotate authentication secrets
    $0 export-env production .env.prod Export secrets to environment file

SECRET CATEGORIES:
    database                  Database connection secrets
    authentication            JWT and session secrets
    external_apis             Third-party API keys
    email                     Email service credentials
    encryption                Data encryption keys
    certificates              SSL/TLS certificates
    monitoring                Monitoring system credentials

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
                BACKUP_SECRETS=false
                shift
                ;;
            --encryption)
                ENCRYPTION_METHOD="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            init|generate|store|get|list|rotate|backup|export-env|export-k8s)
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
    log "INFO" "RemoteHive Secrets Manager started"
    log "DEBUG" "Encryption method: $ENCRYPTION_METHOD"
    
    # Create necessary directories
    mkdir -p "$SECRETS_DIR" "$VAULT_DIR" "$PROJECT_ROOT/tmp" "$PROJECT_ROOT/secrets-backups"
    
    # Execute command
    case "${COMMAND:-}" in
        "init")
            init_encryption
            ;;
        "generate")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                log "ERROR" "Environment required for generate command"
                show_usage
                exit 1
            fi
            
            local env="${ARGS[0]}"
            local category="${ARGS[1]:-}"
            
            init_encryption
            
            if [[ -n "$category" ]]; then
                case "$category" in
                    "database")
                        generate_database_secrets "$env"
                        ;;
                    "authentication"|"auth")
                        generate_authentication_secrets "$env"
                        ;;
                    "external_apis"|"apis")
                        generate_external_api_secrets "$env"
                        ;;
                    "email")
                        generate_email_secrets "$env"
                        ;;
                    "encryption")
                        generate_encryption_secrets "$env"
                        ;;
                    "monitoring")
                        generate_monitoring_secrets "$env"
                        ;;
                    *)
                        log "ERROR" "Unknown category: $category"
                        exit 1
                        ;;
                esac
            else
                # Generate all categories
                generate_database_secrets "$env"
                generate_authentication_secrets "$env"
                generate_external_api_secrets "$env"
                generate_email_secrets "$env"
                generate_encryption_secrets "$env"
                generate_monitoring_secrets "$env"
            fi
            ;;
        "store")
            if [[ ${#ARGS[@]} -lt 3 ]]; then
                log "ERROR" "Environment, category, and key required for store command"
                show_usage
                exit 1
            fi
            
            init_encryption
            
            local env="${ARGS[0]}"
            local category="${ARGS[1]}"
            local key="${ARGS[2]}"
            
            log "INFO" "Enter secret value (input will be hidden):"
            read -s value
            
            store_secret "$env" "$category" "$key" "$value"
            ;;
        "get")
            if [[ ${#ARGS[@]} -lt 3 ]]; then
                log "ERROR" "Environment, category, and key required for get command"
                show_usage
                exit 1
            fi
            
            local env="${ARGS[0]}"
            local category="${ARGS[1]}"
            local key="${ARGS[2]}"
            
            retrieve_secret "$env" "$category" "$key"
            ;;
        "list")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                log "ERROR" "Environment required for list command"
                show_usage
                exit 1
            fi
            
            local env="${ARGS[0]}"
            local category="${ARGS[1]:-}"
            
            list_secrets "$env" "$category"
            ;;
        "rotate")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                log "ERROR" "Environment required for rotate command"
                show_usage
                exit 1
            fi
            
            local env="${ARGS[0]}"
            local category="${ARGS[1]:-}"
            
            rotate_secrets "$env" "$category"
            ;;
        "backup")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                log "ERROR" "Environment required for backup command"
                show_usage
                exit 1
            fi
            
            local env="${ARGS[0]}"
            local category="${ARGS[1]:-}"
            
            backup_secrets "$env" "$category"
            ;;
        "export-env")
            if [[ ${#ARGS[@]} -lt 2 ]]; then
                log "ERROR" "Environment and output file required for export-env command"
                show_usage
                exit 1
            fi
            
            local env="${ARGS[0]}"
            local output_file="${ARGS[1]}"
            
            export_to_env "$env" "$output_file"
            ;;
        "export-k8s")
            if [[ ${#ARGS[@]} -eq 0 ]]; then
                log "ERROR" "Environment required for export-k8s command"
                show_usage
                exit 1
            fi
            
            local env="${ARGS[0]}"
            
            export_to_k8s "$env"
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
    
    log "SUCCESS" "Secrets management operation completed successfully"
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