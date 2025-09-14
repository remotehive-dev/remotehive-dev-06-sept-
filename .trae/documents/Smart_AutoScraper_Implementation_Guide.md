# Smart AutoScraper - Implementation Guide

## 1. Project Structure

```
app/
├── autoscraper/                    # New Django app
│   ├── __init__.py
│   ├── admin.py                     # Django admin configuration
│   ├── apps.py                      # App configuration
│   ├── models.py                    # Data models
│   ├── views.py                     # API views and endpoints
│   ├── urls.py                      # URL routing
│   ├── tasks.py                     # Celery tasks
│   ├── services.py                  # Business logic services
│   ├── serializers.py               # DRF serializers
│   ├── permissions.py               # Custom permissions
│   ├── utils.py                     # Utility functions
│   ├── management/
│   │   └── commands/
│   │       └── autoscraper_demo_seed.py  # Demo data seeding
│   ├── migrations/
│   │   └── __init__.py
│   └── templates/
│       └── autoscraper/
│           ├── dashboard.html       # Main dashboard
│           ├── boards.html          # Boards management
│           ├── schedules.html       # Scheduler interface
│           ├── runs.html            # Operations monitoring
│           └── settings.html        # Configuration
├── core/
│   ├── celery.py                    # Updated Celery configuration
│   └── settings.py                  # Updated Django settings
└── static/
    └── autoscraper/
        ├── js/
        │   ├── dashboard.js         # Dashboard interactions
        │   ├── live-updates.js     # Real-time updates
        │   └── log-streaming.js    # Log streaming
        └── css/
            └── autoscraper.css      # Custom styles
```

## 2. Core Implementation Components

### 2.1 Django Models (models.py)

```python
import uuid
import hashlib
from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinValueValidator, MaxValueValidator
from urllib.parse import urlparse

class JobBoard(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    base_url = models.URLField(max_length=500)
    rss_url = models.URLField(max_length=500, null=True, blank=True)
    region = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'autoscraper_jobboard'
        indexes = [
            models.Index(fields=['region']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_by']),
        ]

    def __str__(self):
        return f"{self.name} ({self.region})"

class ScheduleConfig(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.ForeignKey(JobBoard, on_delete=models.CASCADE, null=True, blank=True)
    cron = models.CharField(max_length=100, null=True, blank=True)
    interval_minutes = models.PositiveIntegerField(null=True, blank=True)
    timezone = models.CharField(max_length=50, default='UTC')
    is_paused = models.BooleanField(default=False)
    next_run_dt = models.DateTimeField(null=True, blank=True)
    last_run_dt = models.DateTimeField(null=True, blank=True)
    max_concurrency = models.PositiveIntegerField(default=2, validators=[MinValueValidator(1), MaxValueValidator(10)])
    rate_limit_per_min = models.PositiveIntegerField(default=30, validators=[MinValueValidator(1), MaxValueValidator(1000)])
    enabled = models.BooleanField(default=True)

    class Meta:
        db_table = 'autoscraper_scheduleconfig'
        indexes = [
            models.Index(fields=['board']),
            models.Index(fields=['enabled']),
            models.Index(fields=['next_run_dt']),
        ]

class ScrapeJob(models.Model):
    MODE_CHOICES = [
        ('rss', 'RSS'),
        ('html', 'HTML'),
        ('auto', 'Auto'),
    ]
    
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('running', 'Running'),
        ('paused', 'Paused'),
        ('stopped', 'Stopped'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
        ('canceled', 'Canceled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.ForeignKey(JobBoard, on_delete=models.SET_NULL, null=True, blank=True)
    mode = models.CharField(max_length=10, choices=MODE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    total_found = models.PositiveIntegerField(default=0)
    total_saved = models.PositiveIntegerField(default=0)
    error = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'autoscraper_scrapejob'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['board']),
            models.Index(fields=['-started_at']),
        ]

class RawJob(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_url = models.URLField(max_length=1000, unique=True)
    board = models.ForeignKey(JobBoard, on_delete=models.SET_NULL, null=True, blank=True)
    raw = models.JSONField()
    fetched_at = models.DateTimeField(auto_now_add=True)
    checksum = models.CharField(max_length=64, unique=True)
    posted_at = models.DateTimeField(null=True, blank=True)
    source_title = models.CharField(max_length=500, null=True, blank=True)
    source_company = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        db_table = 'autoscraper_rawjob'
        indexes = [
            models.Index(fields=['checksum']),
            models.Index(fields=['-posted_at']),
            models.Index(fields=['board']),
            models.Index(fields=['-fetched_at']),
        ]

    @staticmethod
    def generate_checksum(title, company, posted_at, source_url):
        """Generate SHA256 checksum for deduplication"""
        parsed_url = urlparse(source_url)
        content = f"{title.lower()}|{company.lower()}|{posted_at.date()}|{parsed_url.netloc}"
        return hashlib.sha256(content.encode()).hexdigest()

class EngineState(models.Model):
    STATUS_CHOICES = [
        ('idle', 'Idle'),
        ('running', 'Running'),
        ('paused', 'Paused'),
    ]

    key = models.CharField(max_length=20, primary_key=True, default='autoscraper')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='idle')
    last_heartbeat = models.DateTimeField(auto_now=True)
    worker_count = models.PositiveIntegerField(default=0)
    queue_depth = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'autoscraper_enginestate'
```

### 2.2 Celery Tasks (tasks.py)

```python
import logging
import requests
import feedparser
from datetime import datetime, timezone
from celery import shared_task
from django.utils import timezone as django_timezone
from tenacity import retry, stop_after_attempt, wait_exponential
from bs4 import BeautifulSoup
from .models import JobBoard, ScrapeJob, ScrapeRun, RawJob, EngineState
from .services import ScrapingService, NormalizationService

logger = logging.getLogger(__name__)

@shared_task(bind=True, queue='autoscraper.default')
def run_scrape_job(self, job_id):
    """Main orchestration task for scraping operations"""
    try:
        job = ScrapeJob.objects.get(id=job_id)
        job.status = 'running'
        job.started_at = django_timezone.now()
        job.save()

        # Update engine state
        engine_state, _ = EngineState.objects.get_or_create(key='autoscraper')
        engine_state.status = 'running'
        engine_state.save()

        if job.board:
            boards = [job.board]
        else:
            boards = JobBoard.objects.filter(is_active=True)

        total_found = 0
        total_saved = 0

        for board in boards:
            try:
                if job.mode == 'rss' or (job.mode == 'auto' and board.rss_url):
                    found, saved = fetch_rss_entries.delay(board.id, job_id).get()
                elif job.mode == 'html' or job.mode == 'auto':
                    found, saved = html_scrape.delay(board.base_url, job_id, board.id).get()
                
                total_found += found
                total_saved += saved
                
            except Exception as e:
                logger.error(f"Error scraping board {board.name}: {str(e)}")
                continue

        job.total_found = total_found
        job.total_saved = total_saved
        job.status = 'succeeded'
        job.finished_at = django_timezone.now()
        job.save()

        # Update engine state
        engine_state.status = 'idle'
        engine_state.save()

        return {'found': total_found, 'saved': total_saved}

    except Exception as e:
        logger.error(f"Scrape job {job_id} failed: {str(e)}")
        job.status = 'failed'
        job.error = str(e)
        job.finished_at = django_timezone.now()
        job.save()
        raise

@shared_task(queue='autoscraper.heavy')
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def fetch_rss_entries(board_id, job_id):
    """Fetch and process RSS feed entries"""
    try:
        board = JobBoard.objects.get(id=board_id)
        
        # Create scrape run record
        run = ScrapeRun.objects.create(
            job_id=job_id,
            target_url=board.rss_url,
            status='running',
            started_at=django_timezone.now()
        )

        # Fetch RSS feed
        headers = {
            'User-Agent': 'RemoteHive-AutoScraper/1.0 (+https://remotehive.com)'
        }
        
        feed = feedparser.parse(board.rss_url, request_headers=headers)
        
        if feed.bozo:
            logger.warning(f"RSS feed parsing warning for {board.name}: {feed.bozo_exception}")

        items_found = len(feed.entries)
        items_saved = 0

        for entry in feed.entries:
            try:
                # Extract job data
                job_data = {
                    'title': entry.get('title', ''),
                    'link': entry.get('link', ''),
                    'published': entry.get('published_parsed'),
                    'summary': entry.get('summary', ''),
                    'company': entry.get('author', ''),
                }

                if persist_raw_item(job_data, board):
                    items_saved += 1

            except Exception as e:
                logger.error(f"Error processing RSS entry: {str(e)}")
                continue

        run.items_found = items_found
        run.items_saved = items_saved
        run.status = 'succeeded'
        run.finished_at = django_timezone.now()
        run.save()

        return items_found, items_saved

    except Exception as e:
        run.status = 'failed'
        run.error = str(e)
        run.finished_at = django_timezone.now()
        run.save()
        raise

@shared_task(queue='autoscraper.heavy')
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def html_scrape(url, job_id, board_id=None):
    """Scrape job listings from HTML pages"""
    try:
        board = JobBoard.objects.get(id=board_id) if board_id else None
        
        run = ScrapeRun.objects.create(
            job_id=job_id,
            target_url=url,
            status='running',
            started_at=django_timezone.now()
        )

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'lxml')
        
        # Job extraction heuristics
        job_elements = ScrapingService.extract_job_elements(soup)
        
        items_found = len(job_elements)
        items_saved = 0

        for element in job_elements:
            try:
                job_data = ScrapingService.extract_job_data(element, url)
                
                if persist_raw_item(job_data, board):
                    items_saved += 1

            except Exception as e:
                logger.error(f"Error processing job element: {str(e)}")
                continue

        run.items_found = items_found
        run.items_saved = items_saved
        run.http_status = response.status_code
        run.status = 'succeeded'
        run.finished_at = django_timezone.now()
        run.save()

        return items_found, items_saved

    except Exception as e:
        run.status = 'failed'
        run.error = str(e)
        run.http_status = getattr(response, 'status_code', None)
        run.finished_at = django_timezone.now()
        run.save()
        raise

def persist_raw_item(item_data, board):
    """Persist raw job item with deduplication"""
    try:
        # Generate checksum for deduplication
        title = item_data.get('title', '')
        company = item_data.get('company', '')
        posted_at = item_data.get('published', datetime.now(timezone.utc))
        source_url = item_data.get('link', '')
        
        if not title or not source_url:
            return False

        checksum = RawJob.generate_checksum(title, company, posted_at, source_url)
        
        # Check if already exists
        if RawJob.objects.filter(checksum=checksum).exists():
            return False

        # Create raw job record
        raw_job = RawJob.objects.create(
            source_url=source_url,
            board=board,
            raw=item_data,
            checksum=checksum,
            posted_at=posted_at,
            source_title=title,
            source_company=company
        )

        # Trigger normalization
        normalize_raw_job.delay(raw_job.id)
        
        return True

    except Exception as e:
        logger.error(f"Error persisting raw item: {str(e)}")
        return False

@shared_task(queue='autoscraper.default')
def normalize_raw_job(raw_job_id):
    """Normalize raw job data"""
    try:
        raw_job = RawJob.objects.get(id=raw_job_id)
        NormalizationService.normalize_job(raw_job)
        return True
    except Exception as e:
        logger.error(f"Error normalizing job {raw_job_id}: {str(e)}")
        return False

@shared_task(queue='autoscraper.default')
def heartbeat():
    """Update engine heartbeat"""
    engine_state, _ = EngineState.objects.get_or_create(key='autoscraper')
    engine_state.last_heartbeat = django_timezone.now()
    engine_state.save()
    return True
```

### 2.3 API Views (views.py)

```python
import json
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required, permission_required
from django.shortcuts import render, get_object_or_404
from django.utils.decorators import method_decorator
from django.views import View
from .models import JobBoard, ScrapeJob, ScheduleConfig, EngineState
from .tasks import run_scrape_job
from .services import SchedulerService

@method_decorator(login_required, name='dispatch')
class DashboardView(View):
    def get(self, request):
        """Main dashboard view"""
        context = {
            'engine_state': EngineState.objects.get_or_create(key='autoscraper')[0],
            'active_boards': JobBoard.objects.filter(is_active=True).count(),
            'recent_jobs': ScrapeJob.objects.order_by('-started_at')[:10],
        }
        return render(request, 'autoscraper/dashboard.html', context)

@csrf_exempt
@require_http_methods(["POST"])
@login_required
@permission_required('autoscraper.can_manage', raise_exception=True)
def start_scrape_job(request):
    """Start a new scraping job"""
    try:
        data = json.loads(request.body)
        board_id = data.get('board_id')
        mode = data.get('mode', 'auto')
        
        if mode not in ['auto', 'rss', 'html']:
            return JsonResponse({'error': 'Invalid mode'}, status=400)
        
        board = None
        if board_id:
            board = get_object_or_404(JobBoard, id=board_id)
        
        job = ScrapeJob.objects.create(
            board=board,
            mode=mode,
            requested_by=request.user
        )
        
        # Enqueue the job
        run_scrape_job.delay(str(job.id))
        
        return JsonResponse({
            'job_id': str(job.id),
            'status': job.status,
            'message': 'Scraping job started successfully'
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
@login_required
@permission_required('autoscraper.can_manage', raise_exception=True)
def pause_scrape_job(request):
    """Pause a running scraping job"""
    try:
        data = json.loads(request.body)
        job_id = data.get('job_id')
        
        job = get_object_or_404(ScrapeJob, id=job_id)
        
        if job.status != 'running':
            return JsonResponse({'error': 'Job is not running'}, status=400)
        
        job.status = 'paused'
        job.save()
        
        return JsonResponse({
            'success': True,
            'status': job.status
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
@login_required
@permission_required('autoscraper.can_manage', raise_exception=True)
def hard_reset(request):
    """Hard reset the scraping engine"""
    try:
        # Cancel all running jobs
        ScrapeJob.objects.filter(status__in=['queued', 'running']).update(status='canceled')
        
        # Reset engine state
        engine_state, _ = EngineState.objects.get_or_create(key='autoscraper')
        engine_state.status = 'idle'
        engine_state.worker_count = 0
        engine_state.queue_depth = 0
        engine_state.save()
        
        # Purge Celery queues (implementation depends on broker)
        from celery import current_app
        current_app.control.purge()
        
        return JsonResponse({
            'success': True,
            'message': 'Engine reset successfully'
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
@login_required
def health_check(request):
    """System health check endpoint"""
    try:
        engine_state = EngineState.objects.get_or_create(key='autoscraper')[0]
        
        return JsonResponse({
            'status': engine_state.status,
            'worker_count': engine_state.worker_count,
            'queue_depth': engine_state.queue_depth,
            'last_heartbeat': engine_state.last_heartbeat.isoformat()
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def live_logs_stream(request):
    """Server-sent events for live log streaming"""
    def event_stream():
        # Implementation for real-time log streaming
        # This would typically use Redis pub/sub or WebSocket
        yield "data: {\"message\": \"Connected to live logs\"}\n\n"
        
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    return response
```

## 3. Frontend Integration

### 3.1 Admin Panel Navigation Update

**Update remotehive-admin sidebar component:**

```typescript
// src/components/layout/Sidebar.tsx
import { 
  Settings, 
  Users, 
  Briefcase, 
  BarChart3, 
  Mail,
  Bot, // New icon for AutoScraper
  // ... other imports
} from 'lucide-react';

const navigationItems = [
  // ... existing items
  {
    name: 'Smart AutoScraper',
    href: '/admin-panel/autoscraper',
    icon: Bot,
    description: 'Automated job scraping engine'
  },
  // ... other items
];
```

### 3.2 AutoScraper Dashboard Component

```typescript
// src/app/admin-panel/autoscraper/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, RotateCcw, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EngineState {
  status: 'idle' | 'running' | 'paused';
  worker_count: number;
  queue_depth: number;
  last_heartbeat: string;
}

export default function AutoScraperDashboard() {
  const [engineState, setEngineState] = useState<EngineState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEngineState();
    const interval = setInterval(fetchEngineState, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchEngineState = async () => {
    try {
      const response = await fetch('/admin-panel/autoscraper/health');
      const data = await response.json();
      setEngineState(data);
    } catch (error) {
      console.error('Failed to fetch engine state:', error);
    }
  };

  const handleStartScraping = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/admin-panel/autoscraper/jobs/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board_id: null, // Scrape all boards
          mode: 'auto'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Scraping job started successfully',
        });
        fetchEngineState();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to start scraping: ${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHardReset = async () => {
    if (!confirm('Are you sure you want to perform a hard reset? This will cancel all running jobs.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/admin-panel/autoscraper/hard-reset', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Engine reset successfully',
        });
        fetchEngineState();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to reset engine: ${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'idle': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Smart AutoScraper</h1>
        <div className="flex items-center space-x-2">
          {engineState && (
            <Badge className={getStatusColor(engineState.status)}>
              <Activity className="w-3 h-3 mr-1" />
              {engineState.status.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engine Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engineState?.status || 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last heartbeat: {engineState?.last_heartbeat ? 
                new Date(engineState.last_heartbeat).toLocaleTimeString() : 'Never'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engineState?.worker_count || 0}</div>
            <p className="text-xs text-muted-foreground">Processing tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Depth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engineState?.queue_depth || 0}</div>
            <p className="text-xs text-muted-foreground">Pending tasks</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Engine Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button 
              onClick={handleStartScraping}
              disabled={isLoading || engineState?.status === 'running'}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Start Scraping</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleHardReset}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Hard Reset</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 4. Deployment Instructions

### 4.1 Environment Variables

```bash
# Add to .env file
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Supabase/PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/remotehive

# AutoScraper specific
AUTOSCRAPER_USER_AGENT="RemoteHive-AutoScraper/1.0 (+https://remotehive.com)"
AUTOSCRAPER_RATE_LIMIT=30
AUTOSCRAPER_MAX_WORKERS=4
```

### 4.2 Installation Steps

```bash
# 1. Install dependencies
pip install celery redis feedparser beautifulsoup4 lxml dateparser tenacity pydantic tldextract

# 2. Create and run migrations
python manage.py makemigrations autoscraper
python manage.py migrate

# 3. Create superuser
python manage.py createsuperuser

# 4. Seed demo data
python manage.py autoscraper_demo_seed

# 5. Start services
# Terminal 1: Django server
python manage.py runserver

# Terminal 2: Celery worker
celery -A app worker -Q autoscraper.default,autoscraper.heavy --concurrency=4

# Terminal 3: Celery beat scheduler
celery -A app beat

# Terminal 4: Redis server
redis-server
```

### 4.3 Production Deployment

```yaml
# docker-compose.yml addition
services:
  autoscraper-worker:
    build: .
    command: celery -A app worker -Q autoscraper.default,autoscraper.heavy --concurrency=4
    environment:
      - REDIS_URL=redis://redis:6379/0
      - DATABASE_URL=postgresql://user:pass@db:5432/remotehive
    depends_on:
      - redis
      - db
    restart: unless-stopped

  autoscraper-beat:
    build: .
    command: celery -A app beat
    environment:
      - REDIS_URL=redis://redis:6379/0
      - DATABASE_URL=postgresql://user:pass@db:5432/remotehive
    depends_on:
      - redis
      - db
    restart: unless-stopped
```

## 5. Testing and Validation

### 5.1 Unit Tests

```python
# tests/test_autoscraper.py
import pytest
from django.test import TestCase
from autoscraper.models import JobBoard, ScrapeJob
from autoscraper.tasks import run_scrape_job

class AutoScraperTestCase(TestCase):
    def setUp(self):
        self.board = JobBoard.objects.create(
            name="Test Board",
            base_url="https://example.com",
            rss_url="https://example.com/rss",
            region="US"
        )
    
    def test_job_creation(self):
        job = ScrapeJob.objects.create(
            board=self.board,
            mode='auto'
        )
        self.assertEqual(job.status, 'queued')
        self.assertEqual(job.board, self.board)
```

### 5.2 Integration Tests

```python
# tests/test_integration.py
from django.test import Client, TestCase
from django.contrib.auth.models import User
from autoscraper.models import JobBoard

class AutoScraperIntegrationTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_superuser(
            username='admin',
            email='admin@remotehive.in',
            password='Ranjeet11$'
        )
        self.client.login(username='admin', password='Ranjeet11$')
    
    def test_start_scrape_job_endpoint(self):
        response = self.client.post('/admin-panel/autoscraper/jobs/start', {
            'board_id': None,
            'mode': 'auto'
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('job_id', data)
```

This implementation guide provides a comprehensive foundation for building the Smart AutoScraper system with robust scraping capabilities, real-time monitoring, and seamless integration with the existing RemoteHive admin panel.
