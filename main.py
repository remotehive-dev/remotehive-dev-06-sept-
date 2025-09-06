from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from loguru import logger

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.api import api_router
from app.api.employers import router as employers_router
from app.core.auth import verify_token

security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up RemoteHive API...")
    await init_db()
    yield
    # Shutdown
    logger.info("Shutting down RemoteHive API...")

app = FastAPI(
    title="RemoteHive API",
    description="Job Board API with PostgreSQL Database",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Include standalone employers router
app.include_router(employers_router, prefix="/api/employers")

@app.get("/")
async def root():
    return {"message": "Welcome to RemoteHive API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    try:
        from app.core.database import get_db_manager
        db_mgr = get_db_manager()
        db_status = "connected" if db_mgr else "disconnected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy", 
        "service": "RemoteHive API",
        "database": db_status
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )