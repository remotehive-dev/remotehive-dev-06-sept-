#!/bin/bash

# RemoteHive Docker and Kubernetes Setup Script
# This script configures Docker and Kubernetes environment with security best practices

set -e

echo "=== RemoteHive Docker & Kubernetes Setup ==="
echo "Starting configuration..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
echo "Updating system packages..."
sudo apt-get update -y

# Install required packages
echo "Installing required packages..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    jq \
    git

# Configure Docker security settings
echo "Configuring Docker security..."
sudo mkdir -p /etc/docker

# Create Docker daemon configuration with security settings
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp.json",
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
EOF

# Add user to docker group
sudo usermod -aG docker $USER

# Restart Docker service
echo "Restarting Docker service..."
sudo systemctl restart docker
sudo systemctl enable docker

# Install kubectl if not present
if ! command -v kubectl &> /dev/null; then
    echo "Installing kubectl..."
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    rm kubectl
fi

# Install kind (Kubernetes in Docker) for local development
if ! command -v kind &> /dev/null; then
    echo "Installing kind..."
    curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
    chmod +x ./kind
    sudo mv ./kind /usr/local/bin/kind
fi

# Install helm
if ! command -v helm &> /dev/null; then
    echo "Installing Helm..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# Create kind cluster configuration
echo "Creating kind cluster configuration..."
mkdir -p ~/k8s-config

cat > ~/k8s-config/kind-config.yaml <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: remotehive-cluster
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
  - containerPort: 30000
    hostPort: 30000
    protocol: TCP
  - containerPort: 30001
    hostPort: 30001
    protocol: TCP
- role: worker
- role: worker
EOF

# Create Kubernetes cluster
echo "Creating Kubernetes cluster..."
kind create cluster --config ~/k8s-config/kind-config.yaml --wait 300s

# Install NGINX Ingress Controller
echo "Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller to be ready
echo "Waiting for ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

# Create RemoteHive namespace
echo "Creating RemoteHive namespace..."
kubectl create namespace remotehive --dry-run=client -o yaml | kubectl apply -f -

# Set up RBAC
echo "Setting up RBAC..."
cat > ~/k8s-config/rbac.yaml <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: remotehive-service-account
  namespace: remotehive
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: remotehive
  name: remotehive-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: remotehive-role-binding
  namespace: remotehive
subjects:
- kind: ServiceAccount
  name: remotehive-service-account
  namespace: remotehive
roleRef:
  kind: Role
  name: remotehive-role
  apiGroup: rbac.authorization.k8s.io
EOF

kubectl apply -f ~/k8s-config/rbac.yaml

# Create Docker registry secret for private repositories
echo "Creating Docker registry secret..."
kubectl create secret docker-registry github-registry \
  --docker-server=ghcr.io \
  --docker-username=remotehive-deployment \
  --docker-password="$(cat ~/.ssh/remotehive_key_github)" \
  --namespace=remotehive \
  --dry-run=client -o yaml | kubectl apply -f -

# Set up monitoring namespace
echo "Setting up monitoring namespace..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Create network policies for security
echo "Creating network policies..."
cat > ~/k8s-config/network-policies.yaml <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: remotehive-network-policy
  namespace: remotehive
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    - namespaceSelector:
        matchLabels:
          name: monitoring
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
EOF

kubectl apply -f ~/k8s-config/network-policies.yaml

# Create persistent volumes
echo "Creating persistent volumes..."
cat > ~/k8s-config/persistent-volumes.yaml <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: remotehive-mongodb-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  local:
    path: /data/mongodb
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - remotehive-cluster-worker
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: remotehive-redis-pv
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  local:
    path: /data/redis
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - remotehive-cluster-worker2
EOF

# Create directories for persistent volumes
sudo mkdir -p /data/mongodb /data/redis
sudo chown -R 999:999 /data/mongodb
sudo chown -R 999:999 /data/redis

kubectl apply -f ~/k8s-config/persistent-volumes.yaml

# Install Prometheus and Grafana for monitoring
echo "Installing monitoring stack..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false

# Create GitHub webhook secret
echo "Creating GitHub webhook secret..."
kubectl create secret generic github-webhook-secret \
  --from-literal=secret="$(openssl rand -hex 20)" \
  --namespace=remotehive \
  --dry-run=client -o yaml | kubectl apply -f -

# Display cluster information
echo "\n=== Cluster Information ==="
kubectl cluster-info
echo "\n=== Nodes ==="
kubectl get nodes -o wide
echo "\n=== Namespaces ==="
kubectl get namespaces
echo "\n=== Services ==="
kubectl get services --all-namespaces

echo "\n=== Setup Complete ==="
echo "Docker and Kubernetes environment has been configured successfully!"
echo "Cluster name: remotehive-cluster"
echo "Namespaces created: remotehive, monitoring"
echo "RBAC configured with service account: remotehive-service-account"
echo "Network policies applied for security"
echo "Monitoring stack installed (Prometheus + Grafana)"
echo "\nNext steps:"
echo "1. Deploy your applications using kubectl"
echo "2. Configure CI/CD pipeline"
echo "3. Set up real-time synchronization"
echo "\nTo access Grafana dashboard:"
echo "kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
echo "Default credentials: admin/prom-operator"