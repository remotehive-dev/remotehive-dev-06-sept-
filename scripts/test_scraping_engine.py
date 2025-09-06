#!/usr/bin/env python3
"""Script to test and validate the enhanced web scraping engine"""

import asyncio
import sys
import os
import argparse
import json
from typing import Dict, Any
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.scraper.engine import WebScrapingEngine, ScrapingConfig
from app.scraper.config import (
    EnhancedScrapingConfig, ScrapingMode, AntiDetectionLevel,
    get_scraping_config, set_scraping_config
)
from app.core.enums import ScraperSource
from app.scraper.exceptions import ScrapingError

class ScrapingEngineValidator:
    """Validator for the enhanced scraping engine"""
    
    def __init__(self):
        self.test_results = []
    
    async def test_configuration_loading(self) -> bool:
        """Test configuration loading from environment"""
        print("\n🔧 Testing configuration loading...")
        
        try:
            # Test default configuration
            config = EnhancedScrapingConfig()
            assert config.scraping_mode in [ScrapingMode.REQUESTS, ScrapingMode.PLAYWRIGHT, ScrapingMode.HYBRID]
            print("✅ Default configuration loaded successfully")
            
            # Test environment-based configuration
            os.environ['SCRAPING_MODE'] = 'hybrid'
            os.environ['ANTI_DETECTION_LEVEL'] = 'advanced'
            env_config = EnhancedScrapingConfig.from_env()
            assert env_config.scraping_mode == ScrapingMode.HYBRID
            assert env_config.anti_detection_level == AntiDetectionLevel.ADVANCED
            print("✅ Environment-based configuration loaded successfully")
            
            return True
        except Exception as e:
            print(f"❌ Configuration loading failed: {e}")
            return False
    
    async def test_engine_initialization(self) -> bool:
        """Test engine initialization in different modes"""
        print("\n🚀 Testing engine initialization...")
        
        try:
            # Test requests mode
            basic_config = ScrapingConfig(
                source=ScraperSource.REMOTE_OK,
                base_url="https://remoteok.io",
                user_agent="Test Agent",
                rate_limit_delay=1.0
            )
            
            enhanced_config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.REQUESTS)
            engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
            
            assert engine.scraping_mode == ScrapingMode.REQUESTS
            assert engine.session is not None
            print("✅ Requests mode engine initialized successfully")
            
            # Test hybrid mode
            enhanced_config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.HYBRID)
            engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
            
            assert engine.scraping_mode == ScrapingMode.HYBRID
            print("✅ Hybrid mode engine initialized successfully")
            
            return True
        except Exception as e:
            print(f"❌ Engine initialization failed: {e}")
            return False
    
    async def test_url_based_engine_selection(self) -> bool:
        """Test intelligent engine selection based on URL"""
        print("\n🎯 Testing URL-based engine selection...")
        
        try:
            basic_config = ScrapingConfig(
                source=ScraperSource.REMOTE_OK,
                base_url="https://remoteok.io",
                user_agent="Test Agent",
                rate_limit_delay=1.0
            )
            
            enhanced_config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.HYBRID)
            engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
            
            # Test complex sites (should use Playwright)
            complex_urls = [
                'https://linkedin.com/jobs',
                'https://glassdoor.com/jobs',
                'https://indeed.com/jobs'
            ]
            
            for url in complex_urls:
                should_use_playwright = engine._should_use_playwright_for_url(url)
                assert should_use_playwright, f"Should use Playwright for {url}"
            
            # Test simple sites (should use requests)
            simple_urls = [
                'https://remoteok.io',
                'https://weworkremotely.com',
                'https://simple-job-board.com'
            ]
            
            for url in simple_urls:
                should_use_playwright = engine._should_use_playwright_for_url(url)
                assert not should_use_playwright, f"Should use requests for {url}"
            
            print("✅ URL-based engine selection working correctly")
            return True
        except Exception as e:
            print(f"❌ URL-based engine selection failed: {e}")
            return False
    
    async def test_configuration_overrides(self) -> bool:
        """Test site-specific configuration overrides"""
        print("\n⚙️ Testing configuration overrides...")
        
        try:
            config = EnhancedScrapingConfig()
            
            # Add site-specific configuration
            config.site_configs['linkedin.com'] = {
                'rate_limit_delay': 5.0,
                'enable_stealth': True,
                'anti_detection_level': 'maximum'
            }
            
            # Test effective configuration
            effective_config = config.get_effective_config('https://linkedin.com/jobs')
            assert 'rate_limit_delay' in effective_config
            assert effective_config['rate_limit_delay'] == 5.0
            
            print("✅ Configuration overrides working correctly")
            return True
        except Exception as e:
            print(f"❌ Configuration overrides failed: {e}")
            return False
    
    async def test_error_handling(self) -> bool:
        """Test error handling and recovery"""
        print("\n🛡️ Testing error handling...")
        
        try:
            # Test with invalid configuration
            basic_config = ScrapingConfig(
                source=ScraperSource.REMOTE_OK,
                base_url="invalid-url",
                user_agent="Test Agent",
                rate_limit_delay=0.1
            )
            
            enhanced_config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.REQUESTS)
            engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
            
            # This should handle errors gracefully and return a failed result
            result = await engine.scrape_jobs(search_query='test')
            
            # Check if the result indicates failure (no jobs found, errors recorded)
            if result.success == False or len(result.errors) > 0 or result.jobs_found == 0:
                print(f"✅ Error handling working: {len(result.errors)} errors recorded, success={result.success}")
                engine.close()
                return True
            else:
                print("❌ Expected failed result but got successful result")
                engine.close()
                return False
            
        except Exception as e:
            print(f"❌ Error handling test failed: {e}")
            return False
    
    def print_configuration_summary(self):
        """Print current configuration summary"""
        print("\n📋 Current Configuration Summary:")
        print("=" * 50)
        
        config = get_scraping_config()
        
        print(f"Scraping Mode: {config.scraping_mode.value}")
        print(f"Anti-Detection Level: {config.anti_detection_level.value}")
        print(f"Playwright Headless: {config.playwright.headless}")
        print(f"Playwright Stealth: {config.playwright.enable_stealth}")
        print(f"Rate Limiting Enabled: {config.rate_limiting.enabled}")
        print(f"Rate Limit Delay: {config.rate_limiting.base_delay}s")
        print(f"Deduplication Enabled: {config.deduplication.enabled}")
        print(f"Proxy Enabled: {config.proxy.enabled}")
        print(f"Monitoring Enabled: {config.monitoring.enabled}")
        
        if config.site_configs:
            print("\nSite-Specific Configurations:")
            for site, site_config in config.site_configs.items():
                print(f"  {site}: {site_config}")
    
    async def run_all_tests(self) -> bool:
        """Run all validation tests"""
        print("🧪 Starting Enhanced Scraping Engine Validation")
        print("=" * 60)
        
        tests = [
            self.test_configuration_loading,
            self.test_engine_initialization,
            self.test_url_based_engine_selection,
            self.test_configuration_overrides,
            self.test_error_handling
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                result = await test()
                if result:
                    passed += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {e}")
        
        print(f"\n📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Enhanced scraping engine is ready.")
        else:
            print("⚠️ Some tests failed. Please check the configuration and dependencies.")
        
        return passed == total

async def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Test Enhanced Web Scraping Engine')
    parser.add_argument('--mode', choices=['requests', 'playwright', 'hybrid'], 
                       default='hybrid', help='Scraping mode to test')
    parser.add_argument('--config', action='store_true', 
                       help='Show current configuration')
    parser.add_argument('--test-url', type=str, 
                       help='Test engine selection for a specific URL')
    parser.add_argument('--validate', action='store_true', 
                       help='Run full validation suite')
    
    args = parser.parse_args()
    
    # Set up configuration based on arguments
    if args.mode:
        enhanced_config = EnhancedScrapingConfig(
            scraping_mode=ScrapingMode(args.mode)
        )
        set_scraping_config(enhanced_config)
    
    validator = ScrapingEngineValidator()
    
    if args.config:
        validator.print_configuration_summary()
        return
    
    if args.test_url:
        config = get_scraping_config()
        basic_config = ScrapingConfig(
            source=ScraperSource.REMOTE_OK,
            base_url="https://remoteok.io",
            user_agent="Test Agent",
            rate_limit_delay=1.0
        )
        engine = WebScrapingEngine(basic_config, enhanced_config=config)
        should_use_playwright = engine._should_use_playwright_for_url(args.test_url)
        engine_type = "Playwright" if should_use_playwright else "Requests"
        print(f"URL: {args.test_url}")
        print(f"Recommended Engine: {engine_type}")
        return
    
    if args.validate:
        success = await validator.run_all_tests()
        sys.exit(0 if success else 1)
    
    # Default: show configuration and run basic tests
    validator.print_configuration_summary()
    await validator.test_configuration_loading()
    await validator.test_engine_initialization()

if __name__ == '__main__':
    asyncio.run(main())