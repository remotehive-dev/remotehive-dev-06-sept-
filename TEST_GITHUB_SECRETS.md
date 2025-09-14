# Testing GitHub Secrets Configuration for RemoteHive CI/CD

## Quick Test Methods

### Method 1: Manual Verification via GitHub Web Interface

1. **Go to your GitHub repository**:
   - Navigate to: `https://github.com/remotehive-dev/remotehive-dev-06-sept-/settings/secrets/actions`

2. **Check for these 3 required secrets**:
   - ✅ `VPC_HOST` - Should be listed
   - ✅ `VPC_USER` - Should be listed  
   - ✅ `VPC_SSH_KEY` - Should be listed

3. **Verify secret names are exact**:
   - Names are case-sensitive
   - No extra spaces or characters
   - Must match exactly: `VPC_HOST`, `VPC_USER`, `VPC_SSH_KEY`

### Method 2: Test with a Simple Commit

1. **Make a test change**:
   ```bash
   echo "# Test deployment $(date)" >> TEST_DEPLOYMENT.md
   git add TEST_DEPLOYMENT.md
   git commit -m "test: trigger CI/CD pipeline"
   git push origin main
   ```

2. **Monitor the deployment**:
   - Go to: `https://github.com/remotehive-dev/remotehive-dev-06-sept-/actions`
   - Look for the latest workflow run
   - Check if it starts successfully (indicates secrets are configured)

### Method 3: Check Workflow File Compatibility

1. **Verify workflow files use correct secret names**:
   ```bash
   grep -r "secrets\." .github/workflows/
   ```

2. **Expected output should show**:
   - `secrets.VPC_HOST`
   - `secrets.VPC_USER`
   - `secrets.VPC_SSH_KEY`
   - `secrets.GITHUB_TOKEN` (automatically provided by GitHub)

## Test Results Interpretation

### ✅ Success Indicators
- All 3 secrets appear in GitHub repository settings
- GitHub Actions workflow starts when you push to main branch
- No "secret not found" errors in workflow logs
- SSH connection to VPC succeeds in workflow

### ❌ Failure Indicators
- Missing secrets in repository settings
- Workflow fails with "secret not found" error
- SSH authentication failures in deployment logs
- "Permission denied" errors during deployment

## Manual Testing Without GitHub CLI

### Test SSH Connection Locally
```bash
# Test if your SSH key works with the VPC
ssh -i remotehive-vpc-key -o StrictHostKeyChecking=no ubuntu@210.79.128.138 "echo 'SSH connection successful'"
```

### Test VPC Accessibility
```bash
# Test if VPC is reachable
ping -c 3 210.79.128.138
```

### Verify SSH Key Format
```bash
# Check if SSH key file is properly formatted
head -1 remotehive-vpc-key
# Should output: -----BEGIN OPENSSH PRIVATE KEY-----

tail -1 remotehive-vpc-key  
# Should output: -----END OPENSSH PRIVATE KEY-----
```

## GitHub Actions Workflow Test

### Create a Test Workflow (Optional)
Create `.github/workflows/test-secrets.yml`:
```yaml
name: Test Secrets Configuration

on:
  workflow_dispatch:

jobs:
  test-secrets:
    runs-on: ubuntu-latest
    steps:
      - name: Test VPC_HOST
        run: |
          if [ -z "${{ secrets.VPC_HOST }}" ]; then
            echo "❌ VPC_HOST secret not configured"
            exit 1
          else
            echo "✅ VPC_HOST secret configured"
          fi
      
      - name: Test VPC_USER
        run: |
          if [ -z "${{ secrets.VPC_USER }}" ]; then
            echo "❌ VPC_USER secret not configured"
            exit 1
          else
            echo "✅ VPC_USER secret configured"
          fi
      
      - name: Test VPC_SSH_KEY
        run: |
          if [ -z "${{ secrets.VPC_SSH_KEY }}" ]; then
            echo "❌ VPC_SSH_KEY secret not configured"
            exit 1
          else
            echo "✅ VPC_SSH_KEY secret configured"
          fi
      
      - name: Test SSH Connection
        run: |
          echo "${{ secrets.VPC_SSH_KEY }}" > /tmp/ssh_key
          chmod 600 /tmp/ssh_key
          ssh -i /tmp/ssh_key -o StrictHostKeyChecking=no ${{ secrets.VPC_USER }}@${{ secrets.VPC_HOST }} "echo 'SSH connection successful'"
```

## Expected Deployment Flow

Once secrets are properly configured:

1. **Push to main branch** → Triggers GitHub Actions
2. **GitHub Actions** → Uses secrets to connect to VPC
3. **VPC Deployment** → Pulls code and starts services
4. **Services Available**:
   - API: http://210.79.128.138:8000
   - Admin: http://210.79.128.138:3000
   - Public: http://210.79.128.138:5173

## Troubleshooting Common Issues

### Issue: "Secret not found"
**Solution**: Check secret names are exactly `VPC_HOST`, `VPC_USER`, `VPC_SSH_KEY`

### Issue: "Permission denied (publickey)"
**Solution**: 
- Verify SSH key content includes BEGIN/END lines
- Check SSH key has correct permissions
- Ensure SSH key matches the one added to VPC

### Issue: "Connection refused"
**Solution**:
- Verify VPC IP address is `210.79.128.138`
- Check VPC is running and accessible
- Confirm security groups allow SSH (port 22)

### Issue: Workflow doesn't trigger
**Solution**:
- Push to `main` branch (not `master` or other branches)
- Check workflow files are in `.github/workflows/` directory
- Verify workflow YAML syntax is correct

## Next Steps After Successful Configuration

1. **Monitor first deployment**: Watch GitHub Actions logs
2. **Verify services**: Check if all RemoteHive services start
3. **Test endpoints**: Verify API and web interfaces are accessible
4. **Set up monitoring**: Configure alerts for deployment failures

---

**🎯 Quick Verification Checklist**:
- [ ] 3 secrets visible in GitHub repository settings
- [ ] SSH key format is correct (BEGIN/END lines)
- [ ] VPC is accessible via SSH
- [ ] Test commit triggers GitHub Actions workflow
- [ ] Deployment completes successfully
- [ ] RemoteHive services are accessible

**📖 For detailed setup instructions, see**: `EXACT_GITHUB_SECRETS_CONFIG.md`