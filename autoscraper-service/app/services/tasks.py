#!/usr/bin/env python3
"""
Celery Tasks for Autoscraper Service
Background tasks for scraping operations
"""

import time
from datetime import datetime
from celery import Celery
from loguru import logger
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.database import DatabaseManager
from app.models.models import ScrapeJob, JobBoard, ScrapeJobStatus
from app.services.services import ScrapingService
from config.settings import get_settings

settings = get_settings()

# Initialize Celery app
celery_app = Celery(
    'autoscraper',
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_routes={
        'app.services.tasks.run_scrape_job': {'queue': 'autoscraper.default'},
    }
)

db_manager = DatabaseManager()


@celery_app.task(bind=True, name='app.services.tasks.run_scrape_job')
def run_scrape_job(self, job_id: str):
    """
    Execute a scrape job in the background
    
    Args:
        job_id: The ID of the scrape job to execute
    
    Returns:
        dict: Result of the scrape operation
    """
    logger.info(f"Starting scrape job {job_id}")
    
    try:
        # Get database session
        with db_manager.get_session() as db:
            # Find the scrape job
            scrape_job_result = db.execute(
                select(ScrapeJob).where(ScrapeJob.id == job_id)
            )
            scrape_job = scrape_job_result.scalar_one_or_none()
            
            if not scrape_job:
                logger.error(f"Scrape job {job_id} not found")
                return {"success": False, "error": "Job not found"}
            
            # Get job board
            job_board_result = db.execute(
                select(JobBoard).where(JobBoard.id == scrape_job.job_board_id)
            )
            job_board = job_board_result.scalar_one_or_none()
            
            if not job_board:
                logger.error(f"Job board {scrape_job.job_board_id} not found")
                scrape_job.status = ScrapeJobStatus.FAILED
                scrape_job.error_message = "Job board not found"
                scrape_job.completed_at = datetime.utcnow()
                db.commit()
                return {"success": False, "error": "Job board not found"}
            
            # Update job status to running
            scrape_job.status = ScrapeJobStatus.RUNNING
            scrape_job.started_at = datetime.utcnow()
            db.commit()
            
            # Initialize scraping service
            scraping_service = ScrapingService()
            
            # Execute the scraping
            result = scraping_service.scrape_job_board(
                job_board=job_board,
                scrape_job=scrape_job,
                max_pages=scrape_job.max_pages
            )
            
            # Update job status based on result
            if result.get("success", False):
                scrape_job.status = ScrapeJobStatus.COMPLETED
                scrape_job.jobs_scraped = result.get("jobs_scraped", 0)
                scrape_job.pages_scraped = result.get("pages_scraped", 0)
                logger.info(f"Scrape job {job_id} completed successfully")
            else:
                scrape_job.status = ScrapeJobStatus.FAILED
                scrape_job.error_message = result.get("error", "Unknown error")
                logger.error(f"Scrape job {job_id} failed: {scrape_job.error_message}")
            
            scrape_job.completed_at = datetime.utcnow()
            db.commit()
            
            return result
            
    except Exception as e:
        logger.error(f"Error executing scrape job {job_id}: {str(e)}")
        
        # Update job status to failed
        try:
            with db_manager.get_session() as db:
                scrape_job_result = db.execute(
                    select(ScrapeJob).where(ScrapeJob.id == job_id)
                )
                scrape_job = scrape_job_result.scalar_one_or_none()
                
                if scrape_job:
                    scrape_job.status = ScrapeJobStatus.FAILED
                    scrape_job.error_message = str(e)
                    scrape_job.completed_at = datetime.utcnow()
                    db.commit()
        except Exception as db_error:
            logger.error(f"Failed to update job status: {str(db_error)}")
        
        return {"success": False, "error": str(e)}