#!/usr/bin/env python3
"""
Service Integration Test Script
Tests JWT authentication and service discovery between RemoteHive services
"""

import asyncio
import aiohttp
import sys
import os
from pathlib import Path
from loguru import logger
from typing import Dict, Any, Optional

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.utils.jwt_auth import get_jwt_manager, JWTError
from app.utils.service_discovery import get_service_registry, HealthChecker


class ServiceIntegrationTester:
    """Test service integration and JWT authentication"""
    
    def __init__(self):
        self.jwt_manager = get_jwt_manager()
        self.service_registry = get_service_registry()
        self.health_checker = HealthChecker()
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def test_jwt_token_creation(self) -> bool:
        """Test JWT token creation and validation"""
        logger.info("Testing JWT token creation and validation...")
        
        try:
            # Test user access token
            user_token = self.jwt_manager.create_access_token(
                subject="test@example.com",
                additional_claims={
                    "role": "job_seeker",
                    "email": "test@example.com"
                }
            )
            logger.info(f"Created user access token: {user_token[:50]}...")
            
            # Validate user token
            user_payload = self.jwt_manager.decode_token(user_token)
            logger.info(f"User token payload: {user_payload}")
            
            # Test service token
            service_token = self.jwt_manager.create_service_token(
                service_name="autoscraper",
                permissions=["scrape_jobs", "update_status"]
            )
            logger.info(f"Created service token: {service_token[:50]}...")
            
            # Validate service token
            service_payload = self.jwt_manager.decode_token(service_token)
            logger.info(f"Service token payload: {service_payload}")
            
            # Test refresh token
            refresh_token = self.jwt_manager.create_refresh_token("test@example.com")
            logger.info(f"Created refresh token: {refresh_token[:50]}...")
            
            refresh_payload = self.jwt_manager.decode_token(refresh_token)
            logger.info(f"Refresh token payload: {refresh_payload}")
            
            logger.success("✅ JWT token creation and validation tests passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ JWT token test failed: {e}")
            return False
    
    async def test_service_discovery(self) -> bool:
        """Test service discovery and health checks"""
        logger.info("Testing service discovery...")
        
        try:
            # List registered services
            services = self.service_registry.list_services()
            logger.info(f"Registered services: {list(services.keys())}")
            
            # Test health checks for each service
            for service_name, service_info in services.items():
                logger.info(f"Testing health check for {service_name}...")
                
                try:
                    is_healthy = await self.health_checker.check_health(
                        service_info.base_url,
                        timeout=5.0
                    )
                    
                    if is_healthy:
                        logger.success(f"✅ {service_name} is healthy")
                    else:
                        logger.warning(f"⚠️ {service_name} is not responding")
                        
                except Exception as e:
                    logger.warning(f"⚠️ {service_name} health check failed: {e}")
            
            logger.success("✅ Service discovery tests completed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Service discovery test failed: {e}")
            return False
    
    async def test_service_authentication(self) -> bool:
        """Test service-to-service authentication"""
        logger.info("Testing service-to-service authentication...")
        
        if not self.session:
            logger.error("HTTP session not initialized")
            return False
        
        try:
            # Get autoscraper service info
            autoscraper_service = self.service_registry.get_service("autoscraper")
            if not autoscraper_service:
                logger.warning("Autoscraper service not registered, skipping auth test")
                return True
            
            # Create service token for main service
            service_token = self.jwt_manager.create_service_token(
                service_name="main",
                permissions=["access_autoscraper"]
            )
            
            # Test authenticated request to autoscraper health endpoint
            headers = {
                "Authorization": f"Bearer {service_token}",
                "Content-Type": "application/json"
            }
            
            health_url = f"{autoscraper_service.base_url}/health"
            logger.info(f"Testing authenticated request to: {health_url}")
            
            async with self.session.get(health_url, headers=headers, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.success(f"✅ Authenticated request successful: {data}")
                    return True
                else:
                    logger.warning(f"⚠️ Authenticated request failed with status: {response.status}")
                    text = await response.text()
                    logger.warning(f"Response: {text}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Service authentication test failed: {e}")
            return False
    
    async def test_token_validation_errors(self) -> bool:
        """Test token validation error handling"""
        logger.info("Testing token validation error handling...")
        
        try:
            # Test invalid token
            try:
                self.jwt_manager.decode_token("invalid.token.here")
                logger.error("❌ Invalid token should have raised an error")
                return False
            except JWTError:
                logger.success("✅ Invalid token correctly rejected")
            
            # Test expired token (create with very short expiry)
            from datetime import timedelta
            expired_token = self.jwt_manager.create_access_token(
                subject="test@example.com",
                expires_delta=timedelta(seconds=-1)  # Already expired
            )
            
            try:
                self.jwt_manager.decode_token(expired_token)
                logger.error("❌ Expired token should have raised an error")
                return False
            except JWTError:
                logger.success("✅ Expired token correctly rejected")
            
            logger.success("✅ Token validation error handling tests passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Token validation error test failed: {e}")
            return False
    
    async def run_all_tests(self) -> Dict[str, bool]:
        """Run all integration tests"""
        logger.info("🚀 Starting RemoteHive Service Integration Tests")
        logger.info("=" * 60)
        
        results = {
            "jwt_tokens": await self.test_jwt_token_creation(),
            "service_discovery": await self.test_service_discovery(),
            "service_auth": await self.test_service_authentication(),
            "error_handling": await self.test_token_validation_errors()
        }
        
        logger.info("=" * 60)
        logger.info("📊 Test Results Summary:")
        
        passed = 0
        total = len(results)
        
        for test_name, passed_test in results.items():
            status = "✅ PASSED" if passed_test else "❌ FAILED"
            logger.info(f"  {test_name}: {status}")
            if passed_test:
                passed += 1
        
        logger.info(f"\n🎯 Overall: {passed}/{total} tests passed")
        
        if passed == total:
            logger.success("🎉 All integration tests passed!")
        else:
            logger.error(f"💥 {total - passed} tests failed")
        
        return results


async def main():
    """Main test runner"""
    # Configure logging
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )
    
    try:
        async with ServiceIntegrationTester() as tester:
            results = await tester.run_all_tests()
            
            # Exit with error code if any tests failed
            if not all(results.values()):
                sys.exit(1)
                
    except KeyboardInterrupt:
        logger.warning("Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Test runner failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())