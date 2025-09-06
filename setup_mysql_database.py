#!/usr/bin/env python3
"""
MySQL Database Setup Script for RemoteHive

This script creates the MySQL database and initializes all tables.
"""

import os
import sys
import pymysql
from sqlalchemy import create_engine, text
from loguru import logger

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.models import Base
from app.core.database import init_db

def create_mysql_database():
    """
    Create the MySQL database if it doesn't exist.
    """
    # MySQL connection parameters
    mysql_host = 'localhost'
    mysql_user = 'root'
    mysql_password = 'Ranjeet11$'
    database_name = 'remotehive_db'
    
    try:
        # Connect to MySQL server (without specifying database)
        connection = pymysql.connect(
            host=mysql_host,
            user=mysql_user,
            password=mysql_password,
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            # Create database if it doesn't exist
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            logger.info(f"Database '{database_name}' created or already exists")
            
            # Grant privileges (optional, for security)
            cursor.execute(f"GRANT ALL PRIVILEGES ON {database_name}.* TO '{mysql_user}'@'localhost'")
            cursor.execute("FLUSH PRIVILEGES")
            
        connection.commit()
        connection.close()
        
        logger.info("MySQL database setup completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error creating MySQL database: {e}")
        return False

def create_tables():
    """
    Create all application tables using SQLAlchemy.
    """
    try:
        # Database URL for MySQL
        database_url = "mysql+pymysql://root:Ranjeet11$@localhost:3306/remotehive_db"
        
        # Create engine
        engine = create_engine(
            database_url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            echo=True  # Set to False in production
        )
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("All database tables created successfully")
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("Database connection test successful")
        
        return True
        
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        return False

def initialize_default_data():
    """
    Initialize default data like admin users.
    """
    try:
        # Set the DATABASE_URL environment variable
        os.environ['DATABASE_URL'] = "mysql+pymysql://root:Ranjeet11$@localhost:3306/remotehive_db"
        
        # Initialize database with default data
        import asyncio
        asyncio.run(init_db())
        
        logger.info("Default data initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error initializing default data: {e}")
        return False

def main():
    """
    Main setup function.
    """
    logger.info("Starting MySQL database setup for RemoteHive...")
    
    # Step 1: Create MySQL database
    if not create_mysql_database():
        logger.error("Failed to create MySQL database")
        return False
    
    # Step 2: Create tables
    if not create_tables():
        logger.error("Failed to create database tables")
        return False
    
    # Step 3: Initialize default data
    if not initialize_default_data():
        logger.error("Failed to initialize default data")
        return False
    
    logger.info("\n" + "="*50)
    logger.info("MySQL Database Setup Complete!")
    logger.info("="*50)
    logger.info("Database: remotehive_db")
    logger.info("Host: localhost:3306")
    logger.info("User: root")
    logger.info("\nYou can now start the FastAPI server with:")
    logger.info("python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    logger.info("="*50)
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)