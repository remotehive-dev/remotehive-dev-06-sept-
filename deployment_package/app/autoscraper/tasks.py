from celery import current_app as celery_app
from app.database.database import get_database_manager
from app.database.models import JobPost
from app.database.models import (
    JobBoard, ScheduleConfig, AutoScrapeScrapeJob as ScrapeJob, AutoScrapeScrapeRun as ScrapeRun, 
    AutoScrapeRawJob as RawJob, AutoScrapeNormalizedJob as NormalizedJob, 
    AutoScrapeEngineState as EngineState, ScrapeJobStatus, ScrapeJobMode, EngineStatus
)
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import and_, or_
import requests
import json
import feedparser
import uuid
from bs4 import BeautifulSoup
import hashlib
import time
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3, queue='autoscraper.default')
def run_scrape_job(self, job_id: str):
    """
    Main orchestrator task for running a scrape job
    
    Args:
        job_id (str): UUID of the scrape job to run
        
    Returns:
        dict: Job execution results and statistics
    """
    try:
        logger.info(f"Starting scrape job: {job_id}")
        
        db_manager = get_database_manager()
        with db_manager.sqlalchemy_session_scope() as db:
            job = db.query(ScrapeJob).filter(ScrapeJob.id == job_id).first()
            if not job:
                raise ValueError(f"Scrape job {job_id} not found")
            
            if job.status != ScrapeJobStatus.PENDING:
                raise ValueError(f"Job {job_id} is not in pending status")
            
            # Update job status to running
            job.status = ScrapeJobStatus.RUNNING
            job.started_at = datetime.utcnow()
            # Note: commit is handled by sqlalchemy_session_scope context manager
            
            # Create scrape run
            run = ScrapeRun(
                id=str(uuid.uuid4()),
                scrape_job_id=job_id,
                status='running',
                started_at=datetime.utcnow(),
                metadata={'task_id': self.request.id}
            )
            db.add(run)
            # Note: commit is handled by sqlalchemy_session_scope context manager
            run_id = run.id
        
        try:
            # Update engine state
            heartbeat.delay()
            
            # Get job boards for this job
            db_manager = get_database_manager()
            with db_manager.sqlalchemy_session_scope() as db:
                job = db.query(ScrapeJob).filter(ScrapeJob.id == job_id).first()
                job_boards = job.job_boards
                
                total_boards = len(job_boards)
                processed_boards = 0
                total_jobs_found = 0
                total_jobs_created = 0
                
                for board in job_boards:
                    try:
                        if board.board_type.value == 'rss':
                            # Process RSS feeds
                            result = fetch_rss_entries.delay(board.id, job_id, run_id)
                            board_result = result.get(timeout=300)  # 5 minute timeout
                        else:
                            # Process HTML scraping
                            result = html_scrape.delay(board.id, job_id, run_id)
                            board_result = result.get(timeout=600)  # 10 minute timeout
                        
                        total_jobs_found += board_result.get('jobs_found', 0)
                        total_jobs_created += board_result.get('jobs_created', 0)
                        processed_boards += 1
                        
                        logger.info(f"Processed board {board.name}: {board_result.get('jobs_found', 0)} jobs found")
                        
                    except Exception as e:
                        logger.error(f"Failed to process board {board.name}: {e}")
                        continue
            
            # Update run and job status
            db_manager = get_database_manager()
            with db_manager.sqlalchemy_session_scope() as db:
                run = db.query(ScrapeRun).filter(ScrapeRun.id == run_id).first()
                job = db.query(ScrapeJob).filter(ScrapeJob.id == job_id).first()
                
                if run:
                    run.status = 'completed'
                    run.completed_at = datetime.utcnow()
                    run.jobs_found = total_jobs_found
                    run.jobs_created = total_jobs_created
                    run.metadata.update({
                        'boards_processed': processed_boards,
                        'total_boards': total_boards
                    })
                
                if job:
                    job.status = ScrapeJobStatus.COMPLETED
                    job.completed_at = datetime.utcnow()
                    job.last_run_at = datetime.utcnow()
                    job.total_jobs_found = (job.total_jobs_found or 0) + total_jobs_found
                    job.total_jobs_created = (job.total_jobs_created or 0) + total_jobs_created
                
                # Note: commit is handled by sqlalchemy_session_scope context manager
            
            logger.info(f"Scrape job {job_id} completed. Found {total_jobs_found} jobs, created {total_jobs_created}")
            
            return {
                'success': True,
                'job_id': job_id,
                'run_id': run_id,
                'jobs_found': total_jobs_found,
                'jobs_created': total_jobs_created,
                'boards_processed': processed_boards,
                'total_boards': total_boards
            }
            
        except Exception as e:
            # Update run and job status to failed
            db_manager = get_database_manager()
            with db_manager.sqlalchemy_session_scope() as db:
                run = db.query(ScrapeRun).filter(ScrapeRun.id == run_id).first()
                job = db.query(ScrapeJob).filter(ScrapeJob.id == job_id).first()
                
                if run:
                    run.status = 'failed'
                    run.completed_at = datetime.utcnow()
                    run.error_message = str(e)
                
                if job:
                    job.status = ScrapeJobStatus.FAILED
                    job.error_message = str(e)
                
                # Note: commit is handled by sqlalchemy_session_scope context manager
            
            raise e
            
    except Exception as exc:
        logger.error(f"Scrape job {job_id} failed: {exc}")
        raise self.retry(exc=exc, countdown=300, max_retries=3)

@celery_app.task(bind=True, max_retries=3, queue='autoscraper.default')
def fetch_rss_entries(self, board_id: str, job_id: str, run_id: str):
    """
    Fetch and process RSS feed entries from a job board
    
    Args:
        board_id (str): UUID of the job board
        job_id (str): UUID of the scrape job
        run_id (str): UUID of the scrape run
        
    Returns:
        dict: Processing results
    """
    try:
        logger.info(f"Fetching RSS entries for board {board_id}")
        
        db_manager = get_database_manager()
        with db_manager.sqlalchemy_session_scope() as db:
            board = db.query(JobBoard).filter(JobBoard.id == board_id).first()
            if not board:
                raise ValueError(f"Job board {board_id} not found")
            
            if not board.rss_url:
                raise ValueError(f"No RSS URL configured for board {board.name}")
        
        # Fetch RSS feed
        try:
            response = requests.get(board.rss_url, timeout=30)
            response.raise_for_status()
            
            feed = feedparser.parse(response.content)
            if feed.bozo:
                logger.warning(f"RSS feed parsing warning for {board.name}: {feed.bozo_exception}")
            
            entries = feed.entries
            logger.info(f"Found {len(entries)} RSS entries for {board.name}")
            
        except Exception as e:
            logger.error(f"Failed to fetch RSS feed for {board.name}: {e}")
            raise e
        
        jobs_found = 0
        jobs_created = 0
        
        for entry in entries:
            try:
                # Create raw job entry
                raw_data = {
                    'title': entry.get('title', ''),
                    'link': entry.get('link', ''),
                    'description': entry.get('description', ''),
                    'published': entry.get('published', ''),
                    'author': entry.get('author', ''),
                    'tags': [tag.get('term', '') for tag in entry.get('tags', [])],
                    'source': board.name,
                    'board_id': board_id
                }
                
                # Generate content hash for deduplication
                content_hash = hashlib.md5(
                    f"{raw_data['title']}{raw_data['link']}".encode('utf-8')
                ).hexdigest()
                
                # Check for duplicates
                db_manager = get_database_manager()
                with db_manager.sqlalchemy_session_scope() as db:
                    existing = db.query(RawJob).filter(
                        RawJob.content_hash == content_hash
                    ).first()
                    
                    if existing:
                        logger.debug(f"Duplicate job found, skipping: {raw_data['title']}")
                        continue
                
                # Persist raw item
                persist_result = persist_raw_item.delay(
                    raw_data, content_hash, job_id, run_id, board_id
                )
                raw_job_id = persist_result.get(timeout=60)
                
                if raw_job_id:
                    jobs_found += 1
                    
                    # Trigger normalization
                    normalize_result = normalize_raw_job.delay(raw_job_id)
                    normalized = normalize_result.get(timeout=120)
                    
                    if normalized and normalized.get('created_job_post'):
                        jobs_created += 1
                
            except Exception as e:
                logger.error(f"Failed to process RSS entry: {e}")
                continue
        
        logger.info(f"RSS processing completed for {board.name}: {jobs_found} found, {jobs_created} created")
        
        return {
            'success': True,
            'board_id': board_id,
            'board_name': board.name,
            'jobs_found': jobs_found,
            'jobs_created': jobs_created,
            'total_entries': len(entries)
        }
        
    except Exception as exc:
        logger.error(f"RSS fetch failed for board {board_id}: {exc}")
        raise self.retry(exc=exc, countdown=60, max_retries=3)

@celery_app.task(bind=True, max_retries=3, queue='autoscraper.heavy')
def html_scrape(self, board_id: str, job_id: str, run_id: str):
    """
    Perform HTML scraping on a job board website
    
    Args:
        board_id (str): UUID of the job board
        job_id (str): UUID of the scrape job
        run_id (str): UUID of the scrape run
        
    Returns:
        dict: Scraping results
    """
    try:
        logger.info(f"Starting HTML scrape for board {board_id}")
        
        db_manager = get_database_manager()
        with db_manager.sqlalchemy_session_scope() as db:
            board = db.query(JobBoard).filter(JobBoard.id == board_id).first()
            if not board:
                raise ValueError(f"Job board {board_id} not found")
            
            if not board.base_url:
                raise ValueError(f"No base URL configured for board {board.name}")
        
        jobs_found = 0
        jobs_created = 0
        pages_scraped = 0
        max_pages = board.max_pages or 5
        
        # Build search URL
        search_url = board.base_url
        if board.search_params:
            # Add search parameters
            params = board.search_params.copy()
            if '?' in search_url:
                search_url += '&' + '&'.join([f"{k}={v}" for k, v in params.items()])
            else:
                search_url += '?' + '&'.join([f"{k}={v}" for k, v in params.items()])
        
        for page in range(1, max_pages + 1):
            try:
                # Build page URL
                page_url = search_url
                if '{page}' in page_url:
                    page_url = page_url.replace('{page}', str(page))
                elif 'page=' not in page_url:
                    separator = '&' if '?' in page_url else '?'
                    page_url += f"{separator}page={page}"
                
                logger.info(f"Scraping page {page}: {page_url}")
                
                # Fetch page
                response = requests.get(page_url, timeout=30, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extract job listings using selectors
                job_elements = []
                if board.job_selector:
                    job_elements = soup.select(board.job_selector)
                else:
                    # Fallback: common job listing selectors
                    selectors = [
                        '.job', '.job-item', '.job-listing', '.position',
                        '[data-job]', '.vacancy', '.opening'
                    ]
                    for selector in selectors:
                        job_elements = soup.select(selector)
                        if job_elements:
                            break
                
                if not job_elements:
                    logger.warning(f"No job elements found on page {page}")
                    continue
                
                page_jobs_found = 0
                
                for job_element in job_elements:
                    try:
                        # Extract job data
                        raw_data = extract_job_data(job_element, board, page_url)
                        
                        if not raw_data.get('title') or not raw_data.get('link'):
                            continue
                        
                        # Generate content hash
                        content_hash = hashlib.md5(
                            f"{raw_data['title']}{raw_data['link']}".encode('utf-8')
                        ).hexdigest()
                        
                        # Check for duplicates
                        db_manager = get_database_manager()
                        with db_manager.sqlalchemy_session_scope() as db:
                            existing = db.query(RawJob).filter(
                                RawJob.content_hash == content_hash
                            ).first()
                            
                            if existing:
                                continue
                        
                        # Persist raw item
                        persist_result = persist_raw_item.delay(
                            raw_data, content_hash, job_id, run_id, board_id
                        )
                        raw_job_id = persist_result.get(timeout=60)
                        
                        if raw_job_id:
                            page_jobs_found += 1
                            jobs_found += 1
                            
                            # Trigger normalization
                            normalize_result = normalize_raw_job.delay(raw_job_id)
                            normalized = normalize_result.get(timeout=120)
                            
                            if normalized and normalized.get('created_job_post'):
                                jobs_created += 1
                    
                    except Exception as e:
                        logger.error(f"Failed to process job element: {e}")
                        continue
                
                pages_scraped += 1
                logger.info(f"Page {page} completed: {page_jobs_found} jobs found")
                
                # Rate limiting
                time.sleep(board.delay_between_requests or 1)
                
                # Stop if no jobs found on this page
                if page_jobs_found == 0:
                    logger.info(f"No jobs found on page {page}, stopping")
                    break
                    
            except Exception as e:
                logger.error(f"Failed to scrape page {page}: {e}")
                continue
        
        logger.info(f"HTML scraping completed for {board.name}: {jobs_found} found, {jobs_created} created")
        
        return {
            'success': True,
            'board_id': board_id,
            'board_name': board.name,
            'jobs_found': jobs_found,
            'jobs_created': jobs_created,
            'pages_scraped': pages_scraped
        }
        
    except Exception as exc:
        logger.error(f"HTML scrape failed for board {board_id}: {exc}")
        raise self.retry(exc=exc, countdown=120, max_retries=3)

def extract_job_data(job_element, board: JobBoard, page_url: str) -> Dict[str, Any]:
    """
    Extract job data from HTML element using board selectors
    
    Args:
        job_element: BeautifulSoup element containing job data
        board: JobBoard configuration
        page_url: URL of the page being scraped
        
    Returns:
        dict: Extracted job data
    """
    data = {
        'source': board.name,
        'board_id': board.id,
        'scraped_at': datetime.utcnow().isoformat()
    }
    
    try:
        # Extract title
        if board.title_selector:
            title_elem = job_element.select_one(board.title_selector)
            data['title'] = title_elem.get_text(strip=True) if title_elem else ''
        else:
            # Fallback selectors
            for selector in ['.title', '.job-title', 'h2', 'h3', '.position-title']:
                title_elem = job_element.select_one(selector)
                if title_elem:
                    data['title'] = title_elem.get_text(strip=True)
                    break
        
        # Extract link
        if board.link_selector:
            link_elem = job_element.select_one(board.link_selector)
            if link_elem:
                href = link_elem.get('href', '')
                data['link'] = urljoin(page_url, href) if href else ''
        else:
            # Fallback: look for any link in the job element
            link_elem = job_element.select_one('a[href]')
            if link_elem:
                href = link_elem.get('href', '')
                data['link'] = urljoin(page_url, href) if href else ''
        
        # Extract company
        if board.company_selector:
            company_elem = job_element.select_one(board.company_selector)
            data['company'] = company_elem.get_text(strip=True) if company_elem else ''
        
        # Extract location
        if board.location_selector:
            location_elem = job_element.select_one(board.location_selector)
            data['location'] = location_elem.get_text(strip=True) if location_elem else ''
        
        # Extract description
        if board.description_selector:
            desc_elem = job_element.select_one(board.description_selector)
            data['description'] = desc_elem.get_text(strip=True) if desc_elem else ''
        
        # Extract salary
        if board.salary_selector:
            salary_elem = job_element.select_one(board.salary_selector)
            data['salary'] = salary_elem.get_text(strip=True) if salary_elem else ''
        
        # Extract date
        if board.date_selector:
            date_elem = job_element.select_one(board.date_selector)
            data['posted_date'] = date_elem.get_text(strip=True) if date_elem else ''
        
        # Extract all text as fallback
        data['raw_html'] = str(job_element)
        data['raw_text'] = job_element.get_text(strip=True)
        
    except Exception as e:
        logger.error(f"Error extracting job data: {e}")
    
    return data

@celery_app.task(bind=True, max_retries=3, queue='autoscraper.default')
def persist_raw_item(self, raw_data: Dict[str, Any], content_hash: str, 
                    job_id: str, run_id: str, board_id: str):
    """
    Persist raw scraped item to database
    
    Args:
        raw_data: Raw scraped job data
        content_hash: Hash for deduplication
        job_id: UUID of the scrape job
        run_id: UUID of the scrape run
        board_id: UUID of the job board
        
    Returns:
        str: ID of created raw job record
    """
    try:
        db_manager = get_database_manager()
        with db_manager.sqlalchemy_session_scope() as db:
            raw_job = RawJob(
                id=str(uuid.uuid4()),
                scrape_run_id=run_id,
                job_board_id=board_id,
                content_hash=content_hash,
                raw_data=raw_data,
                scraped_at=datetime.utcnow(),
                status='pending_normalization'
            )
            
            db.add(raw_job)
            # Note: commit is handled by sqlalchemy_session_scope context manager
            
            logger.debug(f"Persisted raw job: {raw_job.id}")
            return raw_job.id
            
    except Exception as exc:
        logger.error(f"Failed to persist raw item: {exc}")
        raise self.retry(exc=exc, countdown=30, max_retries=3)

@celery_app.task(bind=True, max_retries=3, queue='autoscraper.default')
def normalize_raw_job(self, raw_job_id: str):
    """
    Normalize raw job data and create JobPost if valid
    
    Args:
        raw_job_id: UUID of the raw job to normalize
        
    Returns:
        dict: Normalization results
    """
    try:
        logger.debug(f"Normalizing raw job: {raw_job_id}")
        
        db_manager = get_database_manager()
        with db_manager.sqlalchemy_session_scope() as db:
            raw_job = db.query(RawJob).filter(RawJob.id == raw_job_id).first()
            if not raw_job:
                raise ValueError(f"Raw job {raw_job_id} not found")
            
            raw_data = raw_job.raw_data
            
            # Normalize data
            normalized_data = {
                'title': clean_text(raw_data.get('title', '')),
                'company': clean_text(raw_data.get('company', '')),
                'location': clean_text(raw_data.get('location', '')),
                'description': clean_text(raw_data.get('description', '')),
                'salary_range': extract_salary(raw_data.get('salary', '')),
                'job_type': extract_job_type(raw_data.get('description', '') + ' ' + raw_data.get('title', '')),
                'remote_type': extract_remote_type(raw_data.get('description', '') + ' ' + raw_data.get('location', '')),
                'source_url': raw_data.get('link', ''),
                'posted_date': parse_date(raw_data.get('posted_date', '')),
                'source': raw_data.get('source', ''),
                'tags': extract_tags(raw_data.get('description', '') + ' ' + raw_data.get('title', ''))
            }
            
            # Validate required fields
            if not normalized_data['title'] or len(normalized_data['title']) < 3:
                raw_job.status = 'rejected'
                raw_job.rejection_reason = 'Invalid or missing title'
                # Note: commit is handled by sqlalchemy_session_scope context manager
                return {'success': False, 'reason': 'Invalid title'}
            
            if not normalized_data['source_url']:
                raw_job.status = 'rejected'
                raw_job.rejection_reason = 'Missing source URL'
                # Note: commit is handled by sqlalchemy_session_scope context manager
                return {'success': False, 'reason': 'Missing URL'}
            
            # Check for duplicate job posts
            existing_job = db.query(JobPost).filter(
                JobPost.source_url == normalized_data['source_url']
            ).first()
            
            if existing_job:
                raw_job.status = 'duplicate'
                raw_job.normalized_job_post_id = existing_job.id
                # Note: commit is handled by sqlalchemy_session_scope context manager
                return {'success': False, 'reason': 'Duplicate job post'}
            
            # Create normalized job record
            normalized_job = NormalizedJob(
                id=str(uuid.uuid4()),
                raw_job_id=raw_job_id,
                normalized_data=normalized_data,
                normalized_at=datetime.utcnow(),
                status='pending_review'
            )
            
            db.add(normalized_job)
            
            # Create JobPost if data quality is good
            quality_score = calculate_quality_score(normalized_data)
            
            if quality_score >= 0.7:  # 70% quality threshold
                job_post = JobPost(
                    id=str(uuid.uuid4()),
                    title=normalized_data['title'],
                    company=normalized_data['company'],
                    location=normalized_data['location'],
                    description=normalized_data['description'],
                    salary_range=normalized_data['salary_range'],
                    job_type=normalized_data['job_type'],
                    remote_type=normalized_data['remote_type'],
                    source_url=normalized_data['source_url'],
                    posted_date=normalized_data['posted_date'] or datetime.utcnow(),
                    source=normalized_data['source'],
                    tags=normalized_data['tags'],
                    status='pending_approval',
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                db.add(job_post)
                normalized_job.job_post_id = job_post.id
                normalized_job.status = 'approved'
                raw_job.normalized_job_post_id = job_post.id
                
                created_job_post = True
            else:
                normalized_job.status = 'low_quality'
                normalized_job.quality_score = quality_score
                created_job_post = False
            
            raw_job.status = 'normalized'
            raw_job.normalized_at = datetime.utcnow()
            
            # Note: commit is handled by sqlalchemy_session_scope context manager
            
            logger.debug(f"Normalized job {raw_job_id}, created job post: {created_job_post}")
            
            return {
                'success': True,
                'raw_job_id': raw_job_id,
                'normalized_job_id': normalized_job.id,
                'created_job_post': created_job_post,
                'quality_score': quality_score
            }
            
    except Exception as exc:
        logger.error(f"Normalization failed for raw job {raw_job_id}: {exc}")
        
        # Update raw job status
        try:
            db_manager = get_database_manager()
            with db_manager.sqlalchemy_session_scope() as db:
                raw_job = db.query(RawJob).filter(RawJob.id == raw_job_id).first()
                if raw_job:
                    raw_job.status = 'normalization_failed'
                    raw_job.rejection_reason = str(exc)
                    # Note: commit is handled by sqlalchemy_session_scope context manager
        except:
            pass
        
        raise self.retry(exc=exc, countdown=60, max_retries=3)

@celery_app.task(queue='autoscraper.default')
def heartbeat():
    """
    Update engine state and system health metrics
    
    Returns:
        dict: System status information
    """
    try:
        db_manager = get_database_manager()
        with db_manager.sqlalchemy_session_scope() as db:
            # Get or create engine state
            engine_state = db.query(EngineState).first()
            if not engine_state:
                engine_state = EngineState(
                    id=str(uuid.uuid4()),
                    status=EngineStatus.IDLE,
                    last_heartbeat=datetime.utcnow(),
                    metadata={}
                )
                db.add(engine_state)
            
            # Update heartbeat
            engine_state.last_heartbeat = datetime.utcnow()
            
            # Calculate system metrics
            active_jobs = db.query(ScrapeJob).filter(
                ScrapeJob.status == ScrapeJobStatus.RUNNING
            ).count()
            
            pending_jobs = db.query(ScrapeJob).filter(
                ScrapeJob.status == ScrapeJobStatus.PENDING
            ).count()
            
            total_raw_jobs = db.query(RawJob).count()
            pending_normalization = db.query(RawJob).filter(
                RawJob.status == 'pending_normalization'
            ).count()
            
            # Update engine status
            if active_jobs > 0:
                engine_state.status = EngineStatus.RUNNING
            elif pending_jobs > 0:
                engine_state.status = EngineStatus.PENDING
            else:
                engine_state.status = EngineStatus.IDLE
            
            # Update metadata
            engine_state.metadata.update({
                'active_jobs': active_jobs,
                'pending_jobs': pending_jobs,
                'total_raw_jobs': total_raw_jobs,
                'pending_normalization': pending_normalization,
                'last_update': datetime.utcnow().isoformat()
            })
            
            # Note: commit is handled by sqlalchemy_session_scope context manager
            
            return {
                'success': True,
                'status': engine_state.status.value,
                'active_jobs': active_jobs,
                'pending_jobs': pending_jobs,
                'total_raw_jobs': total_raw_jobs,
                'pending_normalization': pending_normalization
            }
            
    except Exception as e:
        logger.error(f"Heartbeat failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }

# Utility functions

def clean_text(text: str) -> str:
    """Clean and normalize text data"""
    if not text:
        return ''
    
    # Remove extra whitespace and normalize
    text = ' '.join(text.split())
    return text.strip()

def extract_salary(salary_text: str) -> Optional[str]:
    """Extract and normalize salary information"""
    if not salary_text:
        return None
    
    # Basic salary extraction logic
    import re
    
    # Look for common salary patterns
    patterns = [
        r'\$[\d,]+(?:\s*-\s*\$[\d,]+)?',
        r'[\d,]+\s*-\s*[\d,]+\s*(?:USD|EUR|GBP)',
        r'[\d,]+k?\s*-\s*[\d,]+k?'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, salary_text, re.IGNORECASE)
        if match:
            return match.group(0)
    
    return None

def extract_job_type(text: str) -> Optional[str]:
    """Extract job type from text"""
    if not text:
        return None
    
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['full-time', 'full time', 'fulltime']):
        return 'full-time'
    elif any(word in text_lower for word in ['part-time', 'part time', 'parttime']):
        return 'part-time'
    elif any(word in text_lower for word in ['contract', 'contractor', 'freelance']):
        return 'contract'
    elif any(word in text_lower for word in ['intern', 'internship']):
        return 'internship'
    
    return None

def extract_remote_type(text: str) -> Optional[str]:
    """Extract remote work type from text"""
    if not text:
        return None
    
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['fully remote', '100% remote', 'remote only']):
        return 'fully-remote'
    elif any(word in text_lower for word in ['hybrid', 'remote/office']):
        return 'hybrid'
    elif any(word in text_lower for word in ['remote', 'work from home', 'wfh']):
        return 'remote-friendly'
    elif any(word in text_lower for word in ['on-site', 'onsite', 'office']):
        return 'on-site'
    
    return None

def parse_date(date_text: str) -> Optional[datetime]:
    """Parse date from various formats"""
    if not date_text:
        return None
    
    import dateutil.parser
    
    try:
        return dateutil.parser.parse(date_text)
    except:
        return None

def extract_tags(text: str) -> List[str]:
    """Extract relevant tags from job text"""
    if not text:
        return []
    
    text_lower = text.lower()
    tags = []
    
    # Technology tags
    tech_keywords = [
        'python', 'javascript', 'java', 'react', 'node.js', 'angular', 'vue',
        'django', 'flask', 'fastapi', 'sql', 'postgresql', 'mysql', 'mongodb',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'linux'
    ]
    
    for keyword in tech_keywords:
        if keyword in text_lower:
            tags.append(keyword)
    
    # Experience level tags
    if any(word in text_lower for word in ['senior', 'lead', 'principal']):
        tags.append('senior-level')
    elif any(word in text_lower for word in ['junior', 'entry', 'graduate']):
        tags.append('entry-level')
    elif any(word in text_lower for word in ['mid', 'intermediate']):
        tags.append('mid-level')
    
    return list(set(tags))  # Remove duplicates

def calculate_quality_score(data: Dict[str, Any]) -> float:
    """Calculate data quality score for normalized job"""
    score = 0.0
    
    # Title quality (30%)
    if data.get('title'):
        title_len = len(data['title'])
        if title_len >= 10:
            score += 0.3
        elif title_len >= 5:
            score += 0.15
    
    # Company quality (20%)
    if data.get('company') and len(data['company']) >= 2:
        score += 0.2
    
    # Description quality (25%)
    if data.get('description'):
        desc_len = len(data['description'])
        if desc_len >= 100:
            score += 0.25
        elif desc_len >= 50:
            score += 0.15
        elif desc_len >= 20:
            score += 0.1
    
    # Location quality (10%)
    if data.get('location') and len(data['location']) >= 2:
        score += 0.1
    
    # Additional fields (15%)
    bonus_fields = ['salary_range', 'job_type', 'remote_type', 'posted_date']
    filled_bonus = sum(1 for field in bonus_fields if data.get(field))
    score += (filled_bonus / len(bonus_fields)) * 0.15
    
    return min(score, 1.0)  # Cap at 1.0