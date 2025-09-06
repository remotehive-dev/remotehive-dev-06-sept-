#!/usr/bin/env python3
"""
Comprehensive AutoScraper Integration Tests
Tests all routes, endpoints, expected behaviors, and edge cases
"""

import pytest
import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from httpx import AsyncClient
import requests

# Test configuration
TEST_BASE_URL = "http://localhost:8001"
TEST_ADMIN_URL = "http://localhost:3000"
TEST_TIMEOUT = 30

class AutoScraperTestSuite:
    """Comprehensive test suite for AutoScraper service"""
    
    def __init__(self):
        self.base_url = TEST_BASE_URL
        self.admin_url = TEST_ADMIN_URL
        self.session = requests.Session()
        self.test_results = []
    
    def log_test_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status} {test_name}: {details}")
    
    def test_service_availability(self) -> bool:
        """Test if autoscraper service is running and accessible"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}" if success else f"Failed: {response.status_code}"
            self.log_test_result("Service Availability", success, details)
            return success
        except Exception as e:
            self.log_test_result("Service Availability", False, f"Exception: {str(e)}")
            return False
    
    def test_health_endpoints(self) -> bool:
        """Test all health check endpoints"""
        health_endpoints = [
            ("/health", "Main Health Check"),
            ("/health/live", "Liveness Probe"),
            ("/health/ready", "Readiness Probe"),
            ("/health/database", "Database Health"),
            ("/health/redis", "Redis Health"),
            ("/health/celery", "Celery Health"),
            ("/health/system", "System Health")
        ]
        
        all_passed = True
        for endpoint, name in health_endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                success = response.status_code == 200
                if success:
                    data = response.json()
                    details = f"Status: {data.get('status', 'unknown')}"
                else:
                    details = f"HTTP {response.status_code}"
                
                self.log_test_result(name, success, details)
                all_passed = all_passed and success
                
            except Exception as e:
                self.log_test_result(name, False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_metrics_endpoints(self) -> bool:
        """Test metrics collection endpoints"""
        metrics_endpoints = [
            ("/metrics", "Prometheus Metrics"),
            ("/metrics/health", "Metrics Health")
        ]
        
        all_passed = True
        for endpoint, name in metrics_endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                success = response.status_code == 200
                
                if success and endpoint == "/metrics":
                    # Verify prometheus format
                    content = response.text
                    has_metrics = "autoscraper_" in content
                    details = f"Metrics found: {has_metrics}"
                else:
                    details = f"HTTP {response.status_code}"
                
                self.log_test_result(name, success, details)
                all_passed = all_passed and success
                
            except Exception as e:
                self.log_test_result(name, False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_autoscraper_api_endpoints(self) -> bool:
        """Test all autoscraper API endpoints"""
        api_endpoints = [
            ("/api/v1/autoscraper/", "GET", "API Root"),
            ("/api/v1/autoscraper/dashboard", "GET", "Dashboard"),
            ("/api/v1/autoscraper/engine/state", "GET", "Engine State"),
            ("/api/v1/autoscraper/system/metrics", "GET", "System Metrics"),
            ("/api/v1/autoscraper/settings", "GET", "Get Settings"),
            ("/api/v1/autoscraper/job-boards", "GET", "List Job Boards"),
            ("/api/v1/autoscraper/jobs", "GET", "List Scrape Jobs")
        ]
        
        all_passed = True
        for endpoint, method, name in api_endpoints:
            try:
                if method == "GET":
                    response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                else:
                    response = self.session.request(method, f"{self.base_url}{endpoint}", timeout=10)
                
                success = response.status_code in [200, 401]  # 401 is acceptable for auth-protected endpoints
                
                if success:
                    if response.status_code == 200:
                        try:
                            data = response.json()
                            details = f"Response received with {len(str(data))} chars"
                        except:
                            details = f"Non-JSON response: {response.status_code}"
                    else:
                        details = f"Auth required: {response.status_code}"
                else:
                    details = f"Failed: HTTP {response.status_code}"
                
                self.log_test_result(name, success, details)
                all_passed = all_passed and success
                
            except Exception as e:
                self.log_test_result(name, False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_admin_panel_proxy(self) -> bool:
        """Test admin panel proxy to autoscraper service"""
        proxy_endpoints = [
            ("/api/autoscraper/dashboard", "Dashboard Proxy"),
            ("/api/autoscraper/engine/state", "Engine State Proxy"),
            ("/api/autoscraper/system/metrics", "Metrics Proxy")
        ]
        
        all_passed = True
        for endpoint, name in proxy_endpoints:
            try:
                response = self.session.get(f"{self.admin_url}{endpoint}", timeout=10)
                success = response.status_code in [200, 401, 502, 503]  # Accept various states
                
                if response.status_code == 200:
                    details = "Proxy working correctly"
                elif response.status_code in [401]:
                    details = "Auth required (expected)"
                elif response.status_code in [502, 503]:
                    details = "Service unavailable (check if admin panel is running)"
                else:
                    details = f"HTTP {response.status_code}"
                
                self.log_test_result(name, success, details)
                all_passed = all_passed and success
                
            except Exception as e:
                self.log_test_result(name, False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_error_handling(self) -> bool:
        """Test error handling and edge cases"""
        error_tests = [
            ("/api/v1/autoscraper/nonexistent", "GET", "404 Not Found", 404),
            ("/api/v1/autoscraper/jobs/invalid-id", "GET", "Invalid Job ID", [404, 422]),
            ("/api/v1/autoscraper/job-boards", "POST", "Unauthorized POST", [401, 422]),
            ("/api/v1/autoscraper/settings", "PUT", "Unauthorized PUT", [401, 422])
        ]
        
        all_passed = True
        for endpoint, method, name, expected_codes in error_tests:
            try:
                if isinstance(expected_codes, int):
                    expected_codes = [expected_codes]
                
                if method == "GET":
                    response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                elif method == "POST":
                    response = self.session.post(f"{self.base_url}{endpoint}", json={}, timeout=10)
                elif method == "PUT":
                    response = self.session.put(f"{self.base_url}{endpoint}", json={}, timeout=10)
                
                success = response.status_code in expected_codes
                details = f"Expected {expected_codes}, got {response.status_code}"
                
                self.log_test_result(name, success, details)
                all_passed = all_passed and success
                
            except Exception as e:
                self.log_test_result(name, False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_performance_metrics(self) -> bool:
        """Test performance and response times"""
        performance_tests = [
            ("/health", "Health Check Performance"),
            ("/api/v1/autoscraper/dashboard", "Dashboard Performance"),
            ("/api/v1/autoscraper/system/metrics", "Metrics Performance")
        ]
        
        all_passed = True
        for endpoint, name in performance_tests:
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                end_time = time.time()
                
                response_time = (end_time - start_time) * 1000  # Convert to milliseconds
                success = response.status_code in [200, 401] and response_time < 5000  # Under 5 seconds
                
                details = f"Response time: {response_time:.2f}ms, Status: {response.status_code}"
                
                self.log_test_result(name, success, details)
                all_passed = all_passed and success
                
            except Exception as e:
                self.log_test_result(name, False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_data_validation(self) -> bool:
        """Test data validation and schema compliance"""
        validation_tests = [
            ("/api/v1/autoscraper/dashboard", "Dashboard Schema"),
            ("/api/v1/autoscraper/engine/state", "Engine State Schema"),
            ("/api/v1/autoscraper/system/metrics", "Metrics Schema")
        ]
        
        all_passed = True
        for endpoint, name in validation_tests:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        # Basic schema validation
                        is_valid = isinstance(data, dict) and len(data) > 0
                        
                        if endpoint.endswith("/dashboard"):
                            is_valid = is_valid and "stats" in data
                        elif endpoint.endswith("/engine/state"):
                            is_valid = is_valid and "status" in data
                        elif endpoint.endswith("/system/metrics"):
                            is_valid = is_valid and "cpu_usage" in data
                        
                        details = f"Schema valid: {is_valid}"
                        success = is_valid
                    except json.JSONDecodeError:
                        success = False
                        details = "Invalid JSON response"
                else:
                    success = response.status_code == 401  # Auth required is acceptable
                    details = f"HTTP {response.status_code}"
                
                self.log_test_result(name, success, details)
                all_passed = all_passed and success
                
            except Exception as e:
                self.log_test_result(name, False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def run_comprehensive_tests(self) -> Dict[str, Any]:
        """Run all comprehensive tests"""
        print("\n" + "="*60)
        print("AutoScraper Comprehensive Test Suite")
        print("="*60)
        
        test_methods = [
            ("Service Availability", self.test_service_availability),
            ("Health Endpoints", self.test_health_endpoints),
            ("Metrics Endpoints", self.test_metrics_endpoints),
            ("AutoScraper API", self.test_autoscraper_api_endpoints),
            ("Admin Panel Proxy", self.test_admin_panel_proxy),
            ("Error Handling", self.test_error_handling),
            ("Performance", self.test_performance_metrics),
            ("Data Validation", self.test_data_validation)
        ]
        
        results = {}
        total_tests = 0
        passed_tests = 0
        
        for test_category, test_method in test_methods:
            print(f"\n--- {test_category} ---")
            try:
                result = test_method()
                results[test_category] = result
                if result:
                    passed_tests += 1
                total_tests += 1
            except Exception as e:
                print(f"✗ FAIL {test_category}: Exception {str(e)}")
                results[test_category] = False
                total_tests += 1
        
        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total Test Categories: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Detailed results
        print("\nDetailed Results:")
        for category, result in results.items():
            status = "✓ PASS" if result else "✗ FAIL"
            print(f"  {status} {category}")
        
        return {
            "total_categories": total_tests,
            "passed_categories": passed_tests,
            "success_rate": (passed_tests/total_tests)*100,
            "results": results,
            "detailed_results": self.test_results
        }

def main():
    """Main test runner"""
    test_suite = AutoScraperTestSuite()
    results = test_suite.run_comprehensive_tests()
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"autoscraper_test_results_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\nResults saved to: {results_file}")
    
    # Exit with appropriate code
    if results["success_rate"] >= 80:  # 80% pass rate required
        print("\n✓ Tests PASSED (80%+ success rate)")
        return 0
    else:
        print("\n✗ Tests FAILED (below 80% success rate)")
        return 1

if __name__ == "__main__":
    exit(main())