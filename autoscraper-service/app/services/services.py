from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from loguru import logger
import requests
import feedparser
from bs4 import BeautifulSoup
import re
import time
import hashlib
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.database.database import DatabaseManager
from app.models.models import (
    JobBoard, ScrapeJob, ScrapeRun, RawJob, NormalizedJob,
    JobBoardType, ScrapeJobStatus, ScrapeJobMode, EngineState, EngineStatus
)
from config.settings import get_settings

settings = get_settings()


@dataclass
class ScrapingResult:
    """Result of a scraping operation"""
    success: bool
    items_found: int
    items_processed: int
    items_saved: int
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class NormalizationResult:
    """Result of a normalization operation"""
    success: bool
    raw_jobs_processed: int
    normalized_jobs_created: int
    jobs_published: int
    error_message: Optional[str] = None
    quality_scores: Optional[List[float]] = None


class ScrapingService:
    """Service for handling web scraping operations"""
    
    def __init__(self, db_manager: DatabaseManager = None):
        self.db_manager = db_manager or DatabaseManager()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'RemoteHive AutoScraper/1.0 (Enterprise Job Scraping Service)'
        })
        self.executor = ThreadPoolExecutor(max_workers=settings.max_concurrent_jobs)
    
    async def scrape_job_board(self, job_board_id: str, scrape_job_id: str) -> ScrapingResult:
        """Main entry point for scraping a job board"""
        try:
            with self.db_manager.get_session() as db:
                job_board = db.query(JobBoard).filter(JobBoard.id == job_board_id).first()
                scrape_job = db.query(ScrapeJob).filter(ScrapeJob.id == scrape_job_id).first()
                
                if not job_board or not scrape_job:
                    return ScrapingResult(
                        success=False,
                        items_found=0,
                        items_processed=0,
                        items_saved=0,
                        error_message="Job board or scrape job not found"
                    )
                
                # Update scrape job status
                scrape_job.status = ScrapeJobStatus.RUNNING
                scrape_job.started_at = datetime.utcnow()
                db.commit()
                
                # Route to appropriate scraping method
                if job_board.board_type == JobBoardType.RSS:
                    result = await self._scrape_rss_feed(job_board, scrape_job, db)
                elif job_board.board_type == JobBoardType.HTML:
                    result = await self._scrape_html_pages(job_board, scrape_job, db)
                elif job_board.board_type == JobBoardType.API:
                    result = await self._scrape_api_endpoint(job_board, scrape_job, db)
                elif job_board.board_type == JobBoardType.HYBRID:
                    result = await self._scrape_hybrid(job_board, scrape_job, db)
                else:
                    result = ScrapingResult(
                        success=False,
                        items_found=0,
                        items_processed=0,
                        items_saved=0,
                        error_message=f"Unsupported board type: {job_board.board_type}"
                    )
                
                # Update scrape job with results
                scrape_job.completed_at = datetime.utcnow()
                scrape_job.duration_seconds = int((scrape_job.completed_at - scrape_job.started_at).total_seconds())
                scrape_job.total_items_found = result.items_found
                scrape_job.total_items_processed = result.items_processed
                scrape_job.total_items_created = result.items_saved
                
                if result.success:
                    scrape_job.status = ScrapeJobStatus.COMPLETED
                else:
                    scrape_job.status = ScrapeJobStatus.FAILED
                    scrape_job.error_message = result.error_message
                
                db.commit()
                return result
                
        except Exception as e:
            logger.error(f"Error scraping job board {job_board_id}: {str(e)}")
            return ScrapingResult(
                success=False,
                items_found=0,
                items_processed=0,
                items_saved=0,
                error_message=str(e)
            )
    
    async def _scrape_rss_feed(self, job_board: JobBoard, scrape_job: ScrapeJob, db: Session) -> ScrapingResult:
        """Scrape RSS feed from a job board"""
        try:
            logger.info(f"Starting RSS scraping for {job_board.name}")
            
            if not job_board.rss_url:
                return ScrapingResult(
                    success=False,
                    items_found=0,
                    items_processed=0,
                    items_saved=0,
                    error_message="No RSS URL configured for job board"
                )
            
            # Fetch RSS feed
            response = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                lambda: self.session.get(job_board.rss_url, timeout=job_board.request_timeout)
            )
            response.raise_for_status()
            
            # Parse RSS feed
            feed = feedparser.parse(response.content)
            
            if feed.bozo:
                logger.warning(f"RSS feed parsing warning for {job_board.name}: {feed.bozo_exception}")
            
            items_found = len(feed.entries)
            items_processed = 0
            items_saved = 0
            
            logger.info(f"Found {items_found} RSS entries for {job_board.name}")
            
            for entry in feed.entries:
                try:
                    # Extract basic information
                    title = entry.get('title', '').strip()
                    link = entry.get('link', '').strip()
                    description = entry.get('description', '').strip()
                    pub_date = entry.get('published_parsed')
                    
                    if not title or not link:
                        continue
                    
                    # Convert publication date
                    published_at = None
                    if pub_date:
                        try:
                            published_at = datetime(*pub_date[:6])
                        except (TypeError, ValueError):
                            pass
                    
                    # Create content hash for deduplication
                    content_hash = self._create_content_hash(title, link, description)
                    
                    # Check for existing raw job
                    existing_raw = db.query(RawJob).filter(
                        RawJob.checksum == content_hash,
                        RawJob.job_board_id == job_board.id
                    ).first()
                    
                    if existing_raw:
                        logger.debug(f"Skipping duplicate RSS entry: {title}")
                        continue
                    
                    # Create scrape run
                    scrape_run = ScrapeRun(
                        scrape_job_id=scrape_job.id,
                        run_type="rss",
                        url=job_board.rss_url,
                        page_number=1,
                        started_at=datetime.utcnow(),
                        completed_at=datetime.utcnow(),
                        items_found=1,
                        items_processed=1,
                        items_created=1,
                        http_status_code=response.status_code,
                        response_size_bytes=len(response.content)
                    )
                    db.add(scrape_run)
                    db.flush()  # Get the ID
                    
                    # Create raw job entry
                    raw_job = RawJob(
                        scrape_run_id=scrape_run.id,
                        job_board_id=job_board.id,
                        source_url=link,
                        source_id=entry.get('id', ''),
                        title=title,
                        company=entry.get('author', ''),
                        description=description,
                        posted_at=published_at,
                        raw_data={
                            'title': title,
                            'link': link,
                            'description': description,
                            'published': entry.get('published', ''),
                            'author': entry.get('author', ''),
                            'category': entry.get('category', ''),
                            'tags': entry.get('tags', []),
                            'source': 'rss',
                            'scrape_timestamp': datetime.utcnow().isoformat()
                        },
                        checksum=content_hash,
                        is_processed=False
                    )
                    
                    db.add(raw_job)
                    items_saved += 1
                    items_processed += 1
                    
                    # Apply rate limiting
                    if job_board.rate_limit_delay > 0:
                        await asyncio.sleep(job_board.rate_limit_delay)
                        
                except Exception as e:
                    logger.error(f"Error processing RSS entry: {str(e)}")
                    continue
            
            db.commit()
            
            return ScrapingResult(
                success=True,
                items_found=items_found,
                items_processed=items_processed,
                items_saved=items_saved,
                metadata={
                    'feed_title': feed.feed.get('title', ''),
                    'feed_description': feed.feed.get('description', ''),
                    'feed_updated': feed.feed.get('updated', '')
                }
            )
            
        except Exception as e:
            logger.error(f"RSS scraping failed for {job_board.name}: {str(e)}")
            return ScrapingResult(
                success=False,
                items_found=0,
                items_processed=0,
                items_saved=0,
                error_message=str(e)
            )
    
    async def _scrape_html_pages(self, job_board: JobBoard, scrape_job: ScrapeJob, db: Session) -> ScrapingResult:
        """Scrape HTML pages from a job board"""
        try:
            logger.info(f"Starting HTML scraping for {job_board.name}")
            
            if not job_board.selectors:
                return ScrapingResult(
                    success=False,
                    items_found=0,
                    items_processed=0,
                    items_saved=0,
                    error_message="No selectors configured for HTML scraping"
                )
            
            total_items_found = 0
            total_items_processed = 0
            total_items_saved = 0
            
            max_pages = min(job_board.max_pages, 50)  # Safety limit
            
            for page_num in range(1, max_pages + 1):
                try:
                    # Construct page URL
                    if '{page}' in job_board.base_url:
                        page_url = job_board.base_url.format(page=page_num)
                    else:
                        page_url = f"{job_board.base_url}?page={page_num}"
                    
                    logger.info(f"Scraping page {page_num}: {page_url}")
                    
                    # Fetch page
                    response = await asyncio.get_event_loop().run_in_executor(
                        self.executor,
                        lambda: self.session.get(page_url, timeout=job_board.request_timeout)
                    )
                    response.raise_for_status()
                    
                    # Parse HTML
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Extract job listings
                    job_elements = soup.select(job_board.selectors.get('job_container', '.job'))
                    
                    if not job_elements:
                        logger.info(f"No job elements found on page {page_num}, stopping")
                        break
                    
                    page_items_found = len(job_elements)
                    page_items_processed = 0
                    page_items_saved = 0
                    
                    # Create scrape run for this page
                    scrape_run = ScrapeRun(
                        scrape_job_id=scrape_job.id,
                        run_type="html",
                        url=page_url,
                        page_number=page_num,
                        started_at=datetime.utcnow(),
                        items_found=page_items_found,
                        http_status_code=response.status_code,
                        response_size_bytes=len(response.content)
                    )
                    db.add(scrape_run)
                    db.flush()  # Get the ID
                    
                    for job_element in job_elements:
                        try:
                            job_data = self._extract_job_data(job_element, job_board.selectors, job_board.base_url)
                            
                            if not job_data.get('title') or not job_data.get('url'):
                                continue
                            
                            # Create content hash
                            content_hash = self._create_content_hash(
                                job_data['title'],
                                job_data['url'],
                                job_data.get('description', '')
                            )
                            
                            # Check for duplicates
                            existing_raw = db.query(RawJob).filter(
                                RawJob.checksum == content_hash,
                                RawJob.job_board_id == job_board.id
                            ).first()
                            
                            if existing_raw:
                                continue
                            
                            # Create raw job
                            raw_job = RawJob(
                                scrape_run_id=scrape_run.id,
                                job_board_id=job_board.id,
                                source_url=job_data['url'],
                                title=job_data.get('title'),
                                company=job_data.get('company'),
                                location=job_data.get('location'),
                                description=job_data.get('description'),
                                salary=job_data.get('salary'),
                                raw_data={
                                    **job_data,
                                    'source': 'html',
                                    'page_number': page_num,
                                    'scrape_timestamp': datetime.utcnow().isoformat()
                                },
                                checksum=content_hash,
                                is_processed=False
                            )
                            
                            db.add(raw_job)
                            page_items_saved += 1
                            page_items_processed += 1
                            
                        except Exception as e:
                            logger.error(f"Error processing job element: {str(e)}")
                            continue
                    
                    # Update scrape run
                    scrape_run.completed_at = datetime.utcnow()
                    scrape_run.duration_seconds = int((scrape_run.completed_at - scrape_run.started_at).total_seconds())
                    scrape_run.items_processed = page_items_processed
                    scrape_run.items_created = page_items_saved
                    
                    total_items_found += page_items_found
                    total_items_processed += page_items_processed
                    total_items_saved += page_items_saved
                    
                    # Apply rate limiting between pages
                    if job_board.rate_limit_delay > 0:
                        await asyncio.sleep(job_board.rate_limit_delay)
                    
                except Exception as e:
                    logger.error(f"Error scraping page {page_num}: {str(e)}")
                    continue
            
            db.commit()
            
            return ScrapingResult(
                success=True,
                items_found=total_items_found,
                items_processed=total_items_processed,
                items_saved=total_items_saved,
                metadata={
                    'pages_scraped': page_num,
                    'max_pages': max_pages
                }
            )
            
        except Exception as e:
            logger.error(f"HTML scraping failed for {job_board.name}: {str(e)}")
            return ScrapingResult(
                success=False,
                items_found=0,
                items_processed=0,
                items_saved=0,
                error_message=str(e)
            )
    
    async def _scrape_api_endpoint(self, job_board: JobBoard, scrape_job: ScrapeJob, db: Session) -> ScrapingResult:
        """Scrape API endpoint from a job board"""
        # Implementation for API scraping
        return ScrapingResult(
            success=False,
            items_found=0,
            items_processed=0,
            items_saved=0,
            error_message="API scraping not yet implemented"
        )
    
    async def _scrape_hybrid(self, job_board: JobBoard, scrape_job: ScrapeJob, db: Session) -> ScrapingResult:
        """Scrape using hybrid approach (RSS + HTML)"""
        # Implementation for hybrid scraping
        return ScrapingResult(
            success=False,
            items_found=0,
            items_processed=0,
            items_saved=0,
            error_message="Hybrid scraping not yet implemented"
        )
    
    def _extract_job_data(self, job_element, selectors: Dict[str, str], base_url: str) -> Dict[str, Any]:
        """Extract job data from HTML element using selectors"""
        try:
            job_data = {}
            
            # Extract title
            title_selector = selectors.get('title', '.title')
            title_element = job_element.select_one(title_selector)
            if title_element:
                job_data['title'] = title_element.get_text(strip=True)
            
            # Extract company
            company_selector = selectors.get('company', '.company')
            company_element = job_element.select_one(company_selector)
            if company_element:
                job_data['company'] = company_element.get_text(strip=True)
            
            # Extract location
            location_selector = selectors.get('location', '.location')
            location_element = job_element.select_one(location_selector)
            if location_element:
                job_data['location'] = location_element.get_text(strip=True)
            
            # Extract description
            description_selector = selectors.get('description', '.description')
            description_element = job_element.select_one(description_selector)
            if description_element:
                job_data['description'] = description_element.get_text(strip=True)
            
            # Extract salary
            salary_selector = selectors.get('salary', '.salary')
            salary_element = job_element.select_one(salary_selector)
            if salary_element:
                job_data['salary'] = salary_element.get_text(strip=True)
            
            # Extract URL
            url_selector = selectors.get('url', 'a')
            url_element = job_element.select_one(url_selector)
            if url_element:
                href = url_element.get('href', '')
                if href:
                    job_data['url'] = urljoin(base_url, href)
            
            # Extract posted date
            date_selector = selectors.get('posted_date', '.date')
            date_element = job_element.select_one(date_selector)
            if date_element:
                job_data['posted_date'] = date_element.get_text(strip=True)
            
            return job_data
            
        except Exception as e:
            logger.error(f"Error extracting job data: {str(e)}")
            return {}
    
    def _create_content_hash(self, title: str, url: str, description: str) -> str:
        """Create a hash for content deduplication"""
        content = f"{title}|{url}|{description[:200]}"
        return hashlib.md5(content.encode('utf-8')).hexdigest()
    
    def __del__(self):
        """Cleanup resources"""
        if hasattr(self, 'session'):
            self.session.close()
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False)


class NormalizationService:
    """Service for normalizing raw job data into structured format"""
    
    def __init__(self, db_manager: DatabaseManager = None):
        self.db_manager = db_manager or DatabaseManager()
    
    async def normalize_raw_jobs(self, scrape_job_id: str, limit: int = None) -> NormalizationResult:
        """Normalize raw jobs from a scrape job into structured format"""
        try:
            logger.info(f"Starting normalization for scrape job {scrape_job_id}")
            
            with self.db_manager.get_session() as db:
                # Get raw jobs to normalize
                query = db.query(RawJob).filter(
                    RawJob.scrape_run_id.in_(
                        db.query(ScrapeRun.id).filter(ScrapeRun.scrape_job_id == scrape_job_id)
                    ),
                    RawJob.is_processed == False
                ).order_by(RawJob.created_at.desc())
                
                if limit:
                    query = query.limit(limit)
                
                raw_jobs = query.all()
                
                if not raw_jobs:
                    logger.info(f"No raw jobs to normalize for scrape job {scrape_job_id}")
                    return NormalizationResult(
                        success=True,
                        raw_jobs_processed=0,
                        normalized_jobs_created=0,
                        jobs_published=0
                    )
                
                logger.info(f"Found {len(raw_jobs)} raw jobs to normalize")
                
                raw_jobs_processed = 0
                normalized_jobs_created = 0
                jobs_published = 0
                quality_scores = []
                
                for raw_job in raw_jobs:
                    try:
                        # Normalize the raw job
                        normalized_data = self._normalize_job_data(raw_job)
                        
                        if not normalized_data:
                            raw_job.is_processed = True
                            continue
                        
                        # Calculate quality score
                        quality_score = self._calculate_quality_score(normalized_data)
                        quality_scores.append(quality_score)
                        
                        # Check for existing normalized job
                        existing_normalized = db.query(NormalizedJob).filter(
                            NormalizedJob.raw_job_id == raw_job.id
                        ).first()
                        
                        if existing_normalized:
                            logger.debug(f"Normalized job already exists for raw job {raw_job.id}")
                            raw_job.is_processed = True
                            continue
                        
                        # Create normalized job
                        normalized_job = NormalizedJob(
                            raw_job_id=raw_job.id,
                            title=normalized_data['title'],
                            company=normalized_data.get('company', ''),
                            location=normalized_data.get('location', ''),
                            description=normalized_data.get('description', ''),
                            salary_min=normalized_data.get('salary_min'),
                            salary_max=normalized_data.get('salary_max'),
                            salary_currency=normalized_data.get('salary_currency', 'USD'),
                            employment_type=normalized_data.get('employment_type', ''),
                            experience_level=normalized_data.get('experience_level', ''),
                            skills=normalized_data.get('skills', []),
                            benefits=normalized_data.get('benefits', []),
                            posted_at=normalized_data.get('posted_at') or raw_job.posted_at,
                            is_remote=normalized_data.get('is_remote', False),
                            confidence_score=quality_score
                        )
                        
                        db.add(normalized_job)
                        normalized_jobs_created += 1
                        
                        # Mark raw job as processed
                        raw_job.is_processed = True
                        raw_jobs_processed += 1
                        
                    except Exception as e:
                        logger.error(f"Error normalizing raw job {raw_job.id}: {str(e)}")
                        raw_job.is_processed = True
                        continue
                
                db.commit()
                
                avg_quality_score = sum(quality_scores) / len(quality_scores) if quality_scores else 0.0
                
                logger.info(f"Normalization completed: {normalized_jobs_created} jobs created, avg quality: {avg_quality_score:.2f}")
                
                return NormalizationResult(
                    success=True,
                    raw_jobs_processed=raw_jobs_processed,
                    normalized_jobs_created=normalized_jobs_created,
                    jobs_published=jobs_published,
                    quality_scores=quality_scores
                )
                
        except Exception as e:
            logger.error(f"Normalization failed for scrape job {scrape_job_id}: {str(e)}")
            return NormalizationResult(
                success=False,
                raw_jobs_processed=0,
                normalized_jobs_created=0,
                jobs_published=0,
                error_message=str(e)
            )
    
    def _normalize_job_data(self, raw_job: RawJob) -> Optional[Dict[str, Any]]:
        """Normalize raw job data into structured format"""
        try:
            raw_data = raw_job.raw_data or {}
            normalized = {}
            
            # Title normalization
            title = raw_job.title or raw_data.get('title', '').strip()
            if not title:
                return None
            
            normalized['title'] = self._clean_text(title)
            
            # Company normalization
            company = raw_job.company or raw_data.get('company', '').strip()
            normalized['company'] = self._clean_text(company) if company else ''
            
            # Location normalization
            location = raw_job.location or raw_data.get('location', '').strip()
            normalized['location'] = self._normalize_location(location)
            
            # Description normalization
            description = raw_job.description or raw_data.get('description', '').strip()
            normalized['description'] = self._clean_html(description) if description else ''
            
            # Salary normalization
            salary_info = self._normalize_salary(raw_job.salary or raw_data.get('salary', ''))
            normalized.update(salary_info)
            
            # Employment type normalization
            job_type = raw_data.get('job_type', '').strip()
            normalized['employment_type'] = self._normalize_job_type(job_type)
            
            # Experience level extraction
            normalized['experience_level'] = self._extract_experience_level(title, description)
            
            # Skills extraction
            normalized['skills'] = self._extract_skills(title, description)
            
            # Benefits extraction
            normalized['benefits'] = self._extract_benefits(description)
            
            # Remote work detection
            normalized['is_remote'] = self._detect_remote_work(title, description, location)
            
            # Posted date normalization
            posted_date = raw_data.get('posted_date', '')
            normalized['posted_at'] = self._normalize_date(posted_date)
            
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing job data: {str(e)}")
            return None
    
    def _calculate_quality_score(self, normalized_data: Dict[str, Any]) -> float:
        """Calculate quality score for normalized job data"""
        try:
            score = 0.0
            
            # Title quality (20%)
            if normalized_data.get('title'):
                title_len = len(normalized_data['title'])
                if 10 <= title_len <= 100:
                    score += 0.2
                elif title_len > 5:
                    score += 0.1
            
            # Company quality (15%)
            if normalized_data.get('company'):
                score += 0.15
            
            # Location quality (15%)
            if normalized_data.get('location'):
                score += 0.15
            
            # Description quality (25%)
            description = normalized_data.get('description', '')
            if description:
                desc_len = len(description)
                if desc_len > 200:
                    score += 0.25
                elif desc_len > 50:
                    score += 0.15
                elif desc_len > 10:
                    score += 0.05
            
            # Salary information (10%)
            if normalized_data.get('salary_min') or normalized_data.get('salary_max'):
                score += 0.1
            
            # Skills information (10%)
            skills = normalized_data.get('skills', [])
            if len(skills) >= 3:
                score += 0.1
            elif len(skills) >= 1:
                score += 0.05
            
            # Benefits information (5%)
            benefits = normalized_data.get('benefits', [])
            if len(benefits) >= 2:
                score += 0.05
            elif len(benefits) >= 1:
                score += 0.025
            
            return min(score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating quality score: {str(e)}")
            return 0.0
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ''
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\-.,()&/]', '', text)
        
        return text
    
    def _clean_html(self, html_content: str) -> str:
        """Clean HTML content and extract text"""
        if not html_content:
            return ''
        
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            text = soup.get_text(separator=' ', strip=True)
            return self._clean_text(text)
        except Exception:
            return self._clean_text(html_content)
    
    def _normalize_location(self, location: str) -> str:
        """Normalize location string"""
        if not location:
            return ''
        
        location = self._clean_text(location)
        
        # Common location normalizations
        location_mappings = {
            'remote': 'Remote',
            'work from home': 'Remote',
            'wfh': 'Remote',
            'anywhere': 'Remote',
            'usa': 'United States',
            'us': 'United States',
            'uk': 'United Kingdom',
            'ca': 'Canada'
        }
        
        location_lower = location.lower()
        for key, value in location_mappings.items():
            if key in location_lower:
                return value
        
        return location
    
    def _normalize_salary(self, salary_text: str) -> Dict[str, Any]:
        """Extract and normalize salary information"""
        result = {
            'salary_min': None,
            'salary_max': None,
            'salary_currency': 'USD'
        }
        
        if not salary_text:
            return result
        
        # Extract numbers from salary text
        numbers = re.findall(r'[\d,]+', salary_text.replace(',', ''))
        
        if len(numbers) >= 2:
            try:
                result['salary_min'] = int(numbers[0].replace(',', ''))
                result['salary_max'] = int(numbers[1].replace(',', ''))
            except ValueError:
                pass
        elif len(numbers) == 1:
            try:
                salary = int(numbers[0].replace(',', ''))
                if 'up to' in salary_text.lower() or 'max' in salary_text.lower():
                    result['salary_max'] = salary
                else:
                    result['salary_min'] = salary
            except ValueError:
                pass
        
        # Detect currency
        if '€' in salary_text or 'eur' in salary_text.lower():
            result['salary_currency'] = 'EUR'
        elif '£' in salary_text or 'gbp' in salary_text.lower():
            result['salary_currency'] = 'GBP'
        
        return result
    
    def _normalize_job_type(self, job_type: str) -> str:
        """Normalize job type/employment type"""
        if not job_type:
            return ''
        
        job_type_lower = job_type.lower()
        
        type_mappings = {
            'full-time': 'Full-time',
            'fulltime': 'Full-time',
            'ft': 'Full-time',
            'part-time': 'Part-time',
            'parttime': 'Part-time',
            'pt': 'Part-time',
            'contract': 'Contract',
            'contractor': 'Contract',
            'freelance': 'Freelance',
            'temporary': 'Temporary',
            'temp': 'Temporary',
            'intern': 'Internship',
            'internship': 'Internship'
        }
        
        for key, value in type_mappings.items():
            if key in job_type_lower:
                return value
        
        return job_type.title()
    
    def _extract_experience_level(self, title: str, description: str) -> str:
        """Extract experience level from title and description"""
        text = f"{title} {description}".lower()
        
        if any(word in text for word in ['senior', 'sr.', 'lead', 'principal', 'architect']):
            return 'Senior'
        elif any(word in text for word in ['junior', 'jr.', 'entry', 'graduate', 'associate']):
            return 'Junior'
        elif any(word in text for word in ['mid', 'intermediate', 'experienced']):
            return 'Mid-level'
        elif any(word in text for word in ['intern', 'internship', 'trainee']):
            return 'Internship'
        
        return 'Mid-level'  # Default
    
    def _extract_skills(self, title: str, description: str) -> List[str]:
        """Extract skills from title and description"""
        text = f"{title} {description}".lower()
        
        # Common tech skills
        skills = [
            'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
            'node.js', 'express', 'django', 'flask', 'spring', 'sql', 'postgresql',
            'mysql', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'azure',
            'gcp', 'git', 'linux', 'html', 'css', 'sass', 'webpack', 'babel',
            'rest', 'graphql', 'microservices', 'agile', 'scrum', 'ci/cd'
        ]
        
        found_skills = []
        for skill in skills:
            if skill in text:
                found_skills.append(skill.title())
        
        return found_skills[:10]  # Limit to 10 skills
    
    def _extract_benefits(self, description: str) -> List[str]:
        """Extract benefits from job description"""
        if not description:
            return []
        
        text = description.lower()
        
        benefits = {
            'health insurance': ['health insurance', 'medical insurance', 'healthcare'],
            'dental insurance': ['dental insurance', 'dental coverage'],
            'vision insurance': ['vision insurance', 'vision coverage'],
            '401k': ['401k', '401(k)', 'retirement plan'],
            'paid time off': ['pto', 'paid time off', 'vacation days'],
            'remote work': ['remote work', 'work from home', 'flexible location'],
            'flexible hours': ['flexible hours', 'flexible schedule'],
            'stock options': ['stock options', 'equity', 'stock grants'],
            'gym membership': ['gym membership', 'fitness'],
            'free lunch': ['free lunch', 'free meals', 'catered meals']
        }
        
        found_benefits = []
        for benefit, keywords in benefits.items():
            if any(keyword in text for keyword in keywords):
                found_benefits.append(benefit)
        
        return found_benefits
    
    def _detect_remote_work(self, title: str, description: str, location: str) -> bool:
        """Detect if job allows remote work"""
        text = f"{title} {description} {location}".lower()
        
        remote_keywords = [
            'remote', 'work from home', 'wfh', 'telecommute', 'distributed',
            'anywhere', 'location independent', 'home office'
        ]
        
        return any(keyword in text for keyword in remote_keywords)
    
    def _normalize_date(self, date_str: str) -> Optional[datetime]:
        """Normalize date string to datetime"""
        if not date_str:
            return None
        
        # Common date formats
        formats = [
            '%Y-%m-%d',
            '%m/%d/%Y',
            '%d/%m/%Y',
            '%Y-%m-%d %H:%M:%S',
            '%m/%d/%Y %H:%M:%S'
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        return None


class EngineService:
    """Service for managing the scraping engine state"""
    
    def __init__(self, db_manager: DatabaseManager = None):
        self.db_manager = db_manager or DatabaseManager()
    
    def get_engine_state(self) -> Dict[str, Any]:
        """Get current engine state"""
        try:
            with self.db_manager.get_session() as db:
                engine_state = db.query(EngineState).first()
                
                if not engine_state:
                    # Create default engine state
                    engine_state = EngineState(
                        status=EngineStatus.IDLE,
                        active_jobs=0,
                        queued_jobs=0,
                        total_jobs_today=0,
                        success_rate=0.0,
                        uptime_seconds=0
                    )
                    db.add(engine_state)
                    db.commit()
                
                # Get current job counts
                active_jobs = db.query(ScrapeJob).filter(
                    ScrapeJob.status == ScrapeJobStatus.RUNNING
                ).count()
                
                queued_jobs = db.query(ScrapeJob).filter(
                    ScrapeJob.status == ScrapeJobStatus.PENDING
                ).count()
                
                # Get today's job stats
                today = datetime.utcnow().date()
                today_jobs = db.query(ScrapeJob).filter(
                    ScrapeJob.created_at >= today
                ).all()
                
                total_jobs_today = len(today_jobs)
                completed_jobs = [j for j in today_jobs if j.status == ScrapeJobStatus.COMPLETED]
                success_rate = len(completed_jobs) / total_jobs_today if total_jobs_today > 0 else 0.0
                
                # Update engine state
                engine_state.active_jobs = active_jobs
                engine_state.queued_jobs = queued_jobs
                engine_state.total_jobs_today = total_jobs_today
                engine_state.success_rate = success_rate
                engine_state.last_activity = datetime.utcnow()
                
                db.commit()
                
                return {
                    'status': engine_state.status.value,
                    'active_jobs': engine_state.active_jobs,
                    'queued_jobs': engine_state.queued_jobs,
                    'total_jobs_today': engine_state.total_jobs_today,
                    'success_rate': engine_state.success_rate,
                    'last_activity': engine_state.last_activity,
                    'uptime_seconds': engine_state.uptime_seconds
                }
                
        except Exception as e:
            logger.error(f"Error getting engine state: {str(e)}")
            return {
                'status': 'error',
                'active_jobs': 0,
                'queued_jobs': 0,
                'total_jobs_today': 0,
                'success_rate': 0.0,
                'last_activity': None,
                'uptime_seconds': 0
            }
    
    def update_engine_status(self, status: EngineStatus) -> bool:
        """Update engine status"""
        try:
            with self.db_manager.get_session() as db:
                engine_state = db.query(EngineState).first()
                
                if engine_state:
                    engine_state.status = status
                    engine_state.last_activity = datetime.utcnow()
                    db.commit()
                    return True
                
                return False
                
        except Exception as e:
            logger.error(f"Error updating engine status: {str(e)}")
            return False