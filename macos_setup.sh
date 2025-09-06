#!/bin/bash

# RemoteHive macOS Setup Script
# This script automates the complete installation and setup for macOS migration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
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

print_header() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS only."
    exit 1
fi

print_header "RemoteHive macOS Migration Setup"
print_status "Starting automated setup process..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Homebrew
install_homebrew() {
    if ! command_exists brew; then
        print_status "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for Apple Silicon Macs
        if [[ $(uname -m) == 'arm64' ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
            eval "$(/opt/homebrew/bin/brew shellenv)"
        else
            echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zshrc
            eval "$(/usr/local/bin/brew shellenv)"
        fi
        print_success "Homebrew installed successfully"
    else
        print_status "Updating Homebrew..."
        brew update
        print_success "Homebrew updated"
    fi
}

# Function to install system dependencies
install_system_dependencies() {
    print_header "Installing System Dependencies"
    
    local brew_packages=(
        "git"
        "curl"
        "wget"
        "python@3.11"
        "node@18"
        "redis"
        "postgresql@15"
        "sqlite3"
        "tree"
        "htop"
        "jq"
        "pyenv"
    )

    for package in "${brew_packages[@]}"; do
        if brew list "$package" &>/dev/null; then
            print_status "✓ $package is already installed"
        else
            print_status "Installing $package..."
            brew install "$package"
            print_success "✓ $package installed"
        fi
    done
    
    # Link Python 3.11 if needed
    if ! command_exists python3.11; then
        brew link python@3.11
    fi
    
    print_success "All system dependencies installed"
}

# Function to setup services
setup_services() {
    print_header "Setting Up Services"
    
    # Start Redis
    if brew services list | grep redis | grep -q started; then
        print_status "✓ Redis is already running"
    else
        print_status "Starting Redis service..."
        brew services start redis
        sleep 2
        if brew services list | grep redis | grep -q started; then
            print_success "✓ Redis started successfully"
        else
            print_error "Failed to start Redis"
        fi
    fi
    
    # Start PostgreSQL
    if brew services list | grep postgresql@15 | grep -q started; then
        print_status "✓ PostgreSQL is already running"
    else
        print_status "Starting PostgreSQL service..."
        brew services start postgresql@15
        sleep 3
        if brew services list | grep postgresql@15 | grep -q started; then
            print_success "✓ PostgreSQL started successfully"
        else
            print_error "Failed to start PostgreSQL"
        fi
    fi
}

# Function to setup Python environment
setup_python_environment() {
    print_header "Setting Up Python Environment"
    
    # Ensure pip is up to date
    print_status "Updating pip..."
    python3.11 -m pip install --upgrade pip
    
    # Install essential Python packages
    local python_packages=(
        "virtualenv"
        "wheel"
        "setuptools"
    )
    
    for package in "${python_packages[@]}"; do
        if ! python3.11 -m pip show "$package" &> /dev/null; then
            print_status "Installing $package..."
            python3.11 -m pip install "$package"
            print_success "✓ $package installed"
        else
            print_status "✓ $package is already installed"
        fi
    done
    
    print_success "Python environment ready"
}

# Function to setup project directory
setup_project_directory() {
    print_header "Setting Up Project Directory"
    
    PROJECT_DIR="$HOME/RemoteHive"
    print_status "Project directory: $PROJECT_DIR"
    
    if [ ! -d "$PROJECT_DIR" ]; then
        mkdir -p "$PROJECT_DIR"
        print_success "✓ Created project directory"
    else
        print_warning "Project directory already exists"
    fi
    
    cd "$PROJECT_DIR"
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3.11 -m venv venv
        print_success "✓ Virtual environment created"
    else
        print_warning "Virtual environment already exists"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip in virtual environment
    pip install --upgrade pip
    
    print_success "Project directory setup complete"
}

# Function to install Python dependencies
install_python_dependencies() {
    print_header "Installing Python Dependencies"
    
    cd "$PROJECT_DIR"
    source venv/bin/activate
    
    # Install main dependencies
    if [ -f "requirements.txt" ]; then
        print_status "Installing main Python dependencies..."
        pip install -r requirements.txt
        print_success "✓ Main dependencies installed"
    else
        print_warning "requirements.txt not found - will install after file transfer"
        # Install essential packages for now
        pip install fastapi uvicorn sqlalchemy redis celery python-dotenv
    fi
    

    
    # Install database migration dependencies
    if [ -f "database_migration/requirements.txt" ]; then
        print_status "Installing database migration dependencies..."
        pip install -r database_migration/requirements.txt
        print_success "✓ Database migration dependencies installed"
    fi
}

# Function to setup Node.js and frontend dependencies
setup_frontend_dependencies() {
    print_header "Setting Up Frontend Dependencies"
    
    cd "$PROJECT_DIR"
    
    # Setup Node.js version
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_status "Node.js version: $NODE_VERSION"
    fi
    
    # Admin frontend
    if [ -d "remotehive-admin" ]; then
        cd remotehive-admin
        if [ -f "package.json" ]; then
            print_status "Installing admin frontend dependencies..."
            npm install
            print_success "✓ Admin frontend dependencies installed"
        fi
        cd ..
    else
        print_warning "remotehive-admin directory not found"
    fi
    
    # Public frontend
    if [ -d "remotehive-public" ]; then
        cd remotehive-public
        if [ -f "package.json" ]; then
            print_status "Installing public frontend dependencies..."
            npm install
            print_success "✓ Public frontend dependencies installed"
        fi
        cd ..
    else
        print_warning "remotehive-public directory not found"
    fi
    
    # Root frontend (if exists)
    if [ -f "package.json" ]; then
        print_status "Installing root frontend dependencies..."
        npm install
        print_success "✓ Root frontend dependencies installed"
    fi
}

# Function to setup environment files
setup_environment_files() {
    print_header "Setting Up Environment Files"
    
    cd "$PROJECT_DIR"
    
    # Main .env file
    if [ -f ".env.example" ]; then
        if [ ! -f ".env" ]; then
            cp .env.example .env
            print_success "✓ Created .env from .env.example"
        else
            print_warning ".env already exists"
        fi
    fi
    

    
    # Admin frontend .env.local
    if [ -d "remotehive-admin" ] && [ ! -f "remotehive-admin/.env.local" ]; then
        cat > remotehive-admin/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF
        print_success "✓ Created remotehive-admin/.env.local"
    fi
    
    # Public frontend .env.local
    if [ -d "remotehive-public" ] && [ ! -f "remotehive-public/.env.local" ]; then
        cat > remotehive-public/.env.local << EOF
VITE_API_URL=http://localhost:8001
VITE_FRONTEND_URL=http://localhost:3002
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
EOF
        print_success "✓ Created remotehive-public/.env.local"
    fi
    
    print_success "Environment files setup complete"
}

# Function to create helper scripts
create_helper_scripts() {
    print_header "Creating Helper Scripts"
    
    cd "$PROJECT_DIR"
    
    # Create start script
    cat > start_remotehive.sh << 'EOF'
#!/bin/bash

# RemoteHive Startup Script for macOS

PROJECT_DIR="$HOME/RemoteHive"
cd "$PROJECT_DIR"

# Activate virtual environment
source venv/bin/activate

# Start services if not running
if ! brew services list | grep redis | grep -q started; then
    echo "Starting Redis..."
    brew services start redis
fi

if ! brew services list | grep postgresql@15 | grep -q started; then
    echo "Starting PostgreSQL..."
    brew services start postgresql@15
fi

# Start backend API
echo "Starting RemoteHive API server..."
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
EOF
    
    chmod +x start_remotehive.sh
    print_success "✓ Created start_remotehive.sh"
    
    # Create migration script
    cat > restore_migration.sh << 'EOF'
#!/bin/bash

# RemoteHive Migration Restore Script

PROJECT_DIR="$HOME/RemoteHive"
cd "$PROJECT_DIR"

# Activate virtual environment
source venv/bin/activate

echo "Restoring databases from migration backup..."

if [ -d "migration_backup"* ]; then
    # Find the latest migration backup
    BACKUP_DIR=$(ls -1d migration_backup_* 2>/dev/null | tail -1)
    
    if [ -n "$BACKUP_DIR" ]; then
        echo "Found backup: $BACKUP_DIR"
        
        # Copy database files
        cp "$BACKUP_DIR"/*.db . 2>/dev/null || true
        
        # Copy configuration files
        cp "$BACKUP_DIR"/config/.env . 2>/dev/null || true
        
        echo "Migration restore completed!"
    else
        echo "No migration backup found!"
        exit 1
    fi
else
    echo "Migration backup directory not found!"
    exit 1
fi
EOF
    
    chmod +x restore_migration.sh
    print_success "✓ Created restore_migration.sh"
    
    # Create service status script
    cat > check_services.sh << 'EOF'
#!/bin/bash

# RemoteHive Service Status Checker

echo "=== RemoteHive Service Status ==="
echo

echo "Redis Status:"
brew services list | grep redis
echo

echo "PostgreSQL Status:"
brew services list | grep postgresql
echo

echo "Python Virtual Environment:"
if [ -f "$HOME/RemoteHive/venv/bin/activate" ]; then
    echo "✓ Virtual environment exists"
else
    echo "✗ Virtual environment not found"
fi
echo

echo "Database Files:"
ls -la $HOME/RemoteHive/*.db 2>/dev/null || echo "No database files found"
echo

echo "Environment Files:"
ls -la $HOME/RemoteHive/.env 2>/dev/null || echo "Main .env not found"
EOF
    
    chmod +x check_services.sh
    print_success "✓ Created check_services.sh"
}

# Function to display final instructions
display_final_instructions() {
    print_header "Setup Complete!"
    
    echo -e "${GREEN}🎉 RemoteHive macOS setup completed successfully!${NC}"
    echo
    echo -e "${CYAN}Project Location:${NC} $PROJECT_DIR"
    echo
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Copy your project files from Windows to $PROJECT_DIR"
    echo "2. Copy your migration backup to $PROJECT_DIR/"
    echo "3. Run: ./restore_migration.sh (after copying migration backup)"
    echo "4. Update environment variables in .env files with your actual values"
    echo "5. Run: ./start_remotehive.sh to start the application"
    echo
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo "• Activate Python environment: source $PROJECT_DIR/venv/bin/activate"
    echo "• Check service status: ./check_services.sh"
    echo "• Start Redis: brew services start redis"
    echo "• Start PostgreSQL: brew services start postgresql@15"
    echo "• View service logs: brew services list"
    echo
    echo -e "${YELLOW}Frontend Development:${NC}"
    echo "• Admin frontend: cd remotehive-admin && npm run dev"
    echo "• Public frontend: cd remotehive-public && npm run dev"
    echo
    echo -e "${GREEN}Setup script completed successfully! 🚀${NC}"
}

# Main execution
main() {
    install_homebrew
    install_system_dependencies
    setup_services
    setup_python_environment
    setup_project_directory
    install_python_dependencies
    setup_frontend_dependencies
    setup_environment_files
    create_helper_scripts
    display_final_instructions
}

# Run main function
main