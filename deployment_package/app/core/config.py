from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "RemoteHive API"
    VERSION: str = "1.0.0"
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000", "http://127.0.0.1:3000", 
        "http://localhost:3001", "http://127.0.0.1:3001",
        "http://localhost:3002", "http://127.0.0.1:3002",
        "http://localhost:8080", "http://127.0.0.1:8080",
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174"
    ]
    ALLOWED_HOSTS: str = os.getenv("ALLOWED_HOSTS", "*")
    
    # MongoDB Settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017/remotehive")
    MONGODB_DATABASE_NAME: str = os.getenv("MONGODB_DATABASE_NAME", "remotehive")
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Database Connection Pool Settings
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "20"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "50"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "3600"))
    DEBUG_POOL: bool = os.getenv("DEBUG_POOL", "false").lower() == "true"
    
    # JWT Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Redis Settings (for Celery)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Celery Configuration
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_ACCEPT_CONTENT: List[str] = ["json"]
    CELERY_TIMEZONE: str = "UTC"
    CELERY_ENABLE_UTC: bool = True
    CELERY_TASK_TRACK_STARTED: bool = True
    CELERY_TASK_TIME_LIMIT: int = 30 * 60  # 30 minutes
    CELERY_TASK_SOFT_TIME_LIMIT: int = 25 * 60  # 25 minutes
    CELERY_WORKER_PREFETCH_MULTIPLIER: int = 1
    CELERY_WORKER_MAX_TASKS_PER_CHILD: int = 1000
    
    # Scraper Settings
    SCRAPER_ENABLED: bool = os.getenv("SCRAPER_ENABLED", "false").lower() == "true"
    SCRAPER_INTERVAL_MINUTES: int = int(os.getenv("SCRAPER_INTERVAL_MINUTES", "60"))
    
    # Email Settings
    EMAIL_HOST: str = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT: int = int(os.getenv("EMAIL_PORT", "587"))
    EMAIL_USERNAME: str = os.getenv("EMAIL_USERNAME", "")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@remotehive.com")
    EMAIL_USE_TLS: bool = os.getenv("EMAIL_USE_TLS", "true").lower() == "true"
    SUPPORT_EMAIL: str = os.getenv("SUPPORT_EMAIL", "support@remotehive.com")
    
    # Frontend URL (for email links)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # File Upload Settings
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    
    # External API Keys
    LINKEDIN_API_KEY: str = os.getenv("LINKEDIN_API_KEY", "")
    INDEED_API_KEY: str = os.getenv("INDEED_API_KEY", "")
    GLASSDOOR_API_KEY: str = os.getenv("GLASSDOOR_API_KEY", "")
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Slack Integration
    SLACK_WEBHOOK_URL: str = os.getenv("SLACK_WEBHOOK_URL", "")
    
    # Clerk Authentication Settings
    CLERK_SECRET_KEY: str = os.getenv("CLERK_SECRET_KEY", "")
    CLERK_PUBLISHABLE_KEY: str = os.getenv("CLERK_PUBLISHABLE_KEY", "")
    CLERK_FRONTEND_API_URL: str = os.getenv("CLERK_FRONTEND_API_URL", "https://api.clerk.dev")
    CLERK_API_VERSION: str = os.getenv("CLERK_API_VERSION", "v1")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # Security Settings
    SECURITY_HEADERS_ENABLED: bool = os.getenv("SECURITY_HEADERS_ENABLED", "true").lower() == "true"
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds
    RATE_LIMIT_BLOCK_DURATION: int = int(os.getenv("RATE_LIMIT_BLOCK_DURATION", "300"))  # 5 minutes
    
    # Request Security
    MAX_REQUEST_SIZE: int = int(os.getenv("MAX_REQUEST_SIZE", str(10 * 1024 * 1024)))  # 10MB
    MAX_JSON_DEPTH: int = int(os.getenv("MAX_JSON_DEPTH", "10"))
    MAX_FIELD_LENGTH: int = int(os.getenv("MAX_FIELD_LENGTH", "1000"))
    
    # Input Validation
    STRICT_VALIDATION: bool = os.getenv("STRICT_VALIDATION", "true").lower() == "true"
    SANITIZE_INPUT: bool = os.getenv("SANITIZE_INPUT", "true").lower() == "true"
    BLOCK_SUSPICIOUS_REQUESTS: bool = os.getenv("BLOCK_SUSPICIOUS_REQUESTS", "true").lower() == "true"
    
    # CSRF Protection
    CSRF_PROTECTION_ENABLED: bool = os.getenv("CSRF_PROTECTION_ENABLED", "false").lower() == "true"
    CSRF_SECRET_KEY: str = os.getenv("CSRF_SECRET_KEY", SECRET_KEY)
    
    # Content Security Policy
    CSP_ENABLED: bool = os.getenv("CSP_ENABLED", "true").lower() == "true"
    CSP_REPORT_URI: str = os.getenv("CSP_REPORT_URI", "/api/v1/security/csp-report")
    
    # Security Monitoring
    SECURITY_LOGGING_ENABLED: bool = os.getenv("SECURITY_LOGGING_ENABLED", "true").lower() == "true"
    SECURITY_ALERTS_ENABLED: bool = os.getenv("SECURITY_ALERTS_ENABLED", "false").lower() == "true"
    SECURITY_WEBHOOK_URL: str = os.getenv("SECURITY_WEBHOOK_URL", "")
    
    # IP Whitelisting/Blacklisting
    IP_WHITELIST: List[str] = os.getenv("IP_WHITELIST", "").split(",") if os.getenv("IP_WHITELIST") else []
    IP_BLACKLIST: List[str] = os.getenv("IP_BLACKLIST", "").split(",") if os.getenv("IP_BLACKLIST") else []
    
    # File Upload Security
    ALLOWED_FILE_EXTENSIONS: List[str] = os.getenv("ALLOWED_FILE_EXTENSIONS", ".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt").split(",")
    SCAN_UPLOADED_FILES: bool = os.getenv("SCAN_UPLOADED_FILES", "false").lower() == "true"
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Service URLs and Health Endpoints
    AUTOSCRAPER_SERVICE_URL: str = os.getenv("AUTOSCRAPER_SERVICE_URL", "http://localhost:8003")
    AUTOSCRAPER_SERVICE_HEALTH_ENDPOINT: str = os.getenv("AUTOSCRAPER_SERVICE_HEALTH_ENDPOINT", "/health")
    ADMIN_SERVICE_URL: str = os.getenv("ADMIN_SERVICE_URL", "http://localhost:8002")
    ADMIN_SERVICE_HEALTH_ENDPOINT: str = os.getenv("ADMIN_SERVICE_HEALTH_ENDPOINT", "/health")
    
    # Database Performance Settings
    DB_SLOW_QUERY_THRESHOLD: float = float(os.getenv("DB_SLOW_QUERY_THRESHOLD", "1.0"))
    DATABASE_POOL_SIZE: int = int(os.getenv("DATABASE_POOL_SIZE", "10"))
    DATABASE_MAX_OVERFLOW: int = int(os.getenv("DATABASE_MAX_OVERFLOW", "20"))
    DATABASE_POOL_TIMEOUT: int = int(os.getenv("DATABASE_POOL_TIMEOUT", "30"))
    DATABASE_POOL_RECYCLE: int = int(os.getenv("DATABASE_POOL_RECYCLE", "3600"))
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields to prevent validation errors

settings = Settings()

def get_settings() -> Settings:
    """Get application settings instance"""
    return settings