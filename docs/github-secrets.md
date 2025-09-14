# GitHub Secrets Configuration for RemoteHive CI/CD

This document outlines all the GitHub secrets that need to be configured for the RemoteHive CI/CD pipeline to work properly.

## Required Secrets

### 🔐 Server Access Secrets

#### `VPC_HOST`
- **Description**: The IP address or hostname of your VPC server
- **Example**: `210.79.129.9`
- **Required for**: All deployment workflows

#### `VPC_USERNAME`
- **Description**: Username for SSH access to the VPC server
- **Example**: `ubuntu` or `remotehive`
- **Required for**: All deployment workflows

#### `VPC_SSH_KEY`
- **Description**: Private SSH key for accessing the VPC server
- **Format**: Complete private key including headers
- **Example**:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAFwAAAAdzc2gtcn
...
-----END OPENSSH PRIVATE KEY-----
```
- **Required for**: All deployment workflows

### 🗄️ Database Secrets

#### `MONGODB_URL`
- **Description**: Complete MongoDB Atlas connection string
- **Example**: `mongodb+srv://username:password@cluster.mongodb.net/remotehive?retryWrites=true&w=majority`
- **Required for**: Production and staging deployments

#### `DB_PASSWORD`
- **Description**: Database password for the RemoteHive user
- **Required for**: All environments

### 🔑 Application Secrets

#### `JWT_SECRET_KEY`
- **Description**: Secret key for JWT token generation
- **Requirements**: Should be a long, random string (at least 32 characters)
- **Example**: `your-super-secret-jwt-key-change-this-in-production-12345`
- **Required for**: All environments

#### `SESSION_SECRET_KEY`
- **Description**: Secret key for session management
- **Requirements**: Should be a long, random string (at least 32 characters)
- **Required for**: All environments

### 📧 Email Configuration

#### `SMTP_HOST`
- **Description**: SMTP server hostname
- **Example**: `smtp.gmail.com`
- **Required for**: Production deployment

#### `SMTP_USER`
- **Description**: SMTP username/email
- **Example**: `noreply@remotehive.com`
- **Required for**: Production deployment

#### `SMTP_PASSWORD`
- **Description**: SMTP password or app password
- **Required for**: Production deployment

### ☁️ Cloud Services (Optional)

#### `AWS_ACCESS_KEY_ID`
- **Description**: AWS access key for S3 storage (if using AWS)
- **Required for**: AWS integrations only

#### `AWS_SECRET_ACCESS_KEY`
- **Description**: AWS secret access key
- **Required for**: AWS integrations only

#### `AWS_S3_BUCKET`
- **Description**: S3 bucket name for file storage
- **Required for**: AWS integrations only

### 🔍 Monitoring & Analytics

#### `SENTRY_DSN`
- **Description**: Sentry DSN for error tracking
- **Example**: `https://your-dsn@sentry.io/project-id`
- **Required for**: Production monitoring

#### `GOOGLE_ANALYTICS_ID`
- **Description**: Google Analytics measurement ID
- **Example**: `G-XXXXXXXXXX`
- **Required for**: Analytics tracking

### 🔔 Notifications

#### `SLACK_WEBHOOK_URL`
- **Description**: Slack webhook URL for deployment notifications
- **Example**: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`
- **Required for**: Slack notifications

#### `DISCORD_WEBHOOK_URL`
- **Description**: Discord webhook URL for deployment notifications
- **Required for**: Discord notifications

## How to Add Secrets to GitHub

### Method 1: GitHub Web Interface

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the secret name and value
6. Click **Add secret**

### Method 2: GitHub CLI

```bash
# Install GitHub CLI if not already installed
brew install gh  # macOS
# or
sudo apt install gh  # Ubuntu

# Login to GitHub
gh auth login

# Add secrets
gh secret set VPC_HOST --body "210.79.129.9"
gh secret set VPC_USERNAME --body "ubuntu"
gh secret set VPC_SSH_KEY --body-file ~/.ssh/remotehive-vpc-key
gh secret set DATABASE_URL --body "postgresql://username:password@localhost:5432/remotehive_prod"
gh secret set JWT_SECRET_KEY --body "your-super-secret-jwt-key"
gh secret set SESSION_SECRET_KEY --body "your-super-secret-session-key"
```

## Environment-Specific Secrets

### Production Environment
- All secrets listed above are required
- Use production values (secure passwords, production database, etc.)

### Staging Environment
- Same secrets as production but with staging values
- Can use less secure passwords for testing
- Separate database and services

## Security Best Practices

### ✅ Do's
- Use strong, unique passwords for all secrets
- Rotate secrets regularly (at least every 90 days)
- Use different secrets for production and staging
- Store secrets only in GitHub Secrets, never in code
- Use environment-specific secrets when possible
- Regularly audit who has access to secrets

### ❌ Don'ts
- Never commit secrets to the repository
- Don't use the same secret across multiple environments
- Don't share secrets via email or chat
- Don't use weak or predictable passwords
- Don't store secrets in plain text files

## Secret Generation Examples

### Generate Strong Random Secrets

```bash
# Generate a 32-character random string for JWT secret
openssl rand -base64 32

# Generate a 64-character random string for session secret
openssl rand -base64 48

# Generate a UUID for unique identifiers
uuidgen
```

### Database Connection String Format

```
postgresql://[username]:[password]@[host]:[port]/[database]
```

Example:
```
postgresql://remotehive_user:secure_password123@localhost:5432/remotehive_prod
```

## Troubleshooting

### Common Issues

1. **SSH Key Format Issues**
   - Ensure the SSH key includes the full header and footer
   - Make sure there are no extra spaces or line breaks
   - Use OpenSSH format, not PuTTY format

2. **Database Connection Issues**
   - Verify the database URL format
   - Check that the database user has proper permissions
   - Ensure the database server is accessible from the VPC

3. **Secret Not Found Errors**
   - Verify the secret name matches exactly (case-sensitive)
   - Check that the secret is set at the repository level
   - Ensure the workflow has access to the secret

### Testing Secrets

You can test if secrets are properly configured by running the test workflow:

```bash
# Trigger the test workflow manually
gh workflow run test-and-build.yml

# Check the workflow status
gh run list --workflow=test-and-build.yml
```

## Secret Rotation Schedule

| Secret Type | Rotation Frequency | Next Review Date |
|-------------|-------------------|------------------|
| SSH Keys | Every 6 months | [Set date] |
| Database Passwords | Every 3 months | [Set date] |
| JWT/Session Keys | Every 3 months | [Set date] |
| API Keys | Every 6 months | [Set date] |
| SMTP Passwords | Every 6 months | [Set date] |

## Contact Information

For questions about secrets configuration or if you need help setting up the CI/CD pipeline:

- **DevOps Team**: devops@remotehive.com
- **Security Team**: security@remotehive.com
- **Documentation**: [Internal Wiki Link]

---

**⚠️ Important**: Keep this document updated when adding new secrets or changing existing ones. Always follow the principle of least privilege when granting access to secrets.