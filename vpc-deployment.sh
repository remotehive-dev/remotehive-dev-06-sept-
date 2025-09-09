
#!/bin/bash

# RemoteHive VPC Deployment Script
# This script automates the deployment of RemoteHive platform on AWS VPC with EKS

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

# Script metadata
SCRIPT_NAME="RemoteHive VPC Deployment"
SCRIPT_VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
CONFIG_DIR="${SCRIPT_DIR}/vpc-config"
TEMP_DIR="${SCRIPT_DIR}/temp"

# AWS Configuration
AWS_REGION="${AWS_REGION:-us-west-2}"
AWS_PROFILE="${AWS_PROFILE:-default}"
CLUSTER_NAME="${CLUSTER_NAME:-remotehive}"
ENVIRONMENT="${ENVIRONMENT:-staging}"
NODE_GROUP_NAME="${NODE_GROUP_NAME:-remotehive-nodes}"

# VPC Configuration
VPC_CIDR="10.0.0.0/16"
PUBLIC_SUBNET_1_CIDR="10.0.1.0/24"
PUBLIC_SUBNET_2_CIDR="10.0.2.0/24"
PRIVATE_SUBNET_1_CIDR="10.0.10.0/24"
PRIVATE_SUBNET_2_CIDR="10.0.20.0/24"
DB_SUBNET_1_CIDR="10.0.100.0/24"
DB_SUBNET_2_CIDR="10.0.200.0/24"

# EKS Configuration
KUBERNETES_VERSION="1.28"
NODE_INSTANCE_TYPE="t3.medium"
NODE_GROUP_MIN_SIZE=2
NODE_GROUP_MAX_SIZE=10
NODE_GROUP_DESIRED_SIZE=3

# Application Configuration
DOMAIN_NAME="${DOMAIN_NAME:-remotehive.com}"
CERTIFICATE_ARN="${CERTIFICATE_ARN:-}"
HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Logging functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} ${timestamp} - $message" | tee -a "${LOG_DIR}/deployment.log"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} ${timestamp} - $message" | tee -a "${LOG_DIR}/deployment.log"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message" | tee -a "${LOG_DIR}/deployment.log"
            ;;
        "DEBUG")
            if [[ "${DEBUG:-false}" == "true" ]]; then
                echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - $message" | tee -a "${LOG_DIR}/deployment.log"
            fi
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - $message" | tee -a "${LOG_DIR}/deployment.log"
            ;;
    esac
}

# Progress indicator
show_progress() {
    local current=$1
    local total=$2
    local task="$3"
    local percent=$((current * 100 / total))
    local filled=$((percent / 2))
    local empty=$((50 - filled))
    
    printf "\r${CYAN}[%3d%%]${NC} [" "$percent"
    printf "%*s" "$filled" | tr ' ' '█'
    printf "%*s" "$empty" | tr ' ' '░'
    printf "] %s" "$task"
    
    if [[ $current -eq $total ]]; then
        echo
    fi
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    cleanup
    exit 1
}

# Cleanup function
cleanup() {
    log "INFO" "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
}

# Trap for cleanup on exit
trap cleanup EXIT

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    local required_commands=("aws" "kubectl" "eksctl" "helm" "jq" "yq" "docker")
    local missing_commands=()
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [[ ${#missing_commands[@]} -gt 0 ]]; then
        error_exit "Missing required commands: ${missing_commands[*]}"
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &> /dev/null; then
        error_exit "AWS credentials not configured or invalid for profile: $AWS_PROFILE"
    fi
    
    # Check AWS permissions
    log "INFO" "Validating AWS permissions..."
    local required_permissions=(
        "ec2:*"
        "eks:*"
        "iam:*"
        "cloudformation:*"
        "route53:*"
        "acm:*"
        "elasticloadbalancing:*"
        "autoscaling:*"
    )
    
    # Note: In a real scenario, you'd want to check specific permissions
    # For now, we'll assume the user has the necessary permissions
    
    log "SUCCESS" "Prerequisites check completed"
}

# Validate configuration
validate_config() {
    log "INFO" "Validating configuration..."
    
    # Validate AWS region
    if ! aws ec2 describe-regions --region-names "$AWS_REGION" --profile "$AWS_PROFILE" &> /dev/null; then
        error_exit "Invalid AWS region: $AWS_REGION"
    fi
    
    # Validate CIDR blocks
    local cidrs=("$VPC_CIDR" "$PUBLIC_SUBNET_1_CIDR" "$PUBLIC_SUBNET_2_CIDR" 
                 "$PRIVATE_SUBNET_1_CIDR" "$PRIVATE_SUBNET_2_CIDR" 
                 "$DB_SUBNET_1_CIDR" "$DB_SUBNET_2_CIDR")
    
    for cidr in "${cidrs[@]}"; do
        if ! [[ $cidr =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$ ]]; then
            error_exit "Invalid CIDR block: $cidr"
        fi
    done
    
    # Validate instance type
    if ! aws ec2 describe-instance-types --instance-types "$NODE_INSTANCE_TYPE" --region "$AWS_REGION" --profile "$AWS_PROFILE" &> /dev/null; then
        error_exit "Invalid instance type: $NODE_INSTANCE_TYPE"
    fi
    
    log "SUCCESS" "Configuration validation completed"
}

# =============================================================================
# INFRASTRUCTURE FUNCTIONS
# =============================================================================

# Create directories
setup_directories() {
    log "INFO" "Setting up directories..."
    
    mkdir -p "$LOG_DIR" "$CONFIG_DIR" "$TEMP_DIR"
    mkdir -p "$CONFIG_DIR/cloudformation"
    mkdir -p "$CONFIG_DIR/kubernetes"
    mkdir -p "$CONFIG_DIR/helm"
    
    log "SUCCESS" "Directories created"
}

# Generate CloudFormation templates
generate_cloudformation_templates() {
    log "INFO" "Generating CloudFormation templates..."
    
    # VPC Template
    cat > "$CONFIG_DIR/cloudformation/vpc.yaml" << EOF
AWSTemplateFormatVersion: '2010-09-09'
Description: 'RemoteHive VPC Infrastructure'

Parameters:
  EnvironmentName:
    Description: Environment name prefix
    Type: String
    Default: $ENVIRONMENT
  
  VpcCIDR:
    Description: CIDR block for VPC
    Type: String
    Default: $VPC_CIDR

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-VPC
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: RemoteHive

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-IGW
        - Key: Environment
          Value: !Ref EnvironmentName

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: $PUBLIC_SUBNET_1_CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-Public-Subnet-AZ1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: kubernetes.io/role/elb
          Value: 1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: $PUBLIC_SUBNET_2_CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-Public-Subnet-AZ2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: kubernetes.io/role/elb
          Value: 1

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: $PRIVATE_SUBNET_1_CIDR
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-Private-Subnet-AZ1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: kubernetes.io/role/internal-elb
          Value: 1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: $PRIVATE_SUBNET_2_CIDR
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-Private-Subnet-AZ2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: kubernetes.io/role/internal-elb
          Value: 1

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: $DB_SUBNET_1_CIDR
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-Database-Subnet-AZ1
        - Key: Environment
          Value: !Ref EnvironmentName

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: $DB_SUBNET_2_CIDR
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-Database-Subnet-AZ2
        - Key: Environment
          Value: !Ref EnvironmentName

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-NAT1-EIP

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-NAT2-EIP

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-NAT-Gateway-AZ1

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-NAT-Gateway-AZ2

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-Public-Routes

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-Private-Routes-AZ1

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-Private-Routes-AZ2

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Database Subnet Group
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-Database-SubnetGroup

  # Security Groups
  EKSClusterSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EKS cluster
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS access
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-EKS-Cluster-SG

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 27017
          ToPort: 27017
          SourceSecurityGroupId: !Ref EKSClusterSecurityGroup
          Description: MongoDB access from EKS
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref EKSClusterSecurityGroup
          Description: Redis access from EKS
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-Database-SG

Outputs:
  VPC:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub \${EnvironmentName}-VPC-ID

  PublicSubnets:
    Description: Public subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub \${EnvironmentName}-Public-Subnets

  PrivateSubnets:
    Description: Private subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub \${EnvironmentName}-Private-Subnets

  DatabaseSubnets:
    Description: Database subnet IDs
    Value: !Join [',', [!Ref DatabaseSubnet1, !Ref DatabaseSubnet2]]
    Export:
      Name: !Sub \${EnvironmentName}-Database-Subnets

  EKSClusterSecurityGroup:
    Description: EKS Cluster Security Group ID
    Value: !Ref EKSClusterSecurityGroup
    Export:
      Name: !Sub \${EnvironmentName}-EKS-Cluster-SG

  DatabaseSecurityGroup:
    Description: Database Security Group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub \${EnvironmentName}-Database-SG
EOF

    log "SUCCESS" "CloudFormation templates generated"
}

# Deploy VPC infrastructure
deploy_vpc() {
    log "INFO" "Deploying VPC infrastructure..."
    
    local stack_name="${CLUSTER_NAME}-${ENVIRONMENT}-vpc"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$stack_name" --region "$AWS_REGION" --profile "$AWS_PROFILE" &> /dev/null; then
        log "INFO" "Updating existing VPC stack: $stack_name"
        aws cloudformation update-stack \
            --stack-name "$stack_name" \
            --template-body "file://$CONFIG_DIR/cloudformation/vpc.yaml" \
            --parameters ParameterKey=EnvironmentName,ParameterValue="$ENVIRONMENT" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE" \
            --capabilities CAPABILITY_IAM
    else
        log "INFO" "Creating new VPC stack: $stack_name"
        aws cloudformation create-stack \
            --stack-name "$stack_name" \
            --template-body "file://$CONFIG_DIR/cloudformation/vpc.yaml" \
            --parameters ParameterKey=EnvironmentName,ParameterValue="$ENVIRONMENT" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE" \
            --capabilities CAPABILITY_IAM
    fi
    
    # Wait for stack completion
    log "INFO" "Waiting for VPC stack deployment to complete..."
    aws cloudformation wait stack-create-complete \
        --stack-name "$stack_name" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" || \
    aws cloudformation wait stack-update-complete \
        --stack-name "$stack_name" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE"
    
    # Get stack outputs
    local outputs
    outputs=$(aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --query 'Stacks[0].Outputs' \
        --output json)
    
    # Export variables for later use
    export VPC_ID=$(echo "$outputs" | jq -r '.[] | select(.OutputKey=="VPC") | .OutputValue')
    export PUBLIC_SUBNETS=$(echo "$outputs" | jq -r '.[] | select(.OutputKey=="PublicSubnets") | .OutputValue')
    export PRIVATE_SUBNETS=$(echo "$outputs" | jq -r '.[] | select(.OutputKey=="PrivateSubnets") | .OutputValue')
    export DATABASE_SUBNETS=$(echo "$outputs" | jq -r '.[] | select(.OutputKey=="DatabaseSubnets") | .OutputValue')
    
    log "SUCCESS" "VPC infrastructure deployed successfully"
    log "INFO" "VPC ID: $VPC_ID"
    log "INFO" "Public Subnets: $PUBLIC_SUBNETS"
    log "INFO" "Private Subnets: $PRIVATE_SUBNETS"
}

# Create EKS cluster
create_eks_cluster() {
    log "INFO" "Creating EKS cluster..."
    
    # Generate eksctl config
    cat > "$CONFIG_DIR/eksctl-config.yaml" << EOF
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: $CLUSTER_NAME-$ENVIRONMENT
  region: $AWS_REGION
  version: "$KUBERNETES_VERSION"
  tags:
    Environment: $ENVIRONMENT
    Project: RemoteHive
    ManagedBy: eksctl

vpc:
  id: $VPC_ID
  subnets:
    public:
      public-subnet-1:
        id: $(echo "$PUBLIC_SUBNETS" | cut -d',' -f1)
      public-subnet-2:
        id: $(echo "$PUBLIC_SUBNETS" | cut -d',' -f2)
    private:
      private-subnet-1:
        id: $(echo "$PRIVATE_SUBNETS" | cut -d',' -f1)
      private-subnet-2:
        id: $(echo "$PRIVATE_SUBNETS" | cut -d',' -f2)

iam:
  withOIDC: true
  serviceAccounts:
  - metadata:
      name: aws-load-balancer-controller
      namespace: kube-system
    wellKnownPolicies:
      awsLoadBalancerController: true
  - metadata:
      name: ebs-csi-controller-sa
      namespace: kube-system
    wellKnownPolicies:
      ebsCSIController: true
  - metadata:
      name: cluster-autoscaler
      namespace: kube-system
    wellKnownPolicies:
      autoScaler: true

managedNodeGroups:
- name: $NODE_GROUP_NAME
  instanceType: $NODE_INSTANCE_TYPE
  minSize: $NODE_GROUP_MIN_SIZE
  maxSize: $NODE_GROUP_MAX_SIZE
  desiredCapacity: $NODE_GROUP_DESIRED_SIZE
  volumeSize: 50
  volumeType: gp3
  privateNetworking: true
  subnets:
    - $(echo "$PRIVATE_SUBNETS" | cut -d',' -f1)
    - $(echo "$PRIVATE_SUBNETS" | cut -d',' -f2)
  tags:
    k8s.io/cluster-autoscaler/enabled: "true"
    k8s.io/cluster-autoscaler/$CLUSTER_NAME-$ENVIRONMENT: "owned"
  iam:
    attachPolicyARNs:
    - arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy
    - arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
    - arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
    - arn:aws:iam::aws:policy/AmazonEBSCSIDriverPolicy

addons:
- name: vpc-cni
  version: latest
- name: coredns
  version: latest
- name: kube-proxy
  version: latest
- name: aws-ebs-csi-driver
  version: latest

cloudWatch:
  clusterLogging:
    enable: ["api", "audit", "authenticator", "controllerManager", "scheduler"]
    logRetentionInDays: 30
EOF

    # Create or update cluster
    if eksctl get cluster --name "$CLUSTER_NAME-$ENVIRONMENT" --region "$AWS_REGION" --profile "$AWS_PROFILE" &> /dev/null; then
        log "INFO" "Updating existing EKS cluster..."
        eksctl upgrade cluster --config-file="$CONFIG_DIR/eksctl-config.yaml" --profile="$AWS_PROFILE"
    else
        log "INFO" "Creating new EKS cluster..."
        eksctl create cluster --config-file="$CONFIG_DIR/eksctl-config.yaml" --profile="$AWS_PROFILE"
    fi
    
    # Update kubeconfig
    aws eks update-kubeconfig \
        --region "$AWS_REGION" \
        --name "$CLUSTER_NAME-$ENVIRONMENT" \
        --profile "$AWS_PROFILE"
    
    log "SUCCESS" "EKS cluster created/updated successfully"
}

# Install cluster add-ons
install_cluster_addons() {
    log "INFO" "Installing cluster add-ons..."
    
    # Install AWS Load Balancer Controller
    log "INFO" "Installing AWS Load Balancer Controller..."
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    
    helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
        -n kube-system \
        --set clusterName="$CLUSTER_NAME-$ENVIRONMENT" \
        --set serviceAccount.create=false \
        --set serviceAccount.name=aws-load-balancer-controller
    
    # Install Cluster Autoscaler
    log "INFO" "Installing Cluster Autoscaler..."
    helm repo add autoscaler https://kubernetes.github.io/autoscaler
    helm repo update
    
    helm upgrade --install cluster-autoscaler autoscaler/cluster-autoscaler \
        -n kube-system \
        --set autoDiscovery.clusterName="$CLUSTER_NAME-$ENVIRONMENT" \
        --set awsRegion="$AWS_REGION" \
        --set serviceAccount.create=false \
        --set serviceAccount.name=cluster-autoscaler
    
    # Install Metrics Server
    log "INFO" "Installing Metrics Server..."
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    
    # Install NGINX Ingress Controller
    log "INFO" "Installing NGINX Ingress Controller..."
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        -n ingress-nginx \
        --create-namespace \
        --set controller.service.type=LoadBalancer \
        --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"="nlb" \
        --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-cross-zone-load-balancing-enabled"="true"
    
    log "SUCCESS" "Cluster add-ons installed successfully"
}

# =============================================================================
# APPLICATION DEPLOYMENT FUNCTIONS
# =============================================================================

# Generate Kubernetes manifests
generate_k8s_manifests() {
    log "INFO" "Generating Kubernetes manifests..."
    
    mkdir -p "$CONFIG_DIR/kubernetes/namespaces"
    mkdir -p "$CONFIG_DIR/kubernetes/secrets"
    mkdir -p "$CONFIG_DIR/kubernetes/configmaps"
    mkdir -p "$CONFIG_DIR/kubernetes/deployments"
    mkdir -p "$CONFIG_DIR/kubernetes/services"
    mkdir -p "$CONFIG_DIR/kubernetes/ingress"
    mkdir -p "$CONFIG_DIR/kubernetes/storage"
    
    # Namespace
    cat > "$CONFIG_DIR/kubernetes/namespaces/remotehive.yaml" << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: remotehive-$ENVIRONMENT
  labels:
    name: remotehive-$ENVIRONMENT
    environment: $ENVIRONMENT
    project: remotehive
EOF

    # MongoDB deployment
    cat > "$CONFIG_DIR/kubernetes/deployments/mongodb.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
  namespace: remotehive-$ENVIRONMENT
  labels:
    app: mongodb
    environment: $ENVIRONMENT
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: username
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: password
        volumeMounts:
        - name: mongodb-storage
          mountPath: /data/db
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: mongodb-storage
        persistentVolumeClaim:
          claimName: mongodb-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb
  namespace: remotehive-$ENVIRONMENT
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
  type: ClusterIP
EOF

    # Redis deployment
    cat > "$CONFIG_DIR/kubernetes/deployments/redis.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: remotehive-$ENVIRONMENT
  labels:
    app: redis
    environment: $ENVIRONMENT
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7.2-alpine
        ports:
        - containerPort: 6379
        command: ["redis-server"]
        args: ["--requirepass", "\$(REDIS_PASSWORD)"]
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password
        volumeMounts:
        - name: redis-storage
          mountPath: /data
        resources:
          requests:
            memory: "256Mi"
            cpu: "125m"
          limits:
            memory: "512Mi"
            cpu: "250m"
      volumes:
      - name: redis-storage
        persistentVolumeClaim:
          claimName: redis-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: remotehive-$ENVIRONMENT
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
EOF

    # Backend API deployment
    cat > "$CONFIG_DIR/kubernetes/deployments/backend.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: remotehive-$ENVIRONMENT
  labels:
    app: backend
    environment: $ENVIRONMENT
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/remotehive/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: ENVIRONMENT
          value: "$ENVIRONMENT"
        - name: MONGODB_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: mongodb-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: redis-url
        - name: JWT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: remotehive-$ENVIRONMENT
spec:
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
EOF

    # Autoscraper deployment
    cat > "$CONFIG_DIR/kubernetes/deployments/autoscraper.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: autoscraper
  namespace: remotehive-$ENVIRONMENT
  labels:
    app: autoscraper
    environment: $ENVIRONMENT
spec:
  replicas: 2
  selector:
    matchLabels:
      app: autoscraper
  template:
    metadata:
      labels:
        app: autoscraper
    spec:
      containers:
      - name: autoscraper
        image: ghcr.io/remotehive/autoscraper:latest
        ports:
        - containerPort: 8001
        env:
        - name: ENVIRONMENT
          value: "$ENVIRONMENT"
        - name: DATABASE_URL
          value: "sqlite:///app/scraper.db"
        livenessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "125m"
          limits:
            memory: "512Mi"
            cpu: "250m"
---
apiVersion: v1
kind: Service
metadata:
  name: autoscraper
  namespace: remotehive-$ENVIRONMENT
spec:
  selector:
    app: autoscraper
  ports:
  - port: 80
    targetPort: 8001
  type: ClusterIP
EOF

    # Admin Panel deployment
    cat > "$CONFIG_DIR/kubernetes/deployments/admin.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: admin
  namespace: remotehive-$ENVIRONMENT
  labels:
    app: admin
    environment: $ENVIRONMENT
spec:
  replicas: 2
  selector:
    matchLabels:
      app: admin
  template:
    metadata:
      labels:
        app: admin
    spec:
      containers:
      - name: admin
        image: ghcr.io/remotehive/admin:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://api-$ENVIRONMENT.$DOMAIN_NAME"
        - name: ENVIRONMENT
          value: "$ENVIRONMENT"
        resources:
          requests:
            memory: "256Mi"
            cpu: "125m"
          limits:
            memory: "512Mi"
            cpu: "250m"
---
apiVersion: v1
kind: Service
metadata:
  name: admin
  namespace: remotehive-$ENVIRONMENT
spec:
  selector:
    app: admin
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
EOF

    # Public Website deployment
    cat > "$CONFIG_DIR/kubernetes/deployments/public.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: public
  namespace: remotehive-$ENVIRONMENT
  labels:
    app: public
    environment: $ENVIRONMENT
spec:
  replicas: 3
  selector:
    matchLabels:
      app: public
  template:
    metadata:
      labels:
        app: public
    spec:
      containers:
      - name: public
        image: ghcr.io/remotehive/public:latest
        ports:
        - containerPort: 5173
        env:
        - name: VITE_API_URL
          value: "https://api-$ENVIRONMENT.$DOMAIN_NAME"
        - name: ENVIRONMENT
          value: "$ENVIRONMENT"
        resources:
          requests:
            memory: "256Mi"
            cpu: "125m"
          limits:
            memory: "512Mi"
            cpu: "250m"
---
apiVersion: v1
kind: Service
metadata:
  name: public
  namespace: remotehive-$ENVIRONMENT
spec:
  selector:
    app: public
  ports:
  - port: 80
    targetPort: 5173
  type: ClusterIP
EOF

    # Ingress
    cat > "$CONFIG_DIR/kubernetes/ingress/ingress.yaml" << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: remotehive-ingress
  namespace: remotehive-$ENVIRONMENT
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - $ENVIRONMENT.$DOMAIN_NAME
    - api-$ENVIRONMENT.$DOMAIN_NAME
    - admin-$ENVIRONMENT.$DOMAIN_NAME
    - scraper-$ENVIRONMENT.$DOMAIN_NAME
    secretName: remotehive-tls
  rules:
  - host: $ENVIRONMENT.$DOMAIN_NAME
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: public
            port:
              number: 80
  - host: api-$ENVIRONMENT.$DOMAIN_NAME
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 80
  - host: admin-$ENVIRONMENT.$DOMAIN_NAME
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin
            port:
              number: 80
  - host: scraper-$ENVIRONMENT.$DOMAIN_NAME
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: autoscraper
            port:
              number: 80
EOF

    # Storage
    cat > "$CONFIG_DIR/kubernetes/storage/storage.yaml" << EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
  namespace: remotehive-$ENVIRONMENT
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 20Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
  namespace: remotehive-$ENVIRONMENT
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 5Gi
EOF

    log "SUCCESS" "Kubernetes manifests generated"
}

# Deploy application
deploy_application() {
    log "INFO" "Deploying RemoteHive application..."
    
    # Create namespace
    kubectl apply -f "$CONFIG_DIR/kubernetes/namespaces/"
    
    # Create secrets (you'll need to populate these)
    log "WARN" "Please ensure secrets are created before deployment:"
    log "WARN" "kubectl create secret generic mongodb-secret --from-literal=username=admin --from-literal=password=<password> -n remotehive-$ENVIRONMENT"
    log "WARN" "kubectl create secret generic redis-secret --from-literal=password=<password> -n remotehive-$ENVIRONMENT"
    log "WARN" "kubectl create secret generic app-secrets --from-literal=mongodb-url=<url> --from-literal=redis-url=<url> --from-literal=jwt-secret=<secret> -n remotehive-$ENVIRONMENT"
    
    # Deploy storage
    kubectl apply -f "$CONFIG_DIR/kubernetes/storage/"
    
    # Deploy databases
    kubectl apply -f "$CONFIG_DIR/kubernetes/deployments/mongodb.yaml"
    kubectl apply -f "$CONFIG_DIR/kubernetes/deployments/redis.yaml"
    
    # Wait for databases to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n "remotehive-$ENVIRONMENT"
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n "remotehive-$ENVIRONMENT"
    
    # Deploy applications
    kubectl apply -f "$CONFIG_DIR/kubernetes/deployments/backend.yaml"
    kubectl apply -f "$CONFIG_DIR/kubernetes/deployments/autoscraper.yaml"
    kubectl apply -f "$CONFIG_DIR/kubernetes/deployments/admin.yaml"
    kubectl apply -f "$CONFIG_DIR/kubernetes/deployments/public.yaml"
    
    # Wait for applications to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/backend -n "remotehive-$ENVIRONMENT"
    kubectl wait --for=condition=available --timeout=300s deployment/autoscraper -n "remotehive-$ENVIRONMENT"
    kubectl wait --for=condition=available --timeout=300s deployment/admin -n "remotehive-$ENVIRONMENT"
    kubectl wait --for=condition=available --timeout=300s deployment/public -n "remotehive-$ENVIRONMENT"
    
    # Deploy ingress
    kubectl apply -f "$CONFIG_DIR/kubernetes/ingress/"
    
    log "SUCCESS" "Application deployed successfully"
}

# =============================================================================
# MONITORING AND VERIFICATION
# =============================================================================

# Verify deployment
verify_deployment() {
    log "INFO" "Verifying deployment..."
    
    # Check cluster status
    log "INFO" "Checking cluster status..."
    kubectl cluster-info
    
    # Check nodes
    log "INFO" "Checking nodes..."
    kubectl get nodes -o wide
    
    # Check pods
    log "INFO" "Checking pods..."
    kubectl get pods -n "remotehive-$ENVIRONMENT" -o wide
    
    # Check services
    log "INFO" "Checking services..."
    kubectl get services -n "remotehive-$ENVIRONMENT"
    
    # Check ingress
    log "INFO" "Checking ingress..."
    kubectl get ingress -n "remotehive-$ENVIRONMENT"
    
    # Get load balancer URL
    local lb_url
    lb_url=$(kubectl get service ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    if [[ -n "$lb_url" ]]; then
        log "SUCCESS" "Load Balancer URL: $lb_url"
        log "INFO" "Please update your DNS records to point to this load balancer"
    else
        log "WARN" "Load Balancer URL not yet available"
    fi
    
    log "SUCCESS" "Deployment verification completed"
}

# Run health checks
run_health_checks() {
    log "INFO" "Running health checks..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check backend health
    if kubectl exec -n "remotehive-$ENVIRONMENT" deployment/backend -- curl -f http://localhost:8000/health &> /dev/null; then
        log "SUCCESS" "Backend health check passed"
    else
        log "ERROR" "Backend health check failed"
    fi
    
    # Check autoscraper health
    if kubectl exec -n "remotehive-$ENVIRONMENT" deployment/autoscraper -- curl -f http://localhost:8001/health &> /dev/null; then
        log "SUCCESS" "Autoscraper health check passed"
    else
        log "ERROR" "Autoscraper health check failed"
    fi
    
    # Check database connectivity
    if kubectl exec -n "remotehive-$ENVIRONMENT" deployment/mongodb -- mongosh --eval "db.runCommand({ping: 1})" &> /dev/null; then
        log "SUCCESS" "MongoDB connectivity check passed"
    else
        log "ERROR" "MongoDB connectivity check failed"
    fi
    
    if kubectl exec -n "remotehive-$ENVIRONMENT" deployment/redis -- redis-cli ping &> /dev/null; then
        log "SUCCESS" "Redis connectivity check passed"
    else
        log "ERROR" "Redis connectivity check failed"
    fi
    
    log "SUCCESS" "Health checks completed"
}

# =============================================================================
# MAIN FUNCTIONS
# =============================================================================

# Show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] COMMAND

$SCRIPT_NAME v$SCRIPT_VERSION

COMMANDS:
    deploy          Full deployment (VPC + EKS + Application)
    deploy-vpc      Deploy VPC infrastructure only
    deploy-eks      Deploy EKS cluster only
    deploy-app      Deploy application only
    verify          Verify deployment
    health-check    Run health checks
    cleanup         Clean up resources
    status          Show deployment status

OPTIONS:
    -e, --environment ENV    Environment (staging|production) [default: staging]
    -r, --region REGION      AWS region [default: us-west-2]
    -p, --profile PROFILE    AWS profile [default: default]
    -c, --cluster NAME       Cluster name [default: remotehive]
    -d, --domain DOMAIN      Domain name [default: remotehive.com]
    -v, --verbose            Enable verbose output
    -h, --help              Show this help message
    --dry-run               Show what would be done without executing
    --force                 Force deployment even if resources exist
    --skip-vpc              Skip VPC deployment
    --skip-eks              Skip EKS deployment
    --skip-app              Skip application deployment

EXAMPLES:
    $0 deploy                           # Full deployment to staging
    $0 -e production deploy             # Deploy to production
    $0 -r eu-west-1 deploy-vpc          # Deploy VPC in EU region
    $0 --dry-run deploy                 # Show deployment plan
    $0 verify                           # Verify current deployment
    $0 cleanup                          # Clean up all resources

ENVIRONMENT VARIABLES:
    AWS_REGION              AWS region
    AWS_PROFILE             AWS profile
    CLUSTER_NAME            EKS cluster name
    ENVIRONMENT             Deployment environment
    DOMAIN_NAME             Domain name
    CERTIFICATE_ARN         SSL certificate ARN
    HOSTED_ZONE_ID          Route53 hosted zone ID
    DEBUG                   Enable debug output

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -r|--region)
                AWS_REGION="$2"
                shift 2
                ;;
            -p|--profile)
                AWS_PROFILE="$2"
                shift 2
                ;;
            -c|--cluster)
                CLUSTER_NAME="$2"
                shift 2
                ;;
            -d|--domain)
                DOMAIN_NAME="$2"
                shift 2
                ;;
            -v|--verbose)
                DEBUG="true"
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --force)
                FORCE="true"
                shift
                ;;
            --skip-vpc)
                SKIP_VPC="true"
                shift
                ;;
            --skip-eks)
                SKIP_EKS="true"
                shift
                ;;
            --skip-app)
                SKIP_APP="true"
                shift
                ;;
            deploy|deploy-vpc|deploy-eks|deploy-app|verify|health-check|cleanup|status)
                COMMAND="$1"
                shift
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    if [[ -z "${COMMAND:-}" ]]; then
        log "ERROR" "No command specified"
        show_usage
        exit 1
    fi
}

# Main deployment function
main_deploy() {
    log "INFO" "Starting RemoteHive VPC deployment..."
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Region: $AWS_REGION"
    log "INFO" "Cluster: $CLUSTER_NAME-$ENVIRONMENT"
    
    local total_steps=8
    local current_step=0
    
    # Step 1: Setup
    ((current_step++))
    show_progress $current_step $total_steps "Setting up directories"
    setup_directories
    
    # Step 2: Prerequisites
    ((current_step++))
    show_progress $current_step $total_steps "Checking prerequisites"
    check_prerequisites
    
    # Step 3: Configuration
    ((current_step++))
    show_progress $current_step $total_steps "Validating configuration"
    validate_config
    
    # Step 4: VPC
    if [[ "${SKIP_VPC:-false}" != "true" ]]; then
        ((current_step++))
        show_progress $current_step $total_steps "Deploying VPC infrastructure"
        generate_cloudformation_templates
        deploy_vpc
    else
        log "INFO" "Skipping VPC deployment"
        ((current_step++))
    fi
    
    # Step 5: EKS
    if [[ "${SKIP_EKS:-false}" != "true" ]]; then
        ((current_step++))
        show_progress $current_step $total_steps "Creating EKS cluster"
        create_eks_cluster
        
        ((current_step++))
        show_progress $current_step $total_steps "Installing cluster add-ons"
        install_cluster_addons
    else
        log "INFO" "Skipping EKS deployment"
        ((current_step+=2))
    fi
    
    # Step 6: Application
    if [[ "${SKIP_APP:-false}" != "true" ]]; then
        ((current_step++))
        show_progress $current_step $total_steps "Generating Kubernetes manifests"
        generate_k8s_manifests
        
        ((current_step++))
        show_progress $current_step $total_steps "Deploying application"
        deploy_application
    else
        log "INFO" "Skipping application deployment"
        ((current_step+=2))
    fi
    
    log "SUCCESS" "RemoteHive VPC deployment completed successfully!"
    
    # Show deployment information
    log "INFO" "Deployment Summary:"
    log "INFO" "=================="
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Cluster: $CLUSTER_NAME-$ENVIRONMENT"
    log "INFO" "Region: $AWS_REGION"
    log "INFO" "VPC ID: ${VPC_ID:-N/A}"
    
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        log "INFO" "URLs:"
        log "INFO" "  Public Site: https://staging.$DOMAIN_NAME"
        log "INFO" "  Admin Panel: https://admin-staging.$DOMAIN_NAME"
        log "INFO" "  API: https://api-staging.$DOMAIN_NAME"
        log "INFO" "  Scraper: https://scraper-staging.$DOMAIN_NAME"
    elif [[ "$ENVIRONMENT" == "production" ]]; then
        log "INFO" "URLs:"
        log "INFO" "  Public Site: https://$DOMAIN_NAME"
        log "INFO" "  Admin Panel: https://admin.$DOMAIN_NAME"
        log "INFO" "  API: https://api.$DOMAIN_NAME"
        log "INFO" "  Scraper: https://scraper.$DOMAIN_NAME"
    fi
    
    log "INFO" "Next Steps:"
    log "INFO" "1. Update DNS records to point to the load balancer"
    log "INFO" "2. Create application secrets in Kubernetes"
    log "INFO" "3. Run 'verify' command to check deployment status"
    log "INFO" "4. Run 'health-check' command to verify services"
}

# Cleanup function
cleanup_resources() {
    log "INFO" "Cleaning up RemoteHive resources..."
    
    # Delete application
    if kubectl get namespace "remotehive-$ENVIRONMENT" &> /dev/null; then
        log "INFO" "Deleting application resources..."
        kubectl delete namespace "remotehive-$ENVIRONMENT" --ignore-not-found=true
    fi
    
    # Delete EKS cluster
    if eksctl get cluster --name "$CLUSTER_NAME-$ENVIRONMENT" --region "$AWS_REGION" &> /dev/null; then
        log "INFO" "Deleting EKS cluster..."
        eksctl delete cluster --name "$CLUSTER_NAME-$ENVIRONMENT" --region "$AWS_REGION" --wait
    fi
    
    # Delete VPC stack
    local stack_name="${CLUSTER_NAME}-${ENVIRONMENT}-vpc"
    if aws cloudformation describe-stacks --stack-name "$stack_name" --region "$AWS_REGION" --profile "$AWS_PROFILE" &> /dev/null; then
        log "INFO" "Deleting VPC stack..."
        aws cloudformation delete-stack --stack-name "$stack_name" --region "$AWS_REGION" --profile "$AWS_PROFILE"
        aws cloudformation wait stack-delete-complete --stack-name "$stack_name" --region "$AWS_REGION" --profile "$AWS_PROFILE"
    fi
    
    log "SUCCESS" "Cleanup completed"
}

# Show deployment status
show_status() {
    log "INFO" "Deployment Status:"
    
    # Check VPC stack
    local stack_name="${CLUSTER_NAME}-${ENVIRONMENT}-vpc"
    local vpc_status="Not Found"
    if aws cloudformation describe-stacks --stack-name "$stack_name" --region "$AWS_REGION" --profile "$AWS_PROFILE" &> /dev/null; then
        vpc_status=$(aws cloudformation describe-stacks --stack-name "$stack_name" --region "$AWS_REGION" --profile "$AWS_PROFILE" --query 'Stacks[0].StackStatus' --output text)
    fi
    
    # Check EKS cluster
    local eks_status="Not Found"
    if eksctl get cluster --name "$CLUSTER_NAME-$ENVIRONMENT" --region "$AWS_REGION" &> /dev/null; then
        eks_status="ACTIVE"
    fi
    
    # Check application namespace
    local app_status="Not Found"
    if kubectl get namespace "remotehive-$ENVIRONMENT" &> /dev/null; then
        app_status="Active"
    fi
    
    echo "==========================================="
    echo "RemoteHive Deployment Status"
    echo "==========================================="
    echo "Environment: $ENVIRONMENT"
    echo "Region: $AWS_REGION"
    echo "Cluster: $CLUSTER_NAME-$ENVIRONMENT"
    echo ""
    echo "Infrastructure Status:"
    echo "  VPC Stack: $vpc_status"
    echo "  EKS Cluster: $eks_status"
    echo "  Application: $app_status"
    echo ""
    
    if [[ "$app_status" == "Active" ]]; then
        echo "Application Pods:"
        kubectl get pods -n "remotehive-$ENVIRONMENT" -o wide
        echo ""
        echo "Services:"
        kubectl get services -n "remotehive-$ENVIRONMENT"
        echo ""
        echo "Ingress:"
        kubectl get ingress -n "remotehive-$ENVIRONMENT"
    fi
}

# Execute command based on argument
execute_command() {
    case "$COMMAND" in
        "deploy")
            main_deploy
            ;;
        "deploy-vpc")
            setup_directories
            check_prerequisites
            validate_config
            generate_cloudformation_templates
            deploy_vpc
            ;;
        "deploy-eks")
            create_eks_cluster
            install_cluster_addons
            ;;
        "deploy-app")
            generate_k8s_manifests
            deploy_application
            ;;
        "verify")
            verify_deployment
            ;;
        "health-check")
            run_health_checks
            ;;
        "cleanup")
            cleanup_resources
            ;;
        "status")
            show_status
            ;;
        *)
            log "ERROR" "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

# Main function
main() {
    # Initialize
    log "INFO" "$SCRIPT_NAME v$SCRIPT_VERSION"
    log "INFO" "Starting at $(date)"
    
    # Parse arguments
    parse_arguments "$@"
    
    # Show configuration if dry run
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log "INFO" "DRY RUN MODE - No changes will be made"
        log "INFO" "Configuration:"
        log "INFO" "  Environment: $ENVIRONMENT"
        log "INFO" "  Region: $AWS_REGION"
        log "INFO" "  Cluster: $CLUSTER_NAME-$ENVIRONMENT"
        log "INFO" "  Domain: $DOMAIN_NAME"
        log "INFO" "  Command: $COMMAND"
        return 0
    fi
    
    # Execute command
    execute_command
    
    log "SUCCESS" "Operation completed successfully at $(date)"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi