#!/usr/bin/env python3
"""
RemoteHive Fixed Startup Script

A comprehensive startup script that ensures all services start properly
with correct environment configuration and dependency management.

Usage:
    python fixed_startup.py
"""

import os
import sys
import time
import signal
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import load_dotenv

# Project configuration
PROJECT_ROOT = Path(__file__).parent.absolute()

class FixedStartup:
    """Enhanced startup orchestrator with proper environment handling"""
    
    def __init__(self):
        self.processes: Dict[str, subprocess.Popen] = {}
        self.service_urls = {
            "Redis Server": "redis://localhost:6379",
            "Backend Server": "http://localhost:8000",
            "Autoscraper API": "http://localhost:8001",
            "Admin Panel": "http://localhost:3000",
            "Website": "http://localhost:5173"
        }
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        # Load environment variables
        self._load_environment()
    
    def _load_environment(self):
        """Load environment variables from .env files"""
        print("🔧 Loading environment configuration...")
        
        # Load main project .env
        main_env = PROJECT_ROOT / ".env"
        if main_env.exists():
            load_dotenv(main_env)
            print(f"   ✅ Loaded {main_env}")
        
        # Load autoscraper service .env
        autoscraper_env = PROJECT_ROOT / "autoscraper-service" / ".env"
        if autoscraper_env.exists():
            load_dotenv(autoscraper_env)
            print(f"   ✅ Loaded {autoscraper_env}")
        
        # Ensure critical environment variables are set
        self._ensure_env_vars()
    
    def _ensure_env_vars(self):
        """Ensure critical environment variables are set"""
        critical_vars = {
            "JWT_SECRET_KEY": "your-super-secret-key-change-this-in-production",
            "AUTOSCRAPER_JWT_SECRET_KEY": "your-super-secret-key-change-this-in-production",
            "DATABASE_URL": "sqlite:///./remotehive.db",
            "REDIS_URL": "redis://localhost:6379/1",
            "CELERY_BROKER_URL": "redis://localhost:6379/0"
        }
        
        for var, default in critical_vars.items():
            if not os.getenv(var):
                os.environ[var] = default
                print(f"   🔧 Set {var} to default value")
    
    def _signal_handler(self, signum: int, frame) -> None:
        """Handle shutdown signals gracefully"""
        print(f"\n🛑 Shutting down services...")
        self._cleanup_and_exit()
    
    def _cleanup_ports(self):
        """Clean up processes on required ports"""
        print("🧹 Cleaning up ports...")
        ports = [6379, 8000, 8001, 3000, 5173]
        
        for port in ports:
            try:
                # Find and kill processes on port
                result = subprocess.run(
                    ["lsof", "-ti", f":{port}"],
                    capture_output=True,
                    text=True
                )
                if result.stdout.strip():
                    pids = result.stdout.strip().split('\n')
                    for pid in pids:
                        subprocess.run(["kill", "-9", pid], capture_output=True)
                    print(f"   ✅ Cleaned port {port}")
            except Exception as e:
                print(f"   ⚠️  Could not clean port {port}: {e}")
    
    def _start_service(self, name: str, command: List[str], cwd: Path, delay: int = 3, env: Optional[Dict] = None) -> bool:
        """Start a single service with proper environment"""
        print(f"🚀 Starting {name}...")
        
        try:
            # Prepare environment
            service_env = os.environ.copy()
            if env:
                service_env.update(env)
            
            process = subprocess.Popen(
                command,
                cwd=cwd,
                env=service_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            self.processes[name] = process
            time.sleep(delay)
            
            # Check if process is still running
            if process.poll() is not None:
                stdout, stderr = process.communicate()
                print(f"❌ {name} failed to start")
                if stderr:
                    print(f"   Error: {stderr.decode()[:200]}...")
                return False
            
            print(f"✅ {name} started successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to start {name}: {e}")
            return False
    
    def _health_check(self, name: str, url: str) -> bool:
        """Perform health check on a service"""
        try:
            import requests
            response = requests.get(f"{url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def run(self) -> int:
        """Main execution method"""
        print("""
🚀 RemoteHive Fixed Startup
==========================
""")
        
        # Cleanup first
        self._cleanup_ports()
        
        # Define services with proper configuration
        services = [
            {
                "name": "Redis Server",
                "command": ["redis-server", "--port", "6379"],
                "cwd": PROJECT_ROOT,
                "delay": 3,
                "env": None
            },
            {
                "name": "Backend Server",
                "command": ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
                "cwd": PROJECT_ROOT,
                "delay": 8,
                "env": None
            },
            {
                "name": "Autoscraper API",
                "command": ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"],
                "cwd": PROJECT_ROOT / "autoscraper-service",
                "delay": 8,
                "env": {
                    "JWT_SECRET_KEY": os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-this-in-production"),
                    "AUTOSCRAPER_JWT_SECRET_KEY": os.getenv("AUTOSCRAPER_JWT_SECRET_KEY", "your-super-secret-key-change-this-in-production")
                }
            },
            {
                "name": "Admin Panel",
                "command": ["npm", "run", "dev"],
                "cwd": PROJECT_ROOT / "remotehive-admin",
                "delay": 10,
                "env": None
            },
            {
                "name": "Website",
                "command": ["npm", "run", "dev"],
                "cwd": PROJECT_ROOT / "remotehive-public",
                "delay": 10,
                "env": None
            }
        ]
        
        success_count = 0
        failed_services = []
        
        for service in services:
            if self._start_service(
                service["name"],
                service["command"],
                service["cwd"],
                service["delay"],
                service["env"]
            ):
                success_count += 1
            else:
                failed_services.append(service["name"])
        
        print(f"\n📊 Started {success_count}/{len(services)} services")
        
        if failed_services:
            print(f"❌ Failed services: {', '.join(failed_services)}")
        
        if success_count > 0:
            print("\n🌐 Access URLs:")
            for name, url in self.service_urls.items():
                if name not in failed_services:
                    if name == "Redis Server":
                        print(f"  • {name}: {url}")
                    else:
                        print(f"  • {name}: {url}")
            
            print("\n👀 Services running... (Press Ctrl+C to stop)")
            
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                pass
        
        self._cleanup_and_exit()
        return 0 if success_count == len(services) else 1
    
    def _cleanup_and_exit(self):
        """Clean up processes and exit"""
        print("\n🧹 Cleaning up processes...")
        
        for name, process in self.processes.items():
            try:
                process.terminate()
                process.wait(timeout=5)
                print(f"   ✅ Stopped {name}")
            except subprocess.TimeoutExpired:
                process.kill()
                print(f"   🔪 Force killed {name}")
            except Exception as e:
                print(f"   ⚠️  Error stopping {name}: {e}")
        
        print("\n👋 Goodbye!")
        sys.exit(0)


if __name__ == "__main__":
    startup = FixedStartup()
    sys.exit(startup.run())