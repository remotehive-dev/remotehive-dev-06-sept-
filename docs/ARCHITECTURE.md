# RemoteHive Architecture Documentation

## System Overview

RemoteHive is a modern, scalable job board platform built with a microservices architecture. The system is designed to handle high traffic, provide real-time job matching, and support automated job scraping from multiple sources.

### Architecture Principles

- **Microservices Architecture**: Loosely coupled services with clear boundaries
- **API-First Design**: RESTful APIs with OpenAPI documentation
- **Async Processing**: Background tasks for heavy operations
- **Caching Strategy**: Multi-layer caching for performance
- **Scalability**: Horizontal scaling capabilities
- **Security**: JWT-based authentication with role-based access control

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer / CDN                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                    Frontend Layer                               │
├─────────────────────────┬───────────────────────────────────────┤
│  Admin Panel (Next.js)  │    Public Website (React + Vite)     │
│      Port: 3000         │           Port: 5173                  │
└─────────────────────────┴───────────────────────────────────────┘
                          │
                          │ HTTP/HTTPS
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                    API Gateway Layer                            │
├─────────────────────────┬───────────────────────────────────────┤
│   Main Backend API      │      Autoscraper Service             │
│   (FastAPI + MongoDB)   │      (FastAPI + SQLite)              │
│      Port: 8000         │           Port: 8001                  │
└─────────────────────────┴───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                   Background Services                           │
├─────────────────────────┬───────────────────────────────────────┤
│    Celery Workers       │       Celery Beat Scheduler          │
│   (Task Processing)     │      (Cron Jobs & Alerts)            │
└─────────────────────────┴───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                     Data Layer                                  │
├─────────────────┬───────────────────┬───────────────────────────┤
│   MongoDB       │      SQLite       │         Redis             │
│ (Primary DB)    │  (Autoscraper)    │   (Cache & Queues)        │
│   Port: 27017   │                   │      Port: 6379           │
└─────────────────┴───────────────────┴───────────────────────────┘
```

---

## Service Architecture

### 1. Main Backend API Service

**Technology Stack**:
- **Framework**: FastAPI (Python 3.11+)
- **Database**: MongoDB with Beanie ODM
- **Authentication**: JWT with role-based access control
- **Documentation**: Auto-generated OpenAPI/Swagger
- **Testing**: pytest with async support

**Service Structure**:
```
app/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration management
├── api/                   # API layer
│   ├── api.py            # Main API router
│   ├── deps.py           # Dependencies (auth, db)
│   └── endpoints/        # Feature-specific endpoints
│       ├── auth.py       # Authentication endpoints
│       ├── users.py      # User management
│       ├── jobs.py       # Job management
│       ├── employers.py  # Employer operations
│       ├── applications.py # Job applications
│       └── admin.py      # Admin operations
├── models/               # Data models
│   ├── mongodb_models.py # MongoDB/Beanie models
│   └── schemas.py        # Pydantic request/response schemas
├── services/             # Business logic layer
│   ├── auth_service.py   # Authentication logic
│   ├── user_service.py   # User operations
│   ├── job_service.py    # Job operations
│   ├── email_service.py  # Email notifications
│   └── search_service.py # Search and filtering
├── database/             # Database utilities
│   ├── database.py       # MongoDB connection
│   └── migrations.py     # Database migrations
├── middleware/           # Custom middleware
│   ├── cors.py          # CORS handling
│   ├── auth.py          # JWT middleware
│   └── logging.py       # Request logging
├── core/                 # Core utilities
│   ├── security.py      # Password hashing, JWT
│   ├── config.py        # Settings management
│   └── exceptions.py    # Custom exceptions
└── tasks/               # Background tasks
    ├── celery_app.py    # Celery configuration
    ├── email_tasks.py   # Email sending tasks
    └── job_tasks.py     # Job processing tasks
```

**Key Features**:
- RESTful API design with proper HTTP status codes
- Async/await for database operations
- Comprehensive input validation with Pydantic
- Role-based access control (RBAC)
- Rate limiting and security middleware
- Background task processing with Celery
- Full-text search capabilities
- File upload handling for resumes/documents

### 2. Autoscraper Service

**Technology Stack**:
- **Framework**: FastAPI (Python 3.11+)
- **Database**: SQLite with SQLAlchemy ORM
- **Scraping**: BeautifulSoup4, Selenium, Requests
- **Scheduling**: APScheduler
- **Data Processing**: Pandas for data normalization

**Service Structure**:
```
autoscraper-service/
├── app/
│   ├── main.py           # FastAPI application
│   ├── config.py         # Configuration
│   ├── models/           # SQLAlchemy models
│   ├── scrapers/         # Scraping engines
│   │   ├── base.py       # Base scraper class
│   │   ├── indeed.py     # Indeed scraper
│   │   ├── linkedin.py   # LinkedIn scraper
│   │   └── remote_ok.py  # Remote OK scraper
│   ├── processors/       # Data processing
│   │   ├── normalizer.py # Job data normalization
│   │   ├── deduplicator.py # Duplicate detection
│   │   └── validator.py  # Data validation
│   ├── scheduler/        # Job scheduling
│   │   ├── scheduler.py  # APScheduler setup
│   │   └── jobs.py       # Scheduled job definitions
│   └── api/             # API endpoints
│       ├── scraper.py    # Scraper management
│       ├── jobs.py       # Job data access
│       └── health.py     # Health checks
├── database.db          # SQLite database
└── logs/               # Scraping logs
```

**Key Features**:
- Multi-source job scraping (Indeed, LinkedIn, Remote OK, etc.)
- Intelligent duplicate detection
- Data normalization and validation
- Configurable scraping schedules
- Rate limiting to respect source websites
- Error handling and retry mechanisms
- Comprehensive logging and monitoring

### 3. Admin Panel (Frontend)

**Technology Stack**:
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **UI Components**: Custom components + Headless UI

**Application Structure**:
```
remotehive-admin/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Dashboard page
│   │   ├── login/        # Authentication pages
│   │   ├── users/        # User management
│   │   ├── jobs/         # Job management
│   │   ├── employers/    # Employer management
│   │   ├── applications/ # Application management
│   │   └── settings/     # System settings
│   ├── components/       # Reusable components
│   │   ├── ui/          # Base UI components
│   │   ├── forms/       # Form components
│   │   ├── tables/      # Data table components
│   │   └── charts/      # Analytics charts
│   ├── lib/             # Utilities and services
│   │   ├── api.ts       # API service layer
│   │   ├── auth.ts      # Authentication utilities
│   │   ├── utils.ts     # Helper functions
│   │   └── validations.ts # Form validations
│   ├── stores/          # Zustand stores
│   │   ├── auth.ts      # Authentication state
│   │   ├── users.ts     # User management state
│   │   └── jobs.ts      # Job management state
│   ├── types/           # TypeScript type definitions
│   └── styles/          # Global styles
├── public/              # Static assets
└── next.config.js       # Next.js configuration
```

**Key Features**:
- Server-side rendering (SSR) for better SEO
- Real-time dashboard with analytics
- Comprehensive user and job management
- Role-based access control
- Responsive design for mobile/tablet
- Form validation and error handling
- Data export capabilities

### 4. Public Website (Frontend)

**Technology Stack**:
- **Framework**: React 19+ with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer
- **HTTP Client**: Axios
- **Routing**: React Router v6

**Application Structure**:
```
remotehive-public/
├── src/
│   ├── components/       # Reusable components
│   │   ├── common/      # Common UI components
│   │   ├── job/         # Job-related components
│   │   ├── user/        # User profile components
│   │   └── forms/       # Form components
│   ├── pages/           # Page components
│   │   ├── Home.tsx     # Landing page
│   │   ├── Jobs.tsx     # Job listings
│   │   ├── JobDetail.tsx # Job details
│   │   ├── Profile.tsx  # User profile
│   │   └── Auth.tsx     # Authentication
│   ├── contexts/        # React contexts
│   │   ├── AuthContext.tsx # Authentication state
│   │   ├── JobContext.tsx  # Job search state
│   │   └── ThemeContext.tsx # Theme management
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts   # Authentication hook
│   │   ├── useJobs.ts   # Job search hook
│   │   └── useApi.ts    # API interaction hook
│   ├── lib/             # Utilities and services
│   │   ├── api.ts       # API service layer
│   │   ├── auth.ts      # Authentication utilities
│   │   └── utils.ts     # Helper functions
│   ├── types/           # TypeScript definitions
│   └── styles/          # Component styles
├── public/              # Static assets
└── vite.config.ts       # Vite configuration
```

**Key Features**:
- Fast loading with Vite's HMR
- Advanced job search and filtering
- User registration and profile management
- Job application workflow
- Responsive design
- SEO optimization
- Progressive Web App (PWA) capabilities

---

## Data Flow Architecture

### 1. User Authentication Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│   API GW    │───▶│   Auth      │───▶│   MongoDB   │
│ (Frontend)  │    │             │    │  Service    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   ▼                   │
       │                   │            ┌─────────────┐            │
       │                   │            │    Redis    │            │
       │                   │            │  (Sessions) │            │
       │                   │            └─────────────┘            │
       │                   │                   │                   │
       │◀──────────────────┴───────────────────┴───────────────────┘
       │                        JWT Token
```

### 2. Job Search Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│   API GW    │───▶│   Search    │───▶│   MongoDB   │
│             │    │             │    │  Service    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   ▼                   │
       │                   │            ┌─────────────┐            │
       │                   │            │    Redis    │            │
       │                   │            │   (Cache)   │            │
       │                   │            └─────────────┘            │
       │                   │                   │                   │
       │◀──────────────────┴───────────────────┴───────────────────┘
       │                     Cached Results
```

### 3. Job Scraping Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Scheduler  │───▶│ Autoscraper │───▶│   SQLite    │───▶│  Normalizer │
│   (Cron)    │    │   Service   │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                           │                                      │
                           ▼                                      ▼
                   ┌─────────────┐                        ┌─────────────┐
                   │ Job Sources │                        │   MongoDB   │
                   │ (External)  │                        │ (Main API)  │
                   └─────────────┘                        └─────────────┘
```

### 4. Background Task Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   API       │───▶│    Redis    │───▶│   Celery    │───▶│  External   │
│  Endpoint   │    │   (Queue)   │    │   Worker    │    │  Services   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                      ┌─────────────┐
                                      │   MongoDB   │
                                      │  (Results)  │
                                      └─────────────┘
```

---

## Security Architecture

### 1. Authentication & Authorization

**JWT Token Structure**:
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "role": "job_seeker",
    "exp": 1640995200,
    "iat": 1640908800,
    "jti": "unique_token_id"
  }
}
```

**Role-Based Access Control (RBAC)**:
```
Super Admin
├── Full system access
├── User management
├── System configuration
└── Analytics access

Admin
├── User management (limited)
├── Job management
├── Employer verification
└── Content moderation

Employer
├── Job posting
├── Application management
├── Company profile
└── Analytics (own jobs)

Job Seeker
├── Job search
├── Application submission
├── Profile management
└── Saved jobs

Guest
├── Job browsing (limited)
└── Registration
```

### 2. API Security

**Security Middleware Stack**:
1. **CORS**: Cross-origin request handling
2. **Rate Limiting**: Request throttling per user/IP
3. **JWT Validation**: Token verification and refresh
4. **Input Validation**: Pydantic schema validation
5. **SQL Injection Prevention**: ORM-based queries
6. **XSS Protection**: Input sanitization
7. **HTTPS Enforcement**: SSL/TLS encryption

**Security Headers**:
```python
# Security headers configuration
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'"
}
```

### 3. Data Protection

**Encryption**:
- **Passwords**: bcrypt hashing with salt
- **Sensitive Data**: AES-256 encryption for PII
- **Database**: MongoDB encryption at rest
- **Transit**: TLS 1.3 for all communications

**Privacy Compliance**:
- **GDPR**: Right to deletion, data portability
- **Data Minimization**: Collect only necessary data
- **Audit Logging**: Track all data access
- **Anonymization**: Remove PII from analytics

---

## Performance Architecture

### 1. Caching Strategy

**Multi-Layer Caching**:
```
┌─────────────────────────────────────────────────────────────────┐
│                        CDN Layer                                │
│                   (Static Assets)                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                   Application Cache                             │
│                      (Redis)                                   │
├─────────────────────────┬───────────────────────────────────────┤
│   Session Cache         │        Query Cache                    │
│   User Profiles         │        Job Search Results            │
│   API Rate Limits       │        Popular Jobs                   │
└─────────────────────────┴───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                    Database Layer                               │
│                     (MongoDB)                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Cache Invalidation Strategy**:
- **Time-based**: TTL for all cached data
- **Event-based**: Invalidate on data updates
- **Manual**: Admin-triggered cache clearing
- **Versioning**: Cache versioning for gradual updates

### 2. Database Optimization

**MongoDB Indexing Strategy**:
```javascript
// Compound indexes for common queries
db.job_posts.createIndex({ "location": 1, "job_type": 1, "created_at": -1 })
db.job_posts.createIndex({ "employer_id": 1, "is_active": 1 })
db.job_applications.createIndex({ "job_seeker_id": 1, "status": 1 })

// Text search index
db.job_posts.createIndex({ 
  "title": "text", 
  "description": "text", 
  "company": "text" 
})

// Geospatial index for location-based search
db.job_posts.createIndex({ "location_coordinates": "2dsphere" })
```

**Query Optimization**:
- **Aggregation Pipelines**: Complex queries with MongoDB aggregation
- **Projection**: Return only required fields
- **Pagination**: Cursor-based pagination for large datasets
- **Connection Pooling**: Optimized connection management

### 3. Scalability Architecture

**Horizontal Scaling**:
```
┌─────────────────────────────────────────────────────────────────┐
│                      Load Balancer                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│        API Instance 1   │   API Instance 2   │   API Instance N │
│         (Port 8000)     │    (Port 8001)     │    (Port 800N)   │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│      Worker Pool 1      │   Worker Pool 2    │   Worker Pool N   │
│    (Celery Workers)     │  (Celery Workers)  │ (Celery Workers)  │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                    Shared Data Layer                           │
│              MongoDB Cluster + Redis Cluster                  │
└─────────────────────────────────────────────────────────────────┘
```

**Auto-scaling Triggers**:
- **CPU Usage**: > 70% for 5 minutes
- **Memory Usage**: > 80% for 3 minutes
- **Request Queue**: > 100 pending requests
- **Response Time**: > 2 seconds average

---

## Monitoring & Observability

### 1. Application Monitoring

**Health Check Endpoints**:
```python
# Health check configuration
HEALTH_CHECKS = {
    "/health": "Basic health check",
    "/health/db": "Database connectivity",
    "/health/redis": "Redis connectivity",
    "/health/celery": "Background task status",
    "/health/external": "External service status"
}
```

**Metrics Collection**:
- **Application Metrics**: Request count, response time, error rate
- **Business Metrics**: User registrations, job posts, applications
- **Infrastructure Metrics**: CPU, memory, disk, network
- **Custom Metrics**: Job search performance, scraper success rate

### 2. Logging Strategy

**Log Levels and Categories**:
```python
# Logging configuration
LOGGING_CONFIG = {
    "version": 1,
    "formatters": {
        "detailed": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        }
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
        "file": {"class": "logging.FileHandler", "filename": "app.log"},
        "elasticsearch": {"class": "ElasticsearchHandler"}
    },
    "loggers": {
        "app.api": {"level": "INFO"},
        "app.auth": {"level": "WARNING"},
        "app.scraper": {"level": "DEBUG"},
        "app.tasks": {"level": "INFO"}
    }
}
```

### 3. Error Tracking

**Error Categories**:
- **4xx Errors**: Client errors (validation, authentication)
- **5xx Errors**: Server errors (database, external services)
- **Business Logic Errors**: Application-specific errors
- **Infrastructure Errors**: Network, timeout, resource errors

---

## Deployment Architecture

### 1. Development Environment

**Local Development Stack**:
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    ports: ["27017:27017"]
    
  redis:
    image: redis:7.2-alpine
    ports: ["6379:6379"]
    
  api:
    build: .
    ports: ["8000:8000"]
    depends_on: [mongodb, redis]
    
  autoscraper:
    build: ./autoscraper-service
    ports: ["8001:8001"]
    
  admin:
    build: ./remotehive-admin
    ports: ["3000:3000"]
    
  public:
    build: ./remotehive-public
    ports: ["5173:5173"]
```

### 2. Production Environment

**Container Orchestration**:
```yaml
# kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: remotehive-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: remotehive-api
  template:
    metadata:
      labels:
        app: remotehive-api
    spec:
      containers:
      - name: api
        image: remotehive/api:latest
        ports:
        - containerPort: 8000
        env:
        - name: MONGODB_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: mongodb-url
```

**Infrastructure Components**:
- **Load Balancer**: NGINX or cloud load balancer
- **Container Registry**: Docker Hub or private registry
- **Database**: MongoDB Atlas or self-hosted cluster
- **Cache**: Redis Cloud or self-hosted cluster
- **CDN**: CloudFlare or AWS CloudFront
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

---

## API Design Patterns

### 1. RESTful API Design

**Resource Naming Conventions**:
```
GET    /api/v1/jobs              # List jobs
GET    /api/v1/jobs/{id}         # Get specific job
POST   /api/v1/jobs              # Create job
PUT    /api/v1/jobs/{id}         # Update job
DELETE /api/v1/jobs/{id}         # Delete job

GET    /api/v1/jobs/{id}/applications  # Job applications
POST   /api/v1/jobs/{id}/apply         # Apply to job

GET    /api/v1/users/{id}/profile      # User profile
PUT    /api/v1/users/{id}/profile      # Update profile
```

**Response Format Standardization**:
```json
{
  "success": true,
  "data": {
    "id": "job_id",
    "title": "Software Engineer",
    "company": "Tech Corp"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

### 2. Error Handling Patterns

**Standardized Error Responses**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "request_id": "req_123456"
  }
}
```

---

## Future Architecture Considerations

### 1. Microservices Evolution

**Potential Service Splits**:
- **Notification Service**: Email, SMS, push notifications
- **Analytics Service**: User behavior, job performance analytics
- **Recommendation Service**: ML-based job recommendations
- **Payment Service**: Premium features, job posting fees
- **Chat Service**: Real-time messaging between employers and candidates

### 2. Technology Upgrades

**Planned Improvements**:
- **GraphQL**: Consider GraphQL for flexible data fetching
- **Event Sourcing**: Implement for audit trails and data recovery
- **CQRS**: Separate read/write models for better performance
- **Machine Learning**: Job matching algorithms, salary predictions
- **Real-time Features**: WebSocket connections for live updates

### 3. Scalability Enhancements

**Performance Optimizations**:
- **Database Sharding**: Horizontal partitioning for large datasets
- **Read Replicas**: Separate read/write database instances
- **Edge Computing**: Deploy services closer to users
- **Async Processing**: More background task processing
- **Caching Layers**: Additional caching at CDN and application levels

---

This architecture documentation provides a comprehensive overview of the RemoteHive platform's technical design and implementation. It should be updated as the system evolves and new components are added.

**Last Updated**: December 2024
**Architecture Version**: 1.0.0
**Next Review**: March 2025