# GitHub Secrets Setup Guide for RemoteHive CI/CD

This guide will help you set up the required GitHub secrets for automatic deployments to your VPC.

## Required Secrets

Your CI/CD pipeline requires the following secrets to be configured in your GitHub repository:

### 1. VPC_HOST
- **Value**: `210.79.128.138`
- **Description**: The IP address of your VPC instance

### 2. VPC_USER
- **Value**: `ubuntu`
- **Description**: The SSH user for connecting to the VPC

### 3. VPC_SSH_KEY
- **Value**: Contents of `/Users/ranjeettiwary/Downloads/developer/RemoteHive_Migration_Package/remotehive_key_github`
- **Description**: Private SSH key for authenticating with the VPC

### 4. Optional Secrets (for enhanced features)
- **SNYK_TOKEN**: For security vulnerability scanning
- **SLACK_WEBHOOK**: For deployment notifications

## Manual Setup Instructions

### Step 1: Navigate to GitHub Repository Settings
1. Go to your GitHub repository: `https://github.com/remotehive-dev/remotehive-dev-06-sept-`
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Repository Secrets

#### Add VPC_HOST Secret
1. Click **New repository secret**
2. Name: `VPC_HOST`
3. Secret: `210.79.128.138`
4. Click **Add secret**

#### Add VPC_USER Secret
1. Click **New repository secret**
2. Name: `VPC_USER`
3. Secret: `ubuntu`
4. Click **Add secret**

#### Add VPC_SSH_KEY Secret
1. Click **New repository secret**
2. Name: `VPC_SSH_KEY`
3. Secret: Copy the entire contents of the file `remotehive_key_github` (including the BEGIN and END lines)
4. Click **Add secret**

**Important**: Make sure to copy the private key exactly as it appears in the file, including all line breaks and formatting.

### Step 3: Verify Secrets
After adding all secrets, you should see:
- VPC_HOST
- VPC_USER  
- VPC_SSH_KEY

Listed in your repository secrets.

## Automated Setup (Alternative)

If you prefer to use the GitHub CLI:

```bash
# First, authenticate with GitHub
gh auth login --web

# Then run the setup script
./setup_github_secrets.sh
```

## Testing the CI/CD Pipeline

Once secrets are configured:

1. **Automatic Deployment**: Push changes to the `main` branch
2. **Manual Deployment**: Go to Actions tab → Select "Enhanced CI/CD Pipeline" → Click "Run workflow"
3. **Monitor Progress**: Check the Actions tab for deployment status

## Workflow Triggers

Your CI/CD pipeline will trigger on:
- **Push to main branch**: Automatic deployment to staging
- **Pull requests**: Run tests and security scans
- **Manual dispatch**: Deploy to specific environments (development/staging/production)

## Deployment Environments

- **Development**: For testing new features
- **Staging**: For pre-production testing  
- **Production**: For live deployment

## Security Notes

- Never commit private keys to your repository
- Regularly rotate SSH keys and update secrets
- Use environment-specific secrets for different deployment targets
- Monitor deployment logs for any authentication issues

## Troubleshooting

### Common Issues:

1. **SSH Authentication Failed**
   - Verify VPC_SSH_KEY contains the complete private key
   - Ensure the public key is added to the VPC's authorized_keys

2. **Connection Timeout**
   - Check VPC_HOST IP address is correct
   - Verify VPC instance is running and accessible

3. **Permission Denied**
   - Confirm VPC_USER is correct (should be `ubuntu`)
   - Check SSH key permissions on the VPC

### Getting Help

If you encounter issues:
1. Check the Actions tab for detailed error logs
2. Verify all secrets are correctly configured
3. Test SSH connection manually: `ssh -i remotehive_key_github ubuntu@210.79.128.138`

## Next Steps

After setting up secrets:
1. ✅ Test the CI/CD pipeline with a small change
2. ✅ Verify deployment to VPC works correctly
3. ✅ Set up monitoring and alerts
4. ✅ Configure additional environments if needed

Your RemoteHive application will now automatically deploy when you push changes to GitHub!