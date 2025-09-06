#!/usr/bin/env python3
"""
Comprehensive Load Testing Script for Database Optimizations

This script tests:
1. Database connection pool performance with concurrent connections
2. Pagination performance with large datasets
3. Health endpoint response times under load
4. Query performance with new indexes
5. Realistic user scenarios (job searches, applications, user registration)
6. Generates a performance report
"""

import asyncio
import aiohttp
import time
import statistics
import json
import random
import string
from datetime import datetime
from typing import List, Dict, Any
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import psutil


@dataclass
class TestResult:
    """Container for test results"""
    test_name: str
    duration: float
    success_count: int
    error_count: int
    avg_response_time: float
    min_response_time: float
    max_response_time: float
    p95_response_time: float
    throughput: float
    errors: List[str]


class LoadTester:
    """Comprehensive load testing for database optimizations"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results: List[TestResult] = []
        self.session = None
        
    async def __aenter__(self):
        connector = aiohttp.TCPConnector(
            limit=200,  # Total connection pool size
            limit_per_host=100,  # Per-host connection limit
            ttl_dns_cache=300,
            use_dns_cache=True,
        )
        timeout = aiohttp.ClientTimeout(total=30, connect=10)
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def generate_random_string(self, length: int = 10) -> str:
        """Generate random string for test data"""
        return ''.join(random.choices(string.ascii_letters + string.digits, k=length))
    
    async def make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request and measure response time"""
        start_time = time.time()
        try:
            async with self.session.request(method, f"{self.base_url}{endpoint}", **kwargs) as response:
                response_time = time.time() - start_time
                data = await response.json() if response.content_type == 'application/json' else await response.text()
                return {
                    'success': True,
                    'status_code': response.status,
                    'response_time': response_time,
                    'data': data
                }
        except Exception as e:
            response_time = time.time() - start_time
            return {
                'success': False,
                'error': str(e),
                'response_time': response_time
            }
    
    async def test_health_endpoints(self, concurrent_requests: int = 50, duration: int = 30) -> TestResult:
        """Test health endpoint performance under load"""
        print(f"Testing health endpoints with {concurrent_requests} concurrent requests for {duration}s...")
        
        endpoints = [
            "/api/v1/health/",
            "/api/v1/health/detailed",
            "/api/v1/health/database",
            "/api/v1/health/metrics"
        ]
        
        results = []
        errors = []
        start_time = time.time()
        
        async def worker():
            while time.time() - start_time < duration:
                endpoint = random.choice(endpoints)
                result = await self.make_request("GET", endpoint)
                results.append(result)
                if not result['success']:
                    errors.append(f"{endpoint}: {result.get('error', 'Unknown error')}")
                await asyncio.sleep(0.1)  # Small delay between requests
        
        # Run concurrent workers
        tasks = [worker() for _ in range(concurrent_requests)]
        await asyncio.gather(*tasks)
        
        # Calculate statistics
        response_times = [r['response_time'] for r in results]
        success_count = sum(1 for r in results if r['success'])
        error_count = len(results) - success_count
        
        return TestResult(
            test_name="Health Endpoints Load Test",
            duration=time.time() - start_time,
            success_count=success_count,
            error_count=error_count,
            avg_response_time=statistics.mean(response_times) if response_times else 0,
            min_response_time=min(response_times) if response_times else 0,
            max_response_time=max(response_times) if response_times else 0,
            p95_response_time=statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else 0,
            throughput=len(results) / (time.time() - start_time),
            errors=errors[:10]  # Keep only first 10 errors
        )
    
    async def test_connection_pool(self, concurrent_connections: int = 100, requests_per_connection: int = 10) -> TestResult:
        """Test database connection pool performance"""
        print(f"Testing connection pool with {concurrent_connections} concurrent connections...")
        
        results = []
        errors = []
        start_time = time.time()
        
        async def connection_worker():
            for _ in range(requests_per_connection):
                result = await self.make_request("GET", "/api/v1/health/database")
                results.append(result)
                if not result['success']:
                    errors.append(result.get('error', 'Unknown error'))
                await asyncio.sleep(0.05)  # Small delay
        
        # Run concurrent connection workers
        tasks = [connection_worker() for _ in range(concurrent_connections)]
        await asyncio.gather(*tasks)
        
        # Calculate statistics
        response_times = [r['response_time'] for r in results]
        success_count = sum(1 for r in results if r['success'])
        error_count = len(results) - success_count
        
        return TestResult(
            test_name="Connection Pool Test",
            duration=time.time() - start_time,
            success_count=success_count,
            error_count=error_count,
            avg_response_time=statistics.mean(response_times) if response_times else 0,
            min_response_time=min(response_times) if response_times else 0,
            max_response_time=max(response_times) if response_times else 0,
            p95_response_time=statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else 0,
            throughput=len(results) / (time.time() - start_time),
            errors=errors[:10]
        )
    
    async def test_pagination_performance(self, page_sizes: List[int] = [10, 50, 100], pages_to_test: int = 5) -> TestResult:
        """Test pagination performance with different page sizes"""
        print("Testing pagination performance...")
        
        results = []
        errors = []
        start_time = time.time()
        
        # Test different endpoints that likely use pagination
        endpoints = [
            "/api/v1/jobs/",
            "/api/v1/users/",
            "/api/v1/applications/"
        ]
        
        for endpoint in endpoints:
            for page_size in page_sizes:
                for page in range(1, pages_to_test + 1):
                    params = {"page": page, "page_size": page_size}
                    result = await self.make_request("GET", endpoint, params=params)
                    results.append(result)
                    if not result['success']:
                        errors.append(f"{endpoint} (page={page}, size={page_size}): {result.get('error', 'Unknown error')}")
        
        # Calculate statistics
        response_times = [r['response_time'] for r in results]
        success_count = sum(1 for r in results if r['success'])
        error_count = len(results) - success_count
        
        return TestResult(
            test_name="Pagination Performance Test",
            duration=time.time() - start_time,
            success_count=success_count,
            error_count=error_count,
            avg_response_time=statistics.mean(response_times) if response_times else 0,
            min_response_time=min(response_times) if response_times else 0,
            max_response_time=max(response_times) if response_times else 0,
            p95_response_time=statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else 0,
            throughput=len(results) / (time.time() - start_time),
            errors=errors[:10]
        )
    
    async def test_realistic_user_scenarios(self, concurrent_users: int = 25, duration: int = 60) -> TestResult:
        """Simulate realistic user behavior patterns"""
        print(f"Testing realistic user scenarios with {concurrent_users} concurrent users for {duration}s...")
        
        results = []
        errors = []
        start_time = time.time()
        
        # Define user behavior patterns
        user_actions = [
            ("GET", "/api/v1/jobs/", {"params": {"page": 1, "page_size": 20}}),
            ("GET", "/api/v1/jobs/", {"params": {"search": "python", "page": 1}}),
            ("GET", "/api/v1/jobs/", {"params": {"location": "remote", "page": 1}}),
            ("GET", "/api/v1/health/", {}),
            ("GET", "/api/v1/users/", {"params": {"page": 1, "page_size": 10}}),
        ]
        
        async def user_simulation():
            user_start = time.time()
            while time.time() - user_start < duration:
                # Simulate user browsing pattern
                action = random.choice(user_actions)
                method, endpoint, kwargs = action
                
                result = await self.make_request(method, endpoint, **kwargs)
                results.append(result)
                if not result['success']:
                    errors.append(f"{endpoint}: {result.get('error', 'Unknown error')}")
                
                # Simulate user think time
                await asyncio.sleep(random.uniform(0.5, 2.0))
        
        # Run concurrent user simulations
        tasks = [user_simulation() for _ in range(concurrent_users)]
        await asyncio.gather(*tasks)
        
        # Calculate statistics
        response_times = [r['response_time'] for r in results]
        success_count = sum(1 for r in results if r['success'])
        error_count = len(results) - success_count
        
        return TestResult(
            test_name="Realistic User Scenarios",
            duration=time.time() - start_time,
            success_count=success_count,
            error_count=error_count,
            avg_response_time=statistics.mean(response_times) if response_times else 0,
            min_response_time=min(response_times) if response_times else 0,
            max_response_time=max(response_times) if response_times else 0,
            p95_response_time=statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else 0,
            throughput=len(results) / (time.time() - start_time),
            errors=errors[:10]
        )
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system performance metrics"""
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage_percent': psutil.disk_usage('/').percent if psutil.disk_usage('/') else 0,
            'network_connections': len(psutil.net_connections()),
            'process_count': len(psutil.pids())
        }
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all load tests and generate comprehensive report"""
        print("Starting comprehensive load testing...")
        print("=" * 50)
        
        # Get initial system metrics
        initial_metrics = self.get_system_metrics()
        test_start_time = time.time()
        
        # Run all tests
        tests = [
            self.test_health_endpoints(),
            self.test_connection_pool(),
            self.test_pagination_performance(),
            self.test_realistic_user_scenarios()
        ]
        
        self.results = await asyncio.gather(*tests)
        
        # Get final system metrics
        final_metrics = self.get_system_metrics()
        total_duration = time.time() - test_start_time
        
        # Generate comprehensive report
        report = {
            'test_summary': {
                'total_duration': total_duration,
                'total_tests': len(self.results),
                'timestamp': datetime.now().isoformat()
            },
            'system_metrics': {
                'initial': initial_metrics,
                'final': final_metrics,
                'cpu_change': final_metrics['cpu_percent'] - initial_metrics['cpu_percent'],
                'memory_change': final_metrics['memory_percent'] - initial_metrics['memory_percent']
            },
            'test_results': []
        }
        
        # Add individual test results
        for result in self.results:
            report['test_results'].append({
                'test_name': result.test_name,
                'duration': result.duration,
                'success_rate': result.success_count / (result.success_count + result.error_count) * 100 if (result.success_count + result.error_count) > 0 else 0,
                'total_requests': result.success_count + result.error_count,
                'successful_requests': result.success_count,
                'failed_requests': result.error_count,
                'avg_response_time_ms': result.avg_response_time * 1000,
                'min_response_time_ms': result.min_response_time * 1000,
                'max_response_time_ms': result.max_response_time * 1000,
                'p95_response_time_ms': result.p95_response_time * 1000,
                'throughput_rps': result.throughput,
                'errors': result.errors
            })
        
        return report
    
    def print_report(self, report: Dict[str, Any]):
        """Print formatted test report"""
        print("\n" + "=" * 80)
        print("LOAD TEST RESULTS SUMMARY")
        print("=" * 80)
        
        # Test summary
        summary = report['test_summary']
        print(f"\nTest Duration: {summary['total_duration']:.2f} seconds")
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Timestamp: {summary['timestamp']}")
        
        # System metrics
        metrics = report['system_metrics']
        print(f"\nSYSTEM METRICS:")
        print(f"CPU Usage: {metrics['initial']['cpu_percent']:.1f}% → {metrics['final']['cpu_percent']:.1f}% (Δ{metrics['cpu_change']:+.1f}%)")
        print(f"Memory Usage: {metrics['initial']['memory_percent']:.1f}% → {metrics['final']['memory_percent']:.1f}% (Δ{metrics['memory_change']:+.1f}%)")
        
        # Individual test results
        print(f"\nTEST RESULTS:")
        print("-" * 80)
        
        for result in report['test_results']:
            print(f"\n{result['test_name']}:")
            print(f"  Success Rate: {result['success_rate']:.1f}% ({result['successful_requests']}/{result['total_requests']})")
            print(f"  Avg Response Time: {result['avg_response_time_ms']:.2f}ms")
            print(f"  P95 Response Time: {result['p95_response_time_ms']:.2f}ms")
            print(f"  Throughput: {result['throughput_rps']:.2f} requests/second")
            
            if result['errors']:
                print(f"  Sample Errors: {result['errors'][:3]}")
        
        # Overall assessment
        print(f"\nOVERALL ASSESSMENT:")
        print("-" * 40)
        
        avg_success_rate = sum(r['success_rate'] for r in report['test_results']) / len(report['test_results'])
        avg_response_time = sum(r['avg_response_time_ms'] for r in report['test_results']) / len(report['test_results'])
        total_throughput = sum(r['throughput_rps'] for r in report['test_results'])
        
        print(f"Average Success Rate: {avg_success_rate:.1f}%")
        print(f"Average Response Time: {avg_response_time:.2f}ms")
        print(f"Total Throughput: {total_throughput:.2f} requests/second")
        
        # Performance assessment
        if avg_success_rate >= 95 and avg_response_time <= 500:
            print("\n✅ EXCELLENT: Database optimizations are performing well under load!")
        elif avg_success_rate >= 90 and avg_response_time <= 1000:
            print("\n✅ GOOD: Database performance is acceptable with room for improvement.")
        elif avg_success_rate >= 80:
            print("\n⚠️  WARNING: Database performance shows some issues under load.")
        else:
            print("\n❌ CRITICAL: Database performance is poor and needs immediate attention.")


async def main():
    """Main function to run load tests"""
    async with LoadTester() as tester:
        try:
            # Run all tests
            report = await tester.run_all_tests()
            
            # Print results
            tester.print_report(report)
            
            # Save report to file
            with open('load_test_report.json', 'w') as f:
                json.dump(report, f, indent=2)
            
            print(f"\nDetailed report saved to: load_test_report.json")
            
        except Exception as e:
            print(f"Load test failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())