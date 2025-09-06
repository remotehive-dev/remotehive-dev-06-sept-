"""Comprehensive API Integration Tests for RemoteHive

This module tests all API components including versioning, validation,
documentation, security, and standardized schemas.
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from fastapi import FastAPI, Request, Response
from unittest.mock import Mock, patch
from datetime import datetime
import json

from app.api.integration import APIIntegration, setup_enhanced_api
from app.schemas.base import APIVersion, ResponseStatus
from app.schemas.requests import SearchRequest, BulkOperationRequest
from app.schemas.responses import BaseResponse, ListResponse, HealthCheckResponse
from app.schemas.errors import ErrorCategory, ErrorSeverity
from app.api.versioning import VersionRegistry, VersionExtractor
from app.middleware.validation import ValidationConfig
from app.middleware.enhanced_middleware import EnhancedMiddleware


class TestAPIIntegration:
    """Test suite for API integration components"""
    
    @pytest.fixture
    def app(self):
        """Create test FastAPI application"""
        app = FastAPI(title="Test RemoteHive API", version="1.0.0")
        return app
        
    @pytest.fixture
    def integration(self, app):
        """Create API integration instance"""
        return APIIntegration(app)
        
    @pytest.fixture
    def client(self, app):
        """Create test client"""
        integration = setup_enhanced_api(app)
        return TestClient(app)
        
    def test_api_integration_initialization(self, integration):
        """Test API integration initialization"""
        assert integration.version_registry is not None
        assert integration.api_docs is not None
        assert integration.validation_config is not None
        assert integration.error_factory is not None
        assert integration.security_validator is not None
        
    def test_complete_integration_setup(self, integration):
        """Test complete integration setup"""
        integration.setup_complete_integration()
        
        # Verify all components are configured
        assert len(integration.version_registry.get_supported_versions()) > 0
        assert integration.validation_config.max_request_size > 0
        
    def test_api_versioning_setup(self, integration):
        """Test API versioning configuration"""
        integration._setup_versioning()
        
        supported_versions = integration.version_registry.get_supported_versions()
        assert APIVersion.V1 in supported_versions
        assert APIVersion.V2 in supported_versions
        
    def test_validation_setup(self, integration):
        """Test validation system setup"""
        integration._setup_validation()
        
        # Test validation configuration
        config = integration.validation_config
        assert config.max_request_size > 0
        assert len(config.suspicious_patterns) > 0
        assert len(config.allowed_content_types) > 0
        
    def test_documentation_setup(self, integration):
        """Test documentation system setup"""
        integration._setup_documentation()
        
        # Verify documentation routes are added
        routes = [route.path for route in integration.app.routes]
        assert "/api/schema" in routes
        assert "/api/health/detailed" in routes
        
    def test_error_handling_setup(self, integration):
        """Test error handling configuration"""
        integration._setup_error_handling()
        
        # Verify exception handlers are registered
        assert len(integration.app.exception_handlers) > 0
        
    def test_security_setup(self, integration):
        """Test security system setup"""
        integration._setup_security()
        
        # Test security validator
        validator = integration.security_validator
        assert hasattr(validator, 'validate_request_security')
        
    def test_monitoring_setup(self, integration):
        """Test monitoring system setup"""
        integration._setup_monitoring()
        
        # Verify metrics endpoint is added
        routes = [route.path for route in integration.app.routes]
        assert "/api/metrics" in routes


class TestAPIVersioning:
    """Test suite for API versioning functionality"""
    
    def test_version_registry(self):
        """Test version registry functionality"""
        registry = VersionRegistry()
        
        # Test version registration
        registry.register_version(
            APIVersion.V1,
            release_date=datetime(2024, 1, 1),
            documentation_url="/docs/v1"
        )
        
        assert APIVersion.V1 in registry.get_supported_versions()
        version_info = registry.get_version_info(APIVersion.V1)
        assert version_info.version == APIVersion.V1
        assert version_info.documentation_url == "/docs/v1"
        
    def test_version_extractor(self):
        """Test version extraction from requests"""
        extractor = VersionExtractor()
        
        # Mock request with version header
        request = Mock()
        request.headers = {"X-API-Version": "v2"}
        request.url.path = "/api/v1/test"
        request.query_params = {}
        
        version = extractor.extract_version(request)
        assert version == APIVersion.V2
        
    def test_version_compatibility(self):
        """Test version compatibility checking"""
        registry = VersionRegistry()
        
        # Test compatibility between versions
        assert registry.is_compatible(APIVersion.V1, APIVersion.V2)
        
    def test_version_headers(self, client):
        """Test version headers in responses"""
        response = client.get("/api/health/detailed")
        
        assert "X-API-Version" in response.headers
        assert "X-API-Supported-Versions" in response.headers


class TestAPIValidation:
    """Test suite for API validation functionality"""
    
    def test_validation_config(self):
        """Test validation configuration"""
        config = ValidationConfig()
        
        assert config.max_request_size > 0
        assert config.max_json_depth > 0
        assert len(config.suspicious_patterns) > 0
        assert len(config.allowed_content_types) > 0
        
    def test_security_validation(self):
        """Test security validation patterns"""
        config = ValidationConfig()
        
        # Test XSS detection
        xss_payload = "<script>alert('xss')</script>"
        assert any(pattern in xss_payload.lower() for pattern in config.suspicious_patterns)
        
        # Test SQL injection detection
        sql_payload = "'; DROP TABLE users; --"
        assert any(pattern in sql_payload.lower() for pattern in config.suspicious_patterns)
        
    def test_request_size_validation(self, client):
        """Test request size validation"""
        # Test oversized request
        large_data = {"data": "x" * 10000000}  # 10MB
        response = client.post("/api/test", json=large_data)
        
        # Should be rejected due to size
        assert response.status_code == 413
        
    def test_content_type_validation(self, client):
        """Test content type validation"""
        # Test invalid content type
        response = client.post(
            "/api/test",
            data="invalid data",
            headers={"Content-Type": "application/xml"}
        )
        
        # Should be rejected due to content type
        assert response.status_code == 415
        
    def test_json_depth_validation(self, client):
        """Test JSON nesting depth validation"""
        # Create deeply nested JSON
        deep_json = {"level1": {"level2": {"level3": {"level4": {"level5": {}}}}}}
        
        response = client.post("/api/test", json=deep_json)
        
        # Should pass for reasonable depth
        assert response.status_code != 400 or "depth" not in response.text


class TestAPIDocumentation:
    """Test suite for API documentation functionality"""
    
    def test_openapi_schema_generation(self, client):
        """Test OpenAPI schema generation"""
        response = client.get("/api/schema")
        
        assert response.status_code == 200
        schema = response.json()
        
        assert "openapi" in schema
        assert "validation_rules" in schema
        assert "supported_versions" in schema
        assert "error_codes" in schema
        
    def test_documentation_routes(self, client):
        """Test documentation route accessibility"""
        # Test Swagger UI
        response = client.get("/docs")
        assert response.status_code == 200
        
        # Test ReDoc
        response = client.get("/redoc")
        assert response.status_code == 200
        
    def test_api_metadata(self, client):
        """Test API metadata in responses"""
        response = client.get("/api/health/detailed")
        
        assert "X-API-Documentation" in response.headers
        assert "X-API-Version" in response.headers


class TestAPIErrorHandling:
    """Test suite for API error handling"""
    
    def test_http_exception_handling(self, client):
        """Test HTTP exception handling"""
        # Test 404 error
        response = client.get("/api/nonexistent")
        
        assert response.status_code == 404
        error_data = response.json()
        
        assert "error" in error_data
        assert "message" in error_data
        assert "request_id" in error_data
        
    def test_validation_exception_handling(self, client):
        """Test validation exception handling"""
        # Test invalid JSON
        response = client.post(
            "/api/test",
            data="{invalid json}",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422
        error_data = response.json()
        
        assert "error" in error_data
        assert "validation_errors" in error_data
        
    def test_security_exception_handling(self, client):
        """Test security exception handling"""
        # Test XSS attempt
        xss_data = {"content": "<script>alert('xss')</script>"}
        response = client.post("/api/test", json=xss_data)
        
        # Should be blocked by security middleware
        assert response.status_code == 400
        
    def test_error_response_format(self, client):
        """Test standardized error response format"""
        response = client.get("/api/nonexistent")
        
        error_data = response.json()
        
        # Verify standard error format
        required_fields = ["error", "message", "timestamp", "request_id"]
        for field in required_fields:
            assert field in error_data


class TestAPIHealthCheck:
    """Test suite for API health check functionality"""
    
    def test_basic_health_check(self, client):
        """Test basic health check endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        health_data = response.json()
        
        assert "status" in health_data
        assert health_data["status"] in ["healthy", "unhealthy"]
        
    def test_detailed_health_check(self, client):
        """Test detailed health check endpoint"""
        response = client.get("/api/health/detailed")
        
        assert response.status_code == 200
        health_data = response.json()
        
        required_fields = ["status", "timestamp", "components", "uptime", "version"]
        for field in required_fields:
            assert field in health_data
            
        # Test component health checks
        components = health_data["components"]
        expected_components = ["database", "redis", "external_apis", "validation", "versioning"]
        for component in expected_components:
            assert component in components
            assert "status" in components[component]


class TestAPIMetrics:
    """Test suite for API metrics functionality"""
    
    def test_metrics_endpoint(self, client):
        """Test metrics endpoint"""
        response = client.get("/api/metrics")
        
        assert response.status_code == 200
        metrics_data = response.json()
        
        assert "metrics" in metrics_data
        assert "timestamp" in metrics_data
        assert "time_range" in metrics_data
        
    def test_metrics_content(self, client):
        """Test metrics content"""
        response = client.get("/api/metrics")
        metrics_data = response.json()
        
        metrics = metrics_data["metrics"]
        expected_metrics = [
            "total_requests", "average_response_time", "error_rate",
            "active_connections", "memory_usage", "cpu_usage"
        ]
        
        for metric in expected_metrics:
            assert metric in metrics
            assert isinstance(metrics[metric], (int, float))


class TestAPISecurityHeaders:
    """Test suite for API security headers"""
    
    def test_security_headers_present(self, client):
        """Test that security headers are present in responses"""
        response = client.get("/api/health/detailed")
        
        security_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Strict-Transport-Security",
            "Content-Security-Policy",
            "Referrer-Policy"
        ]
        
        for header in security_headers:
            assert header in response.headers
            
    def test_security_header_values(self, client):
        """Test security header values"""
        response = client.get("/api/health/detailed")
        
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-Frame-Options"] == "DENY"
        assert "max-age=31536000" in response.headers["Strict-Transport-Security"]


class TestAPIPerformance:
    """Test suite for API performance"""
    
    def test_response_time(self, client):
        """Test API response time"""
        import time
        
        start_time = time.time()
        response = client.get("/api/health/detailed")
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        assert response.status_code == 200
        assert response_time < 1000  # Should respond within 1 second
        
    def test_concurrent_requests(self, client):
        """Test handling of concurrent requests"""
        import concurrent.futures
        import threading
        
        def make_request():
            return client.get("/api/health/detailed")
            
        # Make 10 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            responses = [future.result() for future in futures]
            
        # All requests should succeed
        for response in responses:
            assert response.status_code == 200


# Integration test fixtures and utilities
@pytest.fixture
def mock_database():
    """Mock database for testing"""
    with patch('app.database.get_db') as mock_db:
        yield mock_db
        
@pytest.fixture
def mock_redis():
    """Mock Redis for testing"""
    with patch('app.core.redis.get_redis') as mock_redis:
        yield mock_redis
        
@pytest.fixture
def mock_external_apis():
    """Mock external APIs for testing"""
    with patch('app.services.external.ExternalAPIClient') as mock_client:
        yield mock_client


if __name__ == "__main__":
    pytest.main([__file__, "-v"])