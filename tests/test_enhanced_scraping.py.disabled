"""Tests for the enhanced web scraping engine with Playwright integration"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from app.scraper.engine import WebScrapingEngine, ScrapingConfig
from app.scraper.config import (
    EnhancedScrapingConfig, ScrapingMode, AntiDetectionLevel,
    PlaywrightSettings, RateLimitingSettings, DeduplicationSettings
)
from app.scraper.playwright_engine import PlaywrightScrapingEngine, PlaywrightConfig
from app.scraper.exceptions import ScrapingError, RateLimitError, BrowserError
from app.core.enums import ScraperSource

class TestEnhancedScrapingConfig:
    """Test enhanced scraping configuration"""
    
    def test_default_config_creation(self):
        """Test creating default configuration"""
        config = EnhancedScrapingConfig()
        
        assert config.scraping_mode == ScrapingMode.REQUESTS
        assert config.anti_detection_level == AntiDetectionLevel.MODERATE
        assert config.playwright.headless is True
        assert config.rate_limiting.enabled is True
        assert config.deduplication.enabled is True
    
    def test_config_from_env(self):
        """Test configuration creation from environment variables"""
        with patch.dict('os.environ', {
            'SCRAPING_MODE': 'playwright',
            'ANTI_DETECTION_LEVEL': 'advanced',
            'PLAYWRIGHT_HEADLESS': 'false',
            'RATE_LIMITING_ENABLED': 'true',
            'REQUESTS_PER_MINUTE': '120'
        }):
            config = EnhancedScrapingConfig.from_env()
            
            assert config.scraping_mode == ScrapingMode.PLAYWRIGHT
            assert config.anti_detection_level == AntiDetectionLevel.ADVANCED
            assert config.playwright.headless is False
            assert config.rate_limiting.requests_per_minute == 120
    
    def test_should_use_playwright_logic(self):
        """Test Playwright usage decision logic"""
        # Test PLAYWRIGHT mode
        config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.PLAYWRIGHT)
        assert config.should_use_playwright('https://example.com') is True
        
        # Test REQUESTS mode
        config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.REQUESTS)
        assert config.should_use_playwright('https://linkedin.com') is False
        
        # Test HYBRID mode
        config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.HYBRID)
        assert config.should_use_playwright('https://linkedin.com') is True
        assert config.should_use_playwright('https://simple-site.com') is False
    
    def test_site_specific_config(self):
        """Test site-specific configuration overrides"""
        config = EnhancedScrapingConfig()
        config.site_configs['linkedin.com'] = {
            'rate_limit_delay': 5.0,
            'enable_stealth': True
        }
        
        effective_config = config.get_effective_config('https://linkedin.com/jobs')
        assert effective_config['rate_limit_delay'] == 5.0
        assert effective_config['enable_stealth'] is True

class TestWebScrapingEngineEnhanced:
    """Test enhanced web scraping engine"""
    
    @pytest.fixture
    def basic_config(self):
        """Basic scraping configuration"""
        return ScrapingConfig(
            source=ScraperSource.REMOTEOK,
            base_url="https://remoteok.io",
            user_agent="Test Agent",
            rate_limit_delay=1.0,
            use_playwright=False
        )
    
    @pytest.fixture
    def enhanced_config(self):
        """Enhanced scraping configuration"""
        return EnhancedScrapingConfig(
            scraping_mode=ScrapingMode.HYBRID,
            anti_detection_level=AntiDetectionLevel.MODERATE
        )
    
    def test_engine_initialization_requests_mode(self, basic_config):
        """Test engine initialization in requests mode"""
        enhanced_config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.REQUESTS)
        engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
        
        assert engine.scraping_mode == ScrapingMode.REQUESTS
        assert engine.session is not None
        assert engine.playwright_engine is None
    
    def test_engine_initialization_playwright_mode(self, basic_config):
        """Test engine initialization in Playwright mode"""
        enhanced_config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.PLAYWRIGHT)
        
        with patch('app.scraper.engine.PlaywrightScrapingEngine') as mock_playwright:
            engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
            
            assert engine.scraping_mode == ScrapingMode.PLAYWRIGHT
            assert mock_playwright.called
    
    def test_engine_initialization_hybrid_mode(self, basic_config):
        """Test engine initialization in hybrid mode"""
        enhanced_config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.HYBRID)
        
        with patch('app.scraper.engine.PlaywrightScrapingEngine') as mock_playwright:
            engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
            
            assert engine.scraping_mode == ScrapingMode.HYBRID
            assert engine.session is not None  # Should have both engines
            assert mock_playwright.called
    
    def test_should_use_playwright_for_url(self, basic_config, enhanced_config):
        """Test URL-based engine selection"""
        with patch('app.scraper.engine.PlaywrightScrapingEngine'):
            engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
            
            # Test complex sites that should use Playwright
            assert engine._should_use_playwright_for_url('https://linkedin.com/jobs') is True
            assert engine._should_use_playwright_for_url('https://glassdoor.com') is True
            
            # Test simple sites that should use requests
            assert engine._should_use_playwright_for_url('https://simple-job-board.com') is False
    
    @pytest.mark.asyncio
    async def test_scrape_jobs_with_playwright(self, basic_config):
        """Test job scraping with Playwright engine"""
        enhanced_config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.PLAYWRIGHT)
        
        mock_playwright = Mock()
        mock_playwright.scrape_jobs = AsyncMock(return_value=[])
        
        with patch('app.scraper.engine.PlaywrightScrapingEngine', return_value=mock_playwright):
            engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
            
            search_params = {'url': 'https://linkedin.com/jobs', 'query': 'python'}
            result = await engine.scrape_jobs(search_params)
            
            assert isinstance(result, list)
            mock_playwright.scrape_jobs.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_scrape_jobs_with_requests(self, basic_config):
        """Test job scraping with requests engine"""
        enhanced_config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.REQUESTS)
        
        with patch.object(WebScrapingEngine, '_scrape_with_requests', new_callable=AsyncMock) as mock_requests:
            mock_requests.return_value = []
            engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
            
            search_params = {'url': 'https://simple-site.com', 'query': 'python'}
            result = await engine.scrape_jobs(search_params)
            
            assert isinstance(result, list)
            mock_requests.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_scrape_jobs_hybrid_mode(self, basic_config):
        """Test job scraping in hybrid mode with intelligent engine selection"""
        enhanced_config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.HYBRID)
        
        mock_playwright = Mock()
        mock_playwright.scrape_jobs = AsyncMock(return_value=[])
        
        with patch('app.scraper.engine.PlaywrightScrapingEngine', return_value=mock_playwright), \
             patch.object(WebScrapingEngine, '_scrape_with_requests', new_callable=AsyncMock) as mock_requests:
            
            mock_requests.return_value = []
            engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
            
            # Test complex site (should use Playwright)
            search_params = {'url': 'https://linkedin.com/jobs', 'query': 'python'}
            await engine.scrape_jobs(search_params)
            mock_playwright.scrape_jobs.assert_called()
            
            # Test simple site (should use requests)
            search_params = {'url': 'https://simple-site.com', 'query': 'python'}
            await engine.scrape_jobs(search_params)
            mock_requests.assert_called()
    
    @pytest.mark.asyncio
    async def test_scrape_jobs_error_handling(self, basic_config):
        """Test error handling in job scraping"""
        enhanced_config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.PLAYWRIGHT)
        
        mock_playwright = Mock()
        mock_playwright.scrape_jobs = AsyncMock(side_effect=BrowserError("Browser crashed"))
        
        with patch('app.scraper.engine.PlaywrightScrapingEngine', return_value=mock_playwright):
            engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
            
            search_params = {'url': 'https://linkedin.com/jobs', 'query': 'python'}
            
            with pytest.raises(ScrapingError):
                await engine.scrape_jobs(search_params)
    
    def test_engine_cleanup(self, basic_config):
        """Test proper cleanup of engine resources"""
        enhanced_config = EnhancedScrapingConfig(scraping_mode=ScrapingMode.PLAYWRIGHT)
        
        mock_playwright = Mock()
        mock_playwright.cleanup = AsyncMock()
        
        with patch('app.scraper.engine.PlaywrightScrapingEngine', return_value=mock_playwright):
            engine = WebScrapingEngine(basic_config, enhanced_config=enhanced_config)
            engine.close()
            
            # Cleanup should be called
            mock_playwright.cleanup.assert_called_once()

class TestPlaywrightIntegration:
    """Test Playwright engine integration"""
    
    @pytest.fixture
    def playwright_config(self):
        """Playwright configuration for testing"""
        return PlaywrightConfig(
            headless=True,
            timeout=30000,
            enable_stealth=True,
            enable_deduplication=True
        )
    
    def test_playwright_config_creation(self, playwright_config):
        """Test Playwright configuration creation"""
        assert playwright_config.headless is True
        assert playwright_config.timeout == 30000
        assert playwright_config.enable_stealth is True
        assert playwright_config.enable_deduplication is True
    
    @pytest.mark.asyncio
    async def test_playwright_engine_initialization(self, playwright_config):
        """Test Playwright engine initialization"""
        with patch('playwright.async_api.async_playwright') as mock_playwright:
            engine = PlaywrightScrapingEngine(playwright_config)
            
            # Should not initialize browser until first use
            assert engine.browser is None
            assert engine.context is None
    
    @pytest.mark.asyncio
    async def test_playwright_engine_cleanup(self, playwright_config):
        """Test Playwright engine cleanup"""
        mock_browser = Mock()
        mock_browser.close = AsyncMock()
        mock_context = Mock()
        mock_context.close = AsyncMock()
        
        engine = PlaywrightScrapingEngine(playwright_config)
        engine.browser = mock_browser
        engine.context = mock_context
        
        await engine.cleanup()
        
        mock_context.close.assert_called_once()
        mock_browser.close.assert_called_once()

class TestRateLimitingAndDeduplication:
    """Test rate limiting and deduplication features"""
    
    def test_rate_limiting_settings(self):
        """Test rate limiting configuration"""
        settings = RateLimitingSettings(
            enabled=True,
            base_delay=2.0,
            adaptive=True,
            requests_per_minute=30
        )
        
        assert settings.enabled is True
        assert settings.base_delay == 2.0
        assert settings.adaptive is True
        assert settings.requests_per_minute == 30
    
    def test_deduplication_settings(self):
        """Test deduplication configuration"""
        settings = DeduplicationSettings(
            enabled=True,
            url_deduplication=True,
            content_deduplication=True,
            similarity_threshold=0.9
        )
        
        assert settings.enabled is True
        assert settings.url_deduplication is True
        assert settings.content_deduplication is True
        assert settings.similarity_threshold == 0.9

if __name__ == '__main__':
    pytest.main([__file__])