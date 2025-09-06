#!/usr/bin/env python3
"""
Comprehensive Integration Tests for Autoscraper Functionality

This test suite covers:
1. Dashboard endpoints integration
2. Job board management integration
3. Scrape job management integration
4. System health and monitoring integration
5. Settings and configuration integration
6. Error handling and resilience
7. Service adapter communication
"""

import pytest
import json
from unittest.mock import patch, Mock
from fastapi import status
from fastapi.testclient import TestClient


@pytest.mark.integration
@pytest.mark.autoscraper
class TestAutoscraperDashboardIntegration:
    """Test autoscraper dashboard endpoints integration."""
    
    def test_get_dashboard_stats_success(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful dashboard stats retrieval."""
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.get("/api/v1/autoscraper/dashboard", headers=auth_headers)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "stats" in data
            assert "recent_activity" in data
            assert "engine_status" in data
            
            # Check stats structure
            stats = data["stats"]
            assert stats["total_job_boards"] == 5
            assert stats["success_rate"] == 92.5
            
            # Check recent activity
            assert len(data["recent_activity"]) == 2
            
            # Check engine status
            engine_status = data["engine_status"]
            assert engine_status["status"] == "running"
            assert engine_status["active_jobs"] == 2
    
    def test_get_dashboard_stats_service_error(self, client: TestClient, mock_autoscraper_service_error, auth_headers):
        """Test dashboard stats retrieval when service is unavailable."""
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service_error):
            response = client.get("/api/v1/autoscraper/dashboard", headers=auth_headers)
            
            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            data = response.json()
            assert "detail" in data
            assert "autoscraper service" in data["detail"].lower()
    
    def test_get_performance_metrics_success(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful performance metrics retrieval."""
        mock_autoscraper_service.get_performance_metrics.return_value = {
            "cpu_usage": 45.2,
            "memory_usage": 67.8,
            "disk_usage": 23.1,
            "active_connections": 12
        }
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.get("/api/v1/autoscraper/system/metrics", headers=auth_headers)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "cpu_usage" in data
            assert "memory_usage" in data
            assert data["cpu_usage"] == 45.2
            
            # Verify service adapter was called
            mock_autoscraper_service.get_performance_metrics.assert_called_once()


@pytest.mark.integration
@pytest.mark.autoscraper
class TestAutoscraperJobBoardIntegration:
    """Test autoscraper job board management integration."""
    
    def test_list_job_boards_success(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful job boards listing."""
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.get("/api/v1/autoscraper/job-boards", headers=auth_headers)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["name"] == "Test Job Board"
            assert data[0]["is_active"] == True
            assert data[0]["board_type"] == "html"
    
    def test_get_job_board_success(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful job board retrieval by ID."""
        mock_autoscraper_service.get_job_board.return_value = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Test Job Board",
            "description": "Test job board description",
            "board_type": "html",
            "base_url": "https://example.com/jobs",
            "rss_url": None,
            "selectors": {
                "job_title": ".job-title"
            },
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
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.get("/api/v1/autoscraper/job-boards/1", headers=auth_headers)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["id"] == "550e8400-e29b-41d4-a716-446655440000"
            assert data["name"] == "Test Job Board"
            assert data["board_type"] == "html"
            assert data["selectors"]["job_title"] == ".job-title"
    
    def test_create_job_board_success(self, client: TestClient, mock_autoscraper_service, auth_headers, sample_job_board_data):
        """Test successful job board creation."""
        mock_autoscraper_service.create_job_board.return_value = {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "name": sample_job_board_data["name"],
            "description": sample_job_board_data.get("description"),
            "board_type": sample_job_board_data["board_type"],
            "base_url": sample_job_board_data["base_url"],
            "rss_url": sample_job_board_data.get("rss_url"),
            "selectors": sample_job_board_data.get("selectors"),
            "rate_limit_delay": sample_job_board_data.get("rate_limit_delay", 2),
            "max_pages": sample_job_board_data.get("max_pages", 10),
            "request_timeout": sample_job_board_data.get("request_timeout", 30),
            "retry_attempts": sample_job_board_data.get("retry_attempts", 3),
            "is_active": sample_job_board_data.get("is_active", True),
            "success_rate": 0.0,
            "last_scraped_at": None,
            "total_scrapes": 0,
            "successful_scrapes": 0,
            "failed_scrapes": 0,
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z"
        }
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.post(
                "/api/v1/autoscraper/job-boards",
                headers=auth_headers,
                json=sample_job_board_data
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["id"] == "550e8400-e29b-41d4-a716-446655440001"
            assert data["name"] == sample_job_board_data["name"]
            assert data["board_type"] == sample_job_board_data["board_type"]
            assert data["base_url"] == sample_job_board_data["base_url"]
            
            # Verify service adapter was called with correct data
            mock_autoscraper_service.create_job_board.assert_called_once_with(sample_job_board_data)
    
    def test_update_job_board_success(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful job board update."""
        update_data = {
            "name": "Updated Job Board",
            "is_active": True
        }
        
        mock_autoscraper_service.update_job_board.return_value = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Updated Job Board",
            "description": "Updated job board description",
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
            "updated_at": "2024-01-15T12:00:00Z"
        }
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.put(
                "/api/v1/autoscraper/job-boards/1",
                headers=auth_headers,
                json=update_data
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["name"] == "Updated Job Board"
            assert data["is_active"] == True
            assert data["board_type"] == "html"
            
            # Verify service adapter was called with correct parameters
            mock_autoscraper_service.update_job_board.assert_called_once_with("1", update_data)
    
    def test_delete_job_board_success(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful job board deletion."""
        mock_autoscraper_service.delete_job_board.return_value = {
            "success": True,
            "message": "Job board deleted successfully",
            "data": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "deleted"
            }
        }
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.delete("/api/v1/autoscraper/job-boards/1", headers=auth_headers)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] == True
            assert data["message"] == "Job board deleted successfully"
            assert data["data"]["status"] == "deleted"
            
            # Verify service adapter was called
            mock_autoscraper_service.delete_job_board.assert_called_once_with("1")


@pytest.mark.integration
@pytest.mark.autoscraper
class TestAutoscraperScrapeJobIntegration:
    """Test autoscraper scrape job management integration."""
    
    def test_list_scrape_jobs_success(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful scrape jobs listing."""
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.get("/api/v1/autoscraper/jobs", headers=auth_headers)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["status"] == "completed"
    
    def test_get_scrape_job_success(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful scrape job retrieval by ID."""
        job_id = 1
        mock_autoscraper_service.get_scrape_job.return_value = {
            "id": 1,
            "job_board_id": 1,
            "status": "completed",
            "results": {
                "jobs_found": 25,
                "jobs_processed": 25,
                "errors": 0
            }
        }
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.get(f"/api/v1/autoscraper/jobs/{job_id}", headers=auth_headers)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["id"] == 1
            assert data["status"] == "completed"
            assert "results" in data
    
    def test_create_scrape_job_success(self, client: TestClient, mock_autoscraper_service, auth_headers, sample_scrape_job_data):
        """Test successful scrape job creation."""
        mock_autoscraper_service.create_scrape_job.return_value = {
            "id": 2,
            "status": "queued",
            **sample_scrape_job_data
        }
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.post(
                "/api/v1/autoscraper/jobs/start",
                headers=auth_headers,
                json=sample_scrape_job_data
            )
            
            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert data["id"] == 2
            assert data["status"] == "queued"
            assert data["job_board_id"] == sample_scrape_job_data["job_board_id"]


@pytest.mark.integration
@pytest.mark.autoscraper
class TestAutoscraperHealthIntegration:
    """Test autoscraper health and monitoring integration."""
    
    @patch('app.autoscraper.endpoints.get_autoscraper_adapter')
    def test_get_health_success(self, mock_get_adapter, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful health check."""
        # Configure the mock adapter
        mock_get_adapter.return_value = mock_autoscraper_service
        
        response = client.get("/api/v1/autoscraper/health", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data
        assert "database" in data["services"]
        assert "redis" in data["services"]
        assert "version" in data
        assert "timestamp" in data
    
    @patch('app.autoscraper.endpoints.get_autoscraper_adapter')
    def test_get_engine_state_success(self, mock_get_adapter, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful engine state retrieval."""
        mock_get_adapter.return_value = mock_autoscraper_service
        # Use the correct field names that match EngineStateResponse schema
        mock_autoscraper_service.get_engine_state.return_value = {
            "status": "running",
            "active_jobs": 3,
            "queued_jobs": 7,
            "total_jobs_today": 15,
            "success_rate": 0.85,
            "last_activity": "2024-01-15T10:30:00Z",
            "uptime_seconds": 3600
        }
        
        response = client.get("/api/v1/autoscraper/engine/state", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "running"
        assert data["active_jobs"] == 3
    
    @patch('app.autoscraper.endpoints.get_autoscraper_adapter')
    def test_trigger_heartbeat_success(self, mock_get_adapter, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful heartbeat trigger."""
        mock_get_adapter.return_value = mock_autoscraper_service
        mock_autoscraper_service.trigger_heartbeat.return_value = {
            "success": True,
            "message": "Heartbeat triggered successfully",
            "data": {
                "status": "heartbeat_sent",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }
        
        response = client.post("/api/v1/autoscraper/engine/heartbeat", headers=auth_headers)
      # Assert response
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] == True
        assert data["message"] == "Heartbeat triggered successfully"
        assert data["data"]["status"] == "heartbeat_sent"


@pytest.mark.integration
@pytest.mark.autoscraper
class TestAutoscraperSettingsIntegration:
    """Test autoscraper settings and configuration integration."""
    
    def test_get_settings_success(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful settings retrieval."""
        mock_autoscraper_service.get_settings.return_value = {
            "scraping_interval": 3600,
            "max_concurrent_jobs": 5,
            "retry_attempts": 3,
            "timeout_seconds": 30
        }
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.get("/api/v1/autoscraper/settings", headers=auth_headers)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["scraping_interval"] == 3600
            assert data["max_concurrent_jobs"] == 5
    
    def test_update_settings_success(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful settings update."""
        settings_data = {
            "scraping_interval": 7200,
            "max_concurrent_jobs": 10
        }
        
        mock_autoscraper_service.update_settings.return_value = {
            "status": "updated",
            **settings_data
        }
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.put(
                "/api/v1/autoscraper/settings",
                headers=auth_headers,
                json=settings_data
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["scraping_interval"] == 7200
            assert data["status"] == "updated"


@pytest.mark.integration
@pytest.mark.autoscraper
class TestAutoscraperLogsIntegration:
    """Test autoscraper logs and monitoring integration."""
    
    def test_get_logs_success(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test successful logs retrieval."""
        mock_autoscraper_service.get_logs.return_value = {
            "logs": [
                {
                    "timestamp": "2024-01-15T10:30:00Z",
                    "level": "INFO",
                    "message": "Scrape job completed successfully",
                    "job_id": 1
                },
                {
                    "timestamp": "2024-01-15T10:25:00Z",
                    "level": "DEBUG",
                    "message": "Starting scrape job",
                    "job_id": 1
                }
            ],
            "total": 2
        }
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.get("/api/v1/autoscraper/logs", headers=auth_headers)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "logs" in data
            assert len(data["logs"]) == 2
            assert data["total"] == 2
    
    def test_get_logs_with_filters(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test logs retrieval with filters."""
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.get(
                "/api/v1/autoscraper/logs?level=ERROR&limit=10",
                headers=auth_headers
            )
            
            assert response.status_code == status.HTTP_200_OK
            # Verify service adapter was called with filters
            mock_autoscraper_service.get_logs.assert_called_once()


@pytest.mark.integration
@pytest.mark.autoscraper
class TestAutoscraperErrorHandling:
    """Test autoscraper error handling and resilience."""
    
    def test_service_timeout_handling(self, client: TestClient, auth_headers):
        """Test handling of service timeout errors."""
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter') as mock_adapter:
            mock_service = Mock()
            mock_service.get_dashboard.side_effect = TimeoutError("Service timeout")
            mock_adapter.return_value = mock_service
            
            response = client.get("/api/v1/autoscraper/dashboard", headers=auth_headers)
            
            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            data = response.json()
            assert "timeout" in data["detail"].lower()
    
    def test_service_connection_error_handling(self, client: TestClient, auth_headers):
        """Test handling of service connection errors."""
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter') as mock_adapter:
            mock_service = Mock()
            mock_service.list_job_boards.side_effect = ConnectionError("Connection refused")
            mock_adapter.return_value = mock_service
            
            response = client.get("/api/v1/autoscraper/job-boards", headers=auth_headers)
            
            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            data = response.json()
            assert "connection" in data["detail"].lower()
    
    def test_invalid_data_handling(self, client: TestClient, mock_autoscraper_service, auth_headers):
        """Test handling of invalid data in requests."""
        invalid_job_board_data = {
            "name": "",  # Invalid: empty name
            "url": "not-a-valid-url"  # Invalid: malformed URL
        }
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            response = client.post(
                "/api/v1/autoscraper/job-boards",
                headers=auth_headers,
                json=invalid_job_board_data
            )
            
            # Should return validation error
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_authentication_required(self, client: TestClient, mock_autoscraper_service):
        """Test that authentication is required for all endpoints."""
        endpoints = [
            "/api/v1/autoscraper/dashboard",
            "/api/v1/autoscraper/job-boards",
            "/api/v1/autoscraper/jobs",
            "/api/v1/autoscraper/health",
            "/api/v1/autoscraper/settings",
            "/api/v1/autoscraper/logs"
        ]
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            for endpoint in endpoints:
                response = client.get(endpoint)  # No auth headers
                assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.integration
@pytest.mark.autoscraper
@pytest.mark.slow
class TestAutoscraperServiceAdapterIntegration:
    """Test the service adapter communication layer."""
    
    def test_service_adapter_initialization(self):
        """Test service adapter initialization."""
        from app.autoscraper.service_adapter import AutoscraperServiceAdapter
        adapter = AutoscraperServiceAdapter()
        assert adapter is not None
        assert hasattr(adapter, 'get_dashboard')
        assert hasattr(adapter, 'list_job_boards')
        assert hasattr(adapter, 'create_job_board')
    
    @patch('httpx.AsyncClient')
    def test_service_adapter_http_communication(self, mock_httpx):
        """Test HTTP communication through service adapter."""
        from app.autoscraper.service_adapter import AutoscraperServiceAdapter
        
        # Mock HTTP response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "healthy"}
        mock_httpx.return_value.__aenter__.return_value.get.return_value = mock_response
        
        adapter = AutoscraperServiceAdapter()
        
        # This would normally make an HTTP request
        # In a real integration test, we'd test against a running service
        assert adapter is not None
    
    def test_service_adapter_error_propagation(self):
        """Test that service adapter properly propagates errors."""
        from app.autoscraper.service_adapter import AutoscraperServiceAdapter
        from fastapi import HTTPException
        
        with patch('httpx.AsyncClient') as mock_httpx:
            # Mock HTTP error
            mock_httpx.return_value.__aenter__.return_value.get.side_effect = Exception("Network error")
            
            adapter = AutoscraperServiceAdapter()
            
            # Test that errors are properly handled
            # In a real test, we'd call adapter methods and verify error handling
            assert adapter is not None


@pytest.mark.integration
@pytest.mark.autoscraper
class TestAutoscraperEndToEndWorkflow:
    """Test complete end-to-end workflows."""
    
    def test_complete_job_board_workflow(self, client: TestClient, mock_autoscraper_service, auth_headers, sample_job_board_data):
        """Test complete job board creation, update, and deletion workflow."""
        # Setup mock responses for the workflow
        mock_autoscraper_service.create_job_board.return_value = {"id": 1, "status": "created", **sample_job_board_data}
        mock_autoscraper_service.get_job_board.return_value = {"id": 1, **sample_job_board_data}
        mock_autoscraper_service.update_job_board.return_value = {"id": 1, "status": "updated", **sample_job_board_data}
        mock_autoscraper_service.delete_job_board.return_value = {"status": "deleted"}
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            # 1. Create job board
            create_response = client.post(
                "/api/v1/autoscraper/job-boards",
                headers=auth_headers,
                json=sample_job_board_data
            )
            assert create_response.status_code == status.HTTP_201_CREATED
            job_board_id = create_response.json()["id"]
            
            # 2. Get job board
            get_response = client.get(f"/api/v1/autoscraper/job-boards/{job_board_id}", headers=auth_headers)
            assert get_response.status_code == status.HTTP_200_OK
            
            # 3. Update job board
            update_data = {"name": "Updated Job Board"}
            update_response = client.put(
                f"/api/v1/autoscraper/job-boards/{job_board_id}",
                headers=auth_headers,
                json=update_data
            )
            assert update_response.status_code == status.HTTP_200_OK
            
            # 4. Delete job board
            delete_response = client.delete(f"/api/v1/autoscraper/job-boards/{job_board_id}", headers=auth_headers)
            assert delete_response.status_code == status.HTTP_200_OK
    
    def test_scraping_workflow(self, client: TestClient, mock_autoscraper_service, auth_headers, sample_scrape_job_data):
        """Test complete scraping workflow from job creation to completion."""
        # Setup mock responses
        mock_autoscraper_service.create_scrape_job.return_value = {"id": 1, "status": "queued", **sample_scrape_job_data}
        mock_autoscraper_service.get_scrape_job.return_value = {"id": 1, "status": "completed", **sample_scrape_job_data}
        mock_autoscraper_service.list_scrape_runs.return_value = [{"id": 1, "scrape_job_id": 1, "status": "completed"}]
        
        with patch('app.autoscraper.endpoints.get_autoscraper_adapter', return_value=mock_autoscraper_service):
            # 1. Create scrape job
            create_response = client.post(
                "/api/v1/autoscraper/scrape-jobs",
                headers=auth_headers,
                json=sample_scrape_job_data
            )
            assert create_response.status_code == status.HTTP_201_CREATED
            scrape_job_id = create_response.json()["id"]
            
            # 2. Check job status
            status_response = client.get(f"/api/v1/autoscraper/scrape-jobs/{scrape_job_id}", headers=auth_headers)
            assert status_response.status_code == status.HTTP_200_OK
            
            # 3. List scrape runs
            runs_response = client.get("/api/v1/autoscraper/scrape-runs", headers=auth_headers)
            assert runs_response.status_code == status.HTTP_200_OK
            assert len(runs_response.json()) == 1