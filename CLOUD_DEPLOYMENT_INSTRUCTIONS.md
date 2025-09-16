# RemoteHive Cloud Deployment Instructions

## Instance Details
- **Instance ID**: 3198
- **Name**: remotehive-dev
- **Type**: t1.small
- **Zone**: mum-1a
- **Public IP**: 210.79.129.170
- **Internal IP**: 10.0.0.11
- **Status**: RUNNING

## Step 1: Add SSH Public Key to Cloud Instance

You need to manually add the SSH public key to your cloud instance's authorized_keys file.

### SSH Public Key to Add:

Use the content from `remotehive-vpc-key.pub` file in your project directory.

### Manual Steps:
1. **Access your cloud instance console** (via your cloud provider's web interface)
2. **Connect to the instance** using the console or existing SSH access
3. **Add the public key** to the authorized_keys file:
   ```bash
   # Create .ssh directory if it doesn't exist
   mkdir -p ~/.ssh
   
   # Add the public key to authorized_keys
   cat remotehive-vpc-key.pub >> ~/.ssh/authorized_keys
   
   # Set proper permissions
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

## Step 2: Test SSH Connection

After adding the public key, test the SSH connection from your local machine:

```bash
ssh -i remotehive-vpc-key -o ConnectTimeout=10 root@210.79.129.170
```

## Step 3: Deploy RemoteHive

Once SSH access is established, you can deploy RemoteHive using one of these methods:

### Option A: Docker Compose Deployment
1. **Transfer the deployment package** to the cloud instance
2. **Install Docker and Docker Compose** on the instance
3. **Run the deployment**:
   ```bash
   docker-compose up -d
   ```

### Option B: Kubernetes Deployment
1. **Set up Kubernetes cluster** on the instance
2. **Apply the K8s manifests**:
   ```bash
   kubectl apply -f k8s/
   ```

## Step 4: Configure Environment Variables

Update the environment variables in `.env.production` for the cloud deployment:

```bash
# Database URLs (update with cloud instance IPs)
MONGODB_URL=mongodb://10.0.0.11:27017/remotehive
REDIS_URL=redis://10.0.0.11:6379

# API URLs (update with public IP)
NEXT_PUBLIC_API_URL=http://210.79.129.170:8000
REACT_APP_API_URL=http://210.79.129.170:8000
AUTOSCRAPER_API_URL=http://210.79.129.170:8001

# Security
JWT_SECRET_KEY=your-production-secret-key
CORS_ORIGINS=["http://210.79.129.170:3000","http://210.79.129.170:5173"]
```

## Step 5: Verify Deployment

After deployment, verify that all services are running:

- **Backend API**: http://210.79.129.170:8000/docs
- **Admin Panel**: http://210.79.129.170:3000
- **Public Website**: http://210.79.129.170:5173
- **Autoscraper**: http://210.79.129.170:8001/docs

## Security Considerations

1. **Firewall Rules**: Ensure proper security group rules are configured
2. **SSL/TLS**: Consider setting up SSL certificates for production
3. **Database Security**: Secure MongoDB and Redis with authentication
4. **Regular Updates**: Keep the system and dependencies updated

## Troubleshooting

### SSH Issues
- Verify the public key is correctly added to `~/.ssh/authorized_keys`
- Check file permissions (700 for .ssh, 600 for authorized_keys)
- Ensure SSH service is running on the instance

### Deployment Issues
- Check Docker/Kubernetes logs for errors
- Verify environment variables are correctly set
- Ensure all required ports are open in security groups

### Service Issues
- Check service health endpoints
- Verify database connections
- Review application logs for errors

---

**Next Steps**: After adding the SSH public key to your cloud instance, run the test SSH command to verify connectivity, then proceed with the deployment.