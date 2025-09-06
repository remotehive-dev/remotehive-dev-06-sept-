# Enhanced Web Scraping Engine

The RemoteHive platform now includes an enhanced web scraping engine with Playwright integration, intelligent engine selection, advanced anti-bot detection bypass, and comprehensive configuration management.

## Features

### 🚀 Multi-Engine Support
- **Requests Engine**: Fast, lightweight scraping for simple sites
- **Playwright Engine**: Browser automation for complex, JavaScript-heavy sites
- **Hybrid Mode**: Intelligent engine selection based on site complexity

### 🛡️ Anti-Bot Detection
- Stealth mode with browser fingerprint masking
- User agent rotation and randomization
- Random delays and human-like behavior simulation
- Proxy support with rotation and health checking
- CAPTCHA detection and handling

### ⚡ Performance Optimization
- Intelligent rate limiting with adaptive behavior
- Content deduplication (URL and content-based)
- Concurrent request management
- Resource cleanup and memory management

### 📊 Monitoring & Analytics
- Real-time performance tracking
- Success rate monitoring
- Error tracking and alerting
- Comprehensive logging

## Configuration

### Environment Variables

```bash
# Scraping Mode
SCRAPING_MODE=hybrid  # requests, playwright, hybrid
ANTI_DETECTION_LEVEL=moderate  # basic, moderate, advanced, maximum

# Playwright Settings
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
PLAYWRIGHT_STEALTH=true
PLAYWRIGHT_BROWSER=chromium  # chromium, firefox, webkit

# Rate Limiting
RATE_LIMITING_ENABLED=true
RATE_LIMIT_DELAY=1.0
ADAPTIVE_RATE_LIMITING=true
REQUESTS_PER_MINUTE=60

# Deduplication
DEDUPLICATION_ENABLED=true
SIMILARITY_THRESHOLD=0.85

# Proxy Settings
PROXY_ENABLED=false
PROXY_LIST=proxy1:port,proxy2:port

# Monitoring
MONITORING_ENABLED=true
ALERT_EMAIL=admin@remotehive.in
```

### Programmatic Configuration

```python
from app.scraper.config import (
    EnhancedScrapingConfig, ScrapingMode, AntiDetectionLevel,
    PlaywrightSettings, RateLimitingSettings
)

# Create custom configuration
config = EnhancedScrapingConfig(
    scraping_mode=ScrapingMode.HYBRID,
    anti_detection_level=AntiDetectionLevel.ADVANCED,
    playwright=PlaywrightSettings(
        headless=True,
        enable_stealth=True,
        browser_type="chromium"
    ),
    rate_limiting=RateLimitingSettings(
        enabled=True,
        adaptive=True,
        base_delay=2.0
    )
)

# Set global configuration
from app.scraper.config import set_scraping_config
set_scraping_config(config)
```

## Usage

### Basic Usage

```python
from app.scraper.engine import WebScrapingEngine, ScrapingConfig
from app.scraper.config import EnhancedScrapingConfig, ScrapingMode
from app.core.enums import ScraperSource

# Create basic configuration
basic_config = ScrapingConfig(
    source=ScraperSource.REMOTEOK,
    base_url="https://remoteok.io",
    user_agent="RemoteHive Bot 1.0",
    rate_limit_delay=1.0
)

# Create enhanced configuration
enhanced_config = EnhancedScrapingConfig(
    scraping_mode=ScrapingMode.HYBRID
)

# Initialize engine
engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)

# Scrape jobs
search_params = {
    'url': 'https://remoteok.io/remote-python-jobs',
    'query': 'python developer',
    'location': 'remote'
}

results = await engine.scrape_jobs(search_params)
```

### Celery Task Integration

```python
from app.tasks.playwright_scraper import playwright_scrape_jobs, batch_playwright_scrape

# Single scraping task
result = playwright_scrape_jobs.delay(
    scraper_config_id=1,
    search_params={'query': 'python', 'location': 'remote'}
)

# Batch scraping
batch_result = batch_playwright_scrape.delay(
    scraper_configs=[1, 2, 3],
    search_params={'query': 'developer'}
)
```

### Site-Specific Configuration

```python
from app.scraper.config import get_scraping_config

config = get_scraping_config()

# Add site-specific overrides
config.site_configs['linkedin.com'] = {
    'rate_limit_delay': 5.0,
    'enable_stealth': True,
    'anti_detection_level': 'maximum',
    'use_proxy': True
}

config.site_configs['glassdoor.com'] = {
    'rate_limit_delay': 3.0,
    'enable_stealth': True,
    'simulate_human_behavior': True
}
```

## Engine Selection Logic

### Hybrid Mode Intelligence

In hybrid mode, the engine automatically selects the appropriate scraping method:

**Playwright Engine Used For:**
- LinkedIn (linkedin.com)
- Glassdoor (glassdoor.com)
- Indeed (indeed.com)
- AngelList (angel.co)
- Stack Overflow Jobs (stackoverflow.com)
- GitHub Jobs (github.com)
- Sites with heavy JavaScript
- Sites with anti-bot protection

**Requests Engine Used For:**
- RemoteOK (remoteok.io)
- We Work Remotely (weworkremotely.com)
- Remote.co (remote.co)
- Simple HTML-based job boards
- RSS feeds and APIs

### Custom Engine Selection

```python
def custom_engine_selector(url: str) -> bool:
    """Custom logic for engine selection"""
    complex_indicators = [
        'javascript', 'react', 'angular', 'vue',
        'cloudflare', 'captcha', 'bot-protection'
    ]
    
    # Check if URL or content suggests complexity
    return any(indicator in url.lower() for indicator in complex_indicators)

# Override the default logic
config.should_use_playwright = custom_engine_selector
```

## Anti-Bot Detection Levels

### Basic Level
- User agent rotation
- Basic request headers
- Simple delays

### Moderate Level (Default)
- Advanced user agent rotation
- Randomized request headers
- Variable delays
- Basic fingerprint masking

### Advanced Level
- Stealth mode enabled
- Proxy rotation
- Advanced fingerprint masking
- Human behavior simulation
- Request pattern randomization

### Maximum Level
- All advanced features
- CAPTCHA detection
- Advanced behavioral mimicking
- Multiple proxy chains
- Enhanced evasion techniques

## Performance Monitoring

### Metrics Tracked

```python
from app.scraper.engine import WebScrapingEngine

engine = WebScrapingEngine(config)

# Access performance metrics
metrics = engine.performance_tracker.get_metrics()
print(f"Success Rate: {metrics['success_rate']}%")
print(f"Average Response Time: {metrics['avg_response_time']}ms")
print(f"Total Requests: {metrics['total_requests']}")
print(f"Failed Requests: {metrics['failed_requests']}")
```

### Health Checks

```python
from app.tasks.playwright_scraper import health_check_playwright

# Run health check
health_status = health_check_playwright.delay()
result = health_status.get()

if result['status'] == 'healthy':
    print("Playwright engine is running normally")
else:
    print(f"Issues detected: {result['issues']}")
```

## Testing and Validation

### Running Tests

```bash
# Run the validation script
python scripts/test_scraping_engine.py --validate

# Test specific mode
python scripts/test_scraping_engine.py --mode playwright --validate

# Test URL engine selection
python scripts/test_scraping_engine.py --test-url https://linkedin.com/jobs

# Show current configuration
python scripts/test_scraping_engine.py --config
```

### Unit Tests

```bash
# Run enhanced scraping tests
pytest tests/test_enhanced_scraping.py -v

# Run with coverage
pytest tests/test_enhanced_scraping.py --cov=app.scraper --cov-report=html
```

## Troubleshooting

### Common Issues

#### Playwright Installation
```bash
# Install Playwright browsers
python -m playwright install

# Install system dependencies
python -m playwright install-deps
```

#### Memory Issues
```python
# Configure resource limits
config.playwright.enable_images = False  # Disable image loading
config.rate_limiting.concurrent_requests = 2  # Reduce concurrency
```

#### Rate Limiting
```python
# Adjust rate limiting settings
config.rate_limiting.base_delay = 3.0  # Increase delay
config.rate_limiting.adaptive = True   # Enable adaptive behavior
```

### Debug Mode

```python
# Enable debug logging
import logging
logging.getLogger('app.scraper').setLevel(logging.DEBUG)

# Run Playwright in non-headless mode
config.playwright.headless = False
```

### Performance Optimization

```python
# Optimize for speed
config = EnhancedScrapingConfig(
    scraping_mode=ScrapingMode.REQUESTS,  # Use requests when possible
    deduplication=DeduplicationSettings(
        enabled=True,
        cache_size=5000  # Reduce cache size
    ),
    rate_limiting=RateLimitingSettings(
        concurrent_requests=10  # Increase concurrency
    )
)

# Optimize for stealth
config = EnhancedScrapingConfig(
    scraping_mode=ScrapingMode.PLAYWRIGHT,
    anti_detection_level=AntiDetectionLevel.MAXIMUM,
    rate_limiting=RateLimitingSettings(
        base_delay=5.0,  # Slower but stealthier
        adaptive=True
    )
)
```

## Migration Guide

### From Legacy Engine

1. **Update Configuration**
   ```python
   # Old way
   config = ScrapingConfig(use_playwright=True)
   
   # New way
   enhanced_config = EnhancedScrapingConfig(
       scraping_mode=ScrapingMode.PLAYWRIGHT
   )
   engine = WebScrapingEngine(config, enhanced_config=enhanced_config)
   ```

2. **Update Task Calls**
   ```python
   # Old way
   from app.tasks.scraper import run_scheduled_scrapers
   
   # New way
   from app.tasks.playwright_scraper import playwright_scrape_jobs
   ```

3. **Environment Variables**
   ```bash
   # Add new environment variables
   SCRAPING_MODE=hybrid
   ANTI_DETECTION_LEVEL=moderate
   PLAYWRIGHT_STEALTH=true
   ```

## Best Practices

### 1. Engine Selection
- Use **Requests** for simple, API-like endpoints
- Use **Playwright** for complex, JavaScript-heavy sites
- Use **Hybrid** for mixed workloads (recommended)

### 2. Rate Limiting
- Start with conservative settings
- Enable adaptive rate limiting
- Monitor success rates and adjust accordingly

### 3. Anti-Detection
- Use **Moderate** level for most sites
- Escalate to **Advanced** only when necessary
- **Maximum** level should be used sparingly

### 4. Resource Management
- Always call `engine.close()` when done
- Use context managers when possible
- Monitor memory usage in production

### 5. Error Handling
- Implement proper retry logic
- Log errors with context
- Use circuit breakers for failing sites

## API Reference

See the inline documentation in the following modules:
- `app.scraper.config` - Configuration management
- `app.scraper.engine` - Main scraping engine
- `app.scraper.playwright_engine` - Playwright integration
- `app.tasks.playwright_scraper` - Celery task integration

## Contributing

When contributing to the enhanced scraping engine:

1. Add tests for new features
2. Update documentation
3. Follow the existing code style
4. Test with multiple sites and configurations
5. Consider performance implications

## License

This enhanced scraping engine is part of the RemoteHive platform and follows the same licensing terms.