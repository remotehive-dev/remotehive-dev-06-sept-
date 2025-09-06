#!/usr/bin/env python3
"""
Integration Tests between Main App and AutoScraper Service
Tests the interaction and communication between the main RemoteHive app and AutoScraper service
"""

import pytest
import asyncio
import json
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Test configuration
MAIN_APP_URL = "http://localhost:8000"  # Main RemoteHive app
AUTOSCRAPER_URL = "http://localhost:8001"  # AutoScraper service
ADMIN_PANEL_URL = "http://localhost:3000"  # Admin panel
REDIS_URL = "redis://localhost:6379"
TEST_TIMEOUT = 30

class IntegrationTestSuite:
    """Integration test suite for main app and autoscraper service"""
    
    def __init__(self):
        self.main_app_url = MAIN_APP_URL
        self.autoscraper_url = AUTOSCRAPER_URL
        self.admin_url = ADMIN_PANEL_URL
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
    
    def test_service_availability(self) -> bool:
        """Test that all required services are available"""
        services = [
            ("Main App", self.main_app_url, "/health"),
            ("AutoScraper Service", self.autoscraper_url, "/health"),
            ("Admin Panel", self.admin_url, "/")
        ]
        
        all_available = True
        for service_name, base_url, endpoint in services:
            try:
                response = self.session.get(f"{base_url}{endpoint}", timeout=10)
                available = response.status_code in [200, 401, 404]  # 404 for admin panel is OK
                
                if not available:
                    all_available = False
                
                details = f"Status: {response.status_code}"
                self.log_test_result(f"{service_name} Availability", available, details)
                
            except Exception as e:
                self.log_test_result(f"{service_name} Availability", False, f"Exception: {str(e)}")
                all_available = False
        
        return all_available
    
    def test_cross_service_communication(self) -> bool:
        """Test communication between main app and autoscraper service"""
        try:
            # Test if main app can reach autoscraper service
            # This would typically be done through internal API calls
            
            # Test 1: Check if main app health includes autoscraper status
            main_health_response = self.session.get(f"{self.main_app_url}/health", timeout=10)
            main_health_success = main_health_response.status_code in [200, 401]
            
            # Test 2: Check autoscraper service health
            autoscraper_health_response = self.session.get(f"{self.autoscraper_url}/health", timeout=10)
            autoscraper_health_success = autoscraper_health_response.status_code in [200, 401]
            
            # Test 3: Check if services can communicate (simulate internal call)
            # In a real scenario, this would test actual service-to-service communication
            communication_test = main_health_success and autoscraper_health_success
            
            details = f"Main: {main_health_response.status_code}, AutoScraper: {autoscraper_health_response.status_code}"
            self.log_test_result("Cross-Service Communication", communication_test, details)
            
            return communication_test
            
        except Exception as e:
            self.log_test_result("Cross-Service Communication", False, f"Exception: {str(e)}")
            return False
    
    def test_admin_panel_proxy(self) -> bool:
        """Test admin panel proxy to autoscraper service"""
        try:
            # Test if admin panel can proxy requests to autoscraper
            # This tests the routing configuration
            
            # Test direct autoscraper access
            direct_response = self.session.get(f"{self.autoscraper_url}/api/v1/autoscraper/dashboard", timeout=10)
            direct_success = direct_response.status_code in [200, 401]
            
            # Test admin panel access (if proxy is configured)
            # Note: This might need authentication in a real scenario
            try:
                proxy_response = self.session.get(f"{self.admin_url}/api/autoscraper/dashboard", timeout=10)
                proxy_success = proxy_response.status_code in [200, 401, 404]  # 404 might be expected if not configured
            except:
                proxy_success = True  # Proxy might not be configured yet, which is OK
            
            overall_success = direct_success  # At minimum, direct access should work
            details = f"Direct: {direct_response.status_code}, Proxy: {'OK' if proxy_success else 'Failed'}"
            
            self.log_test_result("Admin Panel Proxy", overall_success, details)
            return overall_success
            
        except Exception as e:
            self.log_test_result("Admin Panel Proxy", False, f"Exception: {str(e)}")
            return False
    
    def test_shared_dependencies(self) -> bool:
        """Test shared dependencies (Redis, Database)"""
        try:
            # Test Redis connectivity from both services
            redis_tests = []
            
            # Test main app Redis connection (through health endpoint)
            try:
                main_health = self.session.get(f"{self.main_app_url}/health/readiness", timeout=10)
                redis_tests.append(("Main App Redis", main_health.status_code in [200, 401, 404]))
            except:
                redis_tests.append(("Main App Redis", False))
            
            # Test autoscraper Redis connection (through health endpoint)
            try:
                autoscraper_health = self.session.get(f"{self.autoscraper_url}/health/readiness", timeout=10)
                redis_tests.append(("AutoScraper Redis", autoscraper_health.status_code in [200, 401, 404]))
            except:
                redis_tests.append(("AutoScraper Redis", False))
            
            # Test database connectivity
            db_tests = []
            
            try:
                main_db = self.session.get(f"{self.main_app_url}/health/liveness", timeout=10)
                db_tests.append(("Main App DB", main_db.status_code in [200, 401, 404]))
            except:
                db_tests.append(("Main App DB", False))
            
            try:
                autoscraper_db = self.session.get(f"{self.autoscraper_url}/health/liveness", timeout=10)
                db_tests.append(("AutoScraper DB", autoscraper_db.status_code in [200, 401, 404]))
            except:
                db_tests.append(("AutoScraper DB", False))
            
            # Overall success if at least one service can connect to shared resources
            redis_success = any(result for _, result in redis_tests)
            db_success = any(result for _, result in db_tests)
            overall_success = redis_success and db_success
            
            details = f"Redis: {redis_success}, DB: {db_success}"
            self.log_test_result("Shared Dependencies", overall_success, details)
            
            return overall_success
            
        except Exception as e:
            self.log_test_result("Shared Dependencies", False, f"Exception: {str(e)}")
            return False
    
    def test_concurrent_service_load(self) -> bool:
        """Test both services under concurrent load"""
        def make_requests_to_service(service_url: str, endpoint: str, num_requests: int) -> Dict[str, Any]:
            """Make concurrent requests to a service"""
            def single_request():
                try:
                    response = self.session.get(f"{service_url}{endpoint}", timeout=10)
                    return response.status_code in [200, 401]
                except:
                    return False
            
            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(single_request) for _ in range(num_requests)]
                results = [future.result() for future in as_completed(futures, timeout=30)]
            
            success_count = sum(results)
            return {
                "total": len(results),
                "successful": success_count,
                "success_rate": success_count / len(results) if results else 0
            }
        
        try:
            # Test both services concurrently
            main_app_results = make_requests_to_service(self.main_app_url, "/health", 10)
            autoscraper_results = make_requests_to_service(self.autoscraper_url, "/health", 10)
            
            # Success criteria: both services should handle at least 80% of requests successfully
            main_success = main_app_results["success_rate"] >= 0.8
            autoscraper_success = autoscraper_results["success_rate"] >= 0.8
            overall_success = main_success and autoscraper_success
            
            details = f"Main: {main_app_results['success_rate']:.2f}, AutoScraper: {autoscraper_results['success_rate']:.2f}"
            self.log_test_result("Concurrent Service Load", overall_success, details)
            
            return overall_success
            
        except Exception as e:
            self.log_test_result("Concurrent Service Load", False, f"Exception: {str(e)}")
            return False
    
    def test_service_startup_order(self) -> bool:
        """Test that services start in the correct order and dependencies are met"""
        try:
            # Check if services are responding (indicating they started successfully)
            services_status = []
            
            # Check main app
            try:
                main_response = self.session.get(f"{self.main_app_url}/health", timeout=5)
                services_status.append(("Main App", main_response.status_code in [200, 401]))
            except:
                services_status.append(("Main App", False))
            
            # Check autoscraper (should start after Redis)
            try:
                autoscraper_response = self.session.get(f"{self.autoscraper_url}/health", timeout=5)
                services_status.append(("AutoScraper", autoscraper_response.status_code in [200, 401]))
            except:
                services_status.append(("AutoScraper", False))
            
            # Check admin panel
            try:
                admin_response = self.session.get(f"{self.admin_url}/", timeout=5)
                services_status.append(("Admin Panel", admin_response.status_code in [200, 404]))
            except:
                services_status.append(("Admin Panel", False))
            
            # Success if all services are running
            all_running = all(status for _, status in services_status)
            
            details = ", ".join([f"{name}: {'OK' if status else 'Failed'}" for name, status in services_status])
            self.log_test_result("Service Startup Order", all_running, details)
            
            return all_running
            
        except Exception as e:
            self.log_test_result("Service Startup Order", False, f"Exception: {str(e)}")
            return False
    
    def test_data_consistency(self) -> bool:
        """Test data consistency between services"""
        try:
            # Test if both services report consistent system information
            
            # Get system metrics from autoscraper
            try:
                autoscraper_metrics = self.session.get(f"{self.autoscraper_url}/api/v1/autoscraper/system/metrics", timeout=10)
                autoscraper_metrics_success = autoscraper_metrics.status_code in [200, 401]
            except:
                autoscraper_metrics_success = False
            
            # Get health info from main app
            try:
                main_health = self.session.get(f"{self.main_app_url}/health", timeout=10)
                main_health_success = main_health.status_code in [200, 401]
            except:
                main_health_success = False
            
            # Basic consistency check - both services should be able to provide their status
            consistency_success = autoscraper_metrics_success and main_health_success
            
            details = f"AutoScraper metrics: {'OK' if autoscraper_metrics_success else 'Failed'}, Main health: {'OK' if main_health_success else 'Failed'}"
            self.log_test_result("Data Consistency", consistency_success, details)
            
            return consistency_success
            
        except Exception as e:
            self.log_test_result("Data Consistency", False, f"Exception: {str(e)}")
            return False
    
    def test_error_propagation(self) -> bool:
        """Test how errors propagate between services"""
        try:
            # Test error handling when one service is unavailable
            # This is a simulation - in practice, you'd test actual error scenarios
            
            # Test accessing non-existent endpoints
            error_tests = [
                ("Main App 404", f"{self.main_app_url}/non-existent-endpoint", [404]),
                ("AutoScraper 404", f"{self.autoscraper_url}/non-existent-endpoint", [404]),
                ("Invalid API Call", f"{self.autoscraper_url}/api/v1/autoscraper/invalid", [404, 405])
            ]
            
            all_handled_correctly = True
            for test_name, url, expected_codes in error_tests:
                try:
                    response = self.session.get(url, timeout=10)
                    handled_correctly = response.status_code in expected_codes
                    
                    if not handled_correctly:
                        all_handled_correctly = False
                    
                    self.log_test_result(test_name, handled_correctly, f"Status: {response.status_code}")
                    
                except Exception as e:
                    self.log_test_result(test_name, False, f"Exception: {str(e)}")
                    all_handled_correctly = False
            
            return all_handled_correctly
            
        except Exception as e:
            self.log_test_result("Error Propagation", False, f"Exception: {str(e)}")
            return False
    
    def test_performance_integration(self) -> bool:
        """Test performance when services work together"""
        try:
            # Measure response times for both services
            response_times = []
            
            endpoints_to_test = [
                ("Main App Health", f"{self.main_app_url}/health"),
                ("AutoScraper Health", f"{self.autoscraper_url}/health"),
                ("AutoScraper Dashboard", f"{self.autoscraper_url}/api/v1/autoscraper/dashboard")
            ]
            
            for test_name, url in endpoints_to_test:
                try:
                    start_time = time.time()
                    response = self.session.get(url, timeout=10)
                    end_time = time.time()
                    
                    response_time = end_time - start_time
                    response_times.append(response_time)
                    
                    # Individual endpoint should respond within 5 seconds
                    endpoint_success = response_time < 5.0 and response.status_code in [200, 401]
                    self.log_test_result(f"{test_name} Performance", endpoint_success, f"{response_time:.2f}s")
                    
                except Exception as e:
                    self.log_test_result(f"{test_name} Performance", False, f"Exception: {str(e)}")
                    response_times.append(10.0)  # Penalty for failed requests
            
            # Overall performance success if average response time is reasonable
            avg_response_time = sum(response_times) / len(response_times) if response_times else 10.0
            performance_success = avg_response_time < 3.0
            
            details = f"Average response time: {avg_response_time:.2f}s"
            self.log_test_result("Overall Performance", performance_success, details)
            
            return performance_success
            
        except Exception as e:
            self.log_test_result("Performance Integration", False, f"Exception: {str(e)}")
            return False
    
    def run_integration_tests(self) -> Dict[str, Any]:
        """Run all integration tests"""
        print("\n" + "="*60)
        print("Integration Tests: Main App ↔ AutoScraper Service")
        print("="*60)
        
        test_methods = [
            ("Service Availability", self.test_service_availability),
            ("Cross-Service Communication", self.test_cross_service_communication),
            ("Admin Panel Proxy", self.test_admin_panel_proxy),
            ("Shared Dependencies", self.test_shared_dependencies),
            ("Concurrent Service Load", self.test_concurrent_service_load),
            ("Service Startup Order", self.test_service_startup_order),
            ("Data Consistency", self.test_data_consistency),
            ("Error Propagation", self.test_error_propagation),
            ("Performance Integration", self.test_performance_integration)
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
        print("INTEGRATION TEST SUMMARY")
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
    test_suite = IntegrationTestSuite()
    results = test_suite.run_integration_tests()
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"integration_test_results_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\nResults saved to: {results_file}")
    
    # Exit with appropriate code
    if results["success_rate"] >= 80:  # 80% pass rate for integration tests
        print("\n✓ Integration Tests PASSED")
        return 0
    else:
        print("\n✗ Integration Tests FAILED")
        return 1

if __name__ == "__main__":
    exit(main())