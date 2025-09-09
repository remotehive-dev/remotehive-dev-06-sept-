#!/usr/bin/env python3
"""
RemoteHive Services Startup Script
Orchestrates the startup of all RemoteHive services with proper health checks
"""

import asyncio
import os
import sys
import signal
import subprocess
import time
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass
from loguru import logger
from dotenv import load_dotenv

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables from .env file
load_dotenv(project_root / ".env")

from app.utils.service_discovery import (
    get_service_registry, 
    HealthChecker, 
    ServiceStatus,
    wait_for_all_services
)
from app.utils.jwt_auth import get_jwt_manager, create_service_token


@dataclass
class ServiceConfig:
    """Configuration for a service"""
    name: str
    command: List[str]
    cwd: str
    env: Dict[str, str]
    port: int
    health_endpoint: str = "/health"
    startup_delay: int = 5
    required_services: List[str] = None
    
    def __post_init__(self):
        if self.required_services is None:
            self.required_services = []


class ServiceManager:
    """Manages the lifecycle of RemoteHive services"""
    
    def __init__(self):
        self.processes: Dict[str, subprocess.Popen] = {}
        self.services: Dict[str, ServiceConfig] = {}
        self.shutdown_event = asyncio.Event()
        self._setup_signal_handlers()
        self._load_service_configs()
    
    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, initiating shutdown...")
            asyncio.create_task(self._shutdown())
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    def _load_service_configs(self):
        """Load service configurations"""
        base_env = os.environ.copy()
        
        # Main Service
        self.services["main"] = ServiceConfig(
            name="main",
            command=["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
            cwd=str(project_root),
            env=base_env,
            port=8000,
            startup_delay=10
        )
        
        # AutoScraper Service
        autoscraper_env = base_env.copy()
        autoscraper_env.update({
            "SERVICE_NAME": "autoscraper",
            "SERVICE_PORT": "8001"
        })
        
        self.services["autoscraper"] = ServiceConfig(
            name="autoscraper",
            command=["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"],
            cwd=str(project_root / "autoscraper-service"),
            env=autoscraper_env,
            port=8001,
            startup_delay=8,
            required_services=["main"]
        )
        
        # Admin Service (if exists)
        admin_path = project_root / "admin-service"
        if admin_path.exists():
            admin_env = base_env.copy()
            admin_env.update({
                "SERVICE_NAME": "admin",
                "SERVICE_PORT": "8002"
            })
            
            self.services["admin"] = ServiceConfig(
                name="admin",
                command=["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"],
                cwd=str(admin_path),
                env=admin_env,
                port=8002,
                startup_delay=5,
                required_services=["main"]
            )
        
        logger.info(f"Loaded {len(self.services)} service configurations")
    
    async def _check_prerequisites(self) -> bool:
        """Check if all prerequisites are met"""
        logger.info("Checking prerequisites...")
        
        # Check if .env files exist
        env_files = [
            project_root / ".env",
            project_root / "autoscraper-service" / ".env"
        ]
        
        for env_file in env_files:
            if not env_file.exists():
                logger.error(f"Required .env file not found: {env_file}")
                return False
        
        # Check JWT configuration
        try:
            jwt_manager = get_jwt_manager()
            # Test token creation
            test_token = jwt_manager.create_service_token("test-service")
            jwt_manager.decode_token(test_token)
            logger.info("JWT configuration is valid")
        except Exception as e:
            logger.error(f"JWT configuration error: {e}")
            return False
        
        # Check database file
        db_file = project_root / "remotehive.db"
        if not db_file.exists():
            logger.warning(f"Database file not found: {db_file}")
            logger.info("Database will be created on first startup")
        
        logger.info("Prerequisites check completed")
        return True
    
    async def _start_service(self, service_config: ServiceConfig) -> bool:
        """Start a single service"""
        logger.info(f"Starting service: {service_config.name}")
        
        # Check if required services are running
        if service_config.required_services:
            registry = get_service_registry()
            async with HealthChecker(registry) as health_checker:
                for required_service in service_config.required_services:
                    service = registry.get_service(required_service)
                    if service:
                        status = await health_checker.check_service_health(service)
                        if status != ServiceStatus.HEALTHY:
                            logger.warning(f"Required service {required_service} is not healthy")
                            return False
        
        try:
            # Start the process
            process = subprocess.Popen(
                service_config.command,
                cwd=service_config.cwd,
                env=service_config.env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            self.processes[service_config.name] = process
            logger.info(f"Service {service_config.name} started with PID: {process.pid}")
            
            # Wait for startup delay
            await asyncio.sleep(service_config.startup_delay)
            
            # Check if process is still running
            if process.poll() is not None:
                stdout, stderr = process.communicate()
                logger.error(f"Service {service_config.name} failed to start:")
                logger.error(f"STDOUT: {stdout}")
                logger.error(f"STDERR: {stderr}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to start service {service_config.name}: {e}")
            return False
    
    async def _wait_for_service_health(self, service_name: str, timeout: int = 60) -> bool:
        """Wait for a service to become healthy"""
        logger.info(f"Waiting for service {service_name} to become healthy...")
        
        registry = get_service_registry()
        service = registry.get_service(service_name)
        
        if not service:
            logger.error(f"Service {service_name} not found in registry")
            return False
        
        start_time = time.time()
        
        async with HealthChecker(registry) as health_checker:
            while time.time() - start_time < timeout:
                if self.shutdown_event.is_set():
                    return False
                
                status = await health_checker.check_service_health(service)
                
                if status == ServiceStatus.HEALTHY:
                    logger.info(f"Service {service_name} is healthy")
                    return True
                
                await asyncio.sleep(5)
        
        logger.error(f"Service {service_name} did not become healthy within {timeout} seconds")
        return False
    
    async def _generate_service_tokens(self):
        """Generate service-to-service authentication tokens"""
        logger.info("Generating service authentication tokens...")
        
        try:
            jwt_manager = get_jwt_manager()
            
            # Generate tokens for each service
            for service_name in self.services.keys():
                token = jwt_manager.create_service_token(
                    service_name, 
                    permissions=["service_communication"]
                )
                
                # Set environment variable for the service
                env_var = f"{service_name.upper()}_SERVICE_TOKEN"
                os.environ[env_var] = token
                
                logger.debug(f"Generated service token for {service_name}")
            
            logger.info("Service tokens generated successfully")
            
        except Exception as e:
            logger.error(f"Failed to generate service tokens: {e}")
            raise
    
    async def start_all_services(self) -> bool:
        """Start all services in the correct order"""
        logger.info("Starting RemoteHive services...")
        
        # Check prerequisites
        if not await self._check_prerequisites():
            logger.error("Prerequisites check failed")
            return False
        
        # Generate service tokens
        await self._generate_service_tokens()
        
        # Start services in dependency order
        startup_order = ["main", "autoscraper", "admin"]
        
        for service_name in startup_order:
            if service_name not in self.services:
                continue
            
            if self.shutdown_event.is_set():
                logger.info("Shutdown requested during startup")
                return False
            
            service_config = self.services[service_name]
            
            # Start the service
            if not await self._start_service(service_config):
                logger.error(f"Failed to start service: {service_name}")
                return False
            
            # Wait for service to become healthy
            if not await self._wait_for_service_health(service_name):
                logger.error(f"Service {service_name} failed health check")
                return False
        
        # Final health check for all services
        logger.info("Performing final health check...")
        if not await wait_for_all_services(timeout=30):
            logger.error("Not all services are healthy")
            return False
        
        logger.info("All services started successfully!")
        return True
    
    async def _shutdown(self):
        """Shutdown all services gracefully"""
        logger.info("Shutting down services...")
        self.shutdown_event.set()
        
        # Stop services in reverse order
        shutdown_order = ["admin", "autoscraper", "main"]
        
        for service_name in shutdown_order:
            if service_name in self.processes:
                process = self.processes[service_name]
                
                if process.poll() is None:  # Process is still running
                    logger.info(f"Stopping service: {service_name}")
                    
                    # Try graceful shutdown first
                    process.terminate()
                    
                    try:
                        # Wait for graceful shutdown
                        await asyncio.wait_for(
                            asyncio.create_task(self._wait_for_process_exit(process)),
                            timeout=10
                        )
                        logger.info(f"Service {service_name} stopped gracefully")
                    except asyncio.TimeoutError:
                        # Force kill if graceful shutdown fails
                        logger.warning(f"Force killing service: {service_name}")
                        process.kill()
                        await asyncio.create_task(self._wait_for_process_exit(process))
        
        logger.info("All services stopped")
    
    async def _wait_for_process_exit(self, process: subprocess.Popen):
        """Wait for a process to exit"""
        while process.poll() is None:
            await asyncio.sleep(0.1)
    
    async def run(self):
        """Main run loop"""
        try:
            # Start all services
            if not await self.start_all_services():
                logger.error("Failed to start services")
                return 1
            
            # Keep running until shutdown
            logger.info("Services are running. Press Ctrl+C to stop.")
            await self.shutdown_event.wait()
            
        except KeyboardInterrupt:
            logger.info("Received keyboard interrupt")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return 1
        finally:
            await self._shutdown()
        
        return 0


async def main():
    """Main entry point"""
    # Configure logging
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )
    
    # Add file logging
    log_file = project_root / "logs" / "services.log"
    log_file.parent.mkdir(exist_ok=True)
    logger.add(
        log_file,
        rotation="10 MB",
        retention="7 days",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="DEBUG"
    )
    
    logger.info("RemoteHive Services Startup Script")
    logger.info(f"Project root: {project_root}")
    
    # Create and run service manager
    manager = ServiceManager()
    return await manager.run()


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)