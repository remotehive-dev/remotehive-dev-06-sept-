# RemoteHive Migration Package

A comprehensive migration and deployment solution for the RemoteHive job board platform, featuring enterprise-grade security, monitoring, high availability, and real-time synchronization capabilities.

## 🚀 Features

- **🔒 Enterprise Security**: RBAC, network policies, security scanning, and encrypted communications
- **📊 Comprehensive Monitoring**: Prometheus metrics, Grafana dashboards, and centralized logging
- **🏗️ High Availability**: Multi-replica deployments, auto-scaling, and fault tolerance
- **⚡ Real-time Sync**: IDE-to-production synchronization with file watching and webhooks
- **🔄 CI/CD Pipeline**: Automated testing, building, and deployment via GitHub Actions
- **🐳 Containerization**: Docker and Kubernetes-native deployment

## 📋 Prerequisites

### Required Tools
- **Kubernetes Cluster** (v1.24+)
- **kubectl** (configured with cluster access)
- **Docker** (v20.10+)
- **Helm** (v3.8+)
- **Git**

### System Requirements
- **CPU**: 4+ cores recommended
- **Memory**: 8GB+ RAM
- **Storage**: 50GB+ available space
- **Network**: Stable internet connection

### Access Requirements
- Kubernetes cluster admin access
- Docker registry push permissions
- SSH access to remote servers (if applicable)

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    RemoteHive Platform                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend Services          │  Backend Services             │
│  ├── Admin Panel (Next.js)  │  ├── Main API (FastAPI)      │
│  └── Public Site (React)    │  ├── Autoscraper Service     │
│                              │  └── Background Workers      │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Services                                    │
│  ├── MongoDB (Primary DB)   │  ├── Redis (Cache/Queue)     │
│  ├── Prometheus (Metrics)   │  ├── Grafana (Dashboards)    │
│  ├── Fluentd (Logging)      │  └── Sync Service (Real-time)│
├─────────────────────────────────────────────────────────────┤
│  Security & Networking                                      │
│  ├── NGINX Ingress          │  ├── Network Policies        │
│  ├── TLS Certificates       │  └── RBAC Controls           │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Package Structure

```
RemoteHive_Migration_Package/
├── 📄 README.md                    # This documentation
├── 🚀 setup-migration.sh           # Main setup script
├── 🧪 test-deployment.sh           # Deployment testing script
├── 📊 monitoring-config.yml        # Monitoring stack configuration
├── 🏗️ ha-config.yml               # High availability configuration
├── ⚡ realtime-sync.yml            # Real-time sync configuration
├── 🔄 .github/workflows/deploy.yml # CI/CD pipeline
├── 🐳 docker-compose.remotehive.yml # Docker Compose for remote setup
├── 📁 sync-service/                # Real-time sync service
│   ├── 🐍 main.py                  # Sync service application
│   ├── 📋 requirements.txt         # Python dependencies
│   └── 🐳 Dockerfile               # Container configuration
└── 📁 docs/                        # Additional documentation
```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the migration package
git clone <repository-url>
cd RemoteHive_Migration_Package

# Make setup script executable
chmod +x setup-migration.sh

# Run full setup
./setup-migration.sh
```

### 2. Configure Secrets

The setup script will prompt for:
- Docker registry credentials
- Database passwords (auto-generated)
- JWT secrets (auto-generated)

### 3. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n remotehive

# Get service URLs
./setup-migration.sh urls

# Run deployment tests
./setup-migration.sh test
```

## 🔧 Configuration

### Environment Variables

Key environment variables for customization:

```bash
# Kubernetes Configuration
export NAMESPACE="remotehive"
export REGISTRY="ghcr.io/remotehive"

# Remote Server Configuration
export REMOTE_HOST="210.79.129.193"
export REMOTE_USER="ubuntu"
export SSH_KEY="./remotehive_key_new"

# Monitoring Configuration
export PROMETHEUS_RETENTION="30d"
export GRAFANA_ADMIN_PASSWORD="<secure-password>"

# Sync Service Configuration
export SYNC_MODE="hybrid"  # webhook, polling, hybrid
export MAX_DEPLOYMENTS_PER_HOUR="10"
```

### Service Configuration

#### Monitoring Stack
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization dashboards
- **Fluentd**: Log aggregation and forwarding

#### High Availability
- **Auto-scaling**: HPA based on CPU/memory
- **Pod Disruption Budgets**: Maintain service availability
- **Multi-replica Deployments**: Fault tolerance

#### Real-time Sync
- **File Watching**: Monitor code changes
- **Webhook Support**: Git provider integration
- **Deployment Queue**: Managed deployment pipeline

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The included workflow provides:

1. **Testing Phase**
   - Unit and integration tests
   - Code quality checks
   - Security scanning

2. **Build Phase**
   - Multi-platform Docker images
   - Container registry push
   - Image vulnerability scanning

3. **Deploy Phase**
   - Staging deployment
   - Production deployment (manual approval)
   - Health checks and rollback

### Setup GitHub Secrets

```bash
# Required secrets in GitHub repository
KUBE_CONFIG          # Base64 encoded kubeconfig
DOCKER_USERNAME      # Container registry username
DOCKER_PASSWORD      # Container registry password
SLACK_WEBHOOK_URL    # Slack notifications (optional)
```

## 📊 Monitoring and Observability

### Metrics Collection

- **Application Metrics**: Custom business metrics
- **Infrastructure Metrics**: CPU, memory, disk, network
- **Kubernetes Metrics**: Pod status, resource usage
- **Custom Alerts**: Performance and availability thresholds

### Dashboards

- **Overview Dashboard**: System health and key metrics
- **Application Dashboard**: Service-specific metrics
- **Infrastructure Dashboard**: Cluster and node metrics
- **Security Dashboard**: Security events and compliance

### Log Management

- **Centralized Logging**: All services log to Fluentd
- **Log Parsing**: Structured JSON logs
- **Log Retention**: Configurable retention policies
- **Log Search**: Integrated with monitoring stack

## 🔒 Security Features

### Network Security
- **Network Policies**: Micro-segmentation
- **TLS Encryption**: End-to-end encryption
- **Ingress Security**: WAF and rate limiting

### Access Control
- **RBAC**: Role-based access control
- **Service Accounts**: Least privilege principle
- **Secret Management**: Encrypted secret storage

### Security Scanning
- **Container Scanning**: Vulnerability detection
- **Code Scanning**: Static analysis (Bandit)
- **Dependency Scanning**: Known vulnerability checks

## ⚡ Real-time Synchronization

### File Watching

```yaml
# Example watcher configuration
watchers:
  - name: backend-api
    path: /app
    patterns:
      - "*.py"
      - "*.yml"
    exclude:
      - "__pycache__"
      - "*.pyc"
    actions:
      - type: build
        dockerfile: Dockerfile
      - type: deploy
        service: backend-api
```

### Webhook Integration

```bash
# Configure webhook URL in your Git provider
Webhook URL: https://sync-service.remotehive.com/webhook
Content Type: application/json
Events: push, pull_request
```

### Manual Deployment

```bash
# Trigger manual deployment
curl -X POST https://sync-service.remotehive.com/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "service": "backend-api",
    "branch": "main",
    "triggered_by": "manual"
  }'
```

## 🧪 Testing

### Automated Tests

```bash
# Run all tests
./test-deployment.sh

# Run specific test categories
./test-deployment.sh --category security
./test-deployment.sh --category monitoring
./test-deployment.sh --category connectivity
```

### Manual Testing

```bash
# Check service health
kubectl get pods -n remotehive
kubectl get svc -n remotehive

# Test connectivity
kubectl exec -it <pod-name> -- curl http://backend-api:8000/health

# Check logs
kubectl logs -f deployment/backend-api -n remotehive
```

## 🔧 Troubleshooting

### Common Issues

#### Pod Startup Issues
```bash
# Check pod status
kubectl describe pod <pod-name> -n remotehive

# Check logs
kubectl logs <pod-name> -n remotehive --previous

# Check events
kubectl get events -n remotehive --sort-by='.lastTimestamp'
```

#### Network Connectivity
```bash
# Test DNS resolution
kubectl exec -it <pod-name> -- nslookup kubernetes.default

# Test service connectivity
kubectl exec -it <pod-name> -- curl http://<service-name>:<port>/health

# Check network policies
kubectl get networkpolicy -n remotehive
```

#### Resource Issues
```bash
# Check resource usage
kubectl top pods -n remotehive
kubectl top nodes

# Check resource quotas
kubectl describe quota -n remotehive

# Check limits and requests
kubectl describe pod <pod-name> -n remotehive | grep -A 5 "Limits\|Requests"
```

## 📚 Additional Resources

### Documentation
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

### Best Practices
- [12-Factor App Methodology](https://12factor.net/)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [Container Security Best Practices](https://sysdig.com/blog/dockerfile-best-practices/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

---

**RemoteHive Migration Package** - Enterprise-grade deployment solution for modern job board platforms.

## 🛠️ Tech Stack

### Backend API

- **Framework**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + JWT
- **Task Queue**: Celery with Redis
- **Monitoring**: Flower for Celery monitoring

### Public Website

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7.0.4
- **Styling**: Tailwind CSS 3.4.17
- **Animations**: Framer Motion 12.23.6
- **Routing**: React Router DOM 7.6.3
- **Icons**: Lucide React 0.525.0

### Admin Panel

- **Framework**: Next.js 15.4.1 + TypeScript
- **UI Components**: Radix UI + Tailwind CSS
- **Charts**: Recharts 2.10.0
- **Animations**: Framer Motion 12.23.6
- **Date Handling**: date-fns 3.3.1

## 📁 Project Structure

```
RemoteHive/
├── app/                          # Backend API (FastAPI)
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py
│   │       │   ├── users.py
│   │       │   ├── jobs.py
│   │       │   ├── employers.py
│   │       │   ├── applications.py
│   │       │   ├── admin.py
│   │       │   └── scraper.py
│   │       └── api.py
│   ├── core/
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── tasks/
├── remotehive-public/            # Public Website (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── lib/
│   │   ├── assets/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env
├── remotehive-admin/             # Admin Panel (Next.js)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── lib/
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── .env.local
├── main.py                       # Backend entry point
├── requirements.txt              # Python dependencies
├── .env                          # Backend environment variables
├── .env.example
└── startup_scripts/              # Startup scripts
    ├── start_all.bat
    ├── start_all.sh
    ├── start_backend.bat
    ├── start_backend.sh
    ├── start_public.bat
    ├── start_public.sh
    ├── start_admin.bat
    └── start_admin.sh
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (for frontend applications)
- **Python 3.11+** (for backend API)
- **Supabase account** (for authentication and database)
- **Redis** (for background tasks - optional)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd RemoteHive
```

### 2. Environment Configuration

#### Backend API (.env)

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Secret
SECRET_KEY=your-super-secret-jwt-key-here

# Redis (optional - for background tasks)
REDIS_URL=redis://localhost:6379
```

#### Public Website (remotehive-public/.env)

```bash
cd remotehive-public
cp .env.example .env
```

Edit `.env` with your configuration:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:8000
```

#### Admin Panel (remotehive-admin/.env.local)

```bash
cd remotehive-admin
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Installation & Setup

#### Option A: Use Startup Scripts (Recommended)

**Start All Services:**

```bash
# Windows
.\startup_scripts\start_all.bat

# Linux/macOS (make executable first)
chmod +x startup_scripts/*.sh
./startup_scripts/start_all.sh
```

**Start Individual Services:**

```bash
# Backend API only
.\startup_scripts\start_backend.bat    # Windows
./startup_scripts/start_backend.sh     # Linux/macOS

# Public Website only
.\startup_scripts\start_website.bat    # Windows
./startup_scripts/start_website.sh     # Linux/macOS

# Admin Panel only
.\startup_scripts\start_admin.bat      # Windows
./startup_scripts/start_admin.sh       # Linux/macOS
```

> 📁 **See `startup_scripts/README.md` for detailed usage instructions and troubleshooting.**

#### Option B: Manual Setup

**Backend API:**

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Public Website:**

```bash
cd remotehive-public
npm install
npm run dev
```

**Admin Panel:**

```bash
cd remotehive-admin
npm install
npm run dev
```

### 4. Access the Applications

- **🌐 Public Website**: http://localhost:5173
- **⚙️ Admin Panel**: http://localhost:3000
- **🔧 Backend API**: http://localhost:8000
- **📚 API Documentation**: http://localhost:8000/docs
- **🩺 API Health Check**: http://localhost:8000/health
- **🔐 Authentication Test**: http://localhost:8000/api/v1/rbac-auth/profile (requires login)

### 5. Testing Authentication

To test the RBAC authentication system:

1. **Login**: `POST http://localhost:8000/api/v1/rbac-auth/login`
2. **Get Profile**: `GET http://localhost:8000/api/v1/rbac-auth/profile` (with Bearer token)
3. **Use Demo Accounts**:
   - Job Seeker: `ranjeettiwari105@gmail.com` / `Ranjeet11$`
   - Employer: `ranjeettiwary589@gmail.com` / `Ranjeet11$`
   - Admin: `admin@remotehive.in` / `Ranjeet11$`

## 🔐 Admin Credentials

**IMPORTANT: Single Admin Account**

There is only ONE admin credential for accessing the system:

- **Email:** `admin@remotehive.in`
- **Password:** `Ranjeet11$`

This credential provides access to:

- Admin panel at `/admin`
- All administrative API endpoints
- User management and system configuration

**Note:** All other admin credentials (especially any with `.com` domains) have been removed from the system.

## 🛠️ Development

### Recent Updates

**Authentication System Improvements:**

- Fixed Pydantic validation error for UUID handling in user profiles
- Implemented proper RBAC (Role-Based Access Control) system
- Updated API endpoints to use `/rbac-auth/` prefix for authentication routes
- Enhanced user profile endpoint with permission management
- Resolved server routing and debugging issues

### Project Structure

```
RemoteHive/
├── app/                     # Backend API (FastAPI)
│   ├── main.py             # Application entry point
│   ├── api/v1/             # API version 1
│   │   ├── endpoints/      # API endpoint handlers
│   │   │   ├── auth_endpoints.py  # RBAC authentication endpoints
│   │   │   ├── users.py    # User management
│   │   │   ├── jobs.py     # Job management
│   │   │   └── ...         # Other endpoints
│   │   └── api.py          # API router configuration
│   ├── core/               # Core functionality
│   │   ├── auth.py         # Authentication logic
│   │   ├── config.py       # Configuration settings
│   │   ├── database.py     # Database connection
│   │   └── security.py     # Security utilities
│   ├── database/           # Database models and schemas
│   │   └── models.py       # SQLAlchemy models with UUID support
│   ├── schemas/            # Pydantic schemas
│   ├── services/           # Business logic
│   └── utils/              # Utility functions
├── remotehive-public/       # Public Website (React + Vite)
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   ├── package.json        # Dependencies
│   └── vite.config.ts      # Vite configuration
├── remotehive-admin/        # Admin Panel (Next.js)
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── lib/                # Utility libraries
│   ├── package.json        # Dependencies
│   └── next.config.js      # Next.js configuration
├── startup_scripts/         # Startup scripts for all platforms
│   ├── start_all.bat/.sh   # Start all services
│   ├── start_backend.bat/.sh
│   ├── start_website.bat/.sh
│   ├── start_admin.bat/.sh
│   └── README.md           # Script usage guide
├── requirements.txt         # Python dependencies
├── .env.example            # Environment template
└── README.md               # This file
```

### Development Workflow

1. **Setup Environment**: Configure `.env` files for all applications
2. **Install Dependencies**: Use startup scripts or manual installation
3. **Start Services**: Use `start_all.bat/.sh` or individual scripts
4. **Development**: Make changes and test across all applications
5. **Testing**: Each application has its own testing setup

### Dependencies Overview

#### Backend API (Python)

- **FastAPI 0.104.1**: Modern web framework for APIs
- **Uvicorn 0.24.0**: ASGI server with standard extras
- **Supabase 2.0.2**: Authentication and database client
- **Pydantic 2.5.0**: Data validation and settings
- **Celery 5.3.4 + Redis 5.0.1**: Background task processing
- **Loguru 0.7.2**: Advanced structured logging
- **Python-Jose 3.3.0**: JWT token handling
- **Passlib**: Password hashing with bcrypt
- **HTTPX 0.25.2**: Async HTTP client
- **Jinja2 3.1.2**: Email template rendering

#### Public Website (React + Vite)

- **React 19.1.0**: Modern UI framework
- **Vite 7.0.4**: Fast build tool and dev server
- **React Router DOM 7.6.3**: Client-side routing
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Framer Motion 12.23.6**: Smooth animations
- **Supabase JS 2.51.0**: Client library for authentication
- **Lucide React 0.525.0**: Beautiful icon library
- **React Hot Toast 2.5.2**: Toast notifications
- **TypeScript**: Type safety and better DX

#### Admin Panel (Next.js)

- **Next.js 15.4.1**: React framework with SSR/SSG
- **Radix UI**: Accessible, unstyled component primitives
- **Tailwind CSS 3.4.17**: Utility-first styling
- **Recharts 2.10.0**: Composable charting library
- **Supabase JS 2.51.0**: Authentication client
- **Framer Motion 12.23.6**: Animation library
- **Date-fns 3.3.1**: Modern date utility library
- **Class Variance Authority**: Component variant management
- **TypeScript**: Enhanced development experience

## API Endpoints

### Authentication (RBAC)

- `POST /api/v1/rbac-auth/register` - User registration
- `POST /api/v1/rbac-auth/login` - User login with role-based access
- `GET /api/v1/rbac-auth/profile` - Get current user profile with permissions
- `POST /api/v1/rbac-auth/logout` - User logout

### Users

- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile
- `GET /api/v1/users/` - List users (admin only)
- `GET /api/v1/users/stats` - User statistics (admin only)

### Jobs

- `POST /api/v1/jobs/` - Create job post
- `GET /api/v1/jobs/` - List job posts
- `GET /api/v1/jobs/search` - Advanced job search
- `GET /api/v1/jobs/my-jobs` - Get employer's jobs
- `PUT /api/v1/jobs/{job_id}` - Update job post
- `DELETE /api/v1/jobs/{job_id}` - Delete job post

### Applications

- `POST /api/v1/applications/` - Submit job application
- `GET /api/v1/applications/my-applications` - Get user's applications
- `GET /api/v1/applications/received` - Get received applications (employer)

### Admin

- `GET /api/v1/admin/dashboard` - Admin dashboard
- `GET /api/v1/admin/system-health` - System health status
- `POST /api/v1/admin/users/{user_id}/verify` - Verify user



## User Roles

1. **super_admin**: Full system access
2. **admin**: Administrative functions
3. **employer**: Job posting and application management
4. **job_seeker**: Job search and application submission

## Database Schema

### Core Tables

- `users` - User accounts and profiles
- `employers` - Employer company information
- `job_seekers` - Job seeker profiles
- `job_posts` - Job postings
- `job_applications` - Job applications

## Development

### Local Development Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL and Redis (via Docker)
docker-compose up -d db redis

# Run the application
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Database Management

#### Initial Database Setup

For first-time setup, run the database setup script to create tables and demo users:

```bash
# Ensure your .env file has Supabase credentials configured
# Run the database setup script
python setup_database.py
```

This script will:

- Create all required database tables (users, job_seekers, employers, job_posts, job_applications)
- Set up Row Level Security (RLS) policies
- Create demo accounts:
  - `ranjeettiwari105@gmail.com` (password: `Ranjeet11$`)
  - `ranjeettiwary589@gmail.com` (password: `Ranjeet11$`)
  - `admin@remotehive.in` (password: `Ranjeet11$`)

**Note**: If the script indicates "MANUAL SETUP REQUIRED", follow these steps:

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase_schema.sql`
4. Run the SQL script
5. Run `python setup_database.py` again to verify setup

#### Manual Database Management

Database schema and tables can also be managed directly through Supabase:

- Tables are created and managed via Supabase Dashboard
- Use Supabase SQL Editor for direct database operations
- The complete schema is available in `supabase_schema.sql`

## Production Deployment

### Environment Variables

Ensure all production environment variables are set:

```env
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your-production-secret-key
DATABASE_URL=your-production-database-url
SUPABASE_URL=your-production-supabase-url
# ... other production configs
```

### Docker Production Build

```bash
# Build production image
docker build -t remotehive-api:latest .

# Run with production compose
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring and Logging

- **Application Logs**: Structured logging with Loguru
- **Celery Monitoring**: Flower dashboard at http://localhost:5555
- **Health Checks**: Built-in health check endpoints
- **Database Monitoring**: PostgreSQL logs and metrics

## Security Features

- **JWT Token Authentication**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Granular permission system
- **UUID Support**: Proper handling of UUID identifiers in user profiles
- **Password Hashing**: Secure password storage with bcrypt
- **Input Validation**: Comprehensive validation with Pydantic
- **SQL Injection Prevention**: Protected queries with SQLAlchemy
- **CORS Configuration**: Cross-origin resource sharing setup
- **Supabase Integration**: Enterprise-grade authentication backend
- **Rate Limiting**: (to be implemented)

## Troubleshooting

### Common Issues

**1. Internal Server Error on Profile Endpoint**

- **Issue**: Pydantic validation error for UUID fields
- **Solution**: Ensure `UserProfileResponse.id` field is defined as `str` not `int`
- **Fix**: Update schema definitions to handle UUID strings properly

**2. 404 Not Found for Authentication Endpoints**

- **Issue**: Endpoints not accessible at expected URLs
- **Solution**: Use correct routing prefix `/api/v1/rbac-auth/`
- **Example**: Use `/api/v1/rbac-auth/profile` instead of `/profile`

**3. Server Not Reloading Changes**

- **Issue**: Code changes not reflected after modification
- **Solution**: Restart server with `--reload` flag
- **Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

**4. Debug Logs Not Appearing**

- **Issue**: Print statements or debug logs not visible
- **Solution**: Check server console output and ensure proper logging setup
- **Tip**: Use structured logging with Loguru for better debugging

**5. Database Connection Issues**

- **Issue**: Cannot connect to Supabase database
- **Solution**: Verify `.env` file has correct Supabase credentials
- **Check**: Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for error details
3. Verify environment configuration
4. Test with demo accounts provided
5. Open an issue with detailed error information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
