#!/bin/bash

# RemoteHive VPC Frontend Service Fix Script
# This script will SSH to VPC and fix the frontend services

VPC_HOST="210.79.129.9"
VPC_USER="root"
SSH_KEY="/Users/ranjeettiwary/.ssh/remotehive-vpc-key"

echo "=== RemoteHive VPC Frontend Service Fix ==="
echo "Connecting to VPC: $VPC_USER@$VPC_HOST"
echo

# Create the fix script that will run on VPC
cat > /tmp/vpc_fix_script.sh << 'EOF'
#!/bin/bash

echo "=== VPC Frontend Service Diagnostic and Fix ==="
echo "Current time: $(date)"
echo

# Check current process status
echo "1. Checking current processes..."
ps aux | grep -E '(node|npm|pm2)' | grep -v grep
echo

# Check PM2 status
echo "2. Checking PM2 status..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 status
    echo
    echo "PM2 logs (last 20 lines):"
    pm2 logs --lines 20
else
    echo "PM2 not installed or not in PATH"
fi
echo

# Check port usage
echo "3. Checking port usage..."
netstat -tlnp | grep -E ':(3000|5173|8000|8001)'
echo

# Check if directories exist
echo "4. Checking project directories..."
ls -la /opt/remotehive/ 2>/dev/null || echo "Directory /opt/remotehive/ not found"
ls -la /root/remotehive/ 2>/dev/null || echo "Directory /root/remotehive/ not found"
ls -la ~/RemoteHive* 2>/dev/null || echo "No RemoteHive directories in home"
echo

# Find the actual project directory
echo "5. Finding RemoteHive project directory..."
PROJECT_DIRS=(
    "/opt/remotehive"
    "/root/remotehive"
    "/home/remotehive"
    "$(find /root -name "*remotehive*" -type d 2>/dev/null | head -1)"
    "$(find /opt -name "*remotehive*" -type d 2>/dev/null | head -1)"
)

PROJECT_DIR=""
for dir in "${PROJECT_DIRS[@]}"; do
    if [[ -n "$dir" && -d "$dir" ]]; then
        if [[ -f "$dir/package.json" || -f "$dir/remotehive-admin/package.json" ]]; then
            PROJECT_DIR="$dir"
            echo "Found project directory: $PROJECT_DIR"
            break
        fi
    fi
done

if [[ -z "$PROJECT_DIR" ]]; then
    echo "ERROR: Could not find RemoteHive project directory"
    echo "Searching for any package.json files..."
    find /root /opt -name "package.json" 2>/dev/null | head -10
    exit 1
fi

echo "Using project directory: $PROJECT_DIR"
echo

# Check Node.js and npm versions
echo "6. Checking Node.js and npm versions..."
node --version 2>/dev/null || echo "Node.js not found"
npm --version 2>/dev/null || echo "npm not found"
echo

# Kill any existing processes on ports 3000 and 5173
echo "7. Killing existing processes on frontend ports..."
fuser -k 3000/tcp 2>/dev/null || echo "No process on port 3000"
fuser -k 5173/tcp 2>/dev/null || echo "No process on port 5173"
echo

# Stop PM2 processes
echo "8. Stopping PM2 processes..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 stop all 2>/dev/null || echo "No PM2 processes to stop"
    pm2 delete all 2>/dev/null || echo "No PM2 processes to delete"
fi
echo

# Install/update npm dependencies for admin panel
echo "9. Installing npm dependencies for admin panel..."
ADMIN_DIR="$PROJECT_DIR/remotehive-admin"
if [[ -d "$ADMIN_DIR" ]]; then
    cd "$ADMIN_DIR"
    echo "Working in: $(pwd)"
    
    # Clear npm cache and node_modules
    rm -rf node_modules package-lock.json 2>/dev/null
    npm cache clean --force 2>/dev/null
    
    # Install dependencies with timeout and retry
    echo "Installing admin panel dependencies..."
    timeout 300 npm install --no-audit --no-fund --prefer-offline || {
        echo "npm install failed, trying with different registry..."
        timeout 300 npm install --registry https://registry.npmjs.org/ --no-audit --no-fund
    }
    
    if [[ $? -eq 0 ]]; then
        echo "✓ Admin panel dependencies installed successfully"
    else
        echo "✗ Failed to install admin panel dependencies"
    fi
else
    echo "Admin panel directory not found: $ADMIN_DIR"
fi
echo

# Install/update npm dependencies for public website
echo "10. Installing npm dependencies for public website..."
PUBLIC_DIR="$PROJECT_DIR/remotehive-public"
if [[ -d "$PUBLIC_DIR" ]]; then
    cd "$PUBLIC_DIR"
    echo "Working in: $(pwd)"
    
    # Clear npm cache and node_modules
    rm -rf node_modules package-lock.json 2>/dev/null
    npm cache clean --force 2>/dev/null
    
    # Install dependencies with timeout and retry
    echo "Installing public website dependencies..."
    timeout 300 npm install --no-audit --no-fund --prefer-offline || {
        echo "npm install failed, trying with different registry..."
        timeout 300 npm install --registry https://registry.npmjs.org/ --no-audit --no-fund
    }
    
    if [[ $? -eq 0 ]]; then
        echo "✓ Public website dependencies installed successfully"
    else
        echo "✗ Failed to install public website dependencies"
    fi
else
    echo "Public website directory not found: $PUBLIC_DIR"
fi
echo

# Start admin panel
echo "11. Starting admin panel..."
if [[ -d "$ADMIN_DIR" ]]; then
    cd "$ADMIN_DIR"
    echo "Starting admin panel in background..."
    nohup npm run dev > /tmp/admin-panel.log 2>&1 &
    ADMIN_PID=$!
    echo "Admin panel started with PID: $ADMIN_PID"
    sleep 5
    
    # Check if it's running
    if kill -0 $ADMIN_PID 2>/dev/null; then
        echo "✓ Admin panel is running"
    else
        echo "✗ Admin panel failed to start"
        echo "Last 10 lines of log:"
        tail -10 /tmp/admin-panel.log 2>/dev/null
    fi
fi
echo

# Start public website
echo "12. Starting public website..."
if [[ -d "$PUBLIC_DIR" ]]; then
    cd "$PUBLIC_DIR"
    echo "Starting public website in background..."
    nohup npm run dev > /tmp/public-website.log 2>&1 &
    PUBLIC_PID=$!
    echo "Public website started with PID: $PUBLIC_PID"
    sleep 5
    
    # Check if it's running
    if kill -0 $PUBLIC_PID 2>/dev/null; then
        echo "✓ Public website is running"
    else
        echo "✗ Public website failed to start"
        echo "Last 10 lines of log:"
        tail -10 /tmp/public-website.log 2>/dev/null
    fi
fi
echo

# Final status check
echo "13. Final status check..."
echo "Processes on frontend ports:"
netstat -tlnp | grep -E ':(3000|5173)'
echo

echo "All running node processes:"
ps aux | grep node | grep -v grep
echo

echo "=== VPC Frontend Service Fix Complete ==="
echo "Check the services at:"
echo "- Admin Panel: http://210.79.129.9:3000"
echo "- Public Website: http://210.79.129.9:5173"
echo
echo "Log files:"
echo "- Admin Panel: /tmp/admin-panel.log"
echo "- Public Website: /tmp/public-website.log"
EOF

# Make the script executable
chmod +x /tmp/vpc_fix_script.sh

# Copy and execute the script on VPC
echo "Copying fix script to VPC..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no /tmp/vpc_fix_script.sh "$VPC_USER@$VPC_HOST:/tmp/"

if [[ $? -eq 0 ]]; then
    echo "✓ Script copied successfully"
    echo "Executing fix script on VPC..."
    echo
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VPC_USER@$VPC_HOST" "chmod +x /tmp/vpc_fix_script.sh && /tmp/vpc_fix_script.sh"
    
    if [[ $? -eq 0 ]]; then
        echo
        echo "=== Fix script completed ==="
        echo "Testing VPC services..."
        echo
        
        # Test the services
        echo "Testing Backend API..."
        curl -s -o /dev/null -w "Status: %{http_code}\n" "http://$VPC_HOST:8000/health" || echo "Backend API not responding"
        
        echo "Testing Autoscraper..."
        curl -s -o /dev/null -w "Status: %{http_code}\n" "http://$VPC_HOST:8001/health" || echo "Autoscraper not responding"
        
        echo "Testing Admin Panel..."
        curl -s -o /dev/null -w "Status: %{http_code}\n" "http://$VPC_HOST:3000" || echo "Admin Panel not responding"
        
        echo "Testing Public Website..."
        curl -s -o /dev/null -w "Status: %{http_code}\n" "http://$VPC_HOST:5173" || echo "Public Website not responding"
        
        echo
        echo "🎉 VPC frontend service fix completed!"
        echo "Services should now be accessible at:"
        echo "- Backend API: http://$VPC_HOST:8000"
        echo "- Autoscraper: http://$VPC_HOST:8001"
        echo "- Admin Panel: http://$VPC_HOST:3000"
        echo "- Public Website: http://$VPC_HOST:5173"
    else
        echo "✗ Fix script execution failed"
        exit 1
    fi
else
    echo "✗ Failed to copy script to VPC"
    exit 1
fi

# Cleanup
rm -f /tmp/vpc_fix_script.sh

echo
echo "=== VPC Frontend Service Fix Complete ==="