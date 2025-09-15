#!/usr/bin/env python3
"""
AutoScraper Edge Cases and Error Handling Tests
Comprehensive testing of edge cases, error conditions, and boundary scenarios
"""

import pytest
import asyncio
import json
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, List
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Test configuration
TEST_BASE_URL = "http://localhost:8001"
TEST_ADMIN_URL = "http://localhost:3000"
MAX_CONCURRENT_REQUESTS = 10
STRESS_TEST_DURATION = 30  # seconds

class AutoScraperEdgeCaseTests:
    """Edge case and error handling test suite"""
    
    def __init__(self):
        self.base_url = TEST_BASE_URL
        self.admin_url = TEST_ADMIN_URL
        self.session = self._create_session()
        self.test_results = []
    
    def _create_session(self) -> requests.Session:
        """Create a session with retry strategy"""
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session
    
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
    
    def test_malformed_requests(self) -> bool:
        """Test handling of malformed requests"""
        malformed_tests = [
            # Invalid JSON payloads
            {
                "name": "Invalid JSON POST",
                "method": "POST",
                "endpoint": "/api/v1/autoscraper/job-boards",
                "data": "invalid json{",
                "headers": {"Content-Type": "application/json"},
                "expected_codes": [400, 422]
            },
            # Missing required fields
            {
                "name": "Missing Required Fields",
                "method": "POST",
                "endpoint": "/api/v1/autoscraper/job-boards",
                "data": json.dumps({}),
                "headers": {"Content-Type": "application/json"},
                "expected_codes": [400, 422, 401]
            },
            # Invalid content type
            {
                "name": "Invalid Content Type",
                "method": "POST",
                "endpoint": "/api/v1/autoscraper/settings",
                "data": "some data",
                "headers": {"Content-Type": "text/plain"},
                "expected_codes": [400, 415, 422, 401]
            },
            # Extremely large payload
            {
                "name": "Large Payload",
                "method": "POST",
                "endpoint": "/api/v1/autoscraper/job-boards",
                "data": json.dumps({"data": "x" * 10000}),
                "headers": {"Content-Type": "application/json"},
                "expected_codes": [400, 413, 422, 401]
            }
        ]
        
        all_passed = True
        for test in malformed_tests:
            try:
                response = self.session.request(
                    test["method"],
                    f"{self.base_url}{test['endpoint']}",
                    data=test["data"],
                    headers=test["headers"],
                    timeout=10
                )
                
                success = response.status_code in test["expected_codes"]
                details = f"Expected {test['expected_codes']}, got {response.status_code}"
                
                self.log_test_result(test["name"], success, details)
                all_passed = all_passed and success
                
            except Exception as e:
                self.log_test_result(test["name"], False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_boundary_values(self) -> bool:
        """Test boundary value conditions"""
        boundary_tests = [
            # Pagination limits
            {
                "name": "Max Pagination Limit",
                "endpoint": "/api/v1/autoscraper/jobs?limit=1000",
                "expected_codes": [200, 401]
            },
            {
                "name": "Excessive Pagination Limit",
                "endpoint": "/api/v1/autoscraper/jobs?limit=10000",
                "expected_codes": [400, 422, 401]
            },
            {
                "name": "Negative Skip Value",
                "endpoint": "/api/v1/autoscraper/jobs?skip=-1",
                "expected_codes": [400, 422, 401]
            },
            {
                "name": "Zero Limit",
                "endpoint": "/api/v1/autoscraper/jobs?limit=0",
                "expected_codes": [400, 422, 401]
            },
            # Invalid UUIDs
            {
                "name": "Invalid UUID Format",
                "endpoint": "/api/v1/autoscraper/jobs/invalid-uuid-format",
                "expected_codes": [400, 404, 422, 401]
            },
            {
                "name": "Empty UUID",
                "endpoint": "/api/v1/autoscraper/jobs/",
                "expected_codes": [404, 405]
            }
        ]
        
        all_passed = True
        for test in boundary_tests:
            try:
                response = self.session.get(f"{self.base_url}{test['endpoint']}", timeout=10)
                success = response.status_code in test["expected_codes"]
                details = f"Expected {test['expected_codes']}, got {response.status_code}"
                
                self.log_test_result(test["name"], success, details)
                all_passed = all_passed and success
                
            except Exception as e:
                self.log_test_result(test["name"], False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_concurrent_requests(self) -> bool:
        """Test handling of concurrent requests"""
        def make_request(endpoint: str) -> Dict[str, Any]:
            """Make a single request"""
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=15)
                end_time = time.time()
                
                return {
                    "status_code": response.status_code,
                    "response_time": end_time - start_time,
                    "success": response.status_code in [200, 401],
                    "error": None
                }
            except Exception as e:
                return {
                    "status_code": None,
                    "response_time": None,
                    "success": False,
                    "error": str(e)
                }
        
        # Test endpoints for concurrent access
        test_endpoints = [
            "/health",
            "/api/v1/autoscraper/dashboard",
            "/api/v1/autoscraper/engine/state",
            "/api/v1/autoscraper/system/metrics"
        ]
        
        all_passed = True
        
        for endpoint in test_endpoints:
            try:
                # Make concurrent requests
                with ThreadPoolExecutor(max_workers=MAX_CONCURRENT_REQUESTS) as executor:
                    futures = [executor.submit(make_request, endpoint) for _ in range(MAX_CONCURRENT_REQUESTS)]
                    results = [future.result() for future in as_completed(futures, timeout=30)]
                
                # Analyze results
                successful_requests = sum(1 for r in results if r["success"])
                failed_requests = len(results) - successful_requests
                avg_response_time = sum(r["response_time"] for r in results if r["response_time"]) / len([r for r in results if r["response_time"]])
                
                # Success criteria: at least 80% success rate and reasonable response times
                success_rate = successful_requests / len(results)
                success = success_rate >= 0.8 and avg_response_time < 10.0
                
                details = f"Success rate: {success_rate:.2f}, Avg time: {avg_response_time:.2f}s"
                self.log_test_result(f"Concurrent {endpoint}", success, details)
                all_passed = all_passed and success
                
            except Exception as e:
                self.log_test_result(f"Concurrent {endpoint}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_rate_limiting(self) -> bool:
        """Test rate limiting behavior"""
        try:
            # Make rapid requests to trigger rate limiting
            responses = []
            start_time = time.time()
            
            for i in range(50):  # Make 50 rapid requests
                try:
                    response = self.session.get(f"{self.base_url}/health", timeout=5)
                    responses.append(response.status_code)
                except:
                    responses.append(None)
                
                if time.time() - start_time > 10:  # Don't run longer than 10 seconds
                    break
            
            # Check if rate limiting was triggered (429 status codes)
            rate_limited = 429 in responses
            success_responses = sum(1 for r in responses if r == 200)
            
            # Rate limiting should either be working (429s present) or all requests should succeed
            success = rate_limited or success_responses >= len(responses) * 0.8
            
            details = f"Responses: {len(responses)}, 200s: {success_responses}, 429s: {responses.count(429)}"
            self.log_test_result("Rate Limiting", success, details)
            
            return success
            
        except Exception as e:
            self.log_test_result("Rate Limiting", False, f"Exception: {str(e)}")
            return False
    
    def test_timeout_handling(self) -> bool:
        """Test timeout and slow request handling"""
        timeout_tests = [
            {
                "name": "Short Timeout",
                "endpoint": "/api/v1/autoscraper/dashboard",
                "timeout": 0.1,  # Very short timeout
                "expect_timeout": True
            },
            {
                "name": "Reasonable Timeout",
                "endpoint": "/health",
                "timeout": 5.0,
                "expect_timeout": False
            }
        ]
        
        all_passed = True
        for test in timeout_tests:
            try:
                start_time = time.time()
                response = self.session.get(
                    f"{self.base_url}{test['endpoint']}",
                    timeout=test["timeout"]
                )
                end_time = time.time()
                
                # If we expected a timeout but didn't get one
                if test["expect_timeout"]:
                    success = False  # Should have timed out
                    details = f"Expected timeout but got response: {response.status_code}"
                else:
                    success = response.status_code in [200, 401]
                    details = f"Response time: {end_time - start_time:.2f}s, Status: {response.status_code}"
                
            except requests.exceptions.Timeout:
                success = test["expect_timeout"]
                details = "Request timed out as expected" if success else "Unexpected timeout"
            except Exception as e:
                success = False
                details = f"Exception: {str(e)}"
            
            self.log_test_result(test["name"], success, details)
            all_passed = all_passed and success
        
        return all_passed
    
    def test_memory_and_resource_limits(self) -> bool:
        """Test memory usage and resource limits"""
        try:
            # Test large query parameters
            large_param = "x" * 1000  # 1KB parameter
            response = self.session.get(
                f"{self.base_url}/api/v1/autoscraper/jobs",
                params={"search": large_param},
                timeout=10
            )
            
            # Should handle large parameters gracefully
            success = response.status_code in [200, 400, 401, 422]
            details = f"Large param handling: {response.status_code}"
            
            self.log_test_result("Large Parameters", success, details)
            return success
            
        except Exception as e:
            self.log_test_result("Large Parameters", False, f"Exception: {str(e)}")
            return False
    
    def test_service_recovery(self) -> bool:
        """Test service recovery after errors"""
        try:
            # Make a series of requests to ensure service is stable
            recovery_endpoints = [
                "/health",
                "/api/v1/autoscraper/dashboard",
                "/api/v1/autoscraper/engine/state"
            ]
            
            all_passed = True
            for endpoint in recovery_endpoints:
                for attempt in range(3):  # Try each endpoint 3 times
                    try:
                        response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                        success = response.status_code in [200, 401]
                        
                        if not success:
                            all_passed = False
                            break
                        
                        time.sleep(1)  # Wait between requests
                        
                    except Exception:
                        all_passed = False
                        break
                
                if not all_passed:
                    break
            
            details = "Service remained stable" if all_passed else "Service instability detected"
            self.log_test_result("Service Recovery", all_passed, details)
            
            return all_passed
            
        except Exception as e:
            self.log_test_result("Service Recovery", False, f"Exception: {str(e)}")
            return False
    
    def test_authentication_edge_cases(self) -> bool:
        """Test authentication edge cases"""
        auth_tests = [
            {
                "name": "Missing Auth Header",
                "headers": {},
                "endpoint": "/api/v1/autoscraper/settings",
                "method": "PUT",
                "expected_codes": [401]
            },
            {
                "name": "Invalid Auth Token",
                "headers": {"Authorization": "Bearer invalid-token"},
                "endpoint": "/api/v1/autoscraper/settings",
                "method": "GET",
                "expected_codes": [401]
            },
            {
                "name": "Malformed Auth Header",
                "headers": {"Authorization": "InvalidFormat"},
                "endpoint": "/api/v1/autoscraper/job-boards",
                "method": "POST",
                "expected_codes": [401]
            }
        ]
        
        all_passed = True
        for test in auth_tests:
            try:
                if test["method"] == "GET":
                    response = self.session.get(
                        f"{self.base_url}{test['endpoint']}",
                        headers=test["headers"],
                        timeout=10
                    )
                elif test["method"] == "POST":
                    response = self.session.post(
                        f"{self.base_url}{test['endpoint']}",
                        headers=test["headers"],
                        json={},
                        timeout=10
                    )
                elif test["method"] == "PUT":
                    response = self.session.put(
                        f"{self.base_url}{test['endpoint']}",
                        headers=test["headers"],
                        json={},
                        timeout=10
                    )
                
                success = response.status_code in test["expected_codes"]
                details = f"Expected {test['expected_codes']}, got {response.status_code}"
                
                self.log_test_result(test["name"], success, details)
                all_passed = all_passed and success
                
            except Exception as e:
                self.log_test_result(test["name"], False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def run_edge_case_tests(self) -> Dict[str, Any]:
        """Run all edge case tests"""
        print("\n" + "="*60)
        print("AutoScraper Edge Cases and Error Handling Tests")
        print("="*60)
        
        test_methods = [
            ("Malformed Requests", self.test_malformed_requests),
            ("Boundary Values", self.test_boundary_values),
            ("Concurrent Requests", self.test_concurrent_requests),
            ("Rate Limiting", self.test_rate_limiting),
            ("Timeout Handling", self.test_timeout_handling),
            ("Resource Limits", self.test_memory_and_resource_limits),
            ("Service Recovery", self.test_service_recovery),
            ("Authentication Edge Cases", self.test_authentication_edge_cases)
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
        print("EDGE CASE TEST SUMMARY")
        print("="*60)
        print(f"Total Test Categories: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        return {
            "total_categories": total_tests,
            "passed_categories": passed_tests,
            "success_rate": (passed_tests/total_tests)*100,
            "results": results,
            "detailed_results": self.test_results
        }

def main():
    """Main test runner"""
    test_suite = AutoScraperEdgeCaseTests()
    results = test_suite.run_edge_case_tests()
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"autoscraper_edge_case_results_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\nResults saved to: {results_file}")
    
    # Exit with appropriate code
    if results["success_rate"] >= 70:  # 70% pass rate for edge cases
        print("\n✓ Edge Case Tests PASSED")
        return 0
    else:
        print("\n✗ Edge Case Tests FAILED")
        return 1

if __name__ == "__main__":
    exit(main())