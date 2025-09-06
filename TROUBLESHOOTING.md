# RemoteHive Deployment Troubleshooting Guide

This guide provides solutions to common issues encountered during RemoteHive deployment and operation.

## Table of Contents

1. [Pre-deployment Issues](#pre-deployment-issues)
2. [Kubernetes Deployment Issues](#kubernetes-deployment-issues)
3. [Application Issues](#application-issues)
4. [Database Issues](#database-issues)
5. [Networking Issues](#networking-issues)
6. [SSL/TLS Issues](#ssltls-issues)
7. [Performance Issues](#performance-issues)
8. [Monitoring Issues](#monitoring-issues)
9. [CI/CD Issues](#cicd-issues)
10. [General Debugging Commands](#general-debugging-commands)

## Pre-deployment Issues

### Issue: Docker Build Failures

**Symptoms:**
- Docker build commands fail
- "No such file or directory" errors
- Permission denied errors

**Solutions:**

1. **Check Docker daemon:**
   ```bash
   docker info
   sudo systemctl start docker  # Linux
   # or restart Docker Desktop on macOS/Windows
   ```

2. **Verify Dockerfile paths:**
   ```bash
   # Ensure Dockerfiles exist
   ls -la */Dockerfile
   ls -la docker/*/Dockerfile
   ```

3. **Fix file permissions:**
   ```bash
   chmod +x scripts/*.sh
   sudo chown -R $USER:$USER .
   ```

4. **Clean Docker cache:**
   ```bash
   docker system prune -a
   docker builder prune
   ```

### Issue: Missing Dependencies

**Symptoms:**
- "command not found" errors
- Missing kubectl, helm, or docker commands

**Solutions:**

1. **Install missing tools:**
   ```bash
   # Install kubectl
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   
   # Install helm
   curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
   
   # Install docker (Ubuntu/Debian)
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. **Verify installations:**
   ```bash
   kubectl version --client
   helm version
   docker --version
   ```

## Kubernetes Deployment Issues

### Issue: Pods Stuck in Pending State

**Symptoms:**
- Pods show "Pending" status
- Events show scheduling failures

**Diagnosis:**
```bash
kubectl get pods -n remotehive
kubectl describe pod <pod-name> -n remotehive
kubectl get events -n remotehive --sort-by='.lastTimestamp'
```

**Solutions:**

1. **Insufficient resources:**
   ```bash
   # Check node resources
   kubectl top nodes
   kubectl describe nodes
   
   # Reduce resource requests in deployments
   kubectl edit deployment <deployment-name> -n remotehive
   ```

2. **PVC issues:**
   ```bash
   # Check PVC status
   kubectl get pvc -n remotehive
   kubectl describe pvc <pvc-name> -n remotehive
   
   # Check storage class
   kubectl get storageclass
   ```

3. **Node selector issues:**
   ```bash
   # Check node labels
   kubectl get nodes --show-labels
   
   # Remove node selectors if needed
   kubectl patch deployment <deployment-name> -n remotehive -p '{"spec":{"template":{"spec":{"nodeSelector":null}}}}'
   ```

### Issue: Pods Crashing (CrashLoopBackOff)

**Symptoms:**
- Pods show "CrashLoopBackOff" status
- Restart count keeps increasing

**Diagnosis:**
```bash
kubectl logs <pod-name> -n remotehive
kubectl logs <pod-name> -n remotehive --previous
kubectl describe pod <pod-name> -n remotehive
```

**Solutions:**

1. **Check application logs:**
   ```bash
   # View current logs
   kubectl logs -f deployment/<deployment-name> -n remotehive
   
   # View previous container logs
   kubectl logs <pod-name> -n remotehive --previous
   ```

2. **Common fixes:**
   - Fix environment variables in ConfigMaps/Secrets
   - Adjust resource limits
   - Fix database connection strings
   - Check file permissions in containers

3. **Debug with shell access:**
   ```bash
   # Get shell access to debug
   kubectl exec -it <pod-name> -n remotehive -- /bin/bash
   # or
   kubectl exec -it <pod-name> -n remotehive -- /bin/sh
   ```

### Issue: ImagePullBackOff

**Symptoms:**
- Pods show "ImagePullBackOff" or "ErrImagePull"
- Cannot pull container images

**Solutions:**

1. **Check image names and tags:**
   ```bash
   kubectl describe pod <pod-name> -n remotehive
   
   # Verify image exists
   docker pull <image-name>:<tag>
   ```

2. **Registry authentication:**
   ```bash
   # Create registry secret
   kubectl create secret docker-registry regcred \
     --docker-server=<registry-url> \
     --docker-username=<username> \
     --docker-password=<password> \
     --docker-email=<email> \
     -n remotehive
   
   # Update deployment to use secret
   kubectl patch deployment <deployment-name> -n remotehive -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'
   ```

3. **Network issues:**
   ```bash
   # Test connectivity from nodes
   kubectl run test-pod --image=curlimages/curl --rm -i --restart=Never -- curl -I <registry-url>
   ```

## Application Issues

### Issue: 502 Bad Gateway Errors

**Symptoms:**
- HTTP 502 responses from ingress
- Services unreachable

**Diagnosis:**
```bash
# Check ingress status
kubectl get ingress -n remotehive
kubectl describe ingress remotehive-ingress -n remotehive

# Check service endpoints
kubectl get endpoints -n remotehive
kubectl describe service <service-name> -n remotehive
```

**Solutions:**

1. **Check backend pods:**
   ```bash
   # Ensure pods are running and ready
   kubectl get pods -n remotehive -o wide
   kubectl logs deployment/<deployment-name> -n remotehive
   ```

2. **Verify service configuration:**
   ```bash
   # Check service selectors match pod labels
   kubectl get service <service-name> -n remotehive -o yaml
   kubectl get pods -n remotehive --show-labels
   ```

3. **Test internal connectivity:**
   ```bash
   # Test service from within cluster
   kubectl run test-pod --image=curlimages/curl --rm -i --restart=Never -n remotehive -- \
     curl -v http://<service-name>.<namespace>.svc.cluster.local:<port>/health
   ```

### Issue: Database Connection Failures

**Symptoms:**
- Applications can't connect to databases
- Connection timeout errors
- Authentication failures

**Solutions:**

1. **Check database pods:**
   ```bash
   kubectl get pods -l app=mongodb -n remotehive
   kubectl logs deployment/mongodb -n remotehive
   ```

2. **Test database connectivity:**
   ```bash
   # MongoDB
   kubectl exec -it deployment/mongodb -n remotehive -- mongosh --eval "db.adminCommand('ping')"
   
   # Redis
   kubectl exec -it deployment/redis -n remotehive -- redis-cli ping
   ```

3. **Check connection strings:**
   ```bash
   # Verify ConfigMap values
   kubectl get configmap app-config -n remotehive -o yaml
   
   # Check secrets
   kubectl get secret app-secrets -n remotehive -o yaml
   ```

### Issue: Authentication/Authorization Errors

**Symptoms:**
- 401 Unauthorized responses
- 403 Forbidden errors
- JWT token issues

**Solutions:**

1. **Check JWT configuration:**
   ```bash
   # Verify JWT secret in secrets
   kubectl get secret app-secrets -n remotehive -o jsonpath='{.data.JWT_SECRET_KEY}' | base64 -d
   ```

2. **Test authentication endpoints:**
   ```bash
   # Test login endpoint
   curl -X POST https://api.remotehive.in/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@remotehive.in","password":"Ranjeet11$"}'
   ```

3. **Check CORS configuration:**
   ```bash
   # Verify CORS settings in backend configuration
   kubectl logs deployment/backend-api -n remotehive | grep -i cors
   ```

## Database Issues

### Issue: MongoDB Connection Problems

**Symptoms:**
- "Connection refused" errors
- "Authentication failed" errors
- Slow database responses

**Solutions:**

1. **Check MongoDB status:**
   ```bash
   kubectl exec -it deployment/mongodb -n remotehive -- mongosh --eval "db.adminCommand('ismaster')"
   ```

2. **Verify MongoDB configuration:**
   ```bash
   kubectl logs deployment/mongodb -n remotehive
   kubectl describe pod -l app=mongodb -n remotehive
   ```

3. **Check persistent storage:**
   ```bash
   kubectl get pvc mongodb-data -n remotehive
   kubectl describe pvc mongodb-data -n remotehive
   ```

### Issue: Redis Connection Problems

**Symptoms:**
- Celery workers can't connect to Redis
- Cache misses
- Session storage issues

**Solutions:**

1. **Test Redis connectivity:**
   ```bash
   kubectl exec -it deployment/redis -n remotehive -- redis-cli ping
   kubectl exec -it deployment/redis -n remotehive -- redis-cli info
   ```

2. **Check Redis logs:**
   ```bash
   kubectl logs deployment/redis -n remotehive
   ```

3. **Verify Redis configuration:**
   ```bash
   kubectl get configmap redis-config -n remotehive -o yaml
   ```

## Networking Issues

### Issue: Ingress Not Working

**Symptoms:**
- Domain not resolving
- 404 errors from ingress
- SSL certificate issues

**Solutions:**

1. **Check ingress controller:**
   ```bash
   kubectl get pods -n ingress-nginx
   kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
   ```

2. **Verify ingress configuration:**
   ```bash
   kubectl get ingress -n remotehive
   kubectl describe ingress remotehive-ingress -n remotehive
   ```

3. **Check DNS resolution:**
   ```bash
   nslookup api.remotehive.in
   dig api.remotehive.in
   ```

4. **Test ingress rules:**
   ```bash
   # Test specific paths
   curl -H "Host: api.remotehive.in" http://<ingress-ip>/health
   ```

### Issue: Service Discovery Problems

**Symptoms:**
- Services can't reach each other
- DNS resolution failures
- Connection timeouts between services

**Solutions:**

1. **Test DNS resolution:**
   ```bash
   kubectl run test-pod --image=busybox --rm -i --restart=Never -n remotehive -- \
     nslookup backend-api.remotehive.svc.cluster.local
   ```

2. **Check service endpoints:**
   ```bash
   kubectl get endpoints -n remotehive
   kubectl describe endpoints <service-name> -n remotehive
   ```

3. **Verify network policies:**
   ```bash
   kubectl get networkpolicy -n remotehive
   kubectl describe networkpolicy <policy-name> -n remotehive
   ```

## SSL/TLS Issues

### Issue: Certificate Problems

**Symptoms:**
- SSL certificate warnings
- "Certificate not trusted" errors
- HTTPS not working

**Solutions:**

1. **Check cert-manager:**
   ```bash
   kubectl get pods -n cert-manager
   kubectl logs -n cert-manager deployment/cert-manager
   ```

2. **Check certificate status:**
   ```bash
   kubectl get certificate -n remotehive
   kubectl describe certificate <cert-name> -n remotehive
   ```

3. **Check certificate issuer:**
   ```bash
   kubectl get clusterissuer
   kubectl describe clusterissuer letsencrypt-prod
   ```

4. **Manual certificate check:**
   ```bash
   openssl s_client -servername api.remotehive.in -connect api.remotehive.in:443
   ```

## Performance Issues

### Issue: Slow Response Times

**Symptoms:**
- High response times
- Timeouts
- Poor user experience

**Solutions:**

1. **Check resource usage:**
   ```bash
   kubectl top pods -n remotehive
   kubectl top nodes
   ```

2. **Scale applications:**
   ```bash
   # Manual scaling
   kubectl scale deployment backend-api --replicas=5 -n remotehive
   
   # Check HPA status
   kubectl get hpa -n remotehive
   kubectl describe hpa backend-api-hpa -n remotehive
   ```

3. **Check database performance:**
   ```bash
   # MongoDB stats
   kubectl exec -it deployment/mongodb -n remotehive -- mongosh --eval "db.stats()"
   
   # Redis info
   kubectl exec -it deployment/redis -n remotehive -- redis-cli info stats
   ```

### Issue: High Memory Usage

**Symptoms:**
- Pods being killed (OOMKilled)
- High memory consumption
- Performance degradation

**Solutions:**

1. **Check memory limits:**
   ```bash
   kubectl describe pod <pod-name> -n remotehive
   kubectl top pod <pod-name> -n remotehive
   ```

2. **Adjust resource limits:**
   ```bash
   kubectl patch deployment <deployment-name> -n remotehive -p '{
     "spec": {
       "template": {
         "spec": {
           "containers": [{
             "name": "<container-name>",
             "resources": {
               "limits": {"memory": "2Gi"},
               "requests": {"memory": "1Gi"}
             }
           }]
         }
       }
     }
   }'
   ```

## Monitoring Issues

### Issue: Metrics Not Available

**Symptoms:**
- Prometheus not scraping metrics
- Grafana dashboards empty
- HPA showing "unknown" metrics

**Solutions:**

1. **Check metrics server:**
   ```bash
   kubectl get pods -n kube-system | grep metrics-server
   kubectl top nodes
   ```

2. **Verify ServiceMonitor:**
   ```bash
   kubectl get servicemonitor -n remotehive
   kubectl describe servicemonitor remotehive-metrics -n remotehive
   ```

3. **Check Prometheus targets:**
   ```bash
   # Access Prometheus UI and check targets
   kubectl port-forward -n monitoring svc/prometheus-server 9090:80
   # Visit http://localhost:9090/targets
   ```

## CI/CD Issues

### Issue: GitHub Actions Failures

**Symptoms:**
- Build failures
- Deployment failures
- Authentication errors

**Solutions:**

1. **Check secrets:**
   ```bash
   # Verify GitHub secrets are set:
   # - DOCKER_USERNAME
   # - DOCKER_PASSWORD
   # - KUBE_CONFIG
   # - DOMAIN_NAME
   ```

2. **Check workflow logs:**
   - Review GitHub Actions logs
   - Look for specific error messages
   - Check step-by-step execution

3. **Test locally:**
   ```bash
   # Test Docker builds locally
   docker build -t test-image -f docker/backend/Dockerfile .
   
   # Test Kubernetes manifests
   kubectl apply --dry-run=client -f k8s/
   ```

## General Debugging Commands

### Essential Debugging Commands

```bash
# Get overview of all resources
kubectl get all -n remotehive

# Check pod logs
kubectl logs -f deployment/<deployment-name> -n remotehive

# Describe resources for detailed info
kubectl describe pod <pod-name> -n remotehive
kubectl describe service <service-name> -n remotehive
kubectl describe ingress <ingress-name> -n remotehive

# Get events (sorted by time)
kubectl get events -n remotehive --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n remotehive
kubectl top nodes

# Get shell access to pods
kubectl exec -it <pod-name> -n remotehive -- /bin/bash

# Port forward for local testing
kubectl port-forward service/<service-name> 8080:80 -n remotehive

# Check configuration
kubectl get configmap <configmap-name> -n remotehive -o yaml
kubectl get secret <secret-name> -n remotehive -o yaml
```

### Useful Debugging Scripts

1. **Quick health check:**
   ```bash
   #!/bin/bash
   echo "=== Pod Status ==="
   kubectl get pods -n remotehive
   echo "\n=== Service Status ==="
   kubectl get svc -n remotehive
   echo "\n=== Ingress Status ==="
   kubectl get ingress -n remotehive
   echo "\n=== Recent Events ==="
   kubectl get events -n remotehive --sort-by='.lastTimestamp' | tail -10
   ```

2. **Resource usage check:**
   ```bash
   #!/bin/bash
   echo "=== Node Resources ==="
   kubectl top nodes
   echo "\n=== Pod Resources ==="
   kubectl top pods -n remotehive
   echo "\n=== HPA Status ==="
   kubectl get hpa -n remotehive
   ```

## Getting Help

If you're still experiencing issues:

1. **Check the logs systematically:**
   - Application logs
   - Kubernetes events
   - Ingress controller logs
   - Database logs

2. **Use the validation script:**
   ```bash
   ./scripts/validate-deployment.sh --verbose
   ```

3. **Gather diagnostic information:**
   ```bash
   # Create a diagnostic bundle
   kubectl cluster-info dump --namespaces remotehive --output-directory=./cluster-dump
   ```

4. **Community resources:**
   - Kubernetes documentation
   - FastAPI documentation
   - MongoDB documentation
   - Stack Overflow
   - GitHub issues

Remember to always check the official documentation for the specific versions of tools you're using, as commands and configurations may vary between versions.