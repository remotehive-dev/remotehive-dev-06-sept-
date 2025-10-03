# RemoteHive Database Schema Documentation

## Overview

RemoteHive uses a multi-database architecture to handle different aspects of the platform:

- **MongoDB** - Primary application data (users, jobs, applications)
- **SQLite** - Autoscraper service data (scraping jobs, raw data)
- **Redis** - Caching, sessions, and background task queues

---

## MongoDB Schema (Primary Database)

**Connection**: `mongodb://localhost:27017/remotehive`
**ODM**: Beanie (async MongoDB ODM based on Pydantic)

### Core Collections

#### 1. Users Collection
```python
class User(Document):
    email: str = Field(..., unique=True, index=True)
    password_hash: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole = Field(default=UserRole.JOB_SEEKER)
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    # Indexes
    class Settings:
        indexes = [
            "email",
            "role",
            "is_active",
            "created_at"
        ]
```

**User Roles Enum**:
```python
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    EMPLOYER = "employer"
    JOB_SEEKER = "job_seeker"
    GUEST = "guest"
```

#### 2. Job Posts Collection
```python
class JobPost(Document):
    title: str = Field(..., index=True)
    description: str
    company: str = Field(..., index=True)
    location: str = Field(..., index=True)
    job_type: JobType = Field(default=JobType.FULL_TIME)
    experience_level: ExperienceLevel = Field(default=ExperienceLevel.MID_LEVEL)
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = Field(default="USD")
    skills_required: List[str] = Field(default_factory=list)
    benefits: List[str] = Field(default_factory=list)
    remote_type: RemoteType = Field(default=RemoteType.FULLY_REMOTE)
    application_deadline: Optional[datetime] = None
    is_active: bool = Field(default=True)
    is_featured: bool = Field(default=False)
    views_count: int = Field(default=0)
    applications_count: int = Field(default=0)
    employer_id: PydanticObjectId = Field(..., index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Indexes
    class Settings:
        indexes = [
            "title",
            "company",
            "location",
            "job_type",
            "remote_type",
            "employer_id",
            "is_active",
            "created_at",
            [("title", "text"), ("description", "text"), ("company", "text")]  # Text search
        ]
```

**Job-related Enums**:
```python
class JobType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    FREELANCE = "freelance"
    INTERNSHIP = "internship"

class ExperienceLevel(str, Enum):
    ENTRY_LEVEL = "entry_level"
    MID_LEVEL = "mid_level"
    SENIOR_LEVEL = "senior_level"
    EXECUTIVE = "executive"

class RemoteType(str, Enum):
    FULLY_REMOTE = "fully_remote"
    HYBRID = "hybrid"
    ON_SITE = "on_site"
```

#### 3. Employers Collection
```python
class Employer(Document):
    company_name: str = Field(..., unique=True, index=True)
    company_description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[CompanySize] = None
    founded_year: Optional[int] = None
    headquarters: Optional[str] = None
    contact_email: str = Field(..., index=True)
    contact_phone: Optional[str] = None
    social_links: Dict[str, str] = Field(default_factory=dict)
    is_verified: bool = Field(default=False)
    verification_documents: List[str] = Field(default_factory=list)
    user_id: PydanticObjectId = Field(..., unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Indexes
    class Settings:
        indexes = [
            "company_name",
            "user_id",
            "is_verified",
            "industry"
        ]
```

**Company Size Enum**:
```python
class CompanySize(str, Enum):
    STARTUP = "1-10"
    SMALL = "11-50"
    MEDIUM = "51-200"
    LARGE = "201-1000"
    ENTERPRISE = "1000+"
```

#### 4. Job Applications Collection
```python
class JobApplication(Document):
    job_id: PydanticObjectId = Field(..., index=True)
    job_seeker_id: PydanticObjectId = Field(..., index=True)
    employer_id: PydanticObjectId = Field(..., index=True)
    status: ApplicationStatus = Field(default=ApplicationStatus.PENDING)
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    expected_salary: Optional[int] = None
    availability_date: Optional[datetime] = None
    notes: Optional[str] = None
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    
    # Compound indexes for efficient queries
    class Settings:
        indexes = [
            "job_id",
            "job_seeker_id",
            "employer_id",
            "status",
            "applied_at",
            [("job_seeker_id", 1), ("job_id", 1)],  # Unique application per user per job
            [("employer_id", 1), ("status", 1)],
            [("job_id", 1), ("status", 1)]
        ]
```

**Application Status Enum**:
```python
class ApplicationStatus(str, Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    REJECTED = "rejected"
    HIRED = "hired"
    WITHDRAWN = "withdrawn"
```

#### 5. Job Seeker Profiles Collection
```python
class JobSeekerProfile(Document):
    user_id: PydanticObjectId = Field(..., unique=True, index=True)
    bio: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience_years: Optional[int] = None
    education: List[Education] = Field(default_factory=list)
    work_experience: List[WorkExperience] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None
    preferred_job_types: List[JobType] = Field(default_factory=list)
    preferred_locations: List[str] = Field(default_factory=list)
    expected_salary_min: Optional[int] = None
    expected_salary_max: Optional[int] = None
    availability: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        indexes = [
            "user_id",
            "skills",
            "availability"
        ]
```

**Embedded Documents**:
```python
class Education(BaseModel):
    degree: str
    field_of_study: str
    institution: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    grade: Optional[str] = None

class WorkExperience(BaseModel):
    job_title: str
    company: str
    location: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    description: Optional[str] = None
    is_current: bool = Field(default=False)
```

#### 6. Saved Jobs Collection
```python
class SavedJob(Document):
    user_id: PydanticObjectId = Field(..., index=True)
    job_id: PydanticObjectId = Field(..., index=True)
    saved_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None
    
    class Settings:
        indexes = [
            "user_id",
            "job_id",
            [("user_id", 1), ("job_id", 1)]  # Unique constraint
        ]
```

#### 7. Job Alerts Collection
```python
class JobAlert(Document):
    user_id: PydanticObjectId = Field(..., index=True)
    name: str
    keywords: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    job_type: Optional[JobType] = None
    remote_type: Optional[RemoteType] = None
    salary_min: Optional[int] = None
    experience_level: Optional[ExperienceLevel] = None
    is_active: bool = Field(default=True)
    frequency: AlertFrequency = Field(default=AlertFrequency.DAILY)
    last_sent: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        indexes = [
            "user_id",
            "is_active",
            "frequency"
        ]
```

**Alert Frequency Enum**:
```python
class AlertFrequency(str, Enum):
    IMMEDIATE = "immediate"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
```

---

## SQLite Schema (Autoscraper Service)

**Location**: `/autoscraper-engine-api/app.db`
**ORM**: SQLAlchemy

### Tables

#### 1. Scrape Schedule Configuration
```sql
CREATE TABLE autoscrape_schedule_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    source_url VARCHAR(500) NOT NULL,
    scraper_type VARCHAR(50) NOT NULL,
    schedule_cron VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    max_pages INTEGER DEFAULT 10,
    delay_seconds INTEGER DEFAULT 2,
    user_agent TEXT,
    headers JSON,
    selectors JSON,
    filters JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Scrape Jobs
```sql
CREATE TABLE autoscrape_scrape_job (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    total_pages INTEGER DEFAULT 0,
    jobs_found INTEGER DEFAULT 0,
    jobs_processed INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    error_log TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (config_id) REFERENCES autoscrape_schedule_config(id)
);
```

#### 3. Raw Scraped Jobs
```sql
CREATE TABLE autoscrape_raw_job (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scrape_job_id INTEGER NOT NULL,
    source_url VARCHAR(500),
    job_url VARCHAR(500),
    title TEXT,
    company TEXT,
    location TEXT,
    description TEXT,
    salary TEXT,
    job_type TEXT,
    posted_date TEXT,
    raw_data JSON,
    hash_key VARCHAR(64) UNIQUE,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scrape_job_id) REFERENCES autoscrape_scrape_job(id)
);
```

#### 4. Normalized Jobs
```sql
CREATE TABLE autoscrape_normalized_job (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_job_id INTEGER NOT NULL,
    title VARCHAR(200),
    company VARCHAR(100),
    location VARCHAR(100),
    description TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    job_type VARCHAR(20),
    experience_level VARCHAR(20),
    remote_type VARCHAR(20),
    skills JSON,
    benefits JSON,
    application_url VARCHAR(500),
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    mongodb_id VARCHAR(24),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raw_job_id) REFERENCES autoscrape_raw_job(id)
);
```

#### 5. Scraper Engine State
```sql
CREATE TABLE autoscrape_engine_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engine_name VARCHAR(50) NOT NULL UNIQUE,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    status VARCHAR(20) DEFAULT 'idle',
    config JSON,
    stats JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. Duplicate Detection
```sql
CREATE TABLE autoscrape_duplicates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_hash VARCHAR(64) NOT NULL,
    original_job_id INTEGER,
    duplicate_job_id INTEGER,
    similarity_score REAL,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_job_id) REFERENCES autoscrape_raw_job(id),
    FOREIGN KEY (duplicate_job_id) REFERENCES autoscrape_raw_job(id)
);
```

### SQLite Indexes
```sql
-- Performance indexes
CREATE INDEX idx_raw_job_hash ON autoscrape_raw_job(hash_key);
CREATE INDEX idx_raw_job_scrape_id ON autoscrape_raw_job(scrape_job_id);
CREATE INDEX idx_normalized_processed ON autoscrape_normalized_job(is_processed);
CREATE INDEX idx_scrape_job_status ON autoscrape_scrape_job(status);
CREATE INDEX idx_schedule_active ON autoscrape_schedule_config(is_active);
```

---

## Redis Schema (Caching & Sessions)

**Connection**: `redis://localhost:6379`

### Key Patterns

#### 1. User Sessions
```
Pattern: session:{session_id}
Type: Hash
TTL: 24 hours
Fields:
  - user_id: string
  - email: string
  - role: string
  - created_at: timestamp
  - last_activity: timestamp
```

#### 2. JWT Token Blacklist
```
Pattern: blacklist:jwt:{token_jti}
Type: String
TTL: Token expiration time
Value: "blacklisted"
```

#### 3. API Rate Limiting
```
Pattern: rate_limit:{endpoint}:{user_id}
Type: String
TTL: 1 hour
Value: request_count
```

#### 4. Job Search Cache
```
Pattern: search:jobs:{query_hash}
Type: Hash
TTL: 15 minutes
Fields:
  - results: JSON string
  - total_count: integer
  - cached_at: timestamp
```

#### 5. User Profile Cache
```
Pattern: profile:{user_id}
Type: Hash
TTL: 1 hour
Fields:
  - user_data: JSON string
  - employer_data: JSON string (if applicable)
  - job_seeker_data: JSON string (if applicable)
```

#### 6. Job View Tracking
```
Pattern: job_views:{job_id}
Type: Set
TTL: 24 hours
Members: user_id (for unique view counting)
```

#### 7. Email Queue
```
Pattern: email_queue
Type: List
Values: JSON objects with email data
```

#### 8. Background Task Queues
```
# Celery queues
Queue: celery (default)
Queue: email_tasks
Queue: scraper_tasks
Queue: notification_tasks
```

#### 9. Application Analytics
```
Pattern: analytics:daily:{date}
Type: Hash
Fields:
  - new_users: integer
  - new_jobs: integer
  - applications: integer
  - page_views: integer
```

#### 10. Notification Cache
```
Pattern: notifications:{user_id}
Type: List
TTL: 7 days
Values: JSON notification objects
```

---

## Database Relationships

### MongoDB Relationships
```
Users (1) ←→ (1) Employers
Users (1) ←→ (1) JobSeekerProfiles
Employers (1) ←→ (N) JobPosts
JobPosts (1) ←→ (N) JobApplications
Users (1) ←→ (N) JobApplications (as job_seeker)
Users (1) ←→ (N) SavedJobs
Users (1) ←→ (N) JobAlerts
```

### Cross-Database Data Flow
```
SQLite (autoscraper_normalized_job) → MongoDB (JobPost)
MongoDB (User actions) → Redis (Cache/Sessions)
MongoDB (Job views) → Redis (Analytics)
```

---

## Migration Notes

### From PostgreSQL to MongoDB
The project migrated from PostgreSQL/Supabase to MongoDB:

1. **User Authentication**: Migrated from Supabase Auth to custom JWT
2. **Relational to Document**: Converted normalized tables to embedded documents
3. **Indexes**: Recreated appropriate indexes for MongoDB queries
4. **Data Types**: Converted PostgreSQL types to MongoDB/Pydantic types

### Migration Scripts Location
- `/migrations/` - Contains migration scripts
- `/migration_backup_*/` - Backup data from PostgreSQL

---

## Performance Considerations

### MongoDB Optimization
- **Compound Indexes**: Created for common query patterns
- **Text Search**: Full-text search on job titles and descriptions
- **Aggregation Pipeline**: Used for complex analytics queries
- **Connection Pooling**: Configured for high concurrency

### SQLite Optimization
- **WAL Mode**: Enabled for better concurrent access
- **Indexes**: Created on frequently queried columns
- **Batch Operations**: Used for bulk data processing

### Redis Optimization
- **Memory Management**: TTL set on all cached data
- **Key Patterns**: Structured for efficient querying
- **Pipeline Operations**: Used for bulk operations

---

## Backup Strategy

### MongoDB Backup
```bash
# Daily backup
mongodump --uri="mongodb://localhost:27017/remotehive" --out=/backups/mongodb/$(date +%Y%m%d)
```

### SQLite Backup
```bash
# Backup autoscraper database
cp autoscraper-engine-api/app.db /backups/sqlite/app_$(date +%Y%m%d).db
```

### Redis Backup
```bash
# Redis persistence (RDB snapshots)
save 900 1
save 300 10
save 60 10000
```

---

This database schema documentation provides a comprehensive overview of all data structures used in the RemoteHive platform. It should be updated whenever schema changes are made to maintain accuracy.

**Last Updated**: December 2024
**Schema Version**: 1.0.0