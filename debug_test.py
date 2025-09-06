#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database.models import User, UserRole
from app.core.deps import get_current_user
from unittest.mock import Mock, patch
import uuid

# Create a mock user
mock_user = User(
    id=uuid.uuid4(),
    email="test@example.com",
    first_name="Test",
    last_name="User",
    role=UserRole.ADMIN,
    is_active=True,
    is_verified=True
)

# Create mock autoscraper service
mock_service = Mock()
async def mock_aenter(self):
    return mock_service
async def mock_aexit(self, exc_type, exc_val, exc_tb):
    return None
mock_service.__aenter__ = mock_aenter
mock_service.__aexit__ = mock_aexit
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
mock_service.get_dashboard = mock_get_dashboard

# Override the dependency
app.dependency_overrides[get_current_user] = lambda: mock_user

# Create test client
client = TestClient(app)

# Test the endpoint with mocked service
try:
    with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_service):
        response = client.get("/api/v1/autoscraper/dashboard")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
    import traceback
    traceback.print_exc()

# Clean up
app.dependency_overrides.clear()