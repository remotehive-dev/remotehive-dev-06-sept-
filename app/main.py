from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from loguru import logger
import logging
from app.database import init_database
from app.api.v1 import api_router
from app.api.employers import router as employers_router
from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.monitoring import app_monitor
from app.scraper.config import get_scraping_config, set_scraping_config, EnhancedScrapingConfig
from app.middleware.error_handler import (
    ErrorHandlingMiddleware,
    HealthCheckMiddleware,
    validation_exception_handler,
    http_exception_handler
)
from app.middleware.security import SecurityMiddleware, CSRFProtectionMiddleware
from app.middleware.validation import ValidationMiddleware
from app.middleware.enhanced_middleware import EnhancedMiddleware
from app.api.versioning import VersionRegistry, add_version_headers
from app.api.documentation import APIDocumentation
from app.api.integration import setup_enhanced_api

# Setup centralized logging
setup_logging()
app_logger = get_logger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    app_logger.info("Starting up RemoteHive API...")
    try:
        # Initialize MongoDB database
        await init_database()
        app_logger.info("MongoDB database initialized successfully")
        
        # Initialize enhanced scraping configuration
        scraping_config = EnhancedScrapingConfig.from_env()
        set_scraping_config(scraping_config)
        app_logger.info(f"Enhanced scraping engine initialized in {scraping_config.scraping_mode.value} mode")
        
        # Start monitoring systems (temporarily disabled for debugging)
        # await app_monitor.start()
        app_logger.info("Monitoring systems startup skipped for debugging")
        
    except Exception as e:
        app_logger.error(f"Failed to initialize application: {e}")
        raise
    
    app_logger.info("RemoteHive API started successfully")
    yield
    
    app_logger.info("Shutting down RemoteHive API...")
    try:
        # Stop monitoring systems (temporarily disabled for debugging)
        # await app_monitor.stop()
        app_logger.info("Monitoring systems shutdown skipped for debugging")
    except Exception as e:
        app_logger.error(f"Error during shutdown: {e}")

# Create FastAPI instance
app = FastAPI(
    title="RemoteHive API",
    description="A comprehensive job board platform for remote work opportunities with enhanced API design",
    version="2.0.0",
    lifespan=lifespan
)

# Add basic middleware (order matters - add from innermost to outermost)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(HealthCheckMiddleware)
app.add_middleware(ValidationMiddleware)
app.add_middleware(SecurityMiddleware)
app.add_middleware(CSRFProtectionMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup enhanced API integration (includes validation, versioning, documentation, etc.)
api_integration = setup_enhanced_api(app)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Include direct API routes for admin panel compatibility
app.include_router(employers_router, prefix="/api/employers")



# Register exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)

@app.get("/")
async def root():
    """Root endpoint"""
    app_logger.info("Root endpoint accessed")
    return {
        "message": "Welcome to RemoteHive API - Powered by MongoDB Atlas",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics"
    }

@app.get("/health")
async def health_check():
    """Simple health check endpoint for Kubernetes probes"""
    try:
        # Simple health check without monitoring system dependency
        from datetime import datetime
        return {
            "status": "healthy",
            "service": "RemoteHive API",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "2.0.0"
        }
    except Exception as e:
        app_logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy", 
            "service": "RemoteHive API", 
            "error": str(e)
        }

@app.get("/metrics")
async def get_metrics():
    """Get application metrics"""
    try:
        return app_monitor.get_monitoring_data()
    except Exception as e:
        app_logger.error(f"Failed to get metrics: {e}")
        return {"error": "Failed to retrieve metrics"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )