# GitHub Secrets Configuration Guide

This guide explains how to configure GitHub repository secrets for automated deployment to your VPC server.

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### 1. VPC Server Access Secrets

#### `VPC_HOST`
- **Description**: IP address or hostname of your VPC server
- **Example**: `192.168.1.100` or `your-server.example.com`
- **How to get**: This is your VPC server's public IP address

#### `VPC_USER`
- **Description**: Username for SSH access to VPC server
- **Example**: `ubuntu` (for Ubuntu servers) or `ec2-user` (for Amazon Linux)
- **Default**: `ubuntu`

#### `VPC_SSH_KEY`
- **Description**: Private SSH key for accessing VPC server
- **How to get**: Copy the content of `~/.ssh/remotehive-vpc-key` (the private key)
- **Format**: Complete private key including headers
```
-----BEGIN OPENSSH PRIVATE KEY-----
[key content]
-----END OPENSSH PRIVATE KEY-----
```

#### `VPC_SSH_PORT`
- **Description**: SSH port on VPC server
- **Default**: `22`
- **Example**: `22` or `2222` if using custom port

### 2. Database Connection Secrets

#### `MONGODB_URL`
- **Description**: MongoDB Atlas connection string
- **Format**: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
- **Example**: `mongodb+srv://remotehive:password123@cluster0.abc123.mongodb.net/remotehive?retryWrites=true&w=majority`

#### `REDIS_URL`
- **Description**: Redis connection URL
- **Format**: `redis://[username:password@]host:port[/database]`
- **Example**: `redis://localhost:6379` or `redis://user:pass@redis-server:6379/0`

### 3. Application Secrets

#### `JWT_SECRET_KEY`
- **Description**: Secret key for JWT token signing
- **Format**: Random string (minimum 32 characters)
- **Example**: `your-super-secret-jwt-key-here-make-it-long-and-random`
- **Generate**: `openssl rand -hex 32`

#### `SMTP_USERNAME`
- **Description**: Email username for sending notifications
- **Example**: `noreply@remotehive.com`

#### `SMTP_PASSWORD`
- **Description**: Email password or app-specific password
- **Example**: `your-email-password-or-app-password`

#### `SMTP_SERVER`
- **Description**: SMTP server hostname
- **Example**: `smtp.gmail.com` or `smtp.sendgrid.net`

#### `SMTP_PORT`
- **Description**: SMTP server port
- **Example**: `587` (TLS) or `465` (SSL)

### 4. External API Keys (Optional)

#### `CLERK_SECRET_KEY`
- **Description**: Clerk authentication service secret key
- **Required**: Only if using Clerk for authentication

#### `SUPABASE_URL`
- **Description**: Supabase project URL
- **Required**: Only if using Supabase services

#### `SUPABASE_ANON_KEY`
- **Description**: Supabase anonymous key
- **Required**: Only if using Supabase services

## How to Add Secrets to GitHub Repository

### Step 1: Navigate to Repository Settings
1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables**
4. Click **Actions**

### Step 2: Add Repository Secrets
1. Click **New repository secret**
2. Enter the secret name (e.g., `VPC_HOST`)
3. Enter the secret value
4. Click **Add secret**
5. Repeat for all required secrets

### Step 3: Verify Secrets
After adding all secrets, you should see them listed in the repository secrets section. The values will be hidden for security.

## Getting Your SSH Private Key

To get the content of your SSH private key:

```bash
# Display the private key content
cat ~/.ssh/remotehive-vpc-key

# Copy to clipboard (macOS)
cat ~/.ssh/remotehive-vpc-key | pbcopy

# Copy to clipboard (Linux)
cat ~/.ssh/remotehive-vpc-key | xclip -selection clipboard
```

**Important**: Copy the entire key including the header and footer lines.

## Environment Variables on VPC Server

The deployment script will create a `.env` file on your VPC server with these variables:

```bash
# Database
MONGODB_URL=mongodb+srv://...
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password

# External APIs (if used)
CLERK_SECRET_KEY=your-clerk-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key

# Application
ENVIRONMENT=production
DEBUG=false
```

## Security Best Practices

### 1. SSH Key Security
- Never share your private SSH key
- Use strong passphrases for SSH keys
- Regularly rotate SSH keys
- Limit SSH key access to specific IP addresses if possible

### 2. Database Security
- Use strong, unique passwords for database connections
- Enable database authentication and authorization
- Restrict database access to specific IP addresses
- Regularly update database credentials

### 3. Application Secrets
- Use long, random strings for JWT secrets
- Regularly rotate API keys and secrets
- Use environment-specific secrets (dev, staging, prod)
- Never commit secrets to version control

### 4. GitHub Secrets Management
- Only add secrets that are actually needed
- Use descriptive names for secrets
- Regularly audit and clean up unused secrets
- Use organization-level secrets for shared resources

## Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
- **Cause**: Incorrect SSH key or host information
- **Solution**: Verify `VPC_HOST`, `VPC_USER`, and `VPC_SSH_KEY` secrets
- **Test**: Run the test connection workflow

#### 2. Database Connection Failed
- **Cause**: Incorrect MongoDB URL or credentials
- **Solution**: Verify `MONGODB_URL` secret format and credentials
- **Test**: Check MongoDB Atlas network access settings

#### 3. Authentication Errors
- **Cause**: Missing or incorrect JWT secret
- **Solution**: Verify `JWT_SECRET_KEY` is set and matches across services
- **Test**: Check application logs for JWT-related errors

#### 4. Email Sending Failed
- **Cause**: Incorrect SMTP configuration
- **Solution**: Verify SMTP secrets and enable "Less secure app access" if using Gmail
- **Test**: Send a test email from the application

### Debugging Steps

1. **Check GitHub Actions Logs**:
   - Go to Actions tab in your repository
   - Click on the failed workflow run
   - Review the logs for error messages

2. **Verify Secret Values**:
   - Ensure all required secrets are added
   - Check for typos in secret names
   - Verify secret values are correct (especially for multiline secrets like SSH keys)

3. **Test Individual Components**:
   - Use the test connection workflow to verify SSH access
   - Test database connections separately
   - Verify application startup with current configuration

## Next Steps

After configuring all secrets:

1. **Run Test Workflow**: Execute `.github/workflows/test-connection.yml`
2. **Deploy Application**: Push code to trigger deployment workflow
3. **Monitor Deployment**: Check GitHub Actions logs and server status
4. **Verify Services**: Test all application endpoints and functionality

For detailed deployment instructions, see the [GitHub VPC Deployment Guide](./github-vpc-deployment-guide.md).