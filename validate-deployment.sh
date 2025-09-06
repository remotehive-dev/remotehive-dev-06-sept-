#!/bin/bash

# RemoteHive Deployment Validation Script
# This script validates the entire deployment setup and provides guidance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REQUIRED_FILES=(
    "docker-compose.yml"
    "docker-compose.dev.yml"
    "docker-compose.prod.yml"
    "Dockerfile.prod"
    "requirements-prod.txt"
    "requirements-dev.txt"
    "deploy-remotehive.sh"
    "dev-workflow.sh"
    "deploy-k8s.sh"
    "test-deployment.sh"
    ".env.prod.template"
    ".github/workflows/ci-cd.yml"
)

REQUIRED_DIRS=(
    "app"
    "autoscraper-service"
    "remotehive-admin"
    "remotehive-public"
    "k8s"
)

# Validation results
VALIDATION_RESULTS=()
WARNINGS=()
ERRORS=()
SUCCESSES=()

# Logging functions
log_header() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}\n"
}

log_section() {
    echo -e "\n${CYAN}--- $1 ---${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    SUCCESSES+=("$1")
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    WARNINGS+=("$1")
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ERRORS+=("$1")
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Validation functions
validate_prerequisites() {
    log_section "Validating Prerequisites"
    
    # Check Docker
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker installed: $docker_version"
    else
        log_error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        local compose_version=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker Compose installed: $compose_version"
    else
        log_error "Docker Compose is not installed"
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log_success "Node.js installed: $node_version"
    else
        log_warning "Node.js is not installed (required for frontend development)"
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        local python_version=$(python3 --version | cut -d' ' -f2)
        log_success "Python installed: $python_version"
    else
        log_error "Python 3 is not installed"
    fi
    
    # Check kubectl (optional)
    if command -v kubectl &> /dev/null; then
        local kubectl_version=$(kubectl version --client --short 2>/dev/null | cut -d' ' -f3)
        log_success "kubectl installed: $kubectl_version"
    else
        log_warning "kubectl is not installed (required for Kubernetes deployment)"
    fi
    
    # Check jq (optional but recommended)
    if command -v jq &> /dev/null; then
        local jq_version=$(jq --version)
        log_success "jq installed: $jq_version"
    else
        log_warning "jq is not installed (recommended for JSON processing)"
    fi
    
    # Check curl
    if command -v curl &> /dev/null; then
        log_success "curl is available"
    else
        log_error "curl is not installed (required for testing)"
    fi
}

validate_project_structure() {
    log_section "Validating Project Structure"
    
    # Check required files
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            log_success "Required file exists: $file"
        else
            log_error "Missing required file: $file"
        fi
    done
    
    # Check required directories
    for dir in "${REQUIRED_DIRS[@]}"; do
        if [ -d "$PROJECT_ROOT/$dir" ]; then
            log_success "Required directory exists: $dir"
        else
            log_error "Missing required directory: $dir"
        fi
    done
    
    # Check script permissions
    local scripts=("deploy-remotehive.sh" "dev-workflow.sh" "deploy-k8s.sh" "test-deployment.sh")
    for script in "${scripts[@]}"; do
        if [ -f "$PROJECT_ROOT/$script" ]; then
            if [ -x "$PROJECT_ROOT/$script" ]; then
                log_success "Script is executable: $script"
            else
                log_warning "Script is not executable: $script (run: chmod +x $script)"
            fi
        fi
    done
}

validate_configuration() {
    log_section "Validating Configuration Files"
    
    # Check .env files
    if [ -f "$PROJECT_ROOT/.env" ]; then
        log_success "Development .env file exists"
        
        # Check for required environment variables
        local required_vars=("MONGODB_URL" "REDIS_URL" "JWT_SECRET_KEY")
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" "$PROJECT_ROOT/.env"; then
                log_success "Environment variable configured: $var"
            else
                log_warning "Missing environment variable: $var"
            fi
        done
    else
        log_warning "Development .env file not found (copy from .env.example)"
    fi
    
    if [ -f "$PROJECT_ROOT/.env.prod" ]; then
        log_success "Production .env file exists"
    else
        log_warning "Production .env file not found (copy from .env.prod.template)"
    fi
    
    # Check Docker Compose files
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        if docker-compose -f "$PROJECT_ROOT/docker-compose.yml" config > /dev/null 2>&1; then
            log_success "docker-compose.yml is valid"
        else
            log_error "docker-compose.yml has syntax errors"
        fi
    fi
    
    if [ -f "$PROJECT_ROOT/docker-compose.dev.yml" ]; then
        if docker-compose -f "$PROJECT_ROOT/docker-compose.yml" -f "$PROJECT_ROOT/docker-compose.dev.yml" config > /dev/null 2>&1; then
            log_success "docker-compose.dev.yml is valid"
        else
            log_error "docker-compose.dev.yml has syntax errors"
        fi
    fi
    
    if [ -f "$PROJECT_ROOT/docker-compose.prod.yml" ]; then
        if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" config > /dev/null 2>&1; then
            log_success "docker-compose.prod.yml is valid"
        else
            log_error "docker-compose.prod.yml has syntax errors"
        fi
    fi
}

validate_kubernetes_manifests() {
    log_section "Validating Kubernetes Manifests"
    
    if [ ! -d "$PROJECT_ROOT/k8s" ]; then
        log_warning "Kubernetes manifests directory not found"
        return
    fi
    
    if command -v kubectl &> /dev/null; then
        local k8s_files=$(find "$PROJECT_ROOT/k8s" -name "*.yaml" -o -name "*.yml")
        
        if [ -z "$k8s_files" ]; then
            log_warning "No Kubernetes manifest files found in k8s/ directory"
        else
            for file in $k8s_files; do
                if kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1; then
                    log_success "Valid Kubernetes manifest: $(basename "$file")"
                else
                    log_error "Invalid Kubernetes manifest: $(basename "$file")"
                fi
            done
        fi
    else
        log_warning "kubectl not available, skipping Kubernetes manifest validation"
    fi
}

validate_docker_images() {
    log_section "Validating Docker Images"
    
    # Check if Dockerfiles exist and are valid
    local dockerfiles=("Dockerfile.prod" "autoscraper-service/Dockerfile" "remotehive-admin/Dockerfile" "remotehive-public/Dockerfile")
    
    for dockerfile in "${dockerfiles[@]}"; do
        if [ -f "$PROJECT_ROOT/$dockerfile" ]; then
            log_success "Dockerfile exists: $dockerfile"
            
            # Basic syntax check
            if grep -q "^FROM" "$PROJECT_ROOT/$dockerfile"; then
                log_success "Dockerfile has valid FROM instruction: $dockerfile"
            else
                log_error "Dockerfile missing FROM instruction: $dockerfile"
            fi
        else
            log_warning "Dockerfile not found: $dockerfile"
        fi
    done
}

validate_dependencies() {
    log_section "Validating Dependencies"
    
    # Check Python requirements
    if [ -f "$PROJECT_ROOT/requirements.txt" ]; then
        log_success "Python requirements.txt exists"
    else
        log_warning "Python requirements.txt not found"
    fi
    
    if [ -f "$PROJECT_ROOT/requirements-prod.txt" ]; then
        log_success "Production requirements file exists"
    fi
    
    if [ -f "$PROJECT_ROOT/requirements-dev.txt" ]; then
        log_success "Development requirements file exists"
    fi
    
    # Check Node.js dependencies
    if [ -f "$PROJECT_ROOT/remotehive-admin/package.json" ]; then
        log_success "Admin panel package.json exists"
    else
        log_warning "Admin panel package.json not found"
    fi
    
    if [ -f "$PROJECT_ROOT/remotehive-public/package.json" ]; then
        log_success "Public website package.json exists"
    else
        log_warning "Public website package.json not found"
    fi
}

validate_ci_cd() {
    log_section "Validating CI/CD Configuration"
    
    if [ -f "$PROJECT_ROOT/.github/workflows/ci-cd.yml" ]; then
        log_success "GitHub Actions workflow exists"
        
        # Check for required workflow components
        local workflow_file="$PROJECT_ROOT/.github/workflows/ci-cd.yml"
        
        if grep -q "on:" "$workflow_file"; then
            log_success "Workflow has trigger configuration"
        else
            log_error "Workflow missing trigger configuration"
        fi
        
        if grep -q "jobs:" "$workflow_file"; then
            log_success "Workflow has jobs configuration"
        else
            log_error "Workflow missing jobs configuration"
        fi
        
        # Check for specific jobs
        local required_jobs=("code-quality" "test-backend" "build-and-push" "deploy")
        for job in "${required_jobs[@]}"; do
            if grep -q "$job:" "$workflow_file"; then
                log_success "Workflow includes job: $job"
            else
                log_warning "Workflow missing recommended job: $job"
            fi
        done
    else
        log_warning "GitHub Actions workflow not found"
    fi
}

run_basic_tests() {
    log_section "Running Basic Tests"
    
    # Test Docker Compose syntax
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        log_step "Testing Docker Compose configuration..."
        if docker-compose -f "$PROJECT_ROOT/docker-compose.yml" config > /dev/null 2>&1; then
            log_success "Docker Compose configuration is valid"
        else
            log_error "Docker Compose configuration has errors"
        fi
    fi
    
    # Test Python syntax (if Python files exist)
    if [ -d "$PROJECT_ROOT/app" ]; then
        log_step "Testing Python syntax..."
        if command -v python3 &> /dev/null; then
            local python_files=$(find "$PROJECT_ROOT/app" -name "*.py" | head -5)
            local syntax_errors=0
            
            for file in $python_files; do
                if ! python3 -m py_compile "$file" 2>/dev/null; then
                    log_error "Python syntax error in: $(basename "$file")"
                    syntax_errors=$((syntax_errors + 1))
                fi
            done
            
            if [ $syntax_errors -eq 0 ]; then
                log_success "Python syntax validation passed"
            fi
        else
            log_warning "Python not available for syntax checking"
        fi
    fi
}

generate_setup_guide() {
    log_section "Setup Guide"
    
    echo -e "${CYAN}To get started with RemoteHive deployment:${NC}\n"
    
    echo -e "${YELLOW}1. Environment Setup:${NC}"
    echo "   cp .env.example .env"
    echo "   cp .env.prod.template .env.prod"
    echo "   # Edit .env and .env.prod with your configuration"
    echo
    
    echo -e "${YELLOW}2. Development Deployment:${NC}"
    echo "   ./dev-workflow.sh start"
    echo "   # Or: docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d"
    echo
    
    echo -e "${YELLOW}3. Production Deployment:${NC}"
    echo "   ./deploy-remotehive.sh deploy production"
    echo "   # Or: docker-compose -f docker-compose.prod.yml up -d"
    echo
    
    echo -e "${YELLOW}4. Kubernetes Deployment:${NC}"
    echo "   ./deploy-k8s.sh deploy --environment production --domain your-domain.com"
    echo
    
    echo -e "${YELLOW}5. Test Deployment:${NC}"
    echo "   ./test-deployment.sh docker"
    echo "   # Or for Kubernetes: ./test-deployment.sh kubernetes"
    echo
    
    echo -e "${YELLOW}6. Access Services:${NC}"
    echo "   Backend API: http://localhost:8000"
    echo "   Admin Panel: http://localhost:3000"
    echo "   Public Website: http://localhost:5173"
    echo "   API Documentation: http://localhost:8000/docs"
    echo
}

generate_report() {
    log_header "DEPLOYMENT VALIDATION REPORT"
    
    local total_checks=$((${#SUCCESSES[@]} + ${#WARNINGS[@]} + ${#ERRORS[@]}))
    
    echo -e "${BLUE}Total Checks:${NC} $total_checks"
    echo -e "${GREEN}Successes:${NC} ${#SUCCESSES[@]}"
    echo -e "${YELLOW}Warnings:${NC} ${#WARNINGS[@]}"
    echo -e "${RED}Errors:${NC} ${#ERRORS[@]}"
    echo
    
    if [ ${#ERRORS[@]} -gt 0 ]; then
        echo -e "${RED}Critical Issues (Must Fix):${NC}"
        for error in "${ERRORS[@]}"; do
            echo -e "  ${RED}✗${NC} $error"
        done
        echo
    fi
    
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo -e "${YELLOW}Warnings (Recommended to Fix):${NC}"
        for warning in "${WARNINGS[@]}"; do
            echo -e "  ${YELLOW}⚠${NC} $warning"
        done
        echo
    fi
    
    # Overall status
    if [ ${#ERRORS[@]} -eq 0 ]; then
        if [ ${#WARNINGS[@]} -eq 0 ]; then
            echo -e "${GREEN}✓ Deployment setup is ready!${NC}"
        else
            echo -e "${YELLOW}⚠ Deployment setup is mostly ready (some warnings)${NC}"
        fi
    else
        echo -e "${RED}✗ Deployment setup has critical issues that must be resolved${NC}"
    fi
    
    echo
}

# Main execution
main() {
    local action=${1:-"validate"}
    
    case $action in
        "validate")
            log_header "RemoteHive Deployment Validation"
            echo "Project Root: $PROJECT_ROOT"
            echo "Timestamp: $(date)"
            
            validate_prerequisites
            validate_project_structure
            validate_configuration
            validate_kubernetes_manifests
            validate_docker_images
            validate_dependencies
            validate_ci_cd
            run_basic_tests
            
            generate_report
            generate_setup_guide
            
            # Exit with error if critical issues found
            if [ ${#ERRORS[@]} -gt 0 ]; then
                exit 1
            fi
            ;;
            
        "setup")
            log_header "RemoteHive Quick Setup"
            
            # Create .env from template if it doesn't exist
            if [ ! -f "$PROJECT_ROOT/.env" ] && [ -f "$PROJECT_ROOT/.env.example" ]; then
                cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
                log_success "Created .env from template"
            fi
            
            # Create .env.prod from template if it doesn't exist
            if [ ! -f "$PROJECT_ROOT/.env.prod" ] && [ -f "$PROJECT_ROOT/.env.prod.template" ]; then
                cp "$PROJECT_ROOT/.env.prod.template" "$PROJECT_ROOT/.env.prod"
                log_success "Created .env.prod from template"
            fi
            
            # Make scripts executable
            local scripts=("deploy-remotehive.sh" "dev-workflow.sh" "deploy-k8s.sh" "test-deployment.sh")
            for script in "${scripts[@]}"; do
                if [ -f "$PROJECT_ROOT/$script" ]; then
                    chmod +x "$PROJECT_ROOT/$script"
                    log_success "Made script executable: $script"
                fi
            done
            
            log_success "Quick setup completed!"
            echo
            echo -e "${CYAN}Next steps:${NC}"
            echo "1. Edit .env and .env.prod with your configuration"
            echo "2. Run: ./dev-workflow.sh start"
            echo "3. Run: ./test-deployment.sh docker"
            ;;
            
        "help")
            echo "RemoteHive Deployment Validation Script"
            echo
            echo "Usage: $0 [command]"
            echo
            echo "Commands:"
            echo "  validate  - Validate deployment setup (default)"
            echo "  setup     - Quick setup (create .env files, make scripts executable)"
            echo "  help      - Show this help message"
            echo
            ;;
            
        *)
            log_error "Unknown command: $action"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi