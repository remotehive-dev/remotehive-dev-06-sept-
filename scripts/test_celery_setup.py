#!/usr/bin/env python3
"""Test script to verify Celery configuration and monitoring setup."""

import os
import sys
import time
import traceback
from typing import Dict, Any

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_celery_imports():
    """Test that all Celery-related imports work correctly."""
    print("\n=== Testing Celery Imports ===")
    
    try:
        from app.core.celery import celery_app
        print("✓ Successfully imported celery_app")
        
        from app.core.config import settings
        print("✓ Successfully imported settings")
        
        from app.tasks.monitoring import health_check, collect_queue_metrics
        print("✓ Successfully imported monitoring tasks")
        
        from app.tasks.scraper import run_scheduled_scrapers
        print("✓ Successfully imported scraper tasks")
        
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        traceback.print_exc()
        return False
    except Exception as e:
        print(f"✗ Unexpected error during imports: {e}")
        traceback.print_exc()
        return False

def test_celery_configuration():
    """Test Celery configuration settings."""
    print("\n=== Testing Celery Configuration ===")
    
    try:
        from app.core.celery import celery_app
        from app.core.config import settings
        
        # Test broker and backend URLs
        broker_url = celery_app.conf.broker_url
        result_backend = celery_app.conf.result_backend
        
        print(f"✓ Broker URL: {broker_url}")
        print(f"✓ Result Backend: {result_backend}")
        
        # Test serialization settings
        task_serializer = celery_app.conf.task_serializer
        result_serializer = celery_app.conf.result_serializer
        accept_content = celery_app.conf.accept_content
        
        print(f"✓ Task Serializer: {task_serializer}")
        print(f"✓ Result Serializer: {result_serializer}")
        print(f"✓ Accept Content: {accept_content}")
        
        # Test task routing
        task_routes = celery_app.conf.task_routes
        print(f"✓ Task Routes configured: {len(task_routes)} routes")
        
        # Test queues
        task_queues = celery_app.conf.task_queues
        if task_queues:
            print(f"✓ Task Queues configured: {len(task_queues)} queues")
            for queue_name in task_queues.keys():
                print(f"  - {queue_name}")
        
        # Test beat schedule
        beat_schedule = celery_app.conf.beat_schedule
        print(f"✓ Beat Schedule configured: {len(beat_schedule)} periodic tasks")
        for task_name in beat_schedule.keys():
            print(f"  - {task_name}")
        
        return True
        
    except Exception as e:
        print(f"✗ Configuration test failed: {e}")
        traceback.print_exc()
        return False

def test_task_registration():
    """Test that tasks are properly registered with Celery."""
    print("\n=== Testing Task Registration ===")
    
    try:
        from app.core.celery import celery_app
        
        # Get registered tasks
        registered_tasks = list(celery_app.tasks.keys())
        
        # Expected tasks
        expected_tasks = [
            'app.tasks.monitoring.health_check',
            'app.tasks.monitoring.collect_queue_metrics',
            'app.tasks.scraper.run_scheduled_scrapers',
        ]
        
        print(f"✓ Total registered tasks: {len(registered_tasks)}")
        
        # Check for expected tasks
        missing_tasks = []
        for task in expected_tasks:
            if task in registered_tasks:
                print(f"✓ Found task: {task}")
            else:
                missing_tasks.append(task)
                print(f"✗ Missing task: {task}")
        
        if missing_tasks:
            print(f"\n⚠ Warning: {len(missing_tasks)} expected tasks are missing")
            return False
        else:
            print("\n✓ All expected tasks are registered")
            return True
        
    except Exception as e:
        print(f"✗ Task registration test failed: {e}")
        traceback.print_exc()
        return False

def test_redis_connection():
    """Test Redis connection for Celery broker."""
    print("\n=== Testing Redis Connection ===")
    
    try:
        import redis
        from app.core.config import settings
        
        # Parse Redis URL
        redis_url = settings.CELERY_BROKER_URL or settings.REDIS_URL
        print(f"✓ Using Redis URL: {redis_url}")
        
        # Create Redis client
        r = redis.from_url(redis_url)
        
        # Test connection
        r.ping()
        print("✓ Redis connection successful")
        
        # Test basic operations
        test_key = "celery_test_key"
        test_value = "celery_test_value"
        
        r.set(test_key, test_value, ex=10)  # Expire in 10 seconds
        retrieved_value = r.get(test_key)
        
        if retrieved_value and retrieved_value.decode() == test_value:
            print("✓ Redis read/write operations successful")
            r.delete(test_key)  # Clean up
            return True
        else:
            print("✗ Redis read/write operations failed")
            return False
        
    except ImportError:
        print("✗ Redis package not installed")
        return False
    except Exception as e:
        print(f"✗ Redis connection failed: {e}")
        return False

def test_task_execution():
    """Test task execution in eager mode."""
    print("\n=== Testing Task Execution (Eager Mode) ===")
    
    try:
        from app.core.celery import celery_app
        from app.tasks.monitoring import health_check, collect_queue_metrics
        
        # Enable eager execution for testing
        celery_app.conf.task_always_eager = True
        celery_app.conf.task_eager_propagates = True
        
        print("✓ Enabled eager task execution")
        
        # Test health check task
        print("\nTesting health_check task...")
        result = health_check.apply()
        if result.successful():
            health_data = result.get()
            print(f"✓ Health check completed: {health_data.get('status', 'unknown')}")
            print(f"  - Checks count: {health_data.get('checks_count', 0)}")
            print(f"  - Execution time: {health_data.get('execution_time', 0):.3f}s")
        else:
            print("✗ Health check task failed")
            return False
        
        # Test queue metrics task
        print("\nTesting collect_queue_metrics task...")
        result = collect_queue_metrics.apply()
        if result.successful():
            metrics_data = result.get()
            print(f"✓ Queue metrics collected")
            print(f"  - Collection time: {metrics_data.get('collection_time', 0):.3f}s")
            print(f"  - Registered tasks: {len(metrics_data.get('registered_tasks', []))}")
        else:
            print("✗ Queue metrics task failed")
            return False
        
        # Disable eager execution
        celery_app.conf.task_always_eager = False
        celery_app.conf.task_eager_propagates = False
        
        return True
        
    except Exception as e:
        print(f"✗ Task execution test failed: {e}")
        traceback.print_exc()
        return False

def test_monitoring_integration():
    """Test integration with monitoring system."""
    print("\n=== Testing Monitoring Integration ===")
    
    try:
        from app.core.monitoring import health_checker
        
        # Test health checker
        print("Testing health checker...")
        health_status = health_checker.run_all_checks()
        
        checks = health_status.get('checks', {})
        print(f"✓ Health checker executed: {len(checks)} checks")
        
        healthy_checks = sum(1 for result in checks.values() if result.get('healthy', False))
        print(f"✓ Healthy checks: {healthy_checks}/{len(checks)}")
        
        if healthy_checks == len(checks):
            print("✓ All health checks passed")
        else:
            print("⚠ Some health checks failed (this may be expected in test environment)")
            
        # Show overall health status
        overall_healthy = health_status.get('healthy', False)
        print(f"✓ Overall system health: {'Healthy' if overall_healthy else 'Unhealthy'}")
        
        return True
        
    except Exception as e:
        print(f"✗ Monitoring integration test failed: {e}")
        traceback.print_exc()
        return False

def main():
    """Run all Celery tests."""
    print("Celery Configuration and Monitoring Test Suite")
    print("=" * 50)
    
    tests = [
        ("Celery Imports", test_celery_imports),
        ("Celery Configuration", test_celery_configuration),
        ("Task Registration", test_task_registration),
        ("Redis Connection", test_redis_connection),
        ("Task Execution", test_task_execution),
        ("Monitoring Integration", test_monitoring_integration),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            print(f"\n{'='*20} {test_name} {'='*20}")
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n✗ {test_name} failed with exception: {e}")
            traceback.print_exc()
            results[test_name] = False
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = 0
    total = len(tests)
    
    for test_name, result in results.items():
        status = "PASS" if result else "FAIL"
        icon = "✓" if result else "✗"
        print(f"{icon} {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All Celery tests passed! The configuration is working correctly.")
        return 0
    else:
        print(f"\n⚠ {total - passed} test(s) failed. Please check the configuration.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)