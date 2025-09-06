# Smart Auto-Scraper System Guide

## Overview

The RemoteHive Smart Auto-Scraper System is an intelligent, automated job scraping solution that continuously monitors multiple job boards, extracts high-quality job postings, and maintains an up-to-date database of remote job opportunities.

## Key Features

### 🤖 Intelligent Automation
- **Smart Scheduling**: Automatically adjusts scraping intervals based on historical performance
- **Anti-Detection**: Advanced techniques to avoid being blocked by job sites
- **Quality Scoring**: AI-powered job quality assessment and filtering
- **Deduplication**: Intelligent duplicate detection and removal

### 📊 Real-Time Monitoring
- **Progress Tracking**: Live progress updates during scraping operations
- **Performance Analytics**: Detailed metrics and performance insights
- **Health Monitoring**: System health checks and optimization recommendations
- **Error Handling**: Robust error recovery and reporting

### 🎯 Supported Job Boards
- **Indeed.com**: Comprehensive job search with advanced filtering
- **Remote.co**: Specialized remote job opportunities
- **Extensible**: Easy to add new job board scrapers

## Architecture

### Core Components

1. **SmartScraperManager**: Central orchestrator for all scraping operations
2. **BaseScraper**: Foundation class with anti-detection capabilities
3. **Individual Scrapers**: Site-specific scraping implementations
4. **JobQualityService**: AI-powered job quality assessment
5. **ScraperConfigService**: Intelligent configuration management

### Services Integration

- **Celery Tasks**: Asynchronous background processing
- **Redis**: Caching and task queue management
- **PostgreSQL**: Persistent data storage
- **FastAPI**: RESTful API endpoints

## Getting Started

### 1. Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Install browser drivers for Selenium/Playwright
python -m playwright install
```

### 2. Configuration

Set up your environment variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/remotehive

# Redis
REDIS_URL=redis://localhost:6379

# Scraper Settings
SCRAPER_USER_AGENT_ROTATION=true
SCRAPER_DELAY_MIN=1
SCRAPER_DELAY_MAX=3
SCRAPER_MAX_RETRIES=3
```

### 3. Database Setup

Ensure your database has the required tables:

```sql
-- Scraper configurations
CREATE TABLE scraper_configs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    scraper_name VARCHAR(100) NOT NULL,
    search_query VARCHAR(500),
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    schedule_enabled BOOLEAN DEFAULT true,
    schedule_interval_minutes INTEGER DEFAULT 60,
    max_pages INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Scraper execution logs
CREATE TABLE scraper_logs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    jobs_found INTEGER DEFAULT 0,
    jobs_created INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Usage

### CLI Management Tool

The system includes a comprehensive CLI tool for easy management:

```bash
# Test a specific scraper
python -m app.cli.scraper_cli test --source indeed --query "python developer" --location remote

# Run scrapers manually
python -m app.cli.scraper_cli run --source indeed
python -m app.cli.scraper_cli run  # Run all scheduled scrapers

# Manage configurations
python -m app.cli.scraper_cli config --list
python -m app.cli.scraper_cli config --create --source indeed --query "data scientist" --location "san francisco"

# Check system status
python -m app.cli.scraper_cli status --detailed

# Optimize configurations
python -m app.cli.scraper_cli optimize

# View analytics
python -m app.cli.scraper_cli analytics --days 30

# Check system health
python -m app.cli.scraper_cli health
```

### API Endpoints

#### Scraper Management

```http
# Start a specific scraper
POST /api/v1/scraper/run
{
    "source": "indeed",
    "config_id": 1
}

# Run all scheduled scrapers
POST /api/v1/scraper/run-all

# Stop a running scraper
POST /api/v1/scraper/stop/{task_id}

# Get scraper status
GET /api/v1/scraper/status

# Get real-time progress
GET /api/v1/scraper/progress/{task_id}
```

#### Configuration Management

```http
# List configurations
GET /api/v1/scraper/configs

# Create configuration
POST /api/v1/scraper/configs
{
    "source": "indeed",
    "scraper_name": "Python Jobs",
    "search_query": "python developer",
    "location": "remote",
    "schedule_interval_minutes": 120,
    "max_pages": 10
}

# Update configuration
PUT /api/v1/scraper/configs/{config_id}
{
    "is_active": true,
    "schedule_interval_minutes": 180
}

# Delete configuration
DELETE /api/v1/scraper/config/{config_id}
```

#### Analytics and Monitoring

```http
# Get dashboard data
GET /api/v1/scraper/analytics/dashboard

# Get performance trends
GET /api/v1/scraper/analytics/performance?days=30

# Get job quality analytics
GET /api/v1/scraper/analytics/quality?days=7

# Get optimization recommendations
GET /api/v1/scraper/analytics/recommendations

# Trigger configuration optimization
POST /api/v1/scraper/analytics/optimize

# Check system health
GET /api/v1/scraper/analytics/health
```

## Advanced Features

### Smart Scheduling

The system automatically adjusts scraping intervals based on:
- Historical success rates
- Job discovery rates
- Site responsiveness
- Error patterns

```python
# Example: High-performing sources get more frequent scraping
# Low-performing sources get less frequent scraping to avoid waste

if success_rate > 0.8 and avg_jobs_found > 10:
    # Increase frequency
    new_interval = max(30, current_interval * 0.8)
else:
    # Decrease frequency
    new_interval = min(480, current_interval * 1.2)
```

### Quality Scoring

Jobs are automatically scored based on multiple factors:

- **Title Quality** (25%): Clarity, specificity, professional language
- **Description Quality** (30%): Length, detail, formatting
- **Company Information** (15%): Company name presence and validity
- **Salary Information** (15%): Salary range availability and reasonableness
- **Location Information** (10%): Location clarity and remote work indicators
- **Freshness** (5%): How recently the job was posted

```python
# Quality score calculation
quality_score = (
    title_quality * 0.25 +
    description_quality * 0.30 +
    company_info * 0.15 +
    salary_info * 0.15 +
    location_info * 0.10 +
    freshness * 0.05
) * 100

# Jobs below threshold (30) are automatically filtered out
if quality_score < 30:
    skip_job("Low quality score")
```

### Anti-Detection Measures

1. **User Agent Rotation**: Randomly rotates browser user agents
2. **Request Delays**: Random delays between requests (1-3 seconds)
3. **Proxy Support**: Built-in proxy rotation capabilities
4. **Browser Automation**: Uses undetected Chrome driver
5. **Request Headers**: Mimics real browser requests
6. **Session Management**: Maintains realistic browsing sessions

### Deduplication Strategy

```python
# Job fingerprinting for duplicate detection
fingerprint = hashlib.md5(
    f"{title.lower().strip()}|{company.lower().strip()}|{location.lower().strip()}"
    .encode('utf-8')
).hexdigest()

# Fuzzy matching for similar jobs
similarity_threshold = 0.85
if similarity_score > similarity_threshold:
    mark_as_duplicate()
```

## Monitoring and Maintenance

### Performance Metrics

- **Success Rate**: Percentage of successful scraping runs
- **Job Discovery Rate**: Average jobs found per run
- **Quality Distribution**: Breakdown of job quality scores
- **Source Performance**: Comparative analysis across job boards
- **Error Patterns**: Common failure modes and their frequencies

### Health Checks

The system performs automatic health checks:

1. **Database Connectivity**: Ensures database is accessible
2. **Redis Connectivity**: Verifies task queue functionality
3. **Scraper Availability**: Tests individual scraper components
4. **Performance Degradation**: Detects declining performance
5. **Error Rate Monitoring**: Alerts on high error rates

### Optimization Recommendations

The system provides intelligent recommendations:

- **Schedule Adjustments**: Optimize scraping frequency
- **Configuration Tuning**: Adjust max pages and search parameters
- **Performance Improvements**: Identify bottlenecks and solutions
- **Quality Enhancements**: Suggestions for better job filtering

## Troubleshooting

### Common Issues

#### 1. Scraper Getting Blocked

```bash
# Check if anti-detection is working
python -m app.cli.scraper_cli test --source indeed

# Increase delays in configuration
# Update user agent rotation
# Consider using proxy rotation
```

#### 2. Low Job Discovery

```bash
# Analyze search queries
python -m app.cli.scraper_cli analytics --days 7

# Optimize search parameters
python -m app.cli.scraper_cli optimize

# Check for site changes
python -m app.cli.scraper_cli health
```

#### 3. High Error Rates

```bash
# Check system status
python -m app.cli.scraper_cli status --detailed

# Review error logs
GET /api/v1/scraper/logs?status=failed

# Run health check
python -m app.cli.scraper_cli health
```

### Debugging

Enable debug logging in your environment:

```env
LOG_LEVEL=DEBUG
SCRAPER_DEBUG=true
```

This will provide detailed logs of:
- HTTP requests and responses
- Element selection and extraction
- Anti-detection measures
- Quality scoring decisions
- Database operations

## Extending the System

### Adding New Job Boards

1. Create a new scraper class extending `BaseScraper`:

```python
from app.scrapers.base_scraper import BaseScraper

class NewJobBoardScraper(BaseScraper):
    def __init__(self, progress_callback=None):
        super().__init__("newjobboard", progress_callback)
        self.base_url = "https://newjobboard.com"
    
    async def scrape_jobs(self, search_query, location=None, max_pages=5):
        # Implement scraping logic
        pass
```

2. Register the scraper in `SmartScraperManager`:

```python
# Add to _get_scraper method
if source == "newjobboard":
    return NewJobBoardScraper(self.progress_callback)
```

3. Add configuration support and test thoroughly

### Custom Quality Metrics

Extend the `JobQualityService` to add custom quality factors:

```python
def calculate_custom_quality(self, job_data):
    # Add custom quality calculations
    custom_score = self._calculate_custom_factors(job_data)
    return custom_score
```

## Best Practices

### 1. Respectful Scraping
- Always respect robots.txt
- Use reasonable delays between requests
- Don't overload target servers
- Monitor for rate limiting

### 2. Data Quality
- Regularly review quality thresholds
- Monitor for spam and low-quality content
- Validate extracted data
- Maintain clean, normalized data

### 3. Performance Optimization
- Use appropriate scraping intervals
- Optimize database queries
- Monitor resource usage
- Scale horizontally when needed

### 4. Monitoring and Alerting
- Set up alerts for high error rates
- Monitor job discovery trends
- Track system performance metrics
- Regular health checks

## Support and Maintenance

### Regular Tasks

1. **Weekly**: Review performance metrics and optimize configurations
2. **Monthly**: Analyze job quality trends and adjust thresholds
3. **Quarterly**: Update scraper logic for site changes
4. **As Needed**: Add new job boards and features

### Monitoring Checklist

- [ ] Success rates above 80%
- [ ] Average job discovery > 10 jobs/run
- [ ] Error rates below 10%
- [ ] Quality scores trending upward
- [ ] No blocked scrapers
- [ ] Database performance optimal
- [ ] Task queue processing normally

## Conclusion

The Smart Auto-Scraper System provides a robust, intelligent solution for automated job data collection. With its advanced anti-detection measures, quality scoring, and intelligent scheduling, it ensures high-quality job data while respecting target sites and maintaining optimal performance.

For additional support or feature requests, please refer to the project documentation or contact the development team.