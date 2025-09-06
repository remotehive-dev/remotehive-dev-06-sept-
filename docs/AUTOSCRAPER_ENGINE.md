# RemoteHive Autoscraper Engine Documentation

## Overview

The RemoteHive Autoscraper Engine is a sophisticated, independent microservice designed to automatically discover, extract, normalize, and process job postings from various external job boards and career websites. Built as a standalone FastAPI application, it operates independently from the main RemoteHive platform while seamlessly integrating through well-defined APIs.

---

## Architecture Overview

### Service Architecture

```
Autoscraper Engine Architecture

┌─────────────────────────────────────────────────────────────────┐
│                    Autoscraper Service (Port 8001)             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Scheduler     │  │   Scraper       │  │   Normalizer    │ │
│  │   Engine        │  │   Engine        │  │   Engine        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│           │                     │                     │         │
│           ▼                     ▼                     ▼         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Job Queue     │  │   Raw Data      │  │   Normalized    │ │
│  │   Manager       │  │   Processor     │  │   Data Store    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      SQLite Database                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Schedule      │  │   Raw Jobs      │  │   Normalized    │ │
│  │   Config        │  │   Storage       │  │   Jobs          │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
           │                                           │
           ▼                                           ▼
┌─────────────────┐                         ┌─────────────────┐
│   External      │                         │   Main          │
│   Job Boards    │                         │   RemoteHive    │
│   & Websites    │                         │   API           │
└─────────────────┘                         └─────────────────┘
```

### Core Components

#### 1. **Scheduler Engine**
- **Purpose**: Manages automated scraping schedules and job queue distribution
- **Functionality**: 
  - Cron-based scheduling system
  - Dynamic frequency adjustment based on site activity
  - Load balancing across multiple scraper instances
  - Failure recovery and retry mechanisms

#### 2. **Scraper Engine**
- **Purpose**: Performs actual data extraction from target websites
- **Functionality**:
  - Multi-protocol support (HTTP, HTTPS, API endpoints)
  - Dynamic content handling (JavaScript-rendered pages)
  - Anti-bot detection circumvention
  - Rate limiting and respectful crawling

#### 3. **Normalizer Engine**
- **Purpose**: Standardizes and cleans extracted job data
- **Functionality**:
  - Data format standardization
  - Duplicate detection and removal
  - Content quality assessment
  - Salary range normalization

#### 4. **Data Pipeline Manager**
- **Purpose**: Orchestrates data flow between components
- **Functionality**:
  - Pipeline state management
  - Error handling and logging
  - Performance monitoring
  - Data validation and integrity checks

---

## Database Schema

### SQLite Database Structure

The Autoscraper Engine uses SQLite for local data storage, optimized for high-throughput read/write operations.

#### Table: `autoscrape_schedule_config`
```sql
CREATE TABLE autoscrape_schedule_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_name VARCHAR(100) NOT NULL UNIQUE,
    base_url VARCHAR(500) NOT NULL,
    scrape_frequency_hours INTEGER DEFAULT 24,
    last_scrape_time TIMESTAMP,
    next_scrape_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    scraper_type VARCHAR(50) DEFAULT 'html',
    max_pages INTEGER DEFAULT 10,
    rate_limit_seconds INTEGER DEFAULT 2,
    user_agent VARCHAR(500),
    custom_headers TEXT, -- JSON string
    css_selectors TEXT, -- JSON string
    api_config TEXT, -- JSON string for API-based scrapers
    success_rate FLOAT DEFAULT 0.0,
    last_error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `autoscrape_scrape_job`
```sql
CREATE TABLE autoscrape_scrape_job (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_name VARCHAR(100) NOT NULL,
    job_url VARCHAR(1000) NOT NULL,
    scrape_status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    pages_scraped INTEGER DEFAULT 0,
    jobs_found INTEGER DEFAULT 0,
    jobs_processed INTEGER DEFAULT 0,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    priority INTEGER DEFAULT 5, -- 1-10 scale
    scraper_instance_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_name) REFERENCES autoscrape_schedule_config(site_name)
);
```

#### Table: `autoscrape_raw_job`
```sql
CREATE TABLE autoscrape_raw_job (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scrape_job_id INTEGER NOT NULL,
    external_job_id VARCHAR(200),
    source_url VARCHAR(1000) NOT NULL,
    raw_html TEXT,
    raw_json TEXT,
    extracted_data TEXT, -- JSON string
    scrape_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content_hash VARCHAR(64), -- SHA-256 hash for duplicate detection
    page_number INTEGER,
    extraction_status VARCHAR(20) DEFAULT 'pending', -- pending, extracted, failed
    FOREIGN KEY (scrape_job_id) REFERENCES autoscrape_scrape_job(id)
);
```

#### Table: `autoscrape_normalized_job`
```sql
CREATE TABLE autoscrape_normalized_job (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_job_id INTEGER NOT NULL,
    external_job_id VARCHAR(200),
    title VARCHAR(500),
    company_name VARCHAR(200),
    company_url VARCHAR(500),
    location VARCHAR(200),
    remote_type VARCHAR(50), -- remote, hybrid, onsite
    employment_type VARCHAR(50), -- full-time, part-time, contract, freelance
    experience_level VARCHAR(50), -- entry, mid, senior, executive
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(10) DEFAULT 'USD',
    salary_period VARCHAR(20), -- hourly, monthly, yearly
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    application_url VARCHAR(1000),
    posted_date DATE,
    expires_date DATE,
    tags TEXT, -- JSON array of skill tags
    category VARCHAR(100),
    subcategory VARCHAR(100),
    source_site VARCHAR(100),
    source_url VARCHAR(1000),
    quality_score FLOAT DEFAULT 0.0, -- 0-1 quality assessment
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of INTEGER, -- Reference to original job ID
    normalization_status VARCHAR(20) DEFAULT 'pending', -- pending, normalized, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raw_job_id) REFERENCES autoscrape_raw_job(id),
    FOREIGN KEY (duplicate_of) REFERENCES autoscrape_normalized_job(id)
);
```

#### Table: `autoscrape_engine_state`
```sql
CREATE TABLE autoscrape_engine_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engine_instance_id VARCHAR(50) NOT NULL,
    engine_type VARCHAR(50) NOT NULL, -- scheduler, scraper, normalizer
    status VARCHAR(20) DEFAULT 'idle', -- idle, running, paused, error
    current_task TEXT,
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    performance_metrics TEXT, -- JSON string
    error_log TEXT,
    memory_usage_mb INTEGER,
    cpu_usage_percent FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `autoscrape_duplicates`
```sql
CREATE TABLE autoscrape_duplicates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id_1 INTEGER NOT NULL,
    job_id_2 INTEGER NOT NULL,
    similarity_score FLOAT NOT NULL, -- 0-1 similarity score
    similarity_type VARCHAR(50), -- exact, fuzzy, semantic
    comparison_fields TEXT, -- JSON array of compared fields
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id_1) REFERENCES autoscrape_normalized_job(id),
    FOREIGN KEY (job_id_2) REFERENCES autoscrape_normalized_job(id)
);
```

### Database Indexes

```sql
-- Performance optimization indexes
CREATE INDEX idx_schedule_config_site_name ON autoscrape_schedule_config(site_name);
CREATE INDEX idx_schedule_config_next_scrape ON autoscrape_schedule_config(next_scrape_time, is_active);

CREATE INDEX idx_scrape_job_status ON autoscrape_scrape_job(scrape_status);
CREATE INDEX idx_scrape_job_site_name ON autoscrape_scrape_job(site_name);
CREATE INDEX idx_scrape_job_created_at ON autoscrape_scrape_job(created_at);

CREATE INDEX idx_raw_job_content_hash ON autoscrape_raw_job(content_hash);
CREATE INDEX idx_raw_job_scrape_job_id ON autoscrape_raw_job(scrape_job_id);
CREATE INDEX idx_raw_job_extraction_status ON autoscrape_raw_job(extraction_status);

CREATE INDEX idx_normalized_job_company ON autoscrape_normalized_job(company_name);
CREATE INDEX idx_normalized_job_location ON autoscrape_normalized_job(location);
CREATE INDEX idx_normalized_job_remote_type ON autoscrape_normalized_job(remote_type);
CREATE INDEX idx_normalized_job_posted_date ON autoscrape_normalized_job(posted_date);
CREATE INDEX idx_normalized_job_quality_score ON autoscrape_normalized_job(quality_score);
CREATE INDEX idx_normalized_job_is_duplicate ON autoscrape_normalized_job(is_duplicate);
CREATE INDEX idx_normalized_job_source_site ON autoscrape_normalized_job(source_site);

CREATE INDEX idx_engine_state_instance_id ON autoscrape_engine_state(engine_instance_id);
CREATE INDEX idx_engine_state_type_status ON autoscrape_engine_state(engine_type, status);

CREATE INDEX idx_duplicates_job_ids ON autoscrape_duplicates(job_id_1, job_id_2);
CREATE INDEX idx_duplicates_similarity_score ON autoscrape_duplicates(similarity_score);
```

---

## Core Functions & Modules

### 1. Scheduler Module

#### `ScheduleManager`
```python
class ScheduleManager:
    """
    Manages scraping schedules and job queue distribution.
    """
    
    async def create_schedule(self, site_config: SiteConfig) -> int:
        """Create a new scraping schedule for a site."""
        
    async def update_schedule(self, site_name: str, config: dict) -> bool:
        """Update existing schedule configuration."""
        
    async def get_due_schedules(self) -> List[ScheduleConfig]:
        """Get all schedules that are due for scraping."""
        
    async def calculate_next_scrape_time(self, site_name: str) -> datetime:
        """Calculate next scrape time based on success rate and activity."""
        
    async def pause_schedule(self, site_name: str) -> bool:
        """Temporarily pause a scraping schedule."""
        
    async def resume_schedule(self, site_name: str) -> bool:
        """Resume a paused scraping schedule."""
```

#### `JobQueueManager`
```python
class JobQueueManager:
    """
    Manages the job queue and task distribution.
    """
    
    async def enqueue_scrape_job(self, site_name: str, priority: int = 5) -> int:
        """Add a new scrape job to the queue."""
        
    async def get_next_job(self, scraper_instance_id: str) -> Optional[ScrapeJob]:
        """Get the next job from the queue for processing."""
        
    async def mark_job_started(self, job_id: int, scraper_instance_id: str) -> bool:
        """Mark a job as started by a scraper instance."""
        
    async def mark_job_completed(self, job_id: int, stats: JobStats) -> bool:
        """Mark a job as completed with statistics."""
        
    async def mark_job_failed(self, job_id: int, error: str) -> bool:
        """Mark a job as failed with error details."""
        
    async def retry_failed_jobs(self) -> int:
        """Retry failed jobs that haven't exceeded max retries."""
```

### 2. Scraper Module

#### `BaseScraper`
```python
class BaseScraper:
    """
    Base class for all scraper implementations.
    """
    
    def __init__(self, site_config: SiteConfig):
        self.site_config = site_config
        self.session = None
        self.rate_limiter = RateLimiter(site_config.rate_limit_seconds)
        
    async def scrape_page(self, url: str) -> ScrapedData:
        """Scrape a single page and return extracted data."""
        
    async def extract_job_links(self, page_content: str) -> List[str]:
        """Extract job posting URLs from a listing page."""
        
    async def extract_job_data(self, job_url: str) -> dict:
        """Extract detailed job data from a job posting page."""
        
    async def handle_pagination(self, base_url: str) -> List[str]:
        """Handle pagination and return all page URLs."""
        
    def respect_robots_txt(self, url: str) -> bool:
        """Check if URL is allowed by robots.txt."""
```

#### `HTMLScraper`
```python
class HTMLScraper(BaseScraper):
    """
    Scraper for HTML-based job boards using BeautifulSoup and Selenium.
    """
    
    async def setup_browser(self) -> webdriver.Chrome:
        """Setup headless Chrome browser with anti-detection measures."""
        
    async def extract_with_css_selectors(self, content: str, selectors: dict) -> dict:
        """Extract data using CSS selectors."""
        
    async def handle_dynamic_content(self, url: str) -> str:
        """Handle JavaScript-rendered content using Selenium."""
        
    async def bypass_cloudflare(self, url: str) -> str:
        """Bypass Cloudflare protection if present."""
```

#### `APIScraper`
```python
class APIScraper(BaseScraper):
    """
    Scraper for API-based job boards.
    """
    
    async def authenticate(self) -> str:
        """Authenticate with the API and return access token."""
        
    async def fetch_jobs_batch(self, offset: int, limit: int) -> dict:
        """Fetch a batch of jobs from the API."""
        
    async def handle_rate_limiting(self, response: httpx.Response) -> bool:
        """Handle API rate limiting and backoff."""
        
    async def parse_api_response(self, response: dict) -> List[dict]:
        """Parse API response and extract job data."""
```

### 3. Normalizer Module

#### `DataNormalizer`
```python
class DataNormalizer:
    """
    Normalizes and standardizes scraped job data.
    """
    
    async def normalize_job(self, raw_job: RawJob) -> NormalizedJob:
        """Normalize a single raw job posting."""
        
    def normalize_title(self, title: str) -> str:
        """Standardize job titles."""
        
    def normalize_location(self, location: str) -> dict:
        """Parse and normalize location information."""
        
    def normalize_salary(self, salary_text: str) -> dict:
        """Parse and normalize salary information."""
        
    def extract_skills(self, description: str, requirements: str) -> List[str]:
        """Extract skill tags from job description and requirements."""
        
    def classify_remote_type(self, description: str, location: str) -> str:
        """Classify job as remote, hybrid, or onsite."""
        
    def assess_quality(self, job: NormalizedJob) -> float:
        """Assess job posting quality (0-1 score)."""
```

#### `DuplicateDetector`
```python
class DuplicateDetector:
    """
    Detects and manages duplicate job postings.
    """
    
    async def find_duplicates(self, job: NormalizedJob) -> List[int]:
        """Find potential duplicates for a job."""
        
    def calculate_similarity(self, job1: NormalizedJob, job2: NormalizedJob) -> float:
        """Calculate similarity score between two jobs."""
        
    def exact_match(self, job1: NormalizedJob, job2: NormalizedJob) -> bool:
        """Check for exact matches based on key fields."""
        
    def fuzzy_match(self, job1: NormalizedJob, job2: NormalizedJob) -> float:
        """Calculate fuzzy similarity score."""
        
    def semantic_match(self, job1: NormalizedJob, job2: NormalizedJob) -> float:
        """Calculate semantic similarity using NLP."""
```

### 4. Data Pipeline Module

#### `PipelineOrchestrator`
```python
class PipelineOrchestrator:
    """
    Orchestrates the entire data processing pipeline.
    """
    
    async def process_scrape_job(self, job_id: int) -> bool:
        """Process a complete scrape job from start to finish."""
        
    async def extract_raw_data(self, job_id: int) -> int:
        """Extract raw data from target site."""
        
    async def normalize_raw_data(self, raw_job_ids: List[int]) -> int:
        """Normalize extracted raw data."""
        
    async def detect_duplicates(self, normalized_job_ids: List[int]) -> int:
        """Detect and mark duplicate jobs."""
        
    async def export_to_main_api(self, job_ids: List[int]) -> bool:
        """Export normalized jobs to main RemoteHive API."""
        
    async def cleanup_old_data(self, days_old: int = 30) -> int:
        """Clean up old processed data."""
```

---

## Supported Job Boards

### Tier 1 - High Priority Sites

#### 1. **Remote.co**
- **URL**: `https://remote.co/remote-jobs/`
- **Type**: HTML Scraping
- **Frequency**: Every 6 hours
- **Volume**: ~500 jobs/day
- **Selectors**:
  ```json
  {
    "job_links": ".job_board_list .job a",
    "title": ".job-title h1",
    "company": ".company-name",
    "location": ".location",
    "description": ".job-description",
    "posted_date": ".job-date"
  }
  ```

#### 2. **We Work Remotely**
- **URL**: `https://weworkremotely.com/categories/remote-programming-jobs`
- **Type**: HTML Scraping
- **Frequency**: Every 4 hours
- **Volume**: ~800 jobs/day
- **Selectors**:
  ```json
  {
    "job_links": ".jobs li a",
    "title": ".listing-header h1",
    "company": ".company h2",
    "description": ".listing-container",
    "posted_date": ".listing-date"
  }
  ```

#### 3. **AngelList (Wellfound)**
- **URL**: `https://wellfound.com/jobs`
- **Type**: API + HTML Hybrid
- **Frequency**: Every 8 hours
- **Volume**: ~1200 jobs/day
- **API Config**:
  ```json
  {
    "base_url": "https://wellfound.com/graphql",
    "auth_required": true,
    "rate_limit": 100,
    "pagination": "cursor"
  }
  ```

#### 4. **FlexJobs**
- **URL**: `https://www.flexjobs.com/remote-jobs`
- **Type**: HTML Scraping (Premium)
- **Frequency**: Every 12 hours
- **Volume**: ~600 jobs/day
- **Special**: Requires subscription for full access

### Tier 2 - Medium Priority Sites

#### 5. **RemoteOK**
- **URL**: `https://remoteok.io/`
- **Type**: API
- **Frequency**: Every 6 hours
- **Volume**: ~400 jobs/day

#### 6. **Upwork**
- **URL**: `https://www.upwork.com/nx/search/jobs/`
- **Type**: API
- **Frequency**: Every 8 hours
- **Volume**: ~2000 jobs/day (filtered for remote)

#### 7. **Freelancer.com**
- **URL**: `https://www.freelancer.com/jobs/`
- **Type**: API
- **Frequency**: Every 12 hours
- **Volume**: ~1500 jobs/day (filtered)

#### 8. **Toptal**
- **URL**: `https://www.toptal.com/freelance-jobs`
- **Type**: HTML Scraping
- **Frequency**: Every 24 hours
- **Volume**: ~100 jobs/day (high quality)

### Tier 3 - Specialized Sites

#### 9. **Stack Overflow Jobs**
- **URL**: `https://stackoverflow.com/jobs/remote-developer-jobs`
- **Type**: HTML Scraping
- **Frequency**: Every 12 hours
- **Volume**: ~300 jobs/day

#### 10. **GitHub Jobs**
- **URL**: `https://jobs.github.com/positions`
- **Type**: API (Deprecated, using archive)
- **Frequency**: Weekly
- **Volume**: Historical data only

#### 11. **Dribbble Jobs**
- **URL**: `https://dribbble.com/jobs`
- **Type**: HTML Scraping
- **Frequency**: Every 24 hours
- **Volume**: ~50 jobs/day (design focus)

#### 12. **Behance Jobs**
- **URL**: `https://www.behance.net/jobboard`
- **Type**: HTML Scraping
- **Frequency**: Every 24 hours
- **Volume**: ~80 jobs/day (creative focus)

---

## Data Processing Pipeline

### Stage 1: Data Extraction

```
Extraction Pipeline Flow:

1. Schedule Check
   ├── Get due schedules from database
   ├── Prioritize by success rate and urgency
   └── Create scrape jobs

2. Site Analysis
   ├── Check robots.txt compliance
   ├── Analyze site structure changes
   ├── Adjust scraping parameters
   └── Initialize appropriate scraper

3. Content Extraction
   ├── Fetch job listing pages
   ├── Extract individual job URLs
   ├── Scrape detailed job information
   └── Store raw HTML/JSON data

4. Quality Control
   ├── Validate extracted data completeness
   ├── Check for extraction errors
   ├── Generate content hashes
   └── Log extraction statistics
```

### Stage 2: Data Normalization

```
Normalization Pipeline Flow:

1. Data Parsing
   ├── Parse HTML/JSON content
   ├── Extract structured fields
   ├── Handle missing or malformed data
   └── Apply site-specific parsing rules

2. Field Standardization
   ├── Normalize job titles
   ├── Standardize company names
   ├── Parse location information
   ├── Extract and normalize salary data
   ├── Classify employment types
   └── Determine remote work type

3. Content Enhancement
   ├── Extract skill tags using NLP
   ├── Categorize job postings
   ├── Assess content quality
   ├── Generate job summaries
   └── Add metadata tags

4. Validation
   ├── Validate required fields
   ├── Check data consistency
   ├── Verify URL accessibility
   └── Calculate quality scores
```

### Stage 3: Duplicate Detection

```
Duplicate Detection Pipeline:

1. Exact Match Detection
   ├── Compare external job IDs
   ├── Match identical URLs
   ├── Check content hashes
   └── Identify perfect duplicates

2. Fuzzy Matching
   ├── Compare job titles (Levenshtein distance)
   ├── Match company names with variations
   ├── Compare location strings
   ├── Analyze salary ranges
   └── Calculate similarity scores

3. Semantic Analysis
   ├── Compare job descriptions using NLP
   ├── Analyze requirement similarities
   ├── Match skill sets
   ├── Identify paraphrased content
   └── Generate semantic similarity scores

4. Duplicate Resolution
   ├── Rank duplicates by quality score
   ├── Select canonical job posting
   ├── Mark duplicates with references
   └── Update duplicate tracking tables
```

### Stage 4: Data Export

```
Export Pipeline Flow:

1. Quality Filtering
   ├── Filter by minimum quality score
   ├── Remove flagged duplicates
   ├── Validate required fields
   └── Check recency requirements

2. Format Conversion
   ├── Convert to RemoteHive schema
   ├── Map normalized fields
   ├── Generate unique identifiers
   └── Add source attribution

3. API Integration
   ├── Authenticate with main API
   ├── Batch upload job postings
   ├── Handle API rate limits
   ├── Retry failed uploads
   └── Log export statistics

4. Cleanup
   ├── Mark exported jobs
   ├── Archive old data
   ├── Update processing statistics
   └── Generate reports
```

---

## API Endpoints

### Administrative Endpoints

#### `GET /health`
**Purpose**: Health check endpoint
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-20T10:30:00Z",
  "version": "1.0.0",
  "database": "connected",
  "active_scrapers": 3,
  "queue_size": 15
}
```

#### `GET /stats`
**Purpose**: Get overall system statistics
**Response**:
```json
{
  "total_jobs_scraped": 125000,
  "jobs_today": 1250,
  "active_sites": 12,
  "success_rate": 0.94,
  "average_processing_time": 45.2,
  "duplicate_rate": 0.23,
  "quality_score_avg": 0.78
}
```

### Schedule Management

#### `GET /schedules`
**Purpose**: List all scraping schedules
**Parameters**:
- `active_only`: boolean (default: false)
- `site_name`: string (optional filter)

#### `POST /schedules`
**Purpose**: Create new scraping schedule
**Request Body**:
```json
{
  "site_name": "example-jobs",
  "base_url": "https://example.com/jobs",
  "scrape_frequency_hours": 12,
  "scraper_type": "html",
  "max_pages": 20,
  "rate_limit_seconds": 3,
  "css_selectors": {
    "job_links": ".job-list a",
    "title": "h1.job-title",
    "company": ".company-name"
  }
}
```

#### `PUT /schedules/{site_name}`
**Purpose**: Update existing schedule

#### `DELETE /schedules/{site_name}`
**Purpose**: Delete schedule (soft delete)

### Job Management

#### `GET /jobs/raw`
**Purpose**: Get raw scraped jobs
**Parameters**:
- `limit`: integer (default: 100, max: 1000)
- `offset`: integer (default: 0)
- `site_name`: string (optional filter)
- `status`: string (optional filter)
- `date_from`: date (optional filter)
- `date_to`: date (optional filter)

#### `GET /jobs/normalized`
**Purpose**: Get normalized jobs
**Parameters**: Same as raw jobs plus:
- `min_quality_score`: float (0-1)
- `exclude_duplicates`: boolean (default: true)
- `remote_type`: string (remote, hybrid, onsite)

#### `POST /jobs/reprocess`
**Purpose**: Reprocess specific jobs
**Request Body**:
```json
{
  "job_ids": [123, 456, 789],
  "force_renormalization": true,
  "recheck_duplicates": true
}
```

### Scraper Control

#### `POST /scraper/start`
**Purpose**: Start scraping for specific site
**Request Body**:
```json
{
  "site_name": "example-jobs",
  "priority": 8,
  "max_pages": 10
}
```

#### `POST /scraper/stop`
**Purpose**: Stop active scraping job
**Request Body**:
```json
{
  "job_id": 123,
  "reason": "Manual stop requested"
}
```

#### `GET /scraper/status`
**Purpose**: Get current scraper status
**Response**:
```json
{
  "active_jobs": [
    {
      "job_id": 123,
      "site_name": "example-jobs",
      "status": "running",
      "progress": {
        "pages_scraped": 5,
        "jobs_found": 87,
        "estimated_remaining": "15 minutes"
      }
    }
  ],
  "queue_size": 8,
  "available_scrapers": 2
}
```

### Data Export

#### `POST /export/to-main-api`
**Purpose**: Export jobs to main RemoteHive API
**Request Body**:
```json
{
  "job_ids": [123, 456, 789],
  "min_quality_score": 0.7,
  "exclude_duplicates": true,
  "batch_size": 50
}
```

#### `GET /export/status/{export_id}`
**Purpose**: Check export job status
**Response**:
```json
{
  "export_id": "exp_123456",
  "status": "in_progress",
  "total_jobs": 500,
  "exported_jobs": 350,
  "failed_jobs": 5,
  "estimated_completion": "2024-12-20T11:15:00Z"
}
```

---

## Configuration Management

### Environment Variables

```bash
# Database Configuration
AUTOSCRAPER_DB_PATH=/path/to/autoscraper.db
AUTOSCRAPER_DB_BACKUP_PATH=/path/to/backups/

# API Configuration
AUTOSCRAPER_HOST=0.0.0.0
AUTOSCRAPER_PORT=8001
AUTOSCRAPER_WORKERS=4

# Main API Integration
MAIN_API_BASE_URL=http://localhost:8000
MAIN_API_AUTH_TOKEN=your-service-token
MAIN_API_TIMEOUT=30

# Scraping Configuration
DEFAULT_USER_AGENT="RemoteHive-Bot/1.0 (+https://remotehive.com/bot)"
DEFAULT_RATE_LIMIT=2
MAX_CONCURRENT_SCRAPERS=5
MAX_PAGES_PER_SITE=50

# Browser Configuration (for Selenium)
CHROME_DRIVER_PATH=/usr/local/bin/chromedriver
HEADLESS_BROWSER=true
BROWSER_TIMEOUT=30

# Performance Configuration
MAX_MEMORY_USAGE_MB=2048
CLEANUP_OLD_DATA_DAYS=30
BACKUP_RETENTION_DAYS=90

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE_PATH=/var/log/autoscraper/
LOG_ROTATION_SIZE=100MB
LOG_RETENTION_COUNT=10

# Monitoring Configuration
METRICS_ENABLED=true
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=60

# External Services
PROXY_ENABLED=false
PROXY_LIST_URL=https://example.com/proxy-list
CAPTCHA_SOLVER_API_KEY=your-captcha-key
```

### Site Configuration Schema

```json
{
  "site_name": "example-jobs",
  "display_name": "Example Jobs Board",
  "base_url": "https://example.com/jobs",
  "scraper_config": {
    "type": "html", // html, api, hybrid
    "frequency_hours": 12,
    "max_pages": 20,
    "rate_limit_seconds": 3,
    "timeout_seconds": 30,
    "retry_attempts": 3,
    "respect_robots_txt": true
  },
  "http_config": {
    "user_agent": "Custom User Agent",
    "headers": {
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9"
    },
    "cookies": {
      "session_id": "example_session"
    },
    "proxy": {
      "enabled": false,
      "url": "http://proxy.example.com:8080"
    }
  },
  "extraction_config": {
    "selectors": {
      "job_links": ".job-list a.job-link",
      "pagination_next": ".pagination .next",
      "job_title": "h1.job-title, .title",
      "company_name": ".company-name, .employer",
      "location": ".location, .job-location",
      "salary": ".salary, .compensation",
      "description": ".job-description, .description",
      "requirements": ".requirements, .qualifications",
      "posted_date": ".posted-date, .date",
      "application_url": ".apply-button, .apply-link"
    },
    "required_fields": ["job_title", "company_name", "description"],
    "field_processors": {
      "salary": "extract_salary_range",
      "location": "normalize_location",
      "posted_date": "parse_relative_date"
    }
  },
  "api_config": {
    "authentication": {
      "type": "bearer", // bearer, api_key, oauth2
      "token": "your-api-token",
      "refresh_url": "https://api.example.com/refresh"
    },
    "endpoints": {
      "jobs_list": "https://api.example.com/jobs",
      "job_detail": "https://api.example.com/jobs/{id}"
    },
    "pagination": {
      "type": "offset", // offset, cursor, page
      "limit_param": "limit",
      "offset_param": "offset",
      "max_limit": 100
    },
    "rate_limiting": {
      "requests_per_minute": 60,
      "burst_limit": 10
    }
  },
  "quality_config": {
    "min_description_length": 100,
    "required_fields_weight": 0.4,
    "content_quality_weight": 0.3,
    "freshness_weight": 0.2,
    "source_reputation_weight": 0.1
  },
  "duplicate_detection": {
    "enabled": true,
    "similarity_threshold": 0.85,
    "comparison_fields": ["title", "company", "description"],
    "fuzzy_matching": true,
    "semantic_matching": true
  }
}
```

---

## Performance Optimization

### Scraping Performance

#### 1. **Concurrent Processing**
```python
# Async scraping with controlled concurrency
async def scrape_multiple_sites(sites: List[str], max_concurrent: int = 5):
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def scrape_with_semaphore(site: str):
        async with semaphore:
            return await scrape_site(site)
    
    tasks = [scrape_with_semaphore(site) for site in sites]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

#### 2. **Intelligent Rate Limiting**
```python
class AdaptiveRateLimiter:
    def __init__(self, base_delay: float = 1.0):
        self.base_delay = base_delay
        self.current_delay = base_delay
        self.success_count = 0
        self.error_count = 0
    
    async def wait(self):
        await asyncio.sleep(self.current_delay)
    
    def on_success(self):
        self.success_count += 1
        if self.success_count > 10:
            self.current_delay = max(0.5, self.current_delay * 0.9)
            self.success_count = 0
    
    def on_error(self):
        self.error_count += 1
        self.current_delay = min(10.0, self.current_delay * 1.5)
        if self.error_count > 5:
            self.current_delay = min(30.0, self.current_delay * 2)
```

#### 3. **Caching Strategy**
```python
class ScrapingCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.cache_ttl = {
            'job_list': 3600,  # 1 hour
            'job_detail': 86400,  # 24 hours
            'site_structure': 604800  # 1 week
        }
    
    async def get_cached_content(self, url: str, cache_type: str) -> Optional[str]:
        cache_key = f"scraper:{cache_type}:{hashlib.md5(url.encode()).hexdigest()}"
        return await self.redis.get(cache_key)
    
    async def cache_content(self, url: str, content: str, cache_type: str):
        cache_key = f"scraper:{cache_type}:{hashlib.md5(url.encode()).hexdigest()}"
        ttl = self.cache_ttl.get(cache_type, 3600)
        await self.redis.setex(cache_key, ttl, content)
```

### Database Performance

#### 1. **Batch Operations**
```python
async def batch_insert_raw_jobs(raw_jobs: List[dict], batch_size: int = 1000):
    """Insert raw jobs in batches for better performance."""
    for i in range(0, len(raw_jobs), batch_size):
        batch = raw_jobs[i:i + batch_size]
        
        # Use executemany for better performance
        query = """
        INSERT INTO autoscrape_raw_job 
        (scrape_job_id, external_job_id, source_url, raw_html, extracted_data, content_hash)
        VALUES (?, ?, ?, ?, ?, ?)
        """
        
        values = [
            (job['scrape_job_id'], job['external_job_id'], job['source_url'],
             job['raw_html'], json.dumps(job['extracted_data']), job['content_hash'])
            for job in batch
        ]
        
        await database.executemany(query, values)
```

#### 2. **Index Optimization**
```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_normalized_job_composite_search 
ON autoscrape_normalized_job(source_site, posted_date, quality_score, is_duplicate);

CREATE INDEX idx_raw_job_processing 
ON autoscrape_raw_job(extraction_status, scrape_timestamp);

CREATE INDEX idx_scrape_job_monitoring 
ON autoscrape_scrape_job(scrape_status, started_at, site_name);
```

#### 3. **Connection Pooling**
```python
class DatabaseManager:
    def __init__(self, db_path: str, pool_size: int = 10):
        self.db_path = db_path
        self.pool = asyncio.Queue(maxsize=pool_size)
        self._initialize_pool(pool_size)
    
    async def _initialize_pool(self, size: int):
        for _ in range(size):
            conn = await aiosqlite.connect(self.db_path)
            await self.pool.put(conn)
    
    async def get_connection(self):
        return await self.pool.get()
    
    async def return_connection(self, conn):
        await self.pool.put(conn)
```

---

## Monitoring & Alerting

### Metrics Collection

#### 1. **Performance Metrics**
```python
class MetricsCollector:
    def __init__(self):
        self.metrics = {
            'scrape_jobs_total': 0,
            'scrape_jobs_success': 0,
            'scrape_jobs_failed': 0,
            'jobs_extracted_total': 0,
            'jobs_normalized_total': 0,
            'duplicates_detected': 0,
            'processing_time_avg': 0.0,
            'quality_score_avg': 0.0
        }
    
    def record_scrape_job(self, success: bool, duration: float, jobs_found: int):
        self.metrics['scrape_jobs_total'] += 1
        if success:
            self.metrics['scrape_jobs_success'] += 1
            self.metrics['jobs_extracted_total'] += jobs_found
        else:
            self.metrics['scrape_jobs_failed'] += 1
        
        # Update average processing time
        current_avg = self.metrics['processing_time_avg']
        total_jobs = self.metrics['scrape_jobs_total']
        self.metrics['processing_time_avg'] = (
            (current_avg * (total_jobs - 1) + duration) / total_jobs
        )
```

#### 2. **Health Checks**
```python
class HealthChecker:
    async def check_database_health(self) -> dict:
        try:
            # Test database connection
            async with aiosqlite.connect(DB_PATH) as db:
                await db.execute("SELECT 1")
            
            # Check database size
            db_size = os.path.getsize(DB_PATH)
            
            return {
                'status': 'healthy',
                'database_size_mb': db_size / (1024 * 1024),
                'connection': 'ok'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e)
            }
    
    async def check_scraper_health(self) -> dict:
        # Check active scrapers
        active_scrapers = await get_active_scrapers()
        
        # Check queue size
        queue_size = await get_queue_size()
        
        # Check recent success rate
        success_rate = await calculate_recent_success_rate()
        
        return {
            'active_scrapers': len(active_scrapers),
            'queue_size': queue_size,
            'success_rate': success_rate,
            'status': 'healthy' if success_rate > 0.8 else 'degraded'
        }
```

### Alerting System

#### 1. **Alert Conditions**
```python
class AlertManager:
    def __init__(self):
        self.alert_conditions = {
            'high_error_rate': {
                'threshold': 0.2,  # 20% error rate
                'window_minutes': 30,
                'severity': 'warning'
            },
            'scraper_down': {
                'threshold': 0,  # No active scrapers
                'window_minutes': 5,
                'severity': 'critical'
            },
            'queue_backup': {
                'threshold': 100,  # 100+ jobs in queue
                'window_minutes': 60,
                'severity': 'warning'
            },
            'database_size': {
                'threshold': 5000,  # 5GB database size
                'window_minutes': 1440,  # Daily check
                'severity': 'info'
            }
        }
    
    async def check_alerts(self):
        alerts = []
        
        # Check error rate
        error_rate = await self.calculate_error_rate(30)
        if error_rate > self.alert_conditions['high_error_rate']['threshold']:
            alerts.append({
                'type': 'high_error_rate',
                'severity': 'warning',
                'message': f'Error rate is {error_rate:.2%} over the last 30 minutes',
                'value': error_rate
            })
        
        return alerts
```

#### 2. **Notification Channels**
```python
class NotificationManager:
    async def send_alert(self, alert: dict):
        # Send to multiple channels based on severity
        if alert['severity'] == 'critical':
            await self.send_email_alert(alert)
            await self.send_slack_alert(alert)
            await self.send_sms_alert(alert)
        elif alert['severity'] == 'warning':
            await self.send_email_alert(alert)
            await self.send_slack_alert(alert)
        else:
            await self.send_slack_alert(alert)
    
    async def send_slack_alert(self, alert: dict):
        webhook_url = os.getenv('SLACK_WEBHOOK_URL')
        if not webhook_url:
            return
        
        payload = {
            'text': f"🚨 Autoscraper Alert: {alert['type']}",
            'attachments': [{
                'color': 'danger' if alert['severity'] == 'critical' else 'warning',
                'fields': [
                    {'title': 'Severity', 'value': alert['severity'], 'short': True},
                    {'title': 'Message', 'value': alert['message'], 'short': False}
                ]
            }]
        }
        
        async with httpx.AsyncClient() as client:
            await client.post(webhook_url, json=payload)
```

---

## Error Handling & Recovery

### Error Classification

```python
class ScrapingError(Exception):
    """Base exception for scraping errors."""
    pass

class NetworkError(ScrapingError):
    """Network-related errors (timeouts, connection issues)."""
    pass

class ParsingError(ScrapingError):
    """Data parsing and extraction errors."""
    pass

class RateLimitError(ScrapingError):
    """Rate limiting and blocking errors."""
    pass

class AuthenticationError(ScrapingError):
    """Authentication and authorization errors."""
    pass

class DataQualityError(ScrapingError):
    """Data quality and validation errors."""
    pass
```

### Recovery Strategies

#### 1. **Exponential Backoff**
```python
class RetryManager:
    def __init__(self, max_retries: int = 3, base_delay: float = 1.0):
        self.max_retries = max_retries
        self.base_delay = base_delay
    
    async def retry_with_backoff(self, func, *args, **kwargs):
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                return await func(*args, **kwargs)
            except (NetworkError, RateLimitError) as e:
                last_exception = e
                if attempt < self.max_retries:
                    delay = self.base_delay * (2 ** attempt)
                    await asyncio.sleep(delay)
                    continue
                raise
            except (ParsingError, DataQualityError):
                # Don't retry parsing errors
                raise
        
        raise last_exception
```

#### 2. **Circuit Breaker**
```python
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'closed'  # closed, open, half-open
    
    async def call(self, func, *args, **kwargs):
        if self.state == 'open':
            if time.time() - self.last_failure_time > self.timeout:
                self.state = 'half-open'
            else:
                raise ScrapingError("Circuit breaker is open")
        
        try:
            result = await func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise
    
    def on_success(self):
        self.failure_count = 0
        self.state = 'closed'
    
    def on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = 'open'
```

---

## Security Considerations

### 1. **Anti-Bot Detection Evasion**
```python
class AntiDetectionManager:
    def __init__(self):
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
        ]
        self.proxy_rotation = ProxyRotator()
    
    def get_random_headers(self) -> dict:
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    
    async def setup_stealth_browser(self) -> webdriver.Chrome:
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        driver = webdriver.Chrome(options=options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        return driver
```

### 2. **Data Privacy & Compliance**
```python
class DataPrivacyManager:
    def __init__(self):
        self.pii_patterns = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
            r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
            r'\b\d{3}-\d{3}-\d{4}\b',  # Phone
        ]
    
    def sanitize_job_data(self, job_data: dict) -> dict:
        """Remove or mask PII from job data."""
        sanitized = job_data.copy()
        
        for field in ['description', 'requirements']:
            if field in sanitized:
                sanitized[field] = self.remove_pii(sanitized[field])
        
        return sanitized
    
    def remove_pii(self, text: str) -> str:
        """Remove PII patterns from text."""
        for pattern in self.pii_patterns:
            text = re.sub(pattern, '[REDACTED]', text)
        return text
```

### 3. **Rate Limiting & Respectful Crawling**
```python
class RespectfulCrawler:
    def __init__(self):
        self.robots_cache = {}
        self.crawl_delays = {}
    
    async def check_robots_txt(self, base_url: str) -> bool:
        """Check if crawling is allowed by robots.txt."""
        if base_url not in self.robots_cache:
            robots_url = urljoin(base_url, '/robots.txt')
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(robots_url)
                    if response.status_code == 200:
                        rp = urllib.robotparser.RobotFileParser()
                        rp.set_url(robots_url)
                        rp.read()
                        self.robots_cache[base_url] = rp
                    else:
                        self.robots_cache[base_url] = None
            except:
                self.robots_cache[base_url] = None
        
        rp = self.robots_cache[base_url]
        if rp:
            return rp.can_fetch('*', base_url)
        return True
    
    def get_crawl_delay(self, base_url: str) -> float:
        """Get crawl delay from robots.txt or use default."""
        rp = self.robots_cache.get(base_url)
        if rp:
            delay = rp.crawl_delay('*')
            return float(delay) if delay else 1.0
        return 1.0
```

---

## Deployment & Scaling

### Docker Configuration

#### Dockerfile
```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome for Selenium
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install ChromeDriver
RUN CHROMEDRIVER_VERSION=`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE` \
    && wget -N http://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip \
    && unzip chromedriver_linux64.zip \
    && rm chromedriver_linux64.zip \
    && mv chromedriver /usr/local/bin/chromedriver \
    && chmod +x /usr/local/bin/chromedriver

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 scraper && chown -R scraper:scraper /app
USER scraper

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  autoscraper:
    build: .
    ports:
      - "8001:8001"
    environment:
      - AUTOSCRAPER_DB_PATH=/app/data/autoscraper.db
      - MAIN_API_BASE_URL=http://main-api:8000
      - LOG_LEVEL=INFO
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    depends_on:
      - redis
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped
    
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  redis_data:
  grafana_data:
```

### Kubernetes Deployment

#### Deployment YAML
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: autoscraper
  labels:
    app: autoscraper
spec:
  replicas: 3
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
        image: remotehive/autoscraper:latest
        ports:
        - containerPort: 8001
        env:
        - name: AUTOSCRAPER_DB_PATH
          value: "/app/data/autoscraper.db"
        - name: MAIN_API_BASE_URL
          value: "http://main-api-service:8000"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        volumeMounts:
        - name: data-volume
          mountPath: /app/data
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
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: autoscraper-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: autoscraper-service
spec:
  selector:
    app: autoscraper
  ports:
  - protocol: TCP
    port: 8001
    targetPort: 8001
  type: ClusterIP
```

---

## Testing Strategy

### Unit Tests

```python
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from autoscraper.scrapers.html_scraper import HTMLScraper
from autoscraper.normalizers.data_normalizer import DataNormalizer

class TestHTMLScraper:
    @pytest.fixture
    def scraper(self):
        config = Mock()
        config.rate_limit_seconds = 1
        config.css_selectors = {
            'job_links': '.job-list a',
            'title': 'h1.title',
            'company': '.company'
        }
        return HTMLScraper(config)
    
    @pytest.mark.asyncio
    async def test_extract_job_links(self, scraper):
        html_content = '''
        <div class="job-list">
            <a href="/job/1">Job 1</a>
            <a href="/job/2">Job 2</a>
        </div>
        '''
        
        links = await scraper.extract_job_links(html_content)
        assert len(links) == 2
        assert '/job/1' in links
        assert '/job/2' in links
    
    @pytest.mark.asyncio
    async def test_extract_job_data(self, scraper):
        html_content = '''
        <h1 class="title">Software Engineer</h1>
        <div class="company">Tech Corp</div>
        '''
        
        with patch.object(scraper, 'fetch_page', return_value=html_content):
            data = await scraper.extract_job_data('http://example.com/job/1')
            
        assert data['title'] == 'Software Engineer'
        assert data['company'] == 'Tech Corp'

class TestDataNormalizer:
    @pytest.fixture
    def normalizer(self):
        return DataNormalizer()
    
    def test_normalize_title(self, normalizer):
        # Test title cleaning
        assert normalizer.normalize_title('  Software Engineer  ') == 'Software Engineer'
        assert normalizer.normalize_title('Sr. Software Engineer') == 'Senior Software Engineer'
        assert normalizer.normalize_title('PYTHON DEVELOPER') == 'Python Developer'
    
    def test_normalize_salary(self, normalizer):
        # Test salary parsing
        result = normalizer.normalize_salary('$80,000 - $120,000 per year')
        assert result['min'] == 80000
        assert result['max'] == 120000
        assert result['currency'] == 'USD'
        assert result['period'] == 'yearly'
    
    def test_classify_remote_type(self, normalizer):
        # Test remote classification
        assert normalizer.classify_remote_type('100% remote position', 'Remote') == 'remote'
        assert normalizer.classify_remote_type('hybrid work model', 'New York') == 'hybrid'
        assert normalizer.classify_remote_type('on-site required', 'San Francisco') == 'onsite'
```

### Integration Tests

```python
@pytest.mark.integration
class TestScrapingPipeline:
    @pytest.fixture
    async def test_db(self):
        # Create test database
        db_path = ':memory:'
        await create_test_database(db_path)
        yield db_path
    
    @pytest.mark.asyncio
    async def test_full_scraping_pipeline(self, test_db):
        # Test complete pipeline from scraping to normalization
        site_config = {
            'site_name': 'test-site',
            'base_url': 'http://test-jobs.com',
            'scraper_type': 'html'
        }
        
        # Mock HTTP responses
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_get.return_value.status_code = 200
            mock_get.return_value.text = '''
            <div class="job-list">
                <a href="/job/1">Software Engineer</a>
            </div>
            '''
            
            # Run pipeline
            pipeline = PipelineOrchestrator(test_db)
            job_id = await pipeline.create_scrape_job('test-site')
            success = await pipeline.process_scrape_job(job_id)
            
            assert success
            
            # Verify data was processed
            normalized_jobs = await pipeline.get_normalized_jobs(job_id)
            assert len(normalized_jobs) > 0
```

### Performance Tests

```python
@pytest.mark.performance
class TestPerformance:
    @pytest.mark.asyncio
    async def test_concurrent_scraping_performance(self):
        # Test scraping performance under load
        sites = [f'test-site-{i}' for i in range(10)]
        
        start_time = time.time()
        results = await scrape_multiple_sites(sites, max_concurrent=5)
        end_time = time.time()
        
        # Should complete within reasonable time
        assert end_time - start_time < 60  # 60 seconds
        assert len(results) == 10
    
    @pytest.mark.asyncio
    async def test_database_performance(self):
        # Test database operations under load
        jobs_data = [generate_test_job_data() for _ in range(1000)]
        
        start_time = time.time()
        await batch_insert_raw_jobs(jobs_data)
        end_time = time.time()
        
        # Should insert 1000 jobs quickly
        assert end_time - start_time < 5  # 5 seconds
```

---

## Troubleshooting Guide

### Common Issues

#### 1. **Scraper Not Starting**
```bash
# Check service status
curl http://localhost:8001/health

# Check logs
tail -f /var/log/autoscraper/app.log

# Verify database connection
sqlite3 /path/to/autoscraper.db ".tables"

# Check port availability
lsof -i :8001
```

#### 2. **High Memory Usage**
```python
# Monitor memory usage
import psutil

def check_memory_usage():
    process = psutil.Process()
    memory_info = process.memory_info()
    print(f"RSS: {memory_info.rss / 1024 / 1024:.2f} MB")
    print(f"VMS: {memory_info.vms / 1024 / 1024:.2f} MB")

# Optimize memory usage
async def cleanup_old_data():
    # Remove old raw data
    await db.execute("""
        DELETE FROM autoscrape_raw_job 
        WHERE scrape_timestamp < datetime('now', '-7 days')
    """)
    
    # Vacuum database
    await db.execute("VACUUM")
```

#### 3. **Rate Limiting Issues**
```python
# Check rate limiting status
async def check_rate_limits():
    sites = await get_active_sites()
    for site in sites:
        last_request = await get_last_request_time(site)
        rate_limit = await get_rate_limit(site)
        
        if time.time() - last_request < rate_limit:
            print(f"Site {site} is rate limited")
```

#### 4. **Duplicate Detection Issues**
```sql
-- Check duplicate statistics
SELECT 
    source_site,
    COUNT(*) as total_jobs,
    SUM(CASE WHEN is_duplicate = 1 THEN 1 ELSE 0 END) as duplicates,
    ROUND(SUM(CASE WHEN is_duplicate = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as duplicate_rate
FROM autoscrape_normalized_job 
GROUP BY source_site;

-- Find potential missed duplicates
SELECT 
    a.id, a.title, a.company_name,
    b.id, b.title, b.company_name
FROM autoscrape_normalized_job a
JOIN autoscrape_normalized_job b ON (
    a.id < b.id AND
    a.title = b.title AND
    a.company_name = b.company_name AND
    a.is_duplicate = 0 AND
    b.is_duplicate = 0
);
```

---

## Future Enhancements

### Planned Features

#### 1. **Machine Learning Integration**
- **Job Quality Prediction**: Use ML models to predict job posting quality
- **Salary Estimation**: Predict salary ranges for jobs without explicit compensation
- **Skill Extraction**: Advanced NLP for skill and requirement extraction
- **Duplicate Detection**: Semantic similarity using transformer models

#### 2. **Advanced Scraping Capabilities**
- **Dynamic Site Adaptation**: Automatically adapt to site structure changes
- **CAPTCHA Solving**: Integration with CAPTCHA solving services
- **JavaScript Rendering**: Enhanced support for SPA and dynamic content
- **Mobile Site Scraping**: Support for mobile-optimized job sites

#### 3. **Real-time Processing**
- **Streaming Pipeline**: Real-time job processing using Apache Kafka
- **WebSocket Notifications**: Real-time updates to main application
- **Event-driven Architecture**: Microservices communication via events
- **Hot Reloading**: Dynamic configuration updates without restart

#### 4. **Enhanced Monitoring**
- **Predictive Alerting**: ML-based anomaly detection
- **Performance Analytics**: Advanced metrics and dashboards
- **Cost Optimization**: Resource usage optimization recommendations
- **Quality Metrics**: Content quality trend analysis

---

## Conclusion

The RemoteHive Autoscraper Engine represents a sophisticated, scalable solution for automated job data collection and processing. Its modular architecture, comprehensive error handling, and robust monitoring capabilities make it suitable for production deployment at scale.

Key strengths include:
- **Scalability**: Designed to handle multiple concurrent scraping operations
- **Reliability**: Comprehensive error handling and recovery mechanisms
- **Flexibility**: Configurable scrapers for different site types and structures
- **Quality**: Advanced normalization and duplicate detection
- **Monitoring**: Extensive metrics and alerting capabilities

For additional support or feature requests, please refer to the main RemoteHive documentation or contact the development team.

---

*Last Updated: December 2024*
*Version: 1.0.0*
*Author: RemoteHive Development Team*