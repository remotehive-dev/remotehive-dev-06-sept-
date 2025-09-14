# RemoteHive GitHub to VPC Deployment Guide

This guide provides complete instructions for setting up automated deployment from GitHub to your VPC server without Docker or Kubernetes.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [VPC Server Setup](#vpc-server-setup)
4. [GitHub Repository Setup](#github-repository-setup)
5. [GitHub Secrets Configuration](#github-secrets-configuration)
6. [Testing the Connection](#testing-the-connection)
7. [Deployment Workflows](#deployment-workflows)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

## Overview

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Developer     │    │     GitHub       │    │    VPC Server       │
│                 │    │                  │    │                     │
│ 1. Push Code    │───▶│ 2. GitHub Actions│───▶│ 3. Deploy Services  │
│                 │    │    Workflows     │    │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                                │                     │
                                                │ ┌─────────────────┐ │
                                                │ │ Nginx (Port 80) │ │
                                                │ └─────────────────┘ │
                                                │ ┌─────────────────┐ │
                                                │ │ Backend API     │ │
                                                │ │ (Port 8000)     │ │
                                                │ └─────────────────┘ │
                                                │ ┌─────────────────┐ │
                                                │ │ Admin Panel     │ │
                                                │ │ (Port 3000)     │ │
                                                │ └─────────────────┘ │
                                                │ ┌─────────────────┐ │
                                                │ │ Public Website  │ │
                                                │ │ (Port 5173)     │ │
                                                │ └─────────────────┘ │
                                                │ ┌─────────────────┐ │
                                                │ │ Autoscraper     │ │
                                                │ │ (Port 8001)     │ │
                                                │ └─────────────────┘ │
                                                └─────────────────────┘
```

### Services Deployed

- **Backend API** (FastAPI + MongoDB) - Port 8000
- **Autoscraper Service** (FastAPI + SQLite) - Port 8001
- **Admin Panel** (Next.js) - Port 3000
- **Public Website** (React + Vite) - Port 5173
- **Background Services** (Celery + Redis)
- **Reverse Proxy** (Nginx) - Port 80/443

## Prerequisites

### Local Development Environment

- Git repository initialized
- SSH key pair generated for VPC access
- GitHub repository created

### VPC Server Requirements

- Ubuntu 20.04+ or similar Linux distribution
- Minimum 2GB RAM, 20GB storage
- Root or sudo access
- Public IP address
- Ports 22, 80, 443 accessible

## VPC Server Setup

### Step 1: Run the Server Setup Script

1. **Transfer the setup script to your VPC server:**
   ```bash
   scp scripts/setup-vpc-server.sh ubuntu@YOUR_VPC_IP:/tmp/
   ```

2. **Connect to your VPC server:**
   ```bash
   ssh ubuntu@YOUR_VPC_IP
   ```

3. **Run the setup script:**
   ```bash
   sudo chmod +x /tmp/setup-vpc-server.sh
   sudo /tmp/setup-vpc-server.sh
   ```

### Step 2: Verify Installation

After the setup script completes, verify the installation:

```bash
# Check system status
remotehive-monitor

# Check individual services
sudo systemctl status nginx
sudo systemctl status mongod
sudo systemctl status redis-server

# Check ports
sudo netstat -tlnp | grep -E ':(80|443|3000|5173|8000|8001|6379|27017)'
```

### Step 3: Configure SSH Access

1. **Add your deployment SSH key to the server:**
   ```bash
   # On your local machine
   cat ~/.ssh/remotehive-vpc-key.pub
   
   # On the VPC server
   echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

2. **Test SSH connection:**
   ```bash
   ssh -i ~/.ssh/remotehive-vpc-key ubuntu@YOUR_VPC_IP
   ```

## GitHub Repository Setup

### Step 1: Create GitHub Repository

1. Create a new repository on GitHub named `RemoteHive`
2. Push your local code to the repository:

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/RemoteHive.git

# Push code
git push -u origin main
```

### Step 2: Enable GitHub Actions

1. Go to your repository on GitHub
2. Click on the "Actions" tab
3. GitHub Actions should be automatically enabled
4. The workflows in `.github/workflows/` will be available

## GitHub Secrets Configuration

### Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

#### Server Connection
- `VPC_HOST`: Your VPC server IP address
- `VPC_USER`: SSH username (usually `ubuntu`)
- `VPC_SSH_PRIVATE_KEY`: Content of your private SSH key (`~/.ssh/remotehive-vpc-key`)

#### Database Configuration
- `MONGODB_URL`: MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/remotehive`)

#### Authentication
- `JWT_SECRET_KEY`: Secret key for JWT tokens (generate a secure random string)
- `CLERK_SECRET_KEY`: Clerk authentication secret key (if using Clerk)

#### External Services
- `SUPABASE_URL`: Supabase project URL (if using Supabase)
- `SUPABASE_ANON_KEY`: Supabase anonymous key (if using Supabase)

#### Email Configuration
- `SMTP_SERVER`: SMTP server (e.g., `smtp.gmail.com`)
- `SMTP_PORT`: SMTP port (e.g., `587`)
- `SMTP_USERNAME`: Email username
- `SMTP_PASSWORD`: Email password or app password

### Example Secret Values

```bash
# VPC_HOST
203.0.113.1

# VPC_USER
ubuntu

# VPC_SSH_PRIVATE_KEY
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn
...
-----END OPENSSH PRIVATE KEY-----

# MONGODB_URL
mongodb+srv://remotehive:password123@cluster0.mongodb.net/remotehive?retryWrites=true&w=majority

# JWT_SECRET_KEY
your-super-secret-jwt-key-here-make-it-long-and-random
```

## Testing the Connection

### Step 1: Manual Connection Test

1. **Test SSH connection from your local machine:**
   ```bash
   ssh -i ~/.ssh/remotehive-vpc-key ubuntu@YOUR_VPC_IP 'echo "Connection successful!"'
   ```

2. **Test from GitHub Actions:**
   - Go to your repository on GitHub
   - Click "Actions" tab
   - Click "Test GitHub to VPC Connection"
   - Click "Run workflow"
   - Select "connection" as test type
   - Click "Run workflow"

### Step 2: Deployment Test

1. **Run deployment dry run:**
   - Go to Actions → "Test GitHub to VPC Connection"
   - Run workflow with "deployment" test type

2. **Run full pipeline test:**
   - Go to Actions → "Test GitHub to VPC Connection"
   - Run workflow with "full-pipeline" test type

### Step 3: Verify Test Results

After running tests, check:

1. **GitHub Actions logs** for detailed execution information
2. **Test report artifact** downloaded from the workflow
3. **VPC server status** using `remotehive-monitor`

## Deployment Workflows

### Available Workflows

1. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every push and pull request
   - Linting, testing, security scanning
   - Build verification

2. **Production Deployment** (`.github/workflows/deploy-to-vpc.yml`)
   - Deploys to production on push to `main` branch
   - Includes health checks and rollback capability

3. **Manual Deployment** (`.github/workflows/manual-deploy.yml`)
   - Manual deployment with environment selection
   - Supports deploy, rollback, restart, health check operations

4. **Connection Testing** (`.github/workflows/test-connection.yml`)
   - Tests SSH connection and deployment pipeline
   - Generates detailed test reports

### Deployment Process

1. **Code Push** → GitHub repository
2. **GitHub Actions** triggered automatically
3. **Build & Test** applications
4. **Deploy** to VPC server via SSH
5. **Health Check** verify deployment
6. **Notification** send status updates

### Manual Deployment

For manual deployments:

1. Go to Actions → "Manual Deploy to VPC"
2. Click "Run workflow"
3. Select:
   - **Environment**: production/staging
   - **Action**: deploy/rollback/restart/health-check/logs
   - **Branch**: branch to deploy
   - **Service**: specific service or all
4. Click "Run workflow"

## Monitoring and Maintenance

### System Monitoring

1. **System Status:**
   ```bash
   remotehive-monitor
   ```

2. **Service Logs:**
   ```bash
   # Backend API logs
   sudo journalctl -u remotehive-backend -f
   
   # Autoscraper logs
   sudo journalctl -u remotehive-autoscraper -f
   
   # PM2 logs
   pm2 logs
   
   # Nginx logs
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Database Status:**
   ```bash
   # MongoDB status
   sudo systemctl status mongod
   
   # Redis status
   sudo systemctl status redis-server
   redis-cli ping
   ```

### Automated Backups

Backups are automatically created daily at 2 AM:

```bash
# Manual backup
remotehive-backup

# List backups
ls -la /home/ubuntu/backups/

# Restore from backup
# (Follow restore procedures in backup script)
```

### Health Checks

1. **Application Health:**
   ```bash
   curl http://YOUR_VPC_IP/health
   curl http://YOUR_VPC_IP/api/health
   curl http://YOUR_VPC_IP/autoscraper/health
   ```

2. **Service Status:**
   ```bash
   pm2 status
   sudo systemctl status nginx
   ```

### SSL Certificate Setup

1. **Install SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

2. **Auto-renewal:**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Troubleshooting

### Common Issues

#### 1. SSH Connection Failed

**Symptoms:**
- GitHub Actions can't connect to VPC
- "Permission denied" errors

**Solutions:**
```bash
# Check SSH key format
cat ~/.ssh/remotehive-vpc-key
# Should start with -----BEGIN OPENSSH PRIVATE KEY-----

# Verify key permissions
chmod 600 ~/.ssh/remotehive-vpc-key

# Test connection manually
ssh -i ~/.ssh/remotehive-vpc-key -v ubuntu@YOUR_VPC_IP

# Check server SSH configuration
sudo nano /etc/ssh/sshd_config
# Ensure: PubkeyAuthentication yes
sudo systemctl restart sshd
```

#### 2. Deployment Script Fails

**Symptoms:**
- Deployment workflow fails
- Services don't start

**Solutions:**
```bash
# Check script permissions
ls -la scripts/deploy.sh
chmod +x scripts/deploy.sh

# Test script syntax
bash -n scripts/deploy.sh

# Run script manually
ssh ubuntu@YOUR_VPC_IP
./RemoteHive/scripts/deploy.sh
```

#### 3. Services Not Starting

**Symptoms:**
- Applications not accessible
- Port connection refused

**Solutions:**
```bash
# Check service status
remotehive-monitor

# Check logs
sudo journalctl -u remotehive-backend -n 50
pm2 logs

# Restart services
sudo systemctl restart remotehive-backend
pm2 restart all

# Check ports
sudo netstat -tlnp | grep -E ':(3000|5173|8000|8001)'
```

#### 4. Database Connection Issues

**Symptoms:**
- "Database connection failed" errors
- Authentication errors

**Solutions:**
```bash
# Test MongoDB connection
python3 -c "
import pymongo
client = pymongo.MongoClient('YOUR_MONGODB_URL')
print(client.server_info())
"

# Check environment variables
cat /home/ubuntu/RemoteHive/.env

# Verify MongoDB Atlas IP whitelist
# Add VPC server IP to MongoDB Atlas network access
```

#### 5. Build Failures

**Symptoms:**
- GitHub Actions build fails
- "Module not found" errors

**Solutions:**
```bash
# Check Node.js version
node --version
npm --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Python dependencies
pip install -r requirements.txt
```

### Debug Commands

```bash
# System information
uname -a
lsb_release -a
df -h
free -h

# Network connectivity
ping google.com
curl -I http://localhost:8000/health

# Process information
ps aux | grep python
ps aux | grep node
ps aux | grep nginx

# Log files
sudo tail -f /var/log/syslog
sudo tail -f /var/log/nginx/error.log
sudo journalctl -f
```

### Getting Help

1. **Check GitHub Actions logs** for detailed error messages
2. **Review VPC server logs** using the commands above
3. **Run system monitor** with `remotehive-monitor`
4. **Test individual components** using health check endpoints
5. **Verify configuration** files and environment variables

## Security Best Practices

### Server Security

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Monitor failed login attempts:**
   ```bash
   sudo tail -f /var/log/auth.log
   ```

### Application Security

1. **Use strong JWT secrets**
2. **Enable HTTPS with SSL certificates**
3. **Regularly rotate API keys**
4. **Monitor application logs for suspicious activity**
5. **Keep dependencies updated**

### GitHub Security

1. **Use repository secrets** for sensitive data
2. **Limit workflow permissions**
3. **Enable branch protection rules**
4. **Review workflow runs regularly**

## Performance Optimization

### Server Optimization

1. **Monitor resource usage:**
   ```bash
   htop
   iotop
   ```

2. **Optimize database queries**
3. **Enable caching with Redis**
4. **Configure Nginx caching**
5. **Use PM2 cluster mode for Node.js apps**

### Application Optimization

1. **Enable gzip compression**
2. **Optimize static asset delivery**
3. **Use CDN for static files**
4. **Implement database indexing**
5. **Monitor application performance**

---

## Conclusion

This guide provides a complete setup for deploying RemoteHive from GitHub to your VPC server. The automated deployment pipeline ensures consistent, reliable deployments while maintaining security and performance.

For additional support or questions, refer to the troubleshooting section or check the GitHub Actions logs for detailed error information.