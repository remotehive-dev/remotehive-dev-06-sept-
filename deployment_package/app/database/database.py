import os
import time
import threading
from datetime import datetime, timedelta
from contextlib import contextmanager
import logging
from typing import Generator, Dict, Any, Optional

# Import SQLAlchemy components
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Import MongoDB manager
from .mongodb_manager import MongoDBManager
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Unified database manager for MongoDB and SQLAlchemy operations."""
    def __init__(self):
        self.mongodb_manager = MongoDBManager()
        self._metrics = {
            'total_connections': 0,
            'failed_connections': 0,
            'query_count': 0,
            'slow_queries': 0,
            'last_health_check': None,
            'uptime_start': datetime.now()
        }
        self._lock = threading.Lock()
        self._initialized = False
        
        # SQLAlchemy components
        self.engine = None
        self.SessionLocal = None
        self._init_sqlalchemy()
    
    def _init_sqlalchemy(self):
        """Initialize SQLAlchemy engine and session factory."""
        try:
            database_url = getattr(settings, 'DATABASE_URL', None)
            if database_url:
                # Create SQLAlchemy engine
                self.engine = create_engine(
                    database_url,
                    pool_pre_ping=True,
                    pool_recycle=3600,
                    echo=False
                )
                
                # Create session factory
                self.SessionLocal = sessionmaker(
                    autocommit=False,
                    autoflush=False,
                    bind=self.engine
                )
                
                logger.info("SQLAlchemy engine initialized successfully")
            else:
                logger.warning("DATABASE_URL not found in settings, SQLAlchemy not initialized")
        except Exception as e:
            logger.error(f"Failed to initialize SQLAlchemy: {e}")
            self.engine = None
            self.SessionLocal = None
    
    async def initialize(self):
        """Initialize MongoDB connection."""
        if self._initialized:
            return
        try:
            await self.mongodb_manager.connect()
            logger.info("MongoDB connection initialized successfully")
            self._initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB connection: {e}")
            raise
    
    async def create_tables(self):
        """Initialize MongoDB collections and indexes."""
        try:
            await self.mongodb_manager.create_indexes()
            logger.info("MongoDB collections and indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating MongoDB collections: {e}")
            raise
    
    async def drop_tables(self):
        """Drop MongoDB database."""
        try:
            await self.mongodb_manager.drop_database()
            logger.info("MongoDB database dropped successfully")
        except Exception as e:
            logger.error(f"Error dropping MongoDB database: {e}")
            raise
    
    def get_session(self):
        """Get MongoDB database instance with connection tracking."""
        with self._lock:
            self._metrics['total_connections'] += 1
        
        try:
            db = self.mongodb_manager.get_database()
            if db is None:
                with self._lock:
                    self._metrics['failed_connections'] += 1
                raise Exception("Failed to get MongoDB database")
            return db
        except Exception as e:
            with self._lock:
                self._metrics['failed_connections'] += 1
            logger.error(f"Error getting MongoDB session: {e}")
            raise
    
    def get_sqlalchemy_session(self) -> Session:
        """Get SQLAlchemy session for ORM operations."""
        if not self.SessionLocal:
            raise Exception("SQLAlchemy not initialized. Check DATABASE_URL configuration.")
        
        with self._lock:
            self._metrics['total_connections'] += 1
        
        try:
            session = self.SessionLocal()
            return session
        except Exception as e:
            with self._lock:
                self._metrics['failed_connections'] += 1
            logger.error(f"Error creating SQLAlchemy session: {e}")
            raise
    
    @contextmanager
    def session_scope(self):
        """Provide a transactional scope around MongoDB operations."""
        db = None
        try:
            db = self.get_session()
            with self._lock:
                self._metrics['query_count'] += 1
            yield db
        except Exception as e:
            logger.error(f"MongoDB session error: {e}")
            # MongoDB doesn't have traditional rollback, but we can log the error
            raise
        finally:
            # MongoDB connections are managed by the driver
            # No explicit cleanup needed for database object
            if db:
                logger.debug("MongoDB session completed")
    
    @contextmanager
    def sqlalchemy_session_scope(self):
        """Provide a transactional scope around SQLAlchemy operations."""
        session = None
        try:
            session = self.get_sqlalchemy_session()
            with self._lock:
                self._metrics['query_count'] += 1
            yield session
            session.commit()
        except Exception as e:
            if session:
                session.rollback()
            logger.error(f"SQLAlchemy session error: {e}")
            raise
        finally:
            if session:
                session.close()
                logger.debug("SQLAlchemy session closed")
    
    async def health_check(self) -> Dict[str, Any]:
        """Enhanced health check for MongoDB connection."""
        try:
            start_time = time.time()
            
            # Test MongoDB connectivity
            health_status = await self.mongodb_manager.test_connection()
            
            response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            # Get performance metrics
            metrics = self.get_metrics()
            
            with self._lock:
                self._metrics['last_health_check'] = datetime.now()
            
            return {
                'status': 'healthy' if health_status.get('connected', False) else 'unhealthy',
                'response_time_ms': round(response_time, 2),
                'mongodb_status': health_status,
                'metrics': metrics,
                'timestamp': time.time(),
                'database_type': 'mongodb'
            }
        except Exception as e:
            logger.error(f"MongoDB health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': time.time(),
                'metrics': self.get_metrics()
            }
    
    def get_pool_stats(self) -> Dict[str, Any]:
        """Get MongoDB connection statistics for monitoring."""
        try:
            # MongoDB doesn't have traditional connection pools like SQLAlchemy
            # But we can return connection info from the client
            client = self.mongodb_manager.get_client()
            if client:
                return {
                    'active_connections': len(client.nodes),
                    'database_name': self.mongodb_manager.get_database().name,
                    'client_info': str(client.address) if hasattr(client, 'address') else 'N/A'
                }
            return {}
        except Exception as e:
            logger.warning(f"Could not get MongoDB connection stats: {e}")
            return {}
    
    def optimize_connection(self, db) -> None:
        """Optimize MongoDB connection settings for performance."""
        try:
            # MongoDB optimization is handled at the client level
            # Most optimizations are done during connection setup
            logger.debug("MongoDB connection optimization handled at client level")
        except Exception as e:
            logger.warning(f"Could not optimize MongoDB connection: {e}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get database performance metrics."""
        with self._lock:
            uptime = datetime.now() - self._metrics['uptime_start']
            return {
                'total_connections': self._metrics['total_connections'],
                'failed_connections': self._metrics['failed_connections'],
                'query_count': self._metrics['query_count'],
                'slow_queries': self._metrics['slow_queries'],
                'success_rate': (
                    (self._metrics['total_connections'] - self._metrics['failed_connections']) / 
                    max(self._metrics['total_connections'], 1)
                ) * 100,
                'uptime_seconds': uptime.total_seconds(),
                'last_health_check': self._metrics['last_health_check'].isoformat() if self._metrics['last_health_check'] else None
            }
    
    def reset_metrics(self) -> None:
        """Reset performance metrics (useful for monitoring)."""
        with self._lock:
            self._metrics.update({
                'total_connections': 0,
                'failed_connections': 0,
                'query_count': 0,
                'slow_queries': 0,
                'uptime_start': datetime.now()
            })
        logger.info("Database metrics reset")
    
    def get_connection_info(self) -> Dict[str, Any]:
        """Get detailed MongoDB connection information."""
        try:
            client = self.mongodb_manager.get_client()
            db = self.mongodb_manager.get_database()
            return {
                'database_type': 'mongodb',
                'database_name': db.name if db else 'N/A',
                'client_address': str(client.address) if client and hasattr(client, 'address') else 'N/A',
                'connection_string': 'mongodb://***:***@***',  # Masked for security
                'is_connected': client is not None
            }
        except Exception as e:
            logger.warning(f"Could not get MongoDB connection info: {e}")
            return {'error': str(e)}
    
    async def execute_maintenance(self) -> Dict[str, Any]:
        """Execute MongoDB maintenance tasks."""
        try:
            results = {}
            
            # Get database statistics
            db = self.mongodb_manager.get_database()
            if db:
                stats = await db.command('dbStats')
                results['database_size'] = stats.get('dataSize', 0)
                results['index_size'] = stats.get('indexSize', 0)
                results['collections'] = stats.get('collections', 0)
                results['indexes'] = stats.get('indexes', 0)
                
            # MongoDB doesn't need explicit maintenance like ANALYZE
            # But we can check index usage and suggest optimizations
            results['maintenance_type'] = 'mongodb_stats'
            results['status'] = 'completed'
                    
            logger.info(f"MongoDB maintenance completed: {results}")
            return results
        except Exception as e:
            logger.error(f"MongoDB maintenance failed: {e}")
            return {'error': str(e)}
    
    async def close_all_connections(self) -> None:
        """Close all MongoDB connections (for graceful shutdown)."""
        try:
            await self.mongodb_manager.disconnect()
            logger.info("All MongoDB connections closed")
        except Exception as e:
            logger.error(f"Error closing MongoDB connections: {e}")

# Global database manager instance
db_manager = DatabaseManager()

def get_db_session():
    """Dependency to get SQLAlchemy session for FastAPI and autoscraper tasks."""
    session = None
    try:
        session = db_manager.get_sqlalchemy_session()
        yield session
    except Exception as e:
        logger.error(f"Error getting SQLAlchemy session: {e}")
        raise
    finally:
        if session:
            session.close()

def get_mongodb_session():
    """Dependency to get MongoDB database for FastAPI."""
    try:
        db = db_manager.get_session()
        yield db
    except Exception as e:
        logger.error(f"Error getting MongoDB database: {e}")
        raise

async def init_database():
    """Initialize MongoDB and create indexes."""
    try:
        await db_manager.initialize()
        await db_manager.create_tables()
        logger.info("MongoDB initialization completed")
    except Exception as e:
        logger.error(f"MongoDB initialization failed: {e}")
        raise

def get_database_manager() -> DatabaseManager:
    """Get the global database manager instance."""
    return db_manager