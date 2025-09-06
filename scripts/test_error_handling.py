#!/usr/bin/env python3
"""
Test script for error handling and logging infrastructure.
Validates logging configuration, error middleware, monitoring systems, and exception handling.
"""

import sys
import os
import asyncio
import traceback
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def test_logging_infrastructure():
    """Test logging infrastructure setup"""
    print("\n=== Testing Logging Infrastructure ===")
    
    try:
        from app.core.logging import setup_logging, get_logger, StructuredLogger, PerformanceLogger
        
        # Test setup
        setup_logging()
        print("✓ Logging setup successful")
        
        # Test logger creation
        logger = get_logger("test")
        print("✓ Logger creation successful")
        
        # Test structured logger
        structured_logger = StructuredLogger("test_structured")
        structured_logger.info("Test message", extra={"test_key": "test_value"})
        print("✓ Structured logging successful")
        
        # Test performance logger
        perf_logger = PerformanceLogger(structured_logger)
        with perf_logger.time_operation("test_operation"):
            pass
        print("✓ Performance logging successful")
        
        return True
        
    except Exception as e:
        print(f"✗ Logging infrastructure test failed: {e}")
        traceback.print_exc()
        return False

def test_error_middleware():
    """Test error handling middleware"""
    print("\n=== Testing Error Middleware ===")
    
    try:
        from app.middleware.error_handler import (
            ErrorHandlingMiddleware, 
            HealthCheckMiddleware,
            ErrorResponse
        )
        
        # Test error response model
        error_response = ErrorResponse(
            error="test_error",
            message="Test error message",
            status_code=400
        )
        print("✓ ErrorResponse model creation successful")
        
        # Test middleware classes exist
        assert ErrorHandlingMiddleware is not None
        assert HealthCheckMiddleware is not None
        print("✓ Middleware classes available")
        
        return True
        
    except Exception as e:
        print(f"✗ Error middleware test failed: {e}")
        traceback.print_exc()
        return False

def test_monitoring_system():
    """Test monitoring system"""
    print("\n=== Testing Monitoring System ===")
    
    try:
        from app.core.monitoring import (
            MetricsCollector,
            SystemMonitor, 
            HealthChecker,
            ApplicationMonitor,
            app_monitor
        )
        
        # Test metrics collector
        metrics = MetricsCollector()
        metrics.increment_counter("test_counter")
        metrics.set_gauge("test_gauge", 42.0)
        metrics.record_histogram("test_histogram", 1.5)
        print("✓ MetricsCollector operations successful")
        
        # Test system monitor
        system_monitor = SystemMonitor()
        system_metrics = system_monitor.get_system_metrics()
        assert "cpu_percent" in system_metrics
        assert "memory_percent" in system_metrics
        print("✓ SystemMonitor metrics collection successful")
        
        # Test health checker
        health_checker = HealthChecker()
        health_status = health_checker.run_all_checks()
        assert "healthy" in health_status
        print("✓ HealthChecker operations successful")
        
        # Test application monitor
        assert app_monitor is not None
        print("✓ ApplicationMonitor instance available")
        
        return True
        
    except Exception as e:
        print(f"✗ Monitoring system test failed: {e}")
        traceback.print_exc()
        return False

def test_custom_exceptions():
    """Test custom exception classes"""
    print("\n=== Testing Custom Exceptions ===")
    
    try:
        from app.core.exceptions import (
            RemoteHiveException,
            AuthenticationError,
            AuthorizationError,
            DatabaseError,
            ValidationError,
            BusinessLogicError,
            ExternalServiceError,
            RateLimitError,
            ConfigurationError,
            FileOperationError,
            ScrapingError,
            TaskError
        )
        
        # Test base exception
        base_exc = RemoteHiveException("Test base exception")
        assert str(base_exc) == "Test base exception"
        print("✓ RemoteHiveException creation successful")
        
        # Test specific exceptions
        auth_exc = AuthenticationError("Auth failed")
        db_exc = DatabaseError("DB error")
        val_exc = ValidationError("Validation failed")
        
        assert isinstance(auth_exc, RemoteHiveException)
        assert isinstance(db_exc, RemoteHiveException)
        assert isinstance(val_exc, RemoteHiveException)
        print("✓ Custom exception inheritance successful")
        
        return True
        
    except Exception as e:
        print(f"✗ Custom exceptions test failed: {e}")
        traceback.print_exc()
        return False

async def test_async_monitoring():
    """Test async monitoring operations"""
    print("\n=== Testing Async Monitoring ===")
    
    try:
        from app.core.monitoring import app_monitor
        
        # Test start/stop operations
        await app_monitor.start()
        print("✓ ApplicationMonitor start successful")
        
        # Test monitoring data retrieval
        monitoring_data = app_monitor.get_monitoring_data()
        assert "metrics" in monitoring_data
        assert "system" in monitoring_data
        assert "health" in monitoring_data
        print("✓ Monitoring data retrieval successful")
        
        await app_monitor.stop()
        print("✓ ApplicationMonitor stop successful")
        
        return True
        
    except Exception as e:
        print(f"✗ Async monitoring test failed: {e}")
        traceback.print_exc()
        return False

def test_file_structure():
    """Test that all required files exist"""
    print("\n=== Testing File Structure ===")
    
    required_files = [
        "app/core/logging.py",
        "app/core/monitoring.py", 
        "app/core/exceptions.py",
        "app/middleware/error_handler.py"
    ]
    
    all_exist = True
    for file_path in required_files:
        full_path = project_root / file_path
        if full_path.exists():
            print(f"✓ {file_path} exists")
        else:
            print(f"✗ {file_path} missing")
            all_exist = False
    
    return all_exist

async def main():
    """Run all tests"""
    print("RemoteHive Error Handling & Logging Test Suite")
    print("=" * 50)
    
    tests = [
        ("File Structure", test_file_structure),
        ("Logging Infrastructure", test_logging_infrastructure),
        ("Error Middleware", test_error_middleware),
        ("Monitoring System", test_monitoring_system),
        ("Custom Exceptions", test_custom_exceptions),
        ("Async Monitoring", test_async_monitoring)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n✗ {test_name} failed with exception: {e}")
            traceback.print_exc()
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All error handling and logging tests passed!")
        return True
    else:
        print(f"❌ {total - passed} tests failed")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)