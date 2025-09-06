#!/bin/bash

# RemoteHive Project Startup Script
# A comprehensive startup script that manages Docker containers and services
# Compatible with existing fixed_startup.py infrastructure

set -e  # Exit on any error

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
LOG_FILE="$PROJECT_ROOT/logs/startup.log"
PID_FILE="$PROJECT_ROOT/.startup.pid"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
DOCKER_COMPOSE_DEV_FILE="$PROJECT_ROOT/docker-compose.dev.yml"

# Service configuration - using arrays for compatibility
SERVICE_NAMES=("redis" "mongodb" "backend" "autoscraper" "admin" "public" "nginx")
SERVICE_PORTS=(6379 27017 8000 8001 3000 5173 80)

# Health check URLs
HEALTH_SERVICES=("backend" "autoscraper" "admin" "public")
HEALTH_URLS=("http://localhost:8000/health" "http://localhost:8001/health" "http://localhost:3000/api/health" "http://localhost:5173/health")

# Function to get port for service
get_service_port() {
    local service=$1
    for i in "${!SERVICE_NAMES[@]}"; do
        if [[ "${SERVICE_NAMES[$i]}" == "$service" ]]; then
            echo "${SERVICE_PORTS[$i]}"
            return
        fi
    done
    echo ""
}

# Function to get health URL for service
get_health_url() {
    local service=$1
    for i in "${!HEALTH_SERVICES[@]}"; do
        if [[ "${HEALTH_SERVICES[$i]}" == "$service" ]]; then
            echo "${HEALTH_URLS[$i]}"
            return
        fi
    done
    echo ""
}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "${PURPLE}[STARTUP]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to setup logging
setup_logging() {
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - RemoteHive Startup Script Started" > "$LOG_FILE"
    print_header "RemoteHive Project Startup Script v1.0"
    print_header "Log file: $LOG_FILE"
}

# Function to check if Docker is running
check_docker() {
    print_status "Checking Docker availability..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker Desktop."
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed or not in PATH"
        return 1
    fi
    
    print_success "Docker and Docker Compose are available"
    return 0
}

# Function to stop existing containers and services
stop_existing_services() {
    print_status "Stopping existing Docker containers and services..."
    
    # Stop Docker Compose services
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        print_status "Stopping Docker Compose services..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
        
        if [ -f "$DOCKER_COMPOSE_DEV_FILE" ]; then
            docker-compose -f "$DOCKER_COMPOSE_FILE" -f "$DOCKER_COMPOSE_DEV_FILE" down --remove-orphans 2>/dev/null || true
        fi
    fi
    
    # Stop any RemoteHive containers
    print_status "Stopping RemoteHive containers..."
    docker ps -q --filter "name=remotehive" | xargs -r docker stop 2>/dev/null || true
    docker ps -aq --filter "name=remotehive" | xargs -r docker rm 2>/dev/null || true
    
    # Kill processes on required ports
    print_status "Cleaning up ports..."
    for i in "${!SERVICE_NAMES[@]}"; do
        service="${SERVICE_NAMES[$i]}"
        port="${SERVICE_PORTS[$i]}"
        if lsof -ti:$port >/dev/null 2>&1; then
            print_status "Killing processes on port $port ($service)..."
            lsof -ti:$port | xargs -r kill -9 2>/dev/null || true
        fi
    done
    
    # Stop any Python processes related to RemoteHive
    print_status "Stopping Python processes..."
    pkill -f "fixed_startup.py" 2>/dev/null || true
    pkill -f "docker-startup.py" 2>/dev/null || true
    pkill -f "uvicorn.*app.main:app" 2>/dev/null || true
    pkill -f "celery.*app.tasks" 2>/dev/null || true
    
    print_success "Existing services stopped"
}

# Function to clear cache and temporary files
clear_cache_files() {
    print_status "Clearing cache files and temporary data..."
    
    # Python cache files
    find "$PROJECT_ROOT" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find "$PROJECT_ROOT" -name "*.pyc" -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name "*.pyo" -delete 2>/dev/null || true
    
    # Node.js cache files
    find "$PROJECT_ROOT" -type d -name "node_modules/.cache" -exec rm -rf {} + 2>/dev/null || true
    find "$PROJECT_ROOT" -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$PROJECT_ROOT" -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Docker build cache (optional - uncomment if needed)
    # docker builder prune -f 2>/dev/null || true
    
    # Application logs (keep recent ones)
    if [ -d "$PROJECT_ROOT/logs" ]; then
        find "$PROJECT_ROOT/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    fi
    
    # Temporary files
    rm -f "$PROJECT_ROOT"/*.tmp 2>/dev/null || true
    rm -f "$PROJECT_ROOT"/.startup.pid 2>/dev/null || true
    
    print_success "Cache and temporary files cleared"
}

# Function to build Docker images
build_docker_images() {
    print_status "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build with development override for faster builds
    if [ -f "$DOCKER_COMPOSE_DEV_FILE" ]; then
        print_status "Building with development configuration..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" -f "$DOCKER_COMPOSE_DEV_FILE" build --parallel
    else
        print_status "Building with production configuration..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" build --parallel
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Docker images built successfully"
    else
        print_error "Failed to build Docker images"
        return 1
    fi
}

# Function to start Docker services
start_docker_services() {
    print_status "Starting Docker services..."
    
    cd "$PROJECT_ROOT"
    
    # Start services with development override if available
    if [ -f "$DOCKER_COMPOSE_DEV_FILE" ]; then
        print_status "Starting with development configuration..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" -f "$DOCKER_COMPOSE_DEV_FILE" up -d
    else
        print_status "Starting with production configuration..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Docker services started"
    else
        print_error "Failed to start Docker services"
        return 1
    fi
}

# Function to wait for service health checks
wait_for_services() {
    print_status "Waiting for services to become healthy..."
    
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local all_healthy=true
        
        print_status "Health check attempt $attempt/$max_attempts"
        
        # Check Docker container health
        for container in $(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q); do
            if [ -n "$container" ]; then
                local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-health-check")
                local name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/^\///')
                
                if [ "$health" = "unhealthy" ]; then
                    print_warning "Container $name is unhealthy"
                    all_healthy=false
                elif [ "$health" = "starting" ]; then
                    print_status "Container $name is starting..."
                    all_healthy=false
                elif [ "$health" = "healthy" ] || [ "$health" = "no-health-check" ]; then
                    # For containers without health checks, check if they're running
                    local status=$(docker inspect --format='{{.State.Status}}' "$container")
                    if [ "$status" != "running" ]; then
                        print_warning "Container $name is not running (status: $status)"
                        all_healthy=false
                    fi
                fi
            fi
        done
        
        # Check HTTP endpoints
        for i in "${!HEALTH_SERVICES[@]}"; do
            local service="${HEALTH_SERVICES[$i]}"
            local url="${HEALTH_URLS[$i]}"
            if ! curl -s -f "$url" >/dev/null 2>&1; then
                print_status "Service $service not ready at $url"
                all_healthy=false
            fi
        done
        
        if [ "$all_healthy" = true ]; then
            print_success "All services are healthy!"
            return 0
        fi
        
        sleep 5
        ((attempt++))
    done
    
    print_warning "Some services may not be fully ready, but continuing..."
    return 0
}

# Function to display service information
show_service_info() {
    print_header "RemoteHive Services Status"
    
    echo -e "${CYAN}=== Service URLs ===${NC}"
    echo -e "${GREEN}🔗 Backend API:${NC}      http://localhost:8000"
    echo -e "${GREEN}🔗 Autoscraper API:${NC}  http://localhost:8001"
    echo -e "${GREEN}🔗 Admin Panel:${NC}      http://localhost:3000"
    echo -e "${GREEN}🔗 Public Website:${NC}   http://localhost:5173"
    echo -e "${GREEN}🔗 MongoDB:${NC}          mongodb://localhost:27017"
    echo -e "${GREEN}🔗 Redis:${NC}            redis://localhost:6379"
    
    echo -e "\n${CYAN}=== Docker Containers ===${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    echo -e "\n${CYAN}=== Health Status ===${NC}"
    for i in "${!HEALTH_SERVICES[@]}"; do
        local service="${HEALTH_SERVICES[$i]}"
        local url="${HEALTH_URLS[$i]}"
        if curl -s -f "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service${NC} - Healthy"
        else
            echo -e "${RED}❌ $service${NC} - Not responding"
        fi
    done
    
    echo -e "\n${CYAN}=== Quick Commands ===${NC}"
    echo -e "${YELLOW}View logs:${NC}           docker-compose logs -f [service_name]"
    echo -e "${YELLOW}Stop services:${NC}       docker-compose down"
    echo -e "${YELLOW}Restart service:${NC}     docker-compose restart [service_name]"
    echo -e "${YELLOW}Shell access:${NC}        docker-compose exec [service_name] /bin/bash"
}

# Function to handle cleanup on exit
cleanup_on_exit() {
    print_status "Cleaning up..."
    rm -f "$PID_FILE"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    echo "  --dev          Use development configuration"
    echo "  --prod         Use production configuration"
    echo "  --build        Force rebuild of Docker images"
    echo "  --no-cache     Clear Docker build cache before building"
    echo ""
    echo "Examples:"
    echo "  $0                    # Start with default configuration"
    echo "  $0 --dev             # Start with development configuration"
    echo "  $0 --build           # Force rebuild and start"
    echo "  $0 --no-cache --build # Clear cache, rebuild, and start"
}

# Main execution function
main() {
    local force_build=false
    local clear_docker_cache=false
    local use_dev=false
    local verbose=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                set -x
                shift
                ;;
            --dev)
                use_dev=true
                shift
                ;;
            --prod)
                use_dev=false
                shift
                ;;
            --build)
                force_build=true
                shift
                ;;
            --no-cache)
                clear_docker_cache=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Setup signal handlers
    trap cleanup_on_exit EXIT
    trap 'print_error "Script interrupted"; exit 1' INT TERM
    
    # Store PID
    echo $$ > "$PID_FILE"
    
    # Initialize logging
    setup_logging
    
    print_header "Starting RemoteHive Project..."
    
    # Step 1: Check prerequisites
    if ! check_docker; then
        print_error "Prerequisites check failed"
        exit 1
    fi
    
    # Step 2: Stop existing services
    stop_existing_services
    
    # Step 3: Clear cache files
    clear_cache_files
    
    # Step 4: Clear Docker cache if requested
    if [ "$clear_docker_cache" = true ]; then
        print_status "Clearing Docker build cache..."
        docker builder prune -f
    fi
    
    # Step 5: Build Docker images if needed
    if [ "$force_build" = true ] || ! docker images | grep -q "remotehive"; then
        if ! build_docker_images; then
            print_error "Failed to build Docker images"
            exit 1
        fi
    fi
    
    # Step 6: Start Docker services
    if ! start_docker_services; then
        print_error "Failed to start Docker services"
        exit 1
    fi
    
    # Step 7: Wait for services to be ready
    wait_for_services
    
    # Step 8: Show service information
    show_service_info
    
    # Success message
    print_success "🎉 RemoteHive project started successfully!"
    print_success "All services are running and ready to use."
    
    echo -e "\n${GREEN}=== SUCCESS ===${NC}"
    echo -e "${GREEN}✅ All RemoteHive services are now running${NC}"
    echo -e "${GREEN}✅ Admin Panel: http://localhost:3000${NC}"
    echo -e "${GREEN}✅ Public Website: http://localhost:5173${NC}"
    echo -e "${GREEN}✅ Backend API: http://localhost:8000${NC}"
    echo -e "${GREEN}✅ Autoscraper API: http://localhost:8001${NC}"
    
    print_status "Startup completed at $(date)"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi