#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from tests.test_autoscraper_integration import TestAutoscraperDashboardIntegration
    from tests.conftest import mock_autoscraper_service, auth_headers, client
    from fastapi.testclient import TestClient
    from app.main import app
    from unittest.mock import patch
    
    print("All imports successful")
    
    # Create test client
    test_client = TestClient(app)
    
    # Create mock service
    import pytest
    from unittest.mock import Mock
    
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
                "success_rate": 92.5
            },
            "recent_activity": [{"test": "data"}, {"test2": "data2"}],
            "engine_status": {
                "status": "running",
                "active_jobs": 2
            }
        }
    mock.get_dashboard = mock_get_dashboard
    
    # Create test instance
    test_instance = TestAutoscraperDashboardIntegration()
    
    # Mock auth headers
    headers = {"Authorization": "Bearer test-token"}
    
    print("About to call test method...")
    
    # Try to call the test method directly
    result = test_instance.test_get_dashboard_stats_success(test_client, mock, headers)
    print(f"Test result: {result}")
    
except Exception as e:
    import traceback
    print(f"Error occurred: {e}")
    print(f"Error type: {type(e)}")
    print("Full traceback:")
    traceback.print_exc()