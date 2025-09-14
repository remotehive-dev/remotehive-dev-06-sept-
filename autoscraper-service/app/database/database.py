#!/usr/bin/env python3
"""
Database Manager for AutoScraper Service
Handles MongoDB Atlas connections and database operations
"""

import time
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any
from loguru import logger

from config.settings import get_settings
from app.database.mongodb_manager import AutoScraperMongoDBManager

settings = get_settings()
try:
    from app.utils.metrics import metrics
except ImportError:
    metrics = None

# Import MongoDB models
try:
    from app.models.mongodb_models import (
        JobBoard, ScheduleConfig, ScrapeJob, ScrapeRun, 
        RawJob, NormalizedJob, EngineState, ScrapingMetrics
    )
except ImportError as e:
    logger.warning(f"Could not import MongoDB models: {e}")


class DatabaseManager:
    """MongoDB database manager for autoscraper service"""
    
    def __init__(self):
        self.mongodb_manager = AutoScraperMongoDBManager()
        self._initialized = False
    
    async def initialize(self):
        """Initialize MongoDB connections"""
        if self._initialized:
            return
        try:
            # Connect to MongoDB Atlas
            success = await self.mongodb_manager.connect(
                connection_string=settings.MONGODB_URL,
                database_name=settings.MONGODB_DATABASE_NAME
            )
            
            if not success:
                raise Exception("Failed to connect to MongoDB Atlas")
            
            # Create indexes for better performance
            await self.mongodb_manager.create_indexes()
            
            self._initialized = True
            logger.info("MongoDB Atlas database initialized for autoscraper service")
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB database: {e}")
            raise
    

    
    async def get_database(self):
        """Get MongoDB database instance"""
        if not self._initialized:
            await self.initialize()
        return self.mongodb_manager.database
    
    async def get_collection(self, collection_name: str):
        """Get MongoDB collection"""
        database = await self.get_database()
        return database[collection_name]
    
    async def close(self):
        """Close MongoDB connections"""
        await self.mongodb_manager.disconnect()
        logger.info("MongoDB connections closed")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check MongoDB health"""
        try:
            success = await self.mongodb_manager.test_connection()
            if success:
                return {
                    "status": "healthy",
                    "database_type": "mongodb",
                    "database_name": settings.MONGODB_DATABASE_NAME
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": "Connection test failed",
                    "database_type": "mongodb"
                }
        except Exception as e:
            logger.error(f"MongoDB health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "database_type": "mongodb"
            }
    
    async def get_metrics(self) -> Dict[str, Any]:
        """Get MongoDB metrics"""
        try:
            if not self._initialized:
                return {
                    "database_type": "mongodb",
                    "initialized": False,
                    "error": "Database not initialized"
                }
            
            # Get MongoDB collection stats
            collection_stats = await self.mongodb_manager.get_collection_stats()
            
            return {
                "database_type": "mongodb",
                "database_name": settings.MONGODB_DATABASE_NAME,
                "collection_stats": collection_stats,
                "initialized": self._initialized,
                "connection_status": "connected" if self.mongodb_manager.client else "disconnected"
            }
        except Exception as e:
            logger.error(f"Failed to get MongoDB metrics: {e}")
            return {
                "error": str(e),
                "database_type": "mongodb",
                "initialized": self._initialized
            }


# Create global database manager
db_manager = DatabaseManager()


def get_db_session():
    """FastAPI dependency for database session"""
    try:
        db = db_manager.get_session()
        yield db
    except Exception as e:
        logger.error(f"Error getting database session: {e}")
        raise


def get_db_session_context():
    """Get database session context manager"""
    return db_manager.get_session_context()


class MongoDBRetryMixin:
    """Mixin for MongoDB operations with retry logic"""
    
    async def execute_with_retry(self, operation, max_retries: int = 3, delay: float = 1.0):
        """Execute MongoDB operation with retry logic"""
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                return await operation()
            except Exception as e:
                last_exception = e
                logger.warning(f"MongoDB operation failed (attempt {attempt + 1}/{max_retries}): {e}")
                
                if attempt < max_retries - 1:
                    await asyncio.sleep(delay * (2 ** attempt))  # Exponential backoff
                else:
                    logger.error(f"MongoDB operation failed after {max_retries} attempts")
                    raise last_exception


class MongoDBOperationMixin:
    """Mixin for MongoDB operation management"""
    
    async def with_session(self, operation):
        """Execute operation with MongoDB session (for transactions if needed)"""
        try:
            # For simple operations, we don't need sessions
            # MongoDB handles atomicity at document level
            return await operation()
        except Exception as e:
            logger.error(f"MongoDB operation failed: {e}")
            raise


class TransactionManager:
    """Context manager for database transactions"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
        self.session = None
    
    async def __aenter__(self):
        async with self.db_manager.get_session_context() as session:
            self.session = session
            return session
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # Database transactions are handled automatically
        # by the session_scope context manager
        if exc_type is not None:
            logger.error(f"Transaction error: {exc_val}")
        return False  # Don't suppress exceptions


async def create_tables():
    """Create database tables (for development/testing)"""
    try:
        async with db_manager.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise


async def drop_tables():
    """Drop database tables (for development/testing)"""
    try:
        async with db_manager.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        logger.info("Database tables dropped successfully")
    except Exception as e:
        logger.error(f"Failed to drop database tables: {e}")
        raise


# Cleanup function for graceful shutdown
async def cleanup_database():
    """Cleanup database connections on shutdown"""
    await db_manager.close()