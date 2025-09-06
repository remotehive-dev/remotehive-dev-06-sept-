#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from app.main import app

def test_mock_issue():
    """Debug the mock issue"""
    
    # Mock authentication
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
    
    # Create mock similar to conftest.py
    mock = Mock()
    
    # Make it an async context manager
    async def mock_aenter(self):
        return mock
    async def mock_aexit(self, exc_type, exc_val, exc_tb):
        return None
    mock.__aenter__ = mock_aenter
    mock.__aexit__ = mock_aexit
    
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
    
    print(f"Mock type: {type(mock)}")
    print(f"Mock get_dashboard type: {type(mock.get_dashboard)}")
    print(f"Mock get_dashboard: {mock.get_dashboard}")
    
    # Test the mock
    client = TestClient(app)
    auth_headers = {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json"
    }
    
    with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock):
        response = client.get("/api/v1/autoscraper/dashboard", headers=auth_headers)
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.content}")
        if response.status_code != 200:
            print(f"Response text: {response.text}")

if __name__ == "__main__":
    test_mock_issue()