#!/usr/bin/env python3
"""
RemoteHive Docker-First Startup Script

This script replaces the system-based startup with Docker/Kubernetes deployment.
It provides a unified interface for starting RemoteHive services using containers.

Usage:
    python docker-startup.py [--mode dev|prod] [--platform docker|k8s] [--services service1,service2]

Modes:
    dev  - Development mode with hot-reload and debugging
    prod - Production mode with optimized builds

Platforms:
    docker - Use Docker Compose
    k8s    - Use Kubernetes
"""

import os
import sys
import time
import signal
import argparse
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Set
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).parent.absolute()

class DockerStartup:
    """Docker-first startup manager for RemoteHive platform"""
    
    def __init__(self):
        self.processes: Dict[str, subprocess.Popen] = {}
        self.mode = "dev"
        self.platform = "docker"
        self.selected_services: Optional[Set[str]] = None
        
        # Service definitions
        self.all_services = {
            "mongodb", "redis", "backend", "autoscraper", 
            "admin", "public", "celery-worker", "celery-beat", "nginx"
        }
        
        self.dev_tools = {
            "mongo-express", "redis-commander", "mailhog", 
            "test-runner", "docs", "prometheus", "grafana"
        }
        
        # Service URLs for different modes
        self.service_urls = {
            "docker": {
                "Backend API": "http://localhost:8000",
                "Autoscraper API": "http://localhost:8001", 
                "Admin Panel": "http://localhost:3000",
                "Public Website": "http://localhost:5173",
                "MongoDB Express": "http://localhost:8081",
                "Redis Commander": "http://localhost:8082",
                "MailHog": "http://localhost:8025",
                "Prometheus": "http://localhost:9090",
                "Grafana": "http://localhost:3001"
            },
            "k8s": {
                "Backend API": "http://localhost:30000",
                "Autoscraper API": "http://localhost:30001",
                "Admin Panel": "http://localhost:30002", 
                "Public Website": "http://localhost:30003",
                "Ingress": "http://remotehive.local"
            }
        }
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        # Load environment
        self._load_environment()
    
    def _load_environment(self):
        """Load environment variables from .env files"""
        print("🔧 Loading environment variables...")
        
        # Load main .env
        main_env = PROJECT_ROOT / ".env"
        if main_env.exists():
            load_dotenv(main_env)
            print(f"   ✅ Loaded {main_env}")
        
        # Load autoscraper service .env
        autoscraper_env = PROJECT_ROOT / "autoscraper-service" / ".env"
        if autoscraper_env.exists():
            load_dotenv(autoscraper_env)
            print(f"   ✅ Loaded {autoscraper_env}")
        
        # Ensure Docker environment variables
        self._ensure_docker_env_vars()
    
    def _ensure_docker_env_vars(self):
        """Ensure Docker-specific environment variables are set"""
        docker_vars = {
            "COMPOSE_PROJECT_NAME": "remotehive",
            "COMPOSE_FILE": "docker-compose.yml",
            "DOCKER_BUILDKIT": "1",
            "COMPOSE_DOCKER_CLI_BUILD": "1"
        }
        
        for var, default in docker_vars.items():
            if not os.getenv(var):
                os.environ[var] = default
                print(f"   🔧 Set {var} to {default}")
    
    def _signal_handler(self, signum: int, frame) -> None:
        """Handle shutdown signals gracefully"""
        print(f"\n🛑 Shutting down services...")
        self._cleanup_and_exit()
    
    def _check_prerequisites(self) -> bool:
        """Check if required tools are installed"""
        print("🔍 Checking prerequisites...")
        
        required_tools = {
            "docker": "Docker is required for containerized deployment",
            "docker-compose": "Docker Compose is required for multi-service deployment"
        }
        
        if self.platform == "k8s":
            required_tools["kubectl"] = "kubectl is required for Kubernetes deployment"
        
        missing_tools = []
        
        for tool, description in required_tools.items():
            try:
                result = subprocess.run([tool, "--version"], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"   ✅ {tool} found")
                else:
                    missing_tools.append((tool, description))
            except FileNotFoundError:
                missing_tools.append((tool, description))
        
        if missing_tools:
            print("\n❌ Missing required tools:")
            for tool, description in missing_tools:
                print(f"   • {tool}: {description}")
            return False
        
        return True
    
    def _build_images(self) -> bool:
        """Build Docker images for all services"""
        print("🏗️  Building Docker images...")
        
        if self.platform == "k8s":
            # For Kubernetes, we might need to build and push to registry
            print("   📦 Building images for Kubernetes deployment")
        
        try:
            cmd = ["docker-compose", "build"]
            if self.mode == "dev":
                cmd.extend(["-f", "docker-compose.yml", "-f", "docker-compose.dev.yml"])
            
            result = subprocess.run(cmd, cwd=PROJECT_ROOT, 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                print("   ✅ Images built successfully")
                return True
            else:
                print(f"   ❌ Build failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"   ❌ Build error: {e}")
            return False
    
    def _start_docker_services(self) -> bool:
        """Start services using Docker Compose"""
        print(f"🚀 Starting Docker services in {self.mode} mode...")
        
        try:
            # Prepare compose command
            cmd = ["docker-compose"]
            
            # Add compose files based on mode
            if self.mode == "dev":
                cmd.extend(["-f", "docker-compose.yml", "-f", "docker-compose.dev.yml"])
            else:
                cmd.extend(["-f", "docker-compose.yml"])
            
            # Add up command with options
            cmd.extend(["up", "-d"])
            
            # Add specific services if selected
            if self.selected_services:
                cmd.extend(list(self.selected_services))
            
            # Execute command
            result = subprocess.run(cmd, cwd=PROJECT_ROOT)
            
            if result.returncode == 0:
                print("   ✅ Services started successfully")
                return True
            else:
                print("   ❌ Failed to start services")
                return False
                
        except Exception as e:
            print(f"   ❌ Startup error: {e}")
            return False
    
    def _start_kubernetes_services(self) -> bool:
        """Start services using Kubernetes"""
        print("🚀 Starting Kubernetes services...")
        
        try:
            # Apply namespace first
            subprocess.run(["kubectl", "apply", "-f", "k8s/namespace.yaml"], 
                         cwd=PROJECT_ROOT, check=True)
            
            # Apply all manifests
            k8s_files = [
                "k8s/configmaps-secrets.yaml",
                "k8s/persistent-volumes.yaml", 
                "k8s/mongodb.yaml",
                "k8s/redis.yaml",
                "k8s/backend-api.yaml",
                "k8s/autoscraper-service.yaml",
                "k8s/celery-workers.yaml",
                "k8s/admin-panel.yaml",
                "k8s/public-website.yaml",
                "k8s/ingress.yaml"
            ]
            
            if self.mode == "dev":
                k8s_files.append("k8s/monitoring.yaml")
            
            for k8s_file in k8s_files:
                if (PROJECT_ROOT / k8s_file).exists():
                    result = subprocess.run(["kubectl", "apply", "-f", k8s_file], 
                                          cwd=PROJECT_ROOT)
                    if result.returncode != 0:
                        print(f"   ❌ Failed to apply {k8s_file}")
                        return False
                    print(f"   ✅ Applied {k8s_file}")
            
            print("   ✅ Kubernetes services started successfully")
            return True
            
        except Exception as e:
            print(f"   ❌ Kubernetes startup error: {e}")
            return False
    
    def _wait_for_services(self) -> bool:
        """Wait for services to become healthy"""
        print("⏳ Waiting for services to become ready...")
        
        if self.platform == "docker":
            return self._wait_for_docker_services()
        else:
            return self._wait_for_kubernetes_services()
    
    def _wait_for_docker_services(self) -> bool:
        """Wait for Docker services to be healthy"""
        max_wait = 120  # 2 minutes
        wait_time = 0
        
        while wait_time < max_wait:
            try:
                result = subprocess.run(["docker-compose", "ps", "--services", "--filter", "status=running"],
                                      cwd=PROJECT_ROOT, capture_output=True, text=True)
                
                if result.returncode == 0:
                    running_services = result.stdout.strip().split('\n') if result.stdout.strip() else []
                    
                    if self.selected_services:
                        required_services = self.selected_services
                    else:
                        required_services = self.all_services
                    
                    ready_services = set(running_services) & required_services
                    
                    if len(ready_services) >= len(required_services) * 0.8:  # 80% of services ready
                        print(f"   ✅ {len(ready_services)} services are ready")
                        return True
                
                time.sleep(5)
                wait_time += 5
                print(f"   ⏳ Waiting... ({wait_time}s/{max_wait}s)")
                
            except Exception as e:
                print(f"   ⚠️  Health check error: {e}")
                time.sleep(5)
                wait_time += 5
        
        print("   ⚠️  Timeout waiting for services")
        return False
    
    def _wait_for_kubernetes_services(self) -> bool:
        """Wait for Kubernetes services to be ready"""
        max_wait = 180  # 3 minutes
        wait_time = 0
        
        while wait_time < max_wait:
            try:
                result = subprocess.run(["kubectl", "get", "pods", "-n", "remotehive", 
                                       "--field-selector=status.phase=Running", 
                                       "--no-headers"], 
                                      capture_output=True, text=True)
                
                if result.returncode == 0:
                    running_pods = len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0
                    
                    if running_pods >= 5:  # Minimum required pods
                        print(f"   ✅ {running_pods} pods are running")
                        return True
                
                time.sleep(10)
                wait_time += 10
                print(f"   ⏳ Waiting for pods... ({wait_time}s/{max_wait}s)")
                
            except Exception as e:
                print(f"   ⚠️  Kubernetes check error: {e}")
                time.sleep(10)
                wait_time += 10
        
        print("   ⚠️  Timeout waiting for Kubernetes services")
        return False
    
    def _show_service_info(self):
        """Display service information and access URLs"""
        print("\n🌐 Service Access URLs:")
        
        urls = self.service_urls.get(self.platform, {})
        for service, url in urls.items():
            print(f"  • {service}: {url}")
        
        if self.mode == "dev":
            print("\n🛠️  Development Tools:")
            print("  • MongoDB Express: http://localhost:8081 (admin/admin123)")
            print("  • Redis Commander: http://localhost:8082 (admin/admin123)")
            print("  • MailHog: http://localhost:8025")
            if self.platform == "docker":
                print("  • Prometheus: http://localhost:9090")
                print("  • Grafana: http://localhost:3001 (admin/admin123)")
        
        print("\n📊 Service Status:")
        if self.platform == "docker":
            subprocess.run(["docker-compose", "ps"], cwd=PROJECT_ROOT)
        else:
            subprocess.run(["kubectl", "get", "pods", "-n", "remotehive"])
    
    def run(self, args) -> int:
        """Main execution method"""
        self.mode = args.mode
        self.platform = args.platform
        
        if args.services:
            self.selected_services = set(args.services.split(','))
            # Validate selected services
            invalid_services = self.selected_services - (self.all_services | self.dev_tools)
            if invalid_services:
                print(f"❌ Invalid services: {', '.join(invalid_services)}")
                print(f"Available services: {', '.join(sorted(self.all_services | self.dev_tools))}")
                return 1
        
        print(f"""
🚀 RemoteHive Docker Startup
============================
Mode: {self.mode}
Platform: {self.platform}
Services: {', '.join(self.selected_services) if self.selected_services else 'all'}
""")
        
        # Check prerequisites
        if not self._check_prerequisites():
            return 1
        
        # Build images if needed
        if not self._build_images():
            return 1
        
        # Start services based on platform
        if self.platform == "docker":
            success = self._start_docker_services()
        else:
            success = self._start_kubernetes_services()
        
        if not success:
            return 1
        
        # Wait for services to be ready
        if not self._wait_for_services():
            print("⚠️  Some services may not be fully ready, but continuing...")
        
        # Show service information
        self._show_service_info()
        
        print("\n👀 Services running... (Press Ctrl+C to stop)")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
        
        self._cleanup_and_exit()
        return 0
    
    def _cleanup_and_exit(self):
        """Clean up services and exit"""
        print("\n🧹 Stopping services...")
        
        try:
            if self.platform == "docker":
                cmd = ["docker-compose"]
                if self.mode == "dev":
                    cmd.extend(["-f", "docker-compose.yml", "-f", "docker-compose.dev.yml"])
                cmd.extend(["down"])
                subprocess.run(cmd, cwd=PROJECT_ROOT)
            else:
                # For Kubernetes, we might want to keep services running
                # or provide an option to delete them
                print("   ℹ️  Kubernetes services will continue running")
                print("   💡 Use 'kubectl delete namespace remotehive' to stop all services")
            
            print("   ✅ Services stopped")
            
        except Exception as e:
            print(f"   ⚠️  Error during cleanup: {e}")
        
        print("\n👋 Goodbye!")
        sys.exit(0)


def main():
    parser = argparse.ArgumentParser(
        description="RemoteHive Docker-First Startup Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python docker-startup.py                           # Start all services in dev mode with Docker
  python docker-startup.py --mode prod              # Start in production mode
  python docker-startup.py --platform k8s           # Use Kubernetes
  python docker-startup.py --services backend,redis # Start only specific services
  python docker-startup.py --mode dev --services backend,admin,public  # Dev mode with core services
"""
    )
    
    parser.add_argument(
        "--mode", 
        choices=["dev", "prod"], 
        default="dev",
        help="Deployment mode (default: dev)"
    )
    
    parser.add_argument(
        "--platform", 
        choices=["docker", "k8s"], 
        default="docker",
        help="Deployment platform (default: docker)"
    )
    
    parser.add_argument(
        "--services", 
        help="Comma-separated list of services to start (default: all)"
    )
    
    parser.add_argument(
        "--build", 
        action="store_true",
        help="Force rebuild of Docker images"
    )
    
    args = parser.parse_args()
    
    startup = DockerStartup()
    return startup.run(args)


if __name__ == "__main__":
    sys.exit(main())