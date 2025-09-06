#!/bin/bash

# RemoteHive Development Workflow Script
# Provides easy development, testing, and production update workflows
# Author: RemoteHive DevOps Team
# Version: 1.0

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
PROJECT_NAME="remotehive"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy-remotehive.sh"

# Print functions
print_header() {
    echo -e "\n${PURPLE}=====================================${NC}"
    echo -e "${PURPLE}  RemoteHive Development Workflow  ${NC}"
    echo -e "${PURPLE}=====================================${NC}\n"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
RemoteHive Development Workflow Script

USAGE:
    $0 COMMAND [OPTIONS]

COMMANDS:
    start           Start development environment
    stop            Stop development environment
    restart         Restart development environment
    test            Run comprehensive tests
    build           Build all Docker images
    deploy-staging  Deploy to staging environment
    deploy-prod     Deploy to production environment
    update-prod     Update production with latest changes
    logs            Show application logs
    shell           Open development shell
    db-shell        Open database shell
    backup          Create database backup
    restore         Restore from backup
    clean           Clean up development environment
    status          Show current status
    monitor         Start monitoring dashboard
    setup           Initial project setup
    
DEVELOPMENT WORKFLOWS:
    quick-start     Complete setup and start development
    hot-reload      Start with hot-reload enabled
    debug           Start in debug mode
    test-watch      Run tests in watch mode
    
PRODUCTION WORKFLOWS:
    release         Create and deploy a new release
    hotfix          Deploy urgent fixes to production
    rollback        Rollback to previous version

OPTIONS:
    --verbose       Enable verbose output
    --no-cache      Disable Docker build cache
    --force         Force operation without confirmation
    -h, --help      Show this help message

EXAMPLES:
    # Start development
    $0 start
    
    # Quick development setup
    $0 quick-start
    
    # Deploy to production
    $0 deploy-prod
    
    # Update production with latest changes
    $0 update-prod
    
    # Run tests in watch mode
    $0 test-watch

EOF
}

# Parse command line arguments
parse_args() {
    VERBOSE=false
    NO_CACHE=false
    FORCE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                VERBOSE=true
                shift
                ;;
            --no-cache)
                NO_CACHE=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            start|stop|restart|test|build|deploy-staging|deploy-prod|update-prod|logs|shell|db-shell|backup|restore|clean|status|monitor|setup|quick-start|hot-reload|debug|test-watch|release|hotfix|rollback)
                COMMAND="$1"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Set default command if not provided
    if [[ -z "${COMMAND:-}" ]]; then
        COMMAND="start"
    fi
}

# Utility functions
confirm_action() {
    if [[ "$FORCE" == "true" ]]; then
        return 0
    fi
    
    echo -e "${YELLOW}Are you sure you want to $1? (y/N)${NC}"
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            print_status "Operation cancelled"
            exit 0
            ;;
    esac
}

check_deploy_script() {
    if [[ ! -f "$DEPLOY_SCRIPT" ]]; then
        print_error "Deploy script not found: $DEPLOY_SCRIPT"
        exit 1
    fi
    
    if [[ ! -x "$DEPLOY_SCRIPT" ]]; then
        chmod +x "$DEPLOY_SCRIPT"
    fi
}

wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
            print_success "Backend API is ready"
            break
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for backend..."
        sleep 5
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        print_warning "Backend API may not be fully ready"
    fi
}

# Development commands
start_development() {
    print_status "Starting development environment..."
    
    # Check if already running
    if docker-compose ps | grep -q "Up"; then
        print_warning "Development environment is already running"
        print_status "Use 'restart' command to restart services"
        return 0
    fi
    
    # Start services
    if [[ "$VERBOSE" == "true" ]]; then
        "$DEPLOY_SCRIPT" dev --verbose
    else
        "$DEPLOY_SCRIPT" dev
    fi
    
    wait_for_services
    show_development_info
}

stop_development() {
    print_status "Stopping development environment..."
    docker-compose down
    print_success "Development environment stopped"
}

restart_development() {
    print_status "Restarting development environment..."
    stop_development
    sleep 2
    start_development
}

quick_start() {
    print_status "Quick start: Setting up and starting development environment..."
    
    # Install dependencies
    setup_project
    
    # Start development
    start_development
    
    print_success "Quick start completed!"
}

hot_reload_development() {
    print_status "Starting development with hot-reload enabled..."
    
    # Set environment for hot reload
    export COMPOSE_FILE="docker-compose.yml:docker-compose.dev.yml"
    
    start_development
    
    print_status "Hot-reload enabled for frontend applications"
}

debug_development() {
    print_status "Starting development in debug mode..."
    
    # Set debug environment
    export DEBUG=true
    export LOG_LEVEL=debug
    
    start_development
    
    print_status "Debug mode enabled - check logs for detailed output"
}

# Testing commands
run_tests() {
    print_status "Running comprehensive tests..."
    "$DEPLOY_SCRIPT" test --verbose
}

test_watch() {
    print_status "Starting tests in watch mode..."
    
    # Start test watchers in background
    if [[ -f "pytest.ini" ]]; then
        print_status "Starting Python test watcher..."
        python -m pytest tests/ --tb=short -f &
        PYTEST_PID=$!
    fi
    
    # Start frontend test watchers
    if [[ -d "remotehive-admin" ]]; then
        print_status "Starting admin panel test watcher..."
        cd remotehive-admin
        npm test &
        ADMIN_TEST_PID=$!
        cd ..
    fi
    
    if [[ -d "remotehive-public" ]]; then
        print_status "Starting public website test watcher..."
        cd remotehive-public
        npm test &
        PUBLIC_TEST_PID=$!
        cd ..
    fi
    
    print_status "Test watchers started. Press Ctrl+C to stop."
    
    # Wait for interrupt
    trap 'kill $PYTEST_PID $ADMIN_TEST_PID $PUBLIC_TEST_PID 2>/dev/null; exit 0' INT
    wait
}

# Build commands
build_images() {
    print_status "Building Docker images..."
    
    local build_args=""
    if [[ "$NO_CACHE" == "true" ]]; then
        build_args="--no-cache"
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        build_args="$build_args --verbose"
    fi
    
    "$DEPLOY_SCRIPT" dev --skip-tests $build_args
}

# Deployment commands
deploy_staging() {
    print_status "Deploying to staging environment..."
    confirm_action "deploy to staging"
    
    "$DEPLOY_SCRIPT" staging --verbose
    print_success "Staging deployment completed"
}

deploy_production() {
    print_status "Deploying to production environment..."
    confirm_action "deploy to production"
    
    # Run tests first
    run_tests
    
    # Deploy to production
    "$DEPLOY_SCRIPT" production --verbose
    
    print_success "Production deployment completed"
}

update_production() {
    print_status "Updating production with latest changes..."
    confirm_action "update production"
    
    # Get current git commit
    local current_commit
    current_commit=$(git rev-parse --short HEAD)
    
    # Build and deploy with commit tag
    "$DEPLOY_SCRIPT" production --tag "$current_commit" --verbose
    
    print_success "Production updated with commit: $current_commit"
}

# Release management
create_release() {
    print_status "Creating and deploying a new release..."
    
    # Get version from user
    echo -e "${YELLOW}Enter release version (e.g., v1.2.3):${NC}"
    read -r version
    
    if [[ -z "$version" ]]; then
        print_error "Version is required"
        exit 1
    fi
    
    confirm_action "create release $version"
    
    # Create git tag
    git tag "$version"
    git push origin "$version"
    
    # Deploy with version tag
    "$DEPLOY_SCRIPT" production --tag "$version" --verbose
    
    print_success "Release $version created and deployed"
}

deploy_hotfix() {
    print_status "Deploying urgent hotfix to production..."
    confirm_action "deploy hotfix to production"
    
    # Skip tests for hotfix (urgent)
    "$DEPLOY_SCRIPT" production --skip-tests --verbose
    
    print_success "Hotfix deployed to production"
    print_warning "Remember to run tests and create proper release later"
}

rollback_production() {
    print_status "Rolling back production to previous version..."
    
    # Get available tags
    echo -e "${YELLOW}Available versions:${NC}"
    git tag -l | tail -10
    
    echo -e "${YELLOW}Enter version to rollback to:${NC}"
    read -r rollback_version
    
    if [[ -z "$rollback_version" ]]; then
        print_error "Version is required"
        exit 1
    fi
    
    confirm_action "rollback to $rollback_version"
    
    # Deploy specific version
    "$DEPLOY_SCRIPT" production --tag "$rollback_version" --skip-tests --verbose
    
    print_success "Production rolled back to $rollback_version"
}

# Utility commands
show_logs() {
    print_status "Showing application logs..."
    "$DEPLOY_SCRIPT" logs
}

open_shell() {
    print_status "Opening development shell..."
    "$DEPLOY_SCRIPT" shell
}

open_db_shell() {
    print_status "Opening database shell..."
    
    echo -e "${YELLOW}Select database:${NC}"
    echo "1) MongoDB"
    echo "2) Redis"
    echo "3) SQLite (Autoscraper)"
    read -r db_choice
    
    case "$db_choice" in
        1)
            docker-compose exec mongodb mongosh
            ;;
        2)
            docker-compose exec redis redis-cli
            ;;
        3)
            docker-compose exec autoscraper sqlite3 /app/data/autoscraper.db
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
}

backup_databases() {
    print_status "Creating database backup..."
    "$DEPLOY_SCRIPT" backup
}

restore_databases() {
    print_status "Restoring from backup..."
    
    echo -e "${YELLOW}Available backups:${NC}"
    ls -la backups/ 2>/dev/null || echo "No backups found"
    
    echo -e "${YELLOW}Enter backup directory name:${NC}"
    read -r backup_dir
    
    if [[ ! -d "backups/$backup_dir" ]]; then
        print_error "Backup directory not found: backups/$backup_dir"
        exit 1
    fi
    
    confirm_action "restore from backup $backup_dir"
    
    # Restore MongoDB
    if [[ -d "backups/$backup_dir/mongodb" ]]; then
        docker-compose exec -T mongodb mongorestore --drop /tmp/restore
        docker cp "backups/$backup_dir/mongodb" "$(docker-compose ps -q mongodb)":/tmp/restore
    fi
    
    # Restore Redis
    if [[ -f "backups/$backup_dir/redis_dump.rdb" ]]; then
        docker-compose stop redis
        docker cp "backups/$backup_dir/redis_dump.rdb" "$(docker-compose ps -q redis)":/data/dump.rdb
        docker-compose start redis
    fi
    
    print_success "Database restore completed"
}

clean_environment() {
    print_status "Cleaning up development environment..."
    confirm_action "clean up all development resources"
    
    "$DEPLOY_SCRIPT" cleanup
    
    # Clean Docker system
    docker system prune -f
    docker volume prune -f
    
    print_success "Environment cleaned up"
}

show_status() {
    print_status "Current development status:"
    "$DEPLOY_SCRIPT" status
}

start_monitoring() {
    print_status "Starting monitoring dashboard..."
    
    # Start Grafana if available
    if docker-compose ps | grep -q grafana; then
        print_status "Grafana available at: http://localhost:3001"
    fi
    
    # Show service URLs
    show_development_info
}

setup_project() {
    print_status "Setting up RemoteHive project..."
    
    # Install Python dependencies
    if [[ -f "requirements.txt" ]]; then
        print_status "Installing Python dependencies..."
        pip install -r requirements.txt
    fi
    
    # Install Node.js dependencies for admin panel
    if [[ -d "remotehive-admin" && -f "remotehive-admin/package.json" ]]; then
        print_status "Installing admin panel dependencies..."
        cd remotehive-admin
        npm install
        cd ..
    fi
    
    # Install Node.js dependencies for public website
    if [[ -d "remotehive-public" && -f "remotehive-public/package.json" ]]; then
        print_status "Installing public website dependencies..."
        cd remotehive-public
        npm install
        cd ..
    fi
    
    # Create environment files if they don't exist
    if [[ ! -f ".env.development" && -f ".env.example" ]]; then
        cp .env.example .env.development
        print_status "Created .env.development from template"
    fi
    
    print_success "Project setup completed"
}

show_development_info() {
    print_success "Development environment is running!"
    echo ""
    echo -e "${CYAN}Service URLs:${NC}"
    echo "  🚀 Backend API:      http://localhost:8000"
    echo "  🔧 API Docs:         http://localhost:8000/docs"
    echo "  🕷️  Autoscraper:      http://localhost:8001"
    echo "  👨‍💼 Admin Panel:      http://localhost:3000"
    echo "  🌐 Public Website:   http://localhost:5173"
    echo "  📊 Redis:            localhost:6379"
    echo "  🍃 MongoDB:          localhost:27017"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo "  📋 View logs:        $0 logs"
    echo "  🐚 Open shell:       $0 shell"
    echo "  🗄️  Database shell:   $0 db-shell"
    echo "  🧪 Run tests:        $0 test"
    echo "  🔄 Restart:          $0 restart"
    echo "  🛑 Stop:             $0 stop"
    echo ""
    echo -e "${CYAN}Default Admin Credentials:${NC}"
    echo "  📧 Email:    admin@remotehive.in"
    echo "  🔑 Password: Ranjeet11$"
    echo ""
}

# Main execution
main() {
    print_header
    
    # Parse arguments
    parse_args "$@"
    
    # Check deploy script
    check_deploy_script
    
    # Execute command
    case "$COMMAND" in
        "start")
            start_development
            ;;
        "stop")
            stop_development
            ;;
        "restart")
            restart_development
            ;;
        "test")
            run_tests
            ;;
        "build")
            build_images
            ;;
        "deploy-staging")
            deploy_staging
            ;;
        "deploy-prod")
            deploy_production
            ;;
        "update-prod")
            update_production
            ;;
        "logs")
            show_logs
            ;;
        "shell")
            open_shell
            ;;
        "db-shell")
            open_db_shell
            ;;
        "backup")
            backup_databases
            ;;
        "restore")
            restore_databases
            ;;
        "clean")
            clean_environment
            ;;
        "status")
            show_status
            ;;
        "monitor")
            start_monitoring
            ;;
        "setup")
            setup_project
            ;;
        "quick-start")
            quick_start
            ;;
        "hot-reload")
            hot_reload_development
            ;;
        "debug")
            debug_development
            ;;
        "test-watch")
            test_watch
            ;;
        "release")
            create_release
            ;;
        "hotfix")
            deploy_hotfix
            ;;
        "rollback")
            rollback_production
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
    
    print_success "Operation completed successfully!"
}

# Run main function with all arguments
main "$@"