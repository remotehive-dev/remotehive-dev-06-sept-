#!/usr/bin/env python3
"""
Pytest configuration and fixtures for autoscraper integration tests
"""

import pytest
import asyncio
import os
import sys
from typing import Generator, AsyncGenerator
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.autoscraper.service_adapter import AutoscraperServiceAdapter
from app.core.config import settings


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI application."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for the FastAPI application."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_autoscraper_service():
    """Mock autoscraper service with successful responses"""
    mock = AsyncMock()
    
    # Make it an async context manager
    mock.__aenter__ = AsyncMock(return_value=mock)
    mock.__aexit__ = AsyncMock(return_value=None)
    
    # Dashboard data - make it async
    async def mock_get_dashboard():
        return {
            "stats": {
                "total_job_boards": 5,
                "active_job_boards": 3,
                "total_scrape_jobs": 25,
                "running_jobs": 2,
                "completed_jobs_today": 8,
                "failed_jobs_today": 1,
                "total_jobs_scraped": 1250,
                "success_rate": 92.5
            },
            "recent_activity": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "type": "scrape_job",
                    "message": "Job board 'TechJobs' scraping completed successfully",
                    "timestamp": "2024-01-20T10:30:00Z",
                    "status": "completed"
                },
                {
                    "id": "550e8400-e29b-41d4-a716-446655440001",
                    "type": "job_board",
                    "message": "New job board 'StartupJobs' added",
                    "timestamp": "2024-01-20T09:15:00Z",
                    "status": "success"
                }
            ],
            "engine_status": {
                "status": "running",
                "active_jobs": 2,
                "queued_jobs": 3,
                "total_jobs_today": 9,
                "success_rate": 92.5,
                "last_activity": "2024-01-20T10:30:00Z",
                "uptime_seconds": 86400
            }
        }
    mock.get_dashboard = mock_get_dashboard
    
    # Job boards data
    mock.list_job_boards.return_value = {
        "job_boards": [
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "TechJobs",
                "url": "https://techjobs.com",
                "status": "active",
                "last_scraped": "2024-01-20T10:30:00Z"
            },
            {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "name": "StartupJobs",
                "url": "https://startupjobs.com",
                "status": "active",
                "last_scraped": "2024-01-20T09:15:00Z"
            }
        ],
        "engine_status": {
            "status": "running",
            "active_jobs": 2,
            "queued_jobs": 3,
            "total_jobs_today": 9,
            "success_rate": 92.5,
            "last_activity": "2024-01-20T10:30:00Z",
            "uptime_seconds": 86400
        }
    }
    
    # Job board data
    mock.get_job_boards.return_value = [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Test Job Board",
            "description": "Test job board description",
            "board_type": "html",
            "base_url": "https://example.com/jobs",
            "rss_url": None,
            "selectors": {"job_title": ".job-title"},
            "rate_limit_delay": 2,
            "max_pages": 10,
            "request_timeout": 30,
            "retry_attempts": 3,
            "is_active": True,
            "success_rate": 95.5,
            "last_scraped_at": "2024-01-15T10:30:00Z",
            "total_scrapes": 100,
            "successful_scrapes": 95,
            "failed_scrapes": 5,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-15T10:30:00Z"
        }
    ]
    mock.get_job_board.return_value = {
        "id": "board1",
        "name": "Test Board",
        "url": "https://example.com",
        "active": True
    }
    mock.create_job_board.return_value = {
        "id": "board2",
        "name": "New Board",
        "url": "https://newboard.com",
        "active": True
    }
    mock.update_job_board.return_value = {
        "id": "board1",
        "name": "Updated Board",
        "url": "https://example.com",
        "active": True
    }
    mock.delete_job_board.return_value = {"success": True}
    
    # Scrape job data
    mock.list_scrape_jobs.return_value = [
        {
            "id": "job1",
            "status": "running",
            "job_board_id": "board1"
        }
    ]
    mock.start_scrape_job.return_value = {
        "job_id": "job123",
        "status": "started",
        "message": "Scrape job started successfully"
    }
    mock.pause_scrape_job.return_value = {
        "job_id": "job123",
        "status": "paused",
        "message": "Scrape job paused successfully"
    }
    mock.get_scrape_job.return_value = {
        "id": "job123",
        "status": "running",
        "job_board_id": "board1"
    }
    
    # System methods
    mock.hard_reset.return_value = {"success": True, "message": "System reset completed"}
    
    # Health data
    mock.health_check.return_value = {
        "status": "unhealthy",
        "timestamp": "2024-01-20T10:00:00Z",
        "services": {
            "database": "unhealthy",
            "redis": "healthy"
        },
        "version": "1.0.0"
    }
    mock.get_system_health.return_value = {
        "status": "healthy",
        "database": "connected",
        "redis": "connected"
    }
    mock.get_performance_metrics.return_value = {
        "cpu_usage": 45.2,
        "memory_usage": 67.8,
        "active_jobs": 3
    }
    
    # Engine methods
    mock.get_engine_state.return_value = {
        "status": "running",
        "active_jobs": 3,
        "queued_jobs": 2,
        "total_jobs_today": 15,
        "success_rate": 0.85,
        "last_activity": "2024-01-15T10:30:00Z",
        "uptime_seconds": 3600
    }
    mock.trigger_heartbeat.return_value = {
        "success": True,
        "timestamp": "2024-01-15T10:30:00Z"
    }
    
    # Logs methods
    mock.get_logs.return_value = {
        "logs": [
            {
                "timestamp": "2024-01-15T10:30:00Z",
                "level": "INFO",
                "message": "Test log message"
            }
        ],
        "total": 1
    }
    mock.get_live_logs.return_value = {
        "logs": [
            {
                "timestamp": "2024-01-15T10:30:00Z",
                "level": "INFO",
                "message": "Live log message"
            }
        ],
        "total": 1
    }
    
    # Settings methods
    mock.get_settings.return_value = {
        "scraping_interval": 3600,
        "max_concurrent_jobs": 5,
        "timeout": 30
    }
    mock.update_settings.return_value = {
        "success": True,
        "message": "Settings updated successfully"
    }
    mock.update_system_settings.return_value = {
        "success": True,
        "message": "System settings updated successfully"
    }
    mock.reset_settings.return_value = {
        "success": True,
        "message": "Settings reset to defaults"
    }
    mock.test_settings.return_value = {
        "success": True,
        "message": "Settings test passed"
    }
    mock.health_check.return_value = {
        "status": "healthy",
        "timestamp": "2024-01-20T10:00:00Z",
        "services": {"database": "healthy", "redis": "healthy"},
        "version": "1.0.0"
    }
    
    # Runs methods
    mock.list_scrape_runs.return_value = [
        {
            "id": "run1",
            "job_id": "job1",
            "status": "completed",
            "start_time": "2024-01-15T10:00:00Z",
            "end_time": "2024-01-15T10:30:00Z"
        }
    ]
    mock.get_scrape_run.return_value = {
        "id": "run1",
        "job_id": "job1",
        "status": "completed",
        "start_time": "2024-01-15T10:00:00Z",
        "end_time": "2024-01-15T10:30:00Z",
        "jobs_scraped": 25
    }
    
    return mock


@pytest.fixture
def mock_autoscraper_service_error():
    """Mock autoscraper service that raises errors"""
    mock = AsyncMock()
    
    # Make it an async context manager
    mock.__aenter__ = AsyncMock(return_value=mock)
    mock.__aexit__ = AsyncMock(return_value=None)
    
    # Configure all methods to raise HTTPException
    from fastapi import HTTPException
    error = HTTPException(status_code=503, detail="Service unavailable")
    
    # Dashboard methods
    mock.get_dashboard.side_effect = error
    
    # Job board methods
    mock.list_job_boards.side_effect = error
    mock.get_job_board.side_effect = error
    mock.create_job_board.side_effect = error
    mock.update_job_board.side_effect = error
    mock.delete_job_board.side_effect = error
    
    # Scrape job methods
    mock.list_scrape_jobs.side_effect = error
    mock.start_scrape_job.side_effect = error
    mock.pause_scrape_job.side_effect = error
    mock.get_scrape_job.side_effect = error
    
    # System methods
    mock.hard_reset.side_effect = error
    
    # Health methods
    mock.health_check.side_effect = error
    mock.get_system_health.side_effect = error
    mock.get_performance_metrics.side_effect = error
    
    # Engine methods
    mock.get_engine_state.side_effect = error
    mock.trigger_heartbeat.side_effect = error
    
    # Logs methods
    mock.get_logs.side_effect = error
    mock.get_live_logs.side_effect = error
    
    # Settings methods
    mock.get_settings.side_effect = error
    mock.update_settings.side_effect = error
    mock.update_system_settings.side_effect = error
    mock.reset_settings.side_effect = error
    mock.test_settings.side_effect = error
    
    # Runs methods
    mock.list_scrape_runs.side_effect = error
    mock.get_scrape_run.side_effect = error
    
    return mock


@pytest.fixture
def sample_job_board_data():
    """Sample job board data for testing."""
    return {
        "name": "Test Job Board",
        "description": "A test job board for integration testing",
        "board_type": "html",
        "base_url": "https://example.com/jobs",
        "rss_url": None,
        "selectors": {
            "job_title": ".job-title",
            "company": ".company-name",
            "location": ".job-location"
        },
        "rate_limit_delay": 2,
        "max_pages": 10,
        "request_timeout": 30,
        "retry_attempts": 3,
        "is_active": True
    }


@pytest.fixture
def sample_scrape_job_data():
    """Sample scrape job data for testing."""
    return {
        "job_board_id": 1,
        "priority": "normal",
        "scheduled_at": "2024-01-15T10:00:00Z",
        "config_overrides": {
            "max_pages": 5,
            "delay_between_requests": 2
        }
    }


@pytest.fixture
def auth_headers():
    """Mock authentication headers for testing."""
    return {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json"
    }


@pytest.fixture(autouse=True)
def mock_dependencies():
    """Mock external dependencies for all tests."""
    from app.database.models import User, UserRole
    from app.core.deps import get_current_user
    import uuid
    
    # Create a proper User object
    mock_user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        first_name="Test",
        last_name="User",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True
    )
    
    # Override the dependency in the FastAPI app
    app.dependency_overrides[get_current_user] = lambda: mock_user
    
    yield
    
    # Clean up the override after the test
    app.dependency_overrides.clear()


@pytest.fixture
def mock_redis():
    """Mock Redis connection for testing."""
    with patch('redis.Redis') as mock_redis_class:
        mock_redis_instance = Mock()
        mock_redis_class.return_value = mock_redis_instance
        
        # Mock common Redis operations
        mock_redis_instance.ping.return_value = True
        mock_redis_instance.get.return_value = None
        mock_redis_instance.set.return_value = True
        mock_redis_instance.delete.return_value = 1
        
        yield mock_redis_instance


@pytest.fixture
def mock_database():
    """Mock database session for testing."""
    with patch('app.core.database.get_db') as mock_db:
        mock_session = Mock()
        mock_db.return_value = mock_session
        
        # Mock common database operations
        mock_session.query.return_value.filter.return_value.first.return_value = None
        mock_session.add.return_value = None
        mock_session.commit.return_value = None
        mock_session.rollback.return_value = None
        
        yield mock_session


class TestConfig:
    """Test configuration settings."""
    TESTING = True
    AUTOSCRAPER_SERVICE_URL = "http://localhost:8001"
    AUTOSCRAPER_SERVICE_TIMEOUT = 5
    DATABASE_URL = "sqlite:///test.db"
    REDIS_URL = "redis://localhost:6379/1"


@pytest.fixture
def test_config():
    """Test configuration fixture."""
    return TestConfig()