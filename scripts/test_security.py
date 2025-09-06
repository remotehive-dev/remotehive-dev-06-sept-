#!/usr/bin/env python3
"""
Security Testing Script for RemoteHive API

This script tests various security features implemented in the application:
- Input validation and sanitization
- XSS protection
- SQL injection protection
- Path traversal protection
- Command injection protection
- Rate limiting
- Security headers
- CSRF protection
- File upload security
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, List, Any, Optional
from urllib.parse import urljoin
import argparse
from dataclasses import dataclass
from enum import Enum


class TestResult(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"
    ERROR = "ERROR"


@dataclass
class SecurityTest:
    name: str
    description: str
    test_func: callable
    category: str
    severity: str = "medium"


@dataclass
class TestReport:
    test_name: str
    result: TestResult
    message: str
    details: Optional[Dict[str, Any]] = None
    duration: float = 0.0


class SecurityTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session: Optional[aiohttp.ClientSession] = None
        self.reports: List[TestReport] = []
        
        # Test payloads
        self.xss_payloads = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
            "<svg onload=alert('XSS')>",
            "'><script>alert('XSS')</script>",
            "%3Cscript%3Ealert('XSS')%3C/script%3E"
        ]
        
        self.sql_injection_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --",
            "1' OR 1=1 --",
            "admin'--",
            "' OR 1=1#"
        ]
        
        self.path_traversal_payloads = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "....//....//....//etc/passwd",
            "/var/www/../../etc/passwd"
        ]
        
        self.command_injection_payloads = [
            "; ls -la",
            "| whoami",
            "&& cat /etc/passwd",
            "`id`",
            "$(whoami)",
            "; rm -rf /"
        ]

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def run_test(self, test: SecurityTest) -> TestReport:
        """Run a single security test"""
        start_time = time.time()
        try:
            result, message, details = await test.test_func()
            duration = time.time() - start_time
            
            report = TestReport(
                test_name=test.name,
                result=result,
                message=message,
                details=details,
                duration=duration
            )
            
            self.reports.append(report)
            return report
            
        except Exception as e:
            duration = time.time() - start_time
            report = TestReport(
                test_name=test.name,
                result=TestResult.ERROR,
                message=f"Test error: {str(e)}",
                duration=duration
            )
            self.reports.append(report)
            return report

    async def test_xss_protection(self) -> tuple:
        """Test XSS protection"""
        blocked_count = 0
        total_tests = len(self.xss_payloads)
        
        for payload in self.xss_payloads:
            try:
                # Test in query parameter
                async with self.session.get(
                    f"{self.base_url}/api/v1/security/health",
                    params={"search": payload}
                ) as response:
                    if response.status == 400:
                        blocked_count += 1
                
                # Test in JSON body
                async with self.session.post(
                    f"{self.base_url}/api/v1/security/incident",
                    json={"incident_type": payload, "description": "test"}
                ) as response:
                    if response.status == 400:
                        blocked_count += 1
                        
            except Exception:
                pass
        
        if blocked_count >= total_tests * 0.8:  # 80% blocked is good
            return TestResult.PASS, f"XSS protection working: {blocked_count}/{total_tests * 2} blocked", {"blocked": blocked_count, "total": total_tests * 2}
        else:
            return TestResult.FAIL, f"Insufficient XSS protection: {blocked_count}/{total_tests * 2} blocked", {"blocked": blocked_count, "total": total_tests * 2}

    async def test_sql_injection_protection(self) -> tuple:
        """Test SQL injection protection"""
        blocked_count = 0
        total_tests = len(self.sql_injection_payloads)
        
        for payload in self.sql_injection_payloads:
            try:
                async with self.session.get(
                    f"{self.base_url}/api/v1/security/health",
                    params={"id": payload}
                ) as response:
                    if response.status == 400:
                        blocked_count += 1
                        
            except Exception:
                pass
        
        if blocked_count >= total_tests * 0.8:
            return TestResult.PASS, f"SQL injection protection working: {blocked_count}/{total_tests} blocked", {"blocked": blocked_count, "total": total_tests}
        else:
            return TestResult.FAIL, f"Insufficient SQL injection protection: {blocked_count}/{total_tests} blocked", {"blocked": blocked_count, "total": total_tests}

    async def test_path_traversal_protection(self) -> tuple:
        """Test path traversal protection"""
        blocked_count = 0
        total_tests = len(self.path_traversal_payloads)
        
        for payload in self.path_traversal_payloads:
            try:
                async with self.session.get(
                    f"{self.base_url}/api/v1/security/health",
                    params={"file": payload}
                ) as response:
                    if response.status == 400:
                        blocked_count += 1
                        
            except Exception:
                pass
        
        if blocked_count >= total_tests * 0.8:
            return TestResult.PASS, f"Path traversal protection working: {blocked_count}/{total_tests} blocked", {"blocked": blocked_count, "total": total_tests}
        else:
            return TestResult.FAIL, f"Insufficient path traversal protection: {blocked_count}/{total_tests} blocked", {"blocked": blocked_count, "total": total_tests}

    async def test_command_injection_protection(self) -> tuple:
        """Test command injection protection"""
        blocked_count = 0
        total_tests = len(self.command_injection_payloads)
        
        for payload in self.command_injection_payloads:
            try:
                async with self.session.post(
                    f"{self.base_url}/api/v1/security/incident",
                    json={"incident_type": "test", "description": payload}
                ) as response:
                    if response.status == 400:
                        blocked_count += 1
                        
            except Exception:
                pass
        
        if blocked_count >= total_tests * 0.8:
            return TestResult.PASS, f"Command injection protection working: {blocked_count}/{total_tests} blocked", {"blocked": blocked_count, "total": total_tests}
        else:
            return TestResult.FAIL, f"Insufficient command injection protection: {blocked_count}/{total_tests} blocked", {"blocked": blocked_count, "total": total_tests}

    async def test_rate_limiting(self) -> tuple:
        """Test rate limiting"""
        requests_sent = 0
        rate_limited = False
        
        # Send rapid requests
        for i in range(150):  # Exceed typical rate limit
            try:
                async with self.session.get(f"{self.base_url}/api/v1/security/health") as response:
                    requests_sent += 1
                    if response.status == 429:  # Too Many Requests
                        rate_limited = True
                        break
            except Exception:
                break
        
        if rate_limited:
            return TestResult.PASS, f"Rate limiting working: blocked after {requests_sent} requests", {"requests_sent": requests_sent}
        else:
            return TestResult.FAIL, f"Rate limiting not working: sent {requests_sent} requests without blocking", {"requests_sent": requests_sent}

    async def test_security_headers(self) -> tuple:
        """Test security headers"""
        try:
            async with self.session.get(f"{self.base_url}/api/v1/security/health") as response:
                headers = response.headers
                
                expected_headers = {
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY',
                    'X-XSS-Protection': '1; mode=block',
                    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                    'Content-Security-Policy': None  # Just check if present
                }
                
                present_headers = []
                missing_headers = []
                
                for header, expected_value in expected_headers.items():
                    if header in headers:
                        present_headers.append(header)
                        if expected_value and headers[header] != expected_value:
                            missing_headers.append(f"{header} (incorrect value)")
                    else:
                        missing_headers.append(header)
                
                if len(missing_headers) == 0:
                    return TestResult.PASS, "All security headers present", {"present": present_headers}
                elif len(missing_headers) <= 2:
                    return TestResult.PASS, f"Most security headers present, missing: {missing_headers}", {"present": present_headers, "missing": missing_headers}
                else:
                    return TestResult.FAIL, f"Many security headers missing: {missing_headers}", {"present": present_headers, "missing": missing_headers}
                    
        except Exception as e:
            return TestResult.ERROR, f"Failed to check security headers: {e}", None

    async def test_oversized_request_protection(self) -> tuple:
        """Test protection against oversized requests"""
        try:
            # Create a large payload (5MB)
            large_data = "x" * (5 * 1024 * 1024)
            
            async with self.session.post(
                f"{self.base_url}/api/v1/security/incident",
                json={"incident_type": "test", "description": large_data}
            ) as response:
                if response.status == 413:  # Payload Too Large
                    return TestResult.PASS, "Oversized request protection working", {"status": response.status}
                else:
                    return TestResult.FAIL, f"Oversized request not blocked: {response.status}", {"status": response.status}
                    
        except Exception as e:
            # Connection errors might indicate the request was blocked
            if "payload" in str(e).lower() or "size" in str(e).lower():
                return TestResult.PASS, "Oversized request blocked by server", {"error": str(e)}
            else:
                return TestResult.ERROR, f"Test error: {e}", None

    async def test_csp_reporting(self) -> tuple:
        """Test CSP violation reporting"""
        try:
            csp_report = {
                "csp_report": {
                    "document-uri": "https://example.com/page",
                    "referrer": "https://example.com/",
                    "violated-directive": "script-src 'self'",
                    "effective-directive": "script-src",
                    "original-policy": "script-src 'self'; report-uri /api/v1/security/csp-report",
                    "blocked-uri": "https://evil.com/script.js",
                    "status-code": 200
                }
            }
            
            async with self.session.post(
                f"{self.base_url}/api/v1/security/csp-report",
                json=csp_report
            ) as response:
                if response.status == 204:  # No Content (expected for CSP reports)
                    return TestResult.PASS, "CSP reporting endpoint working", {"status": response.status}
                else:
                    return TestResult.FAIL, f"CSP reporting failed: {response.status}", {"status": response.status}
                    
        except Exception as e:
            return TestResult.ERROR, f"CSP reporting test error: {e}", None

    async def test_security_stats_endpoint(self) -> tuple:
        """Test security statistics endpoint"""
        try:
            async with self.session.get(f"{self.base_url}/api/v1/security/stats") as response:
                if response.status == 200:
                    data = await response.json()
                    required_fields = [
                        'blocked_requests', 'xss_attempts', 'sql_injection_attempts',
                        'path_traversal_attempts', 'command_injection_attempts',
                        'rate_limit_violations', 'oversized_requests'
                    ]
                    
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        return TestResult.PASS, "Security stats endpoint working", {"data": data}
                    else:
                        return TestResult.FAIL, f"Security stats missing fields: {missing_fields}", {"data": data}
                else:
                    return TestResult.FAIL, f"Security stats endpoint failed: {response.status}", {"status": response.status}
                    
        except Exception as e:
            return TestResult.ERROR, f"Security stats test error: {e}", None

    def get_tests(self) -> List[SecurityTest]:
        """Get all security tests"""
        return [
            SecurityTest(
                name="XSS Protection",
                description="Test Cross-Site Scripting (XSS) protection",
                test_func=self.test_xss_protection,
                category="Input Validation",
                severity="high"
            ),
            SecurityTest(
                name="SQL Injection Protection",
                description="Test SQL injection protection",
                test_func=self.test_sql_injection_protection,
                category="Input Validation",
                severity="critical"
            ),
            SecurityTest(
                name="Path Traversal Protection",
                description="Test path traversal protection",
                test_func=self.test_path_traversal_protection,
                category="Input Validation",
                severity="high"
            ),
            SecurityTest(
                name="Command Injection Protection",
                description="Test command injection protection",
                test_func=self.test_command_injection_protection,
                category="Input Validation",
                severity="critical"
            ),
            SecurityTest(
                name="Rate Limiting",
                description="Test rate limiting functionality",
                test_func=self.test_rate_limiting,
                category="DoS Protection",
                severity="medium"
            ),
            SecurityTest(
                name="Security Headers",
                description="Test security headers presence",
                test_func=self.test_security_headers,
                category="Headers",
                severity="medium"
            ),
            SecurityTest(
                name="Oversized Request Protection",
                description="Test protection against oversized requests",
                test_func=self.test_oversized_request_protection,
                category="DoS Protection",
                severity="medium"
            ),
            SecurityTest(
                name="CSP Reporting",
                description="Test Content Security Policy violation reporting",
                test_func=self.test_csp_reporting,
                category="Headers",
                severity="low"
            ),
            SecurityTest(
                name="Security Stats Endpoint",
                description="Test security statistics endpoint",
                test_func=self.test_security_stats_endpoint,
                category="Monitoring",
                severity="low"
            )
        ]

    def print_report(self):
        """Print test results report"""
        print("\n" + "=" * 80)
        print("SECURITY TEST REPORT")
        print("=" * 80)
        
        # Summary
        total_tests = len(self.reports)
        passed = len([r for r in self.reports if r.result == TestResult.PASS])
        failed = len([r for r in self.reports if r.result == TestResult.FAIL])
        errors = len([r for r in self.reports if r.result == TestResult.ERROR])
        skipped = len([r for r in self.reports if r.result == TestResult.SKIP])
        
        print(f"\nSUMMARY:")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed} ({passed/total_tests*100:.1f}%)")
        print(f"Failed: {failed} ({failed/total_tests*100:.1f}%)")
        print(f"Errors: {errors} ({errors/total_tests*100:.1f}%)")
        print(f"Skipped: {skipped} ({skipped/total_tests*100:.1f}%)")
        
        # Detailed results
        print(f"\nDETAILED RESULTS:")
        print("-" * 80)
        
        for report in self.reports:
            status_symbol = {
                TestResult.PASS: "✓",
                TestResult.FAIL: "✗",
                TestResult.ERROR: "!",
                TestResult.SKIP: "-"
            }[report.result]
            
            print(f"{status_symbol} {report.test_name:<30} [{report.result.value}] ({report.duration:.2f}s)")
            print(f"  {report.message}")
            if report.details:
                print(f"  Details: {report.details}")
            print()
        
        # Security score
        if total_tests > 0:
            security_score = (passed / total_tests) * 100
            print(f"SECURITY SCORE: {security_score:.1f}%")
            
            if security_score >= 90:
                print("🟢 EXCELLENT - Your application has strong security measures")
            elif security_score >= 75:
                print("🟡 GOOD - Your application has decent security, but could be improved")
            elif security_score >= 50:
                print("🟠 FAIR - Your application has basic security, significant improvements needed")
            else:
                print("🔴 POOR - Your application has serious security vulnerabilities")
        
        print("=" * 80)


async def main():
    parser = argparse.ArgumentParser(description="Security testing for RemoteHive API")
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Base URL of the API (default: http://localhost:8000)"
    )
    parser.add_argument(
        "--test",
        help="Run specific test by name"
    )
    parser.add_argument(
        "--category",
        help="Run tests in specific category"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results in JSON format"
    )
    
    args = parser.parse_args()
    
    async with SecurityTester(args.url) as tester:
        tests = tester.get_tests()
        
        # Filter tests if specified
        if args.test:
            tests = [t for t in tests if t.name.lower() == args.test.lower()]
        elif args.category:
            tests = [t for t in tests if t.category.lower() == args.category.lower()]
        
        if not tests:
            print("No tests found matching criteria")
            return
        
        print(f"Running {len(tests)} security tests against {args.url}...\n")
        
        # Run tests
        for test in tests:
            print(f"Running: {test.name}...", end=" ")
            report = await tester.run_test(test)
            print(f"[{report.result.value}]")
        
        # Print results
        if args.json:
            results = {
                "summary": {
                    "total": len(tester.reports),
                    "passed": len([r for r in tester.reports if r.result == TestResult.PASS]),
                    "failed": len([r for r in tester.reports if r.result == TestResult.FAIL]),
                    "errors": len([r for r in tester.reports if r.result == TestResult.ERROR]),
                    "skipped": len([r for r in tester.reports if r.result == TestResult.SKIP])
                },
                "tests": [
                    {
                        "name": r.test_name,
                        "result": r.result.value,
                        "message": r.message,
                        "details": r.details,
                        "duration": r.duration
                    }
                    for r in tester.reports
                ]
            }
            print(json.dumps(results, indent=2))
        else:
            tester.print_report()


if __name__ == "__main__":
    asyncio.run(main())