#!/usr/bin/env python3
"""
Database Manager for AutoScraper Service
Handles database connections and session management
"""

import time
from contextlib import asynccontextmanager
from typing import Dict, Any
from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker

from config.settings import get_settings
from app.models.models import Base

settings = get_settings()
from app.utils.metrics import metrics


# Import models from models package for SQLAlchemy
try:
    from app.models import (
        JobBoard, ScheduleConfig, ScrapeJob, ScrapeRun, 
        RawJob, NormalizedJob, EngineState
    )
except ImportError as e:
    logger.warning(f"Could not import models: {e}")


class DatabaseManager:
    """Database manager for autoscraper service"""
    
    def __init__(self):
        # Convert sqlite URL to async if needed
        database_url = settings.DATABASE_URL
        if database_url.startswith("sqlite://"):
            self.async_database_url = database_url.replace("sqlite://", "sqlite+aiosqlite://")
        else:
            self.async_database_url = database_url
            
        self.engine = None
        self.async_session_maker = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize database connections"""
        if self._initialized:
            return
        try:
            # Create async engine
            self.engine = create_async_engine(
                self.async_database_url,
                echo=settings.ENVIRONMENT == "development",
                pool_size=settings.DATABASE_POOL_SIZE,
                max_overflow=settings.DATABASE_MAX_OVERFLOW,
                pool_timeout=settings.DATABASE_POOL_TIMEOUT,
                pool_recycle=settings.DATABASE_POOL_RECYCLE
            )
            
            # Create session maker
            self.async_session_maker = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            # Create tables
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            
            self._initialized = True
            logger.info("SQLAlchemy database initialized for autoscraper service")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    

    
    def get_session(self):
        """Get database session (sync version - not recommended)"""
        if not self.async_session_maker:
            raise RuntimeError("Database not initialized")
        return self.async_session_maker()
    
    @asynccontextmanager
    async def get_session_context(self):
        """Get database session context manager"""
        if not self.async_session_maker:
            raise RuntimeError("Database not initialized")
            
        async with self.async_session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.error(f"Database session error: {e}")
                raise
    
    async def health_check(self) -> dict:
        """Perform database health check"""
        try:
            start_time = time.time()
            
            async with self.get_session_context() as session:
                await session.execute("SELECT 1")
            
            duration = time.time() - start_time
            
            return {
                "status": "healthy",
                "response_time_ms": round(duration * 1000, 2)
            }
            
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    async def close(self):
        """Close database connections"""
        if self.engine:
            await self.engine.dispose()
        logger.info("Database connections closed")


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


class DatabaseRetryMixin:
    """Mixin for database operations with retry logic"""
    
    @staticmethod
    async def with_retry(func, max_retries: int = 3, delay: float = 1.0):
        """Execute database operation with retry logic"""
        for attempt in range(max_retries):
            try:
                return await func()
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"Database operation failed after {max_retries} attempts: {e}")
                    raise
                
                logger.warning(
                    f"Database operation failed (attempt {attempt + 1}/{max_retries}): {e}. "
                    f"Retrying in {delay}s..."
                )
                time.sleep(delay)
                delay *= 2  # Exponential backoff


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