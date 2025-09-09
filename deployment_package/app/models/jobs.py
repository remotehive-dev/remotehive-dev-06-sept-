"""Job-related models for the RemoteHive application"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, Float, JSON, UniqueConstraint, Table, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from enum import Enum as PyEnum
import uuid

# Import from database models to avoid duplication
from app.database.models import JobPost, Base
from app.models.scraping_session import ScrapingSession

# Re-export the models for easy importing
__all__ = ['JobPost', 'ScrapingSession']