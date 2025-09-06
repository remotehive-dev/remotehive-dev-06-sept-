#!/usr/bin/env python3

import asyncio
from unittest.mock import patch, AsyncMock
from app.autoscraper.service_adapter import get_autoscraper_adapter

async def test_mock_directly():
    """Test the mock directly to see if it works"""
    # Create mock
    mock = AsyncMock()
    
    # Make it an async context manager
    mock.__aenter__ = AsyncMock(return_value=mock)
    mock.__aexit__ = AsyncMock(return_value=None)
    
    # Set up health_check return value
    mock.health_check.return_value = {
        "status": "healthy",
        "services": {
            "database": {"status": "healthy", "response_time": 0.05},
            "redis": {"status": "healthy", "response_time": 0.02}
        },
        "version": "1.0.0",
        "timestamp": "2024-01-15T10:30:00Z"
    }
    
    # Test the mock directly
    print("Testing mock directly...")
    async with mock:
        result = await mock.health_check()
        print(f"Direct mock result: {result}")
    
    # Test with patch
    print("\nTesting with patch...")
    with patch('app.autoscraper.service_adapter.get_autoscraper_adapter', return_value=mock):
        adapter = get_autoscraper_adapter()
        print(f"Adapter type: {type(adapter)}")
        async with adapter:
            result = await adapter.health_check()
            print(f"Patched result: {result}")

if __name__ == "__main__":
    asyncio.run(test_mock_directly())