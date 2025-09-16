#!/usr/bin/env python3
"""
Autoscraper API Routes
Enterprise-grade autoscraper endpoints for the dedicated service
"""

import time
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from celery.result import AsyncResult
from loguru import logger
import psutil
import json

from app.database.database import DatabaseManager
from app.middleware.auth import get_current_user_optional, require_auth, require_admin
# from app.utils.metrics import AutoScraperMetrics  # Temporarily disabled
from app.models.models import (
    JobBoard, ScheduleConfig, ScrapeJob, ScrapeRun,
    RawJob, NormalizedJob, EngineState,
    ScrapeJobStatus, EngineStatus
)
from app.schemas import (
    JobBoardCreate, JobBoardUpdate, JobBoardResponse,
    ScheduleConfigCreate, ScheduleConfigUpdate, ScheduleConfigResponse,
    ScrapeJobCreate, ScrapeJobUpdate, ScrapeJobResponse,
    ScrapeRunResponse, RawJobResponse, NormalizedJobResponse, EngineStateResponse,
    StartScrapeJobRequest, PauseScrapeJobRequest, HardResetRequest,
    DashboardResponse, DashboardStats, RecentActivity,
    HealthCheckResponse, LiveLogsResponse, LogEntry,
    SuccessResponse, ErrorResponse,
    SystemSettings, SystemSettingsUpdate, SettingsTestRequest, SettingsTestResponse,
    SystemHealthResponse, PerformanceMetrics
)
from app.services.services import ScrapingService, NormalizationService, EngineService
from app.services.tasks import run_scrape_job
from app.services.settings_service import settings_service
from config.settings import get_settings

settings = get_settings()
# metrics = AutoScraperMetrics()  # Temporarily disabled

# Create router
router = APIRouter(prefix="/api/v1/autoscraper", tags=["autoscraper"])


@router.get("/", include_in_schema=False)
async def autoscraper_root():
    """Autoscraper service root endpoint"""
    return {
        "service": "autoscraper",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "dashboard": "/api/v1/autoscraper/dashboard",
            "health": "/api/v1/autoscraper/health",
            "metrics": "/metrics",
            "docs": "/docs"
        }
    }


async def get_db_session(request: Request):
    """Database session dependency"""
    db_manager = request.app.state.db_manager
    async with db_manager.get_session_context() as session:
        yield session

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    db: Session = Depends(get_db_session),
    current_user = Depends(get_current_user_optional)
):
    """
    Get autoscraper dashboard with stats and recent activities
    """
    start_time = time.time()
    
    try:
        # Get dashboard statistics
        from sqlalchemy import select, func
        
        total_job_boards_result = await db.execute(select(func.count(JobBoard.id)))
        total_job_boards = total_job_boards_result.scalar()
        
        active_job_boards_result = await db.execute(
            select(func.count(JobBoard.id)).where(JobBoard.is_active == True)
        )
        active_job_boards = active_job_boards_result.scalar()
        
        total_scrape_jobs_result = await db.execute(select(func.count(ScrapeJob.id)))
        total_scrape_jobs = total_scrape_jobs_result.scalar()
        
        running_jobs_result = await db.execute(
            select(func.count(ScrapeJob.id)).where(ScrapeJob.status == ScrapeJobStatus.RUNNING)
        )
        running_jobs = running_jobs_result.scalar()
        
        # Today's statistics
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        completed_jobs_today_result = await db.execute(
            select(func.count(ScrapeJob.id)).where(
                ScrapeJob.status == ScrapeJobStatus.COMPLETED,
                ScrapeJob.completed_at >= today_start
            )
        )
        completed_jobs_today = completed_jobs_today_result.scalar()
        
        failed_jobs_today_result = await db.execute(
            select(func.count(ScrapeJob.id)).where(
                ScrapeJob.status == ScrapeJobStatus.FAILED,
                ScrapeJob.updated_at >= today_start
            )
        )
        failed_jobs_today = failed_jobs_today_result.scalar()
        
        # Calculate success rate
        total_jobs_today = completed_jobs_today + failed_jobs_today
        success_rate_today = (completed_jobs_today / total_jobs_today * 100) if total_jobs_today > 0 else 0.0
        
        total_raw_jobs_result = await db.execute(select(func.count(RawJob.id)))
        total_raw_jobs = total_raw_jobs_result.scalar()
        total_normalized_jobs_result = await db.execute(select(func.count(NormalizedJob.id)))
        total_normalized_jobs = total_normalized_jobs_result.scalar()
        
        jobs_published_today_result = await db.execute(
            select(func.count(NormalizedJob.id)).where(
                NormalizedJob.is_published == True,
                NormalizedJob.published_at >= today_start
            )
        )
        jobs_published_today = jobs_published_today_result.scalar()
        
        # Calculate total jobs scraped (completed + failed)
        total_jobs_scraped = total_raw_jobs + total_normalized_jobs
        
        # Calculate overall success rate
        success_rate = (completed_jobs_today / total_jobs_today * 100) if total_jobs_today > 0 else 0.0
        
        stats = DashboardStats(
            total_job_boards=total_job_boards,
            active_job_boards=active_job_boards,
            total_scrape_jobs=total_scrape_jobs,
            running_jobs=running_jobs,
            completed_jobs_today=completed_jobs_today,
            failed_jobs_today=failed_jobs_today,
            total_jobs_scraped=total_jobs_scraped,
            success_rate=success_rate
        )
        
        # Get recent activities
        recent_jobs_result = await db.execute(
            select(ScrapeJob, JobBoard)
            .join(JobBoard)
            .order_by(ScrapeJob.created_at.desc())
            .limit(10)
        )
        recent_jobs = recent_jobs_result.all()
        
        recent_activities = [
            RecentActivity(
                id=job.ScrapeJob.id,
                type="scrape_job",
                message=f"Scrape job for {job.JobBoard.name} - {job.ScrapeJob.status.value}",
                timestamp=job.ScrapeJob.started_at or job.ScrapeJob.created_at,
                status=job.ScrapeJob.status.value
            )
            for job in recent_jobs
        ]
        
        # Get engine state
        engine_state_result = await db.execute(select(EngineState))
        engine_state = engine_state_result.scalar_one_or_none()
        if not engine_state:
            # Create default engine state if not exists
            engine_state = EngineState(
                status=EngineStatus.IDLE,
                active_jobs_count=running_jobs,
                total_jobs_today=total_jobs_today,
                success_rate_today=success_rate_today,
                last_heartbeat=datetime.utcnow(),
                system_load=psutil.cpu_percent(),
                memory_usage_mb=psutil.virtual_memory().used / 1024 / 1024,
                error_count_today=failed_jobs_today,
                uptime_seconds=0,
                version="1.0.0",
                configuration={"max_concurrent_jobs": 5}
            )
            db.add(engine_state)
            await db.commit()
            await db.refresh(engine_state)
        
        # Record metrics
        duration = time.time() - start_time
        # metrics.record_http_request("GET", "/dashboard", 200, duration)  # Temporarily disabled
        
        return DashboardResponse(
            stats=stats,
            recent_activity=recent_activities,
            engine_status=EngineStateResponse.from_orm(engine_state)
        )
        
    except Exception as e:
        duration = time.time() - start_time
        # metrics.record_http_request("GET", "/dashboard", 500, duration)  # Temporarily disabled
        logger.error(f"Dashboard error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load dashboard: {str(e)}"
        )


@router.post("/jobs/start", response_model=ScrapeJobResponse)
async def start_scrape_job(
    request: StartScrapeJobRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db_session),
    current_user = Depends(require_auth)
):
    """
    Start a new scrape job for a specific job board
    """
    start_time = time.time()
    
    try:
        # Verify job board exists and is active
        job_board_result = await db.execute(
            select(JobBoard).where(
                JobBoard.id == request.job_board_id,
                JobBoard.is_active == True
            )
        )
        job_board = job_board_result.scalar_one_or_none()
        
        if not job_board:
            duration = time.time() - start_time
            metrics.record_http_request("POST", "/jobs/start", 404, duration)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job board not found or inactive"
            )
        
        # Check for existing running jobs for this job board
        existing_job_result = await db.execute(
            select(ScrapeJob).where(
                ScrapeJob.job_board_id == request.job_board_id,
                ScrapeJob.status == ScrapeJobStatus.RUNNING
            )
        )
        existing_job = existing_job_result.scalar_one_or_none()
        
        if existing_job:
            duration = time.time() - start_time
            metrics.record_http_request("POST", "/jobs/start", 409, duration)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A scrape job is already running for this job board"
            )
        
        # Create new scrape job
        scrape_job = ScrapeJob(
            job_board_id=request.job_board_id,
            mode=request.mode,
            priority=request.priority,
            max_pages=request.max_pages,
            status=ScrapeJobStatus.PENDING,
            config_snapshot={
                "job_board_config": {
                    "name": job_board.name,
                    "type": job_board.type,
                    "base_url": job_board.base_url,
                    "rss_url": job_board.rss_url,
                    "selectors": job_board.selectors,
                    "headers": job_board.headers,
                    "rate_limit_delay": job_board.rate_limit_delay,
                    "quality_threshold": job_board.quality_threshold
                },
                "request_params": {
                    "mode": request.mode,
                    "priority": request.priority,
                    "max_pages": request.max_pages
                }
            }
        )
        
        db.add(scrape_job)
        await db.commit()
        await db.refresh(scrape_job)
        
        # Start the Celery task
        task = run_scrape_job.apply_async(
            args=[str(scrape_job.id)],
            queue="autoscraper.default",
            priority=request.priority
        )
        
        # Update job with task ID
        scrape_job.celery_task_id = task.id
        await db.commit()
        
        # Record metrics
        duration = time.time() - start_time
        metrics.record_http_request("POST", "/jobs/start", 200, duration)
        metrics.record_scrape_job(job_board.type, "started")
        
        logger.info(f"Started scrape job {scrape_job.id} for job board {job_board.name}")
        
        return ScrapeJobResponse.from_orm(scrape_job)
        
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("POST", "/jobs/start", 500, duration)
        logger.error(f"Failed to start scrape job: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start scrape job: {str(e)}"
        )


@router.post("/jobs/pause", response_model=SuccessResponse)
async def pause_scrape_job(
    request: PauseScrapeJobRequest,
    db: Session = Depends(get_db_session),
    current_user = Depends(require_auth)
):
    """
    Pause a running scrape job
    """
    start_time = time.time()
    
    try:
        # Find the scrape job
        scrape_job_result = await db.execute(
            select(ScrapeJob).where(
                ScrapeJob.id == request.job_id
            )
        )
        scrape_job = scrape_job_result.scalar_one_or_none()
        
        if not scrape_job:
            duration = time.time() - start_time
            metrics.record_http_request("POST", "/jobs/pause", 404, duration)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scrape job not found"
            )
        
        if scrape_job.status != ScrapeJobStatus.RUNNING:
            duration = time.time() - start_time
            metrics.record_http_request("POST", "/jobs/pause", 400, duration)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job is not currently running"
            )
        
        # Revoke the Celery task if it exists
        if scrape_job.celery_task_id:
            from celery import Celery
            from autoscraper_service.config.settings import settings
            
            celery_app = Celery(
                'autoscraper',
                broker=settings.CELERY_BROKER_URL,
                backend=settings.CELERY_RESULT_BACKEND
            )
            celery_app.control.revoke(scrape_job.celery_task_id, terminate=True)
        
        # Update job status
        scrape_job.status = ScrapeJobStatus.PAUSED
        scrape_job.updated_at = datetime.utcnow()
        await db.commit()
        
        # Record metrics
        duration = time.time() - start_time
        metrics.record_http_request("POST", "/jobs/pause", 200, duration)
        
        logger.info(f"Paused scrape job {scrape_job.id}")
        
        return SuccessResponse(
            message=f"Scrape job {scrape_job.id} has been paused",
            data={"job_id": scrape_job.id, "status": scrape_job.status}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("POST", "/jobs/pause", 500, duration)
        logger.error(f"Failed to pause scrape job: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to pause scrape job: {str(e)}"
        )


@router.get("/job-boards", response_model=List[JobBoardResponse])
async def list_job_boards(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(False),
    db: Session = Depends(get_db_session),
    current_user = Depends(get_current_user_optional)
):
    """
    List all job boards with pagination
    """
    start_time = time.time()
    
    try:
        query = select(JobBoard)
        
        if active_only:
            query = query.where(JobBoard.is_active == True)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        job_boards = result.scalars().all()
        
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/job-boards", 200, duration)
        
        return [JobBoardResponse.from_orm(jb) for jb in job_boards]
        
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/job-boards", 500, duration)
        logger.error(f"Failed to list job boards: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list job boards: {str(e)}"
        )


@router.post("/job-boards", response_model=JobBoardResponse)
async def create_job_board(
    job_board: JobBoardCreate,
    db: Session = Depends(get_db_session),
    current_user = Depends(require_auth)
):
    """
    Create a new job board
    """
    start_time = time.time()
    
    try:
        # Check if job board with same name exists
        existing_result = await db.execute(select(JobBoard).where(JobBoard.name == job_board.name))
        existing = existing_result.scalar_one_or_none()
        if existing:
            duration = time.time() - start_time
            metrics.record_http_request("POST", "/job-boards", 409, duration)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Job board with this name already exists"
            )
        
        # Create new job board
        db_job_board = JobBoard(**job_board.dict())
        db.add(db_job_board)
        await db.commit()
        await db.refresh(db_job_board)
        
        duration = time.time() - start_time
        metrics.record_http_request("POST", "/job-boards", 201, duration)
        
        logger.info(f"Created job board: {db_job_board.name}")
        
        return JobBoardResponse.from_orm(db_job_board)
        
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("POST", "/job-boards", 500, duration)
        logger.error(f"Failed to create job board: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create job board: {str(e)}"
        )


@router.post("/job-boards/upload-csv")
async def upload_job_boards_csv(
    file: UploadFile = File(...),
    test_accessibility: bool = Query(False, description="Test URL accessibility"),
    db: Session = Depends(get_db_session),
    current_user = Depends(require_admin)
):
    """
    Upload job boards from CSV file
    Expected CSV format: name,url,region (optional)
    """
    start_time = time.time()
    upload_id = f"upload_{int(time.time())}"
    
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be a CSV file"
            )
        
        # Read and parse CSV content
        content = await file.read()
        csv_text = content.decode('utf-8')
        lines = csv_text.strip().split('\n')
        
        if len(lines) < 2:  # At least header + 1 data row
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV file must contain at least one data row"
            )
        
        # Parse CSV data
        job_boards_data = []
        headers = []
        
        for i, line in enumerate(lines):
            if not line.strip():
                continue
                
            # Parse CSV line (simple parsing, handles quoted values)
            columns = []
            current_col = ""
            in_quotes = False
            
            for char in line:
                if char == '"':
                    in_quotes = not in_quotes
                elif char == ',' and not in_quotes:
                    columns.append(current_col.strip())
                    current_col = ""
                else:
                    current_col += char
            columns.append(current_col.strip())  # Add last column
            
            if i == 0:
                # Check if first row is header
                first_col = columns[0].lower() if columns else ""
                if 'name' in first_col or 'job' in first_col or 'board' in first_col:
                    headers = [col.lower() for col in columns]
                    continue
                else:
                    # No header, treat as data
                    headers = ['name', 'base_url', 'region']
            
            # Process data rows
            if len(columns) >= 2:
                name = columns[0].strip('"').strip()
                url = columns[1].strip('"').strip()
                region = columns[2].strip('"').strip() if len(columns) > 2 else None
                
                if name and url:
                    job_boards_data.append({
                        'name': name,
                        'base_url': url,
                        'region': region
                    })
        
        if not job_boards_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid job board data found in CSV"
            )
        
        # Create job boards in database
        created_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []
        
        for data in job_boards_data:
            try:
                # Check if job board already exists
                existing_result = await db.execute(
                    select(JobBoard).where(JobBoard.name == data['name'])
                )
                existing = existing_result.scalar_one_or_none()
                
                if existing:
                    # Update existing job board
                    existing.base_url = data['base_url']
                    if data['region']:
                        # Store region in selectors
                        selectors = existing.selectors or {}
                        selectors['region'] = data['region']
                        existing.selectors = selectors
                    updated_count += 1
                else:
                    # Create new job board
                    # Store region in selectors if provided
                    selectors = {}
                    if data['region']:
                        selectors['region'] = data['region']
                    
                    new_job_board = JobBoard(
                        name=data['name'],
                        type='HTML',  # Default to HTML scraping
                        base_url=data['base_url'],
                        is_active=False,  # Start inactive for safety
                        selectors=selectors,
                        rate_limit_delay=2,  # Default values
                        max_pages=10
                    )
                    db.add(new_job_board)
                    created_count += 1
                    
            except Exception as e:
                errors.append(f"Error processing {data['name']}: {str(e)}")
                skipped_count += 1
                continue
        
        # Commit all changes
        await db.commit()
        
        duration = time.time() - start_time
        metrics.record_http_request("POST", "/job-boards/upload-csv", 200, duration)
        
        logger.info(f"CSV upload completed: {created_count} created, {updated_count} updated, {skipped_count} skipped")
        
        return {
            "upload_id": upload_id,
            "total_rows": len(job_boards_data),
            "created": created_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "errors": errors,
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("POST", "/job-boards/upload-csv", 500, duration)
        logger.error(f"Failed to upload CSV: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload CSV: {str(e)}"
        )


@router.get("/jobs", response_model=List[ScrapeJobResponse])
async def list_scrape_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    job_status: Optional[str] = Query(None),
    job_board_id: Optional[str] = Query(None),
    db: Session = Depends(get_db_session),
    current_user = Depends(get_current_user_optional)
):
    """
    List scrape jobs with filtering
    """
    start_time = time.time()
    
    try:
        query = select(ScrapeJob)
        
        if job_status:
            query = query.where(ScrapeJob.status == job_status)
        
        if job_board_id:
            query = query.where(ScrapeJob.job_board_id == job_board_id)
        
        query = query.order_by(ScrapeJob.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        jobs = result.scalars().all()
        
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/jobs", 200, duration)
        
        return [ScrapeJobResponse.from_orm(job) for job in jobs]
        
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/jobs", 500, duration)
        logger.error(f"Failed to list scrape jobs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list scrape jobs: {str(e)}"
        )


@router.get("/engine/state", response_model=EngineStateResponse)
async def get_engine_state(
    db: Session = Depends(get_db_session),
    current_user = Depends(get_current_user_optional)
):
    """
    Get current engine state
    """
    start_time = time.time()
    
    try:
        engine_state_result = await db.execute(select(EngineState))
        engine_state = engine_state_result.scalar_one_or_none()
        
        if not engine_state:
            # Create default engine state
            running_jobs_result = await db.execute(
                select(func.count(ScrapeJob.id)).where(
                    ScrapeJob.status == ScrapeJobStatus.RUNNING
                )
            )
            running_jobs = running_jobs_result.scalar()
            
            engine_state = EngineState(
                status=EngineStatus.IDLE,
                active_jobs_count=running_jobs,
                total_jobs_today=0,
                success_rate_today=0.0,
                last_heartbeat=datetime.utcnow(),
                system_load=psutil.cpu_percent(),
                memory_usage_mb=psutil.virtual_memory().used / 1024 / 1024,
                error_count_today=0,
                uptime_seconds=0,
                version="1.0.0",
                configuration={"max_concurrent_jobs": 5}
            )
            db.add(engine_state)
            await db.commit()
            await db.refresh(engine_state)
        
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/engine/state", 200, duration)
        
        return EngineStateResponse.from_orm(engine_state)
        
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/engine/state", 500, duration)
        logger.error(f"Failed to get engine state: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get engine state: {str(e)}"
        )


@router.get("/system/metrics", response_model=PerformanceMetrics)
async def get_performance_metrics(
    current_user = Depends(get_current_user_optional)
):
    """
    Get current performance metrics
    """
    start_time = time.time()
    
    try:
        # Get system metrics
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=1)
        disk = psutil.disk_usage('/')
        
        performance_metrics = PerformanceMetrics(
            cpu_usage=cpu_percent,
            memory_usage=memory.percent,
            disk_usage=disk.percent,
            active_connections=0,  # TODO: Implement connection tracking
            requests_per_second=0.0,  # TODO: Implement request tracking
            average_response_time=0.0,  # TODO: Implement response time tracking
            error_rate=0.0,  # TODO: Implement error tracking
            success_rate=100.0,  # TODO: Implement success tracking
            memory_usage_mb=memory.used // (1024 * 1024),
            cpu_usage_percent=cpu_percent,
            disk_usage_percent=disk.percent,
            timestamp=datetime.now().isoformat()
        )
        
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/system/metrics", 200, duration)
        
        return performance_metrics
        
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/system/metrics", 500, duration)
        logger.error(f"Failed to get performance metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get performance metrics: {str(e)}"
        )


@router.get("/settings", response_model=SystemSettings)
async def get_settings(
    current_user = Depends(get_current_user_optional)
):
    """
    Get current system settings
    """
    start_time = time.time()
    
    try:
        settings = settings_service.get_settings()
        
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/settings", 200, duration)
        
        return settings
        
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/settings", 500, duration)
        logger.error(f"Failed to get settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get settings: {str(e)}"
        )


@router.put("/settings", response_model=SystemSettings)
async def update_settings(
    settings_update: SystemSettingsUpdate,
    current_user = Depends(require_auth)
):
    """
    Update system settings
    """
    start_time = time.time()
    
    try:
        updated_settings = settings_service.update_settings(settings_update.dict(exclude_unset=True))
        
        duration = time.time() - start_time
        metrics.record_http_request("PUT", "/settings", 200, duration)
        
        logger.info("System settings updated")
        
        return updated_settings
        
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("PUT", "/settings", 500, duration)
        logger.error(f"Failed to update settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update settings: {str(e)}"
        )


# Engine control endpoints
@router.post("/engine/start", response_model=SuccessResponse)
async def start_engine(
    request: Optional[StartScrapeJobRequest] = None,
    current_user = Depends(require_admin)
):
    """
    Start the scraping engine by dispatching scrape jobs.
    If no request body is provided, it will start all active job boards.
    """
    start_time = time.time()
    
    try:
        db_manager: DatabaseManager = request.app.state.db_manager
        async with db_manager.get_session() as db:
            # Get active job boards
            query = select(JobBoard).where(JobBoard.is_active == True)
            result = await db.execute(query)
            job_boards = result.scalars().all()
            
            if not job_boards:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No active job boards available to start"
                )
            
            # Create scrape jobs for active job boards
            scraping_service = ScrapingService(db)
            job_data = {
                'job_board_ids': [str(jb.id) for jb in job_boards],
                'priority': getattr(request, 'priority', 0) if request else 0,
                'mode': getattr(request, 'mode', 'manual') if request else 'manual'
            }
            
            result = await scraping_service.start_scrape_job(job_data)
            
            duration = time.time() - start_time
            metrics.record_http_request("POST", "/engine/start", 200, duration)
            
            return SuccessResponse(success=True, message="Engine start request submitted", data=result)
            
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("POST", "/engine/start", 500, duration)
        logger.error(f"Error starting engine: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start engine"
        )


@router.post("/engine/pause", response_model=SuccessResponse)
async def pause_engine(
    request: Optional[PauseScrapeJobRequest] = None,
    current_user = Depends(require_admin)
):
    """
    Pause the scraping engine by pausing active jobs.
    If no request body is provided, pause all running jobs.
    """
    start_time = time.time()
    
    try:
        db_manager: DatabaseManager = request.app.state.db_manager
        async with db_manager.get_session() as db:
            # Get running jobs
            query = select(ScrapeJob).where(ScrapeJob.status == ScrapeJobStatus.RUNNING)
            result = await db.execute(query)
            running_jobs = result.scalars().all()
            
            if not running_jobs:
                return SuccessResponse(success=True, message="No running jobs to pause", data={"paused": 0})
            
            # Pause running jobs
            scraping_service = ScrapingService(db)
            job_ids = [str(job.id) for job in running_jobs]
            
            payload = {
                'job_ids': job_ids,
                'reason': 'Pause-all via engine alias'
            }
            
            result = await scraping_service.pause_scrape_job(payload)
            
            duration = time.time() - start_time
            metrics.record_http_request("POST", "/engine/pause", 200, duration)
            
            return SuccessResponse(success=True, message="Engine pause request submitted", data=result)
            
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("POST", "/engine/pause", 500, duration)
        logger.error(f"Error pausing engine: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to pause engine"
        )


@router.post("/engine/reset", response_model=SuccessResponse)
async def reset_engine(
    current_user = Depends(require_admin)
):
    """
    Reset the scraping engine.
    This performs a system reset with no data/config wipe by default.
    Requires admin privileges.
    """
    start_time = time.time()
    
    try:
        
        db_manager: DatabaseManager = request.app.state.db_manager
        async with db_manager.get_session() as db:
            # Reset engine state
            engine_service = EngineService(db)
            result = await engine_service.reset_engine()
            
            duration = time.time() - start_time
            metrics.record_http_request("POST", "/engine/reset", 200, duration)
            
            return SuccessResponse(success=True, message="Engine reset completed", data=result)
            
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("POST", "/engine/reset", 500, duration)
        logger.error(f"Error resetting engine: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset engine"
        )


# Scrape Runs endpoints
@router.get("/runs", response_model=List[ScrapeRunResponse])
async def list_scrape_runs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    job_id: Optional[str] = Query(None, description="Filter by scrape job ID"),
    db: Session = Depends(get_db_session),
    current_user = Depends(get_current_user_optional)
):
    """
    List scrape runs with optional filtering
    """
    start_time = time.time()
    
    try:
        query = select(ScrapeRun)
        
        # Apply filters
        if job_id:
            query = query.where(ScrapeRun.scrape_job_id == job_id)
        
        # Apply pagination
        query = query.offset(skip).limit(limit).order_by(ScrapeRun.created_at.desc())
        
        result = await db.execute(query)
        runs = result.scalars().all()
        
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/runs", 200, duration)
        
        return [ScrapeRunResponse.from_orm(run) for run in runs]
        
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/runs", 500, duration)
        logger.error(f"Failed to list scrape runs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list scrape runs"
        )


@router.get("/runs/{run_id}", response_model=ScrapeRunResponse)
async def get_scrape_run(
    run_id: str,
    db: Session = Depends(get_db_session),
    current_user = Depends(get_current_user_optional)
):
    """
    Get a specific scrape run by ID
    """
    start_time = time.time()
    
    try:
        # Convert string run_id to UUID
        try:
            run_uuid = UUID(run_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid run ID format"
            )
        
        query = select(ScrapeRun).where(ScrapeRun.id == run_uuid)
        result = await db.execute(query)
        run = result.scalar_one_or_none()
        
        if not run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scrape run not found"
            )
        
        duration = time.time() - start_time
        metrics.record_http_request("GET", f"/runs/{run_id}", 200, duration)
        
        return ScrapeRunResponse.from_orm(run)
        
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("GET", f"/runs/{run_id}", 500, duration)
        logger.error(f"Failed to get scrape run {run_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get scrape run"
        )


# Logs endpoints
@router.get("/logs", response_model=LiveLogsResponse)
async def get_logs(
    limit: int = Query(100, ge=1, le=1000, description="Number of logs to retrieve"),
    level: Optional[str] = Query(None, description="Filter by log level"),
    source: Optional[str] = Query(None, description="Filter by log source"),
    job_id: Optional[str] = Query(None, description="Filter by job ID"),
    current_user = Depends(get_current_user_optional)
):
    """
    Get application logs with filtering options
    """
    start_time = time.time()
    
    try:
        # For now, return mock logs since we don't have a log storage system
        # In a real implementation, you'd query your log storage (e.g., database, file, etc.)
        mock_logs = [
            LogEntry(
                timestamp=datetime.now(),
                level="INFO",
                message="AutoScraper service started successfully",
                source="autoscraper",
                job_id=None,
                details={"service": "autoscraper", "version": "1.0.0"}
            ),
            LogEntry(
                timestamp=datetime.now(),
                level="INFO",
                message="Job board scraping completed",
                source="scraper",
                job_id=None,
                details={"items_found": 25, "items_processed": 25}
            )
        ]
        
        # Apply filters
        filtered_logs = mock_logs
        if level:
            filtered_logs = [log for log in filtered_logs if log.level.lower() == level.lower()]
        if source:
            filtered_logs = [log for log in filtered_logs if log.source and source.lower() in log.source.lower()]
        if job_id:
            try:
                job_uuid = UUID(job_id)
                filtered_logs = [log for log in filtered_logs if log.job_id == job_uuid]
            except ValueError:
                pass  # Invalid UUID, ignore filter
        
        # Apply limit
        filtered_logs = filtered_logs[:limit]
        
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/logs", 200, duration)
        
        return LiveLogsResponse(
            logs=filtered_logs,
            total_count=len(filtered_logs),
            has_more=False
        )
        
    except Exception as e:
        duration = time.time() - start_time
        metrics.record_http_request("GET", "/logs", 500, duration)
        logger.error(f"Failed to get logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve logs"
        )


@router.get("/logs/live")
async def get_live_logs(
    limit: int = Query(100, ge=1, le=1000),
    level: str = Query("INFO", description="Log level filter"),
    current_user = Depends(get_current_user_optional)
):
    """
    Live log streaming using Server-Sent Events (SSE)
    """
    import asyncio
    import json
    
    async def generate_log_stream():
        """Generate SSE formatted log stream"""
        try:
            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connected', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
            
            # Send recent logs first
            now = datetime.utcnow()
            
            for i in range(min(limit, 10)):
                log_time = now - timedelta(minutes=i)
                log_entry = {
                    "type": "log",
                    "timestamp": log_time.isoformat(),
                    "level": level,
                    "message": f"Sample log message {i+1}",
                    "source": "autoscraper",
                    "job_id": None
                }
                yield f"data: {json.dumps(log_entry)}\n\n"
            
            # Keep connection alive and send periodic updates
            while True:
                await asyncio.sleep(5)  # Send update every 5 seconds
                
                # Send heartbeat or new log entries
                heartbeat = {
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat(),
                    "active_jobs": 0  # TODO: Get actual active job count
                }
                yield f"data: {json.dumps(heartbeat)}\n\n"
                
        except asyncio.CancelledError:
            # Client disconnected
            logger.info("Live log stream disconnected")
            return
        except Exception as e:
            logger.error(f"Error in log stream: {str(e)}")
            error_event = {
                "type": "error",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
            yield f"data: {json.dumps(error_event)}\n\n"
    
    return StreamingResponse(
        generate_log_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )