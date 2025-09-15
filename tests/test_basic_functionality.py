#!/usr/bin/env python3
"""
Basic functionality tests for RemoteHive
Simple tests that verify core functionality without external dependencies
"""

import pytest
import sys
import os
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "app"))

def test_python_version():
    """Test that we're running a supported Python version"""
    assert sys.version_info >= (3, 8), "Python 3.8+ is required"

def test_project_structure():
    """Test that essential project files exist"""
    project_root = Path(__file__).parent.parent
    
    # Check for essential files
    essential_files = [
        "app/main.py",
        "app/core/config.py",
        "requirements.txt",
        "README.md"
    ]
    
    for file_path in essential_files:
        full_path = project_root / file_path
        assert full_path.exists(), f"Essential file {file_path} is missing"

def test_app_imports():
    """Test that core app modules can be imported"""
    try:
        from app.core import config
        from app import main
        assert True, "Core modules imported successfully"
    except ImportError as e:
        pytest.fail(f"Failed to import core modules: {e}")

def test_config_loading():
    """Test that configuration can be loaded successfully"""
    try:
        from app.core.config import settings
        # Check that essential configuration is loaded
        assert hasattr(settings, 'MONGODB_URL'), "Settings should have MONGODB_URL"
        assert hasattr(settings, 'SECRET_KEY'), "Settings should have SECRET_KEY"
        assert hasattr(settings, 'REDIS_URL'), "Settings should have REDIS_URL"
        # Verify the values are not empty
        assert settings.MONGODB_URL, "MONGODB_URL should not be empty"
        assert settings.SECRET_KEY, "SECRET_KEY should not be empty"
        assert settings.REDIS_URL, "REDIS_URL should not be empty"
    except Exception as e:
        pytest.fail(f"Failed to load configuration: {e}")

def test_fastapi_app_creation():
    """Test that FastAPI app can be created"""
    try:
        from app.main import app
        assert app is not None, "FastAPI app should be created"
        assert hasattr(app, 'routes'), "App should have routes"
    except Exception as e:
        pytest.fail(f"Failed to create FastAPI app: {e}")

def test_environment_variables():
    """Test environment variable handling"""
    # Test that we can set and read environment variables
    test_var = "TEST_REMOTEHIVE_VAR"
    test_value = "test_value_123"
    
    os.environ[test_var] = test_value
    assert os.getenv(test_var) == test_value
    
    # Clean up
    del os.environ[test_var]

def test_requirements_file():
    """Test that requirements.txt exists and is readable"""
    requirements_path = Path(__file__).parent.parent / "requirements.txt"
    assert requirements_path.exists(), "requirements.txt should exist"
    
    with open(requirements_path, 'r') as f:
        content = f.read()
        assert len(content) > 0, "requirements.txt should not be empty"
        assert "fastapi" in content.lower(), "FastAPI should be in requirements"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])