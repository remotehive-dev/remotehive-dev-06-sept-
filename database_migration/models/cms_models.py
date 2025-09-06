from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, Float, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
import uuid

Base = declarative_base()

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    OTHER = "other"

class CarouselType(str, Enum):
    HERO = "hero"
    TESTIMONIALS = "testimonials"
    PORTFOLIO = "portfolio"
    PRODUCTS = "products"
    GENERAL = "general"

class PageStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class MediaFile(Base):
    __tablename__ = "media_files"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_url = Column(Text, nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    media_type = Column(String(20), nullable=False)  # MediaType enum
    alt_text = Column(String(255))
    caption = Column(String(500))
    tags = Column(JSON)  # List of strings
    folder = Column(String(100))
    is_public = Column(Boolean, default=True)
    uploaded_by = Column(String, ForeignKey("users.id"))
    download_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    uploader = relationship("User", back_populates="uploaded_files")
    gallery_images = relationship("GalleryImage", back_populates="media_file")

class CarouselItem(Base):
    __tablename__ = "carousel_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200))
    subtitle = Column(String(300))
    description = Column(String(500))
    image_url = Column(Text, nullable=False)
    link_url = Column(Text)
    link_text = Column(String(50))
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    carousel_type = Column(String(20), nullable=False)  # CarouselType enum
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="carousel_items")

class Gallery(Base):
    __tablename__ = "galleries"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    description = Column(String(500))
    slug = Column(String(100), nullable=False, unique=True)
    is_public = Column(Boolean, default=True)
    cover_image = Column(Text)
    created_by = Column(String, ForeignKey("users.id"))
    image_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="galleries")
    images = relationship("GalleryImage", back_populates="gallery", cascade="all, delete-orphan")

class GalleryImage(Base):
    __tablename__ = "gallery_images"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    gallery_id = Column(String, ForeignKey("galleries.id"), nullable=False)
    media_file_id = Column(String, ForeignKey("media_files.id"), nullable=False)
    order = Column(Integer, default=0)
    caption = Column(String(500))
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    gallery = relationship("Gallery", back_populates="images")
    media_file = relationship("MediaFile", back_populates="gallery_images")

class Page(Base):
    __tablename__ = "pages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)
    content = Column(Text)
    excerpt = Column(Text)
    featured_image = Column(Text)
    status = Column(String(20), default="draft")  # PageStatus enum
    is_featured = Column(Boolean, default=False)
    template = Column(String(100))
    meta_title = Column(String(200))
    meta_description = Column(String(300))
    meta_keywords = Column(Text)
    custom_css = Column(Text)
    custom_js = Column(Text)
    content_blocks = Column(JSON)  # List of ContentBlock objects
    author_id = Column(String, ForeignKey("users.id"))
    published_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    author = relationship("User", back_populates="pages")

class ThemeSettings(Base):
    __tablename__ = "theme_settings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    primary_color = Column(String(7), default="#007bff")
    secondary_color = Column(String(7), default="#6c757d")
    accent_color = Column(String(7), default="#28a745")
    background_color = Column(String(7), default="#ffffff")
    text_color = Column(String(7), default="#212529")
    font_family = Column(String(100), default="Inter")
    font_size = Column(String(10), default="16px")
    logo_url = Column(Text)
    favicon_url = Column(Text)
    custom_css = Column(Text)
    custom_js = Column(Text)
    header_code = Column(Text)
    footer_code = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AdCampaign(Base):
    __tablename__ = "ad_campaigns"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    platform = Column(String(50), nullable=False)
    campaign_type = Column(String(50))
    status = Column(String(20), default="draft")
    budget = Column(String(20))
    daily_budget = Column(Float)
    total_budget = Column(Float)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    target_audience = Column(Text)
    keywords = Column(JSON)  # List of strings
    ad_copy = Column(Text)
    landing_page = Column(Text)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    ctr = Column(Float, default=0.0)  # Click-through rate
    cpc = Column(Float, default=0.0)  # Cost per click
    cpa = Column(Float, default=0.0)  # Cost per acquisition
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class NavigationItem(Base):
    __tablename__ = "navigation_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    label = Column(String(100), nullable=False)
    url = Column(Text, nullable=False)
    target = Column(String(10), default="_self")  # _self, _blank
    order = Column(Integer, default=0)
    parent_id = Column(String, ForeignKey("navigation_items.id"))
    menu_id = Column(String, ForeignKey("navigation_menus.id"))
    is_active = Column(Boolean, default=True)
    icon = Column(String(50))
    css_class = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    parent = relationship("NavigationItem", remote_side=[id])
    menu = relationship("NavigationMenu", back_populates="items")

class NavigationMenu(Base):
    __tablename__ = "navigation_menus"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    location = Column(String(50), nullable=False)  # header, footer, sidebar
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    items = relationship("NavigationItem", back_populates="menu", cascade="all, delete-orphan")