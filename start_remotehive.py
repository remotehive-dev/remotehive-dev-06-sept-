#!/usr/bin/env python3
"""
RemoteHive Complete Startup Script
Starts all services with proper port configuration and health checks

Port Configuration:
- Backend API: 8001
- Admin Panel: 3000  
- Public Website: 3001
- AutoScraper: 8002 (if available)
- Redis: 6379
- MongoDB: Atlas (cloud)
"""

import os
import sys
import time
import signal
import subprocess
import threading
from pathlib import Path
from typing import Dict, List, Optional
import requests
from dataclasses import dataclass

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

@dataclass
class ServiceConfig:
    name: str
    command: List[str]
    cwd: str
    port: int
    health_url: str
    env_vars: Dict[str, str] = None
    startup_delay: int = 5
    process: Optional[subprocess.Popen] = None

class RemoteHiveStarter:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.services: Dict[str, ServiceConfig] = {}
        self.running_services: List[str] = []
        self.setup_signal_handlers()
        
    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print(f"\n{Colors.YELLOW}Received shutdown signal. Stopping all services...{Colors.END}")
        self.stop_all_services()
        sys.exit(0)
        
    def print_banner(self):
        """Print startup banner"""
        banner = f"""
{Colors.CYAN}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════╗
║                    🚀 RemoteHive Startup                     ║
║              Complete Service Orchestration                  ║
╚══════════════════════════════════════════════════════════════╝
{Colors.END}

{Colors.WHITE}Port Configuration:{Colors.END}
{Colors.GREEN}• Backend API:     http://localhost:8001{Colors.END}
{Colors.BLUE}• Admin Panel:     http://localhost:3000{Colors.END}
{Colors.MAGENTA}• Public Website:  http://localhost:3001{Colors.END}
{Colors.YELLOW}• AutoScraper:     http://localhost:8002{Colors.END}
{Colors.CYAN}• Redis:           localhost:6379{Colors.END}
{Colors.WHITE}• MongoDB:         Atlas Cloud{Colors.END}

{Colors.YELLOW}Starting services...{Colors.END}\n
        """
        print(banner)
        
    def check_port_availability(self, port: int) -> bool:
        """Check if a port is available"""
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) != 0
            
    def kill_process_on_port(self, port: int):
        """Kill process running on specified port"""
        try:
            result = subprocess.run(['lsof', '-ti', f':{port}'], 
                                  capture_output=True, text=True)
            if result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    if pid:
                        print(f"{Colors.YELLOW}Killing process {pid} on port {port}{Colors.END}")
                        subprocess.run(['kill', '-9', pid])
                        time.sleep(1)
        except Exception as e:
            print(f"{Colors.RED}Error killing process on port {port}: {e}{Colors.END}")
            
    def setup_services(self):
        """Setup service configurations"""
        
        # Backend API Service (Port 8001)
        self.services['backend'] = ServiceConfig(
            name='Backend API',
            command=['uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8001', '--reload'],
            cwd=str(self.project_root),
            port=8001,
            health_url='http://localhost:8001/health',
            env_vars={
                'PORT': '8001',
                'HOST': '0.0.0.0'
            }
        )
        
        # Admin Panel Service (Port 3000)
        admin_path = self.project_root / 'remotehive-admin'
        if admin_path.exists():
            self.services['admin'] = ServiceConfig(
                name='Admin Panel',
                command=['npm', 'run', 'dev', '--', '--port', '3000'],
                cwd=str(admin_path),
                port=3000,
                health_url='http://localhost:3000',
                startup_delay=10
            )
            
        # Public Website Service (Port 3001)
        public_path = self.project_root / 'remotehive-public'
        if public_path.exists():
            self.services['public'] = ServiceConfig(
                name='Public Website',
                command=['npm', 'run', 'dev', '--port', '3001'],
                cwd=str(public_path),
                port=3001,
                health_url='http://localhost:3001',
                startup_delay=10
            )
            
        # AutoScraper Service (Port 8002) - Optional
        autoscraper_path = self.project_root / 'autoscraper-service'
        if autoscraper_path.exists():
            self.services['autoscraper'] = ServiceConfig(
                name='AutoScraper',
                command=['uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8002', '--reload'],
                cwd=str(autoscraper_path),
                port=8002,
                health_url='http://localhost:8002/health',
                env_vars={
                    'PORT': '8002',
                    'HOST': '0.0.0.0'
                }
            )
            
    def check_prerequisites(self) -> bool:
        """Check if all prerequisites are met"""
        print(f"{Colors.BLUE}Checking prerequisites...{Colors.END}")
        
        # Check Python
        if sys.version_info < (3, 8):
            print(f"{Colors.RED}❌ Python 3.8+ required{Colors.END}")
            return False
        print(f"{Colors.GREEN}✅ Python {sys.version.split()[0]}{Colors.END}")
        
        # Check Node.js
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"{Colors.GREEN}✅ Node.js {result.stdout.strip()}{Colors.END}")
            else:
                print(f"{Colors.RED}❌ Node.js not found{Colors.END}")
                return False
        except FileNotFoundError:
            print(f"{Colors.RED}❌ Node.js not found{Colors.END}")
            return False
            
        # Check npm
        try:
            result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"{Colors.GREEN}✅ npm {result.stdout.strip()}{Colors.END}")
            else:
                print(f"{Colors.RED}❌ npm not found{Colors.END}")
                return False
        except FileNotFoundError:
            print(f"{Colors.RED}❌ npm not found{Colors.END}")
            return False
            
        # Check Redis (optional)
        try:
            result = subprocess.run(['redis-cli', 'ping'], capture_output=True, text=True)
            if result.returncode == 0 and 'PONG' in result.stdout:
                print(f"{Colors.GREEN}✅ Redis is running{Colors.END}")
            else:
                print(f"{Colors.YELLOW}⚠️  Redis not running (will start if needed){Colors.END}")
        except FileNotFoundError:
            print(f"{Colors.YELLOW}⚠️  Redis not installed (optional){Colors.END}")
            
        return True
        
    def install_dependencies(self):
        """Install dependencies for all services"""
        print(f"\n{Colors.BLUE}Installing dependencies...{Colors.END}")
        
        # Install Python dependencies
        if (self.project_root / 'requirements.txt').exists():
            print(f"{Colors.YELLOW}Installing Python dependencies...{Colors.END}")
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                         cwd=self.project_root)
            
        # Install Admin Panel dependencies
        admin_path = self.project_root / 'remotehive-admin'
        if admin_path.exists() and (admin_path / 'package.json').exists():
            print(f"{Colors.YELLOW}Installing Admin Panel dependencies...{Colors.END}")
            subprocess.run(['npm', 'install'], cwd=admin_path)
            
        # Install Public Website dependencies
        public_path = self.project_root / 'remotehive-public'
        if public_path.exists() and (public_path / 'package.json').exists():
            print(f"{Colors.YELLOW}Installing Public Website dependencies...{Colors.END}")
            subprocess.run(['npm', 'install'], cwd=public_path)
            
        # Install AutoScraper dependencies
        autoscraper_path = self.project_root / 'autoscraper-service'
        if autoscraper_path.exists() and (autoscraper_path / 'requirements.txt').exists():
            print(f"{Colors.YELLOW}Installing AutoScraper dependencies...{Colors.END}")
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                         cwd=autoscraper_path)
                         
    def start_service(self, service_name: str, config: ServiceConfig) -> bool:
        """Start a single service"""
        print(f"{Colors.YELLOW}Starting {config.name}...{Colors.END}")
        
        # Check if port is available
        if not self.check_port_availability(config.port):
            print(f"{Colors.YELLOW}Port {config.port} is busy, attempting to free it...{Colors.END}")
            self.kill_process_on_port(config.port)
            time.sleep(2)
            
        # Prepare environment
        env = os.environ.copy()
        if config.env_vars:
            env.update(config.env_vars)
            
        try:
            # Start the service
            config.process = subprocess.Popen(
                config.command,
                cwd=config.cwd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait for startup
            time.sleep(config.startup_delay)
            
            # Check if process is still running
            if config.process.poll() is None:
                print(f"{Colors.GREEN}✅ {config.name} started on port {config.port}{Colors.END}")
                self.running_services.append(service_name)
                return True
            else:
                stdout, stderr = config.process.communicate()
                print(f"{Colors.RED}❌ {config.name} failed to start{Colors.END}")
                if stderr:
                    print(f"{Colors.RED}Error: {stderr[:200]}...{Colors.END}")
                return False
                
        except Exception as e:
            print(f"{Colors.RED}❌ Failed to start {config.name}: {e}{Colors.END}")
            return False
            
    def check_service_health(self, config: ServiceConfig) -> bool:
        """Check if service is healthy"""
        try:
            response = requests.get(config.health_url, timeout=5)
            return response.status_code == 200
        except:
            return False
            
    def wait_for_service_health(self, config: ServiceConfig, timeout: int = 30) -> bool:
        """Wait for service to become healthy"""
        print(f"{Colors.YELLOW}Waiting for {config.name} to become healthy...{Colors.END}")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.check_service_health(config):
                print(f"{Colors.GREEN}✅ {config.name} is healthy{Colors.END}")
                return True
            time.sleep(2)
            
        print(f"{Colors.RED}❌ {config.name} health check timeout{Colors.END}")
        return False
        
    def start_all_services(self):
        """Start all services in order"""
        print(f"\n{Colors.BLUE}Starting services in order...{Colors.END}\n")
        
        # Start backend first
        if 'backend' in self.services:
            if self.start_service('backend', self.services['backend']):
                self.wait_for_service_health(self.services['backend'])
            else:
                print(f"{Colors.RED}Failed to start backend service. Aborting.{Colors.END}")
                return False
                
        # Start frontend services
        for service_name in ['admin', 'public']:
            if service_name in self.services:
                self.start_service(service_name, self.services[service_name])
                
        # Start autoscraper last (optional)
        if 'autoscraper' in self.services:
            if self.start_service('autoscraper', self.services['autoscraper']):
                self.wait_for_service_health(self.services['autoscraper'])
                
        return True
        
    def stop_all_services(self):
        """Stop all running services"""
        print(f"\n{Colors.YELLOW}Stopping all services...{Colors.END}")
        
        for service_name in self.running_services:
            config = self.services[service_name]
            if config.process and config.process.poll() is None:
                print(f"{Colors.YELLOW}Stopping {config.name}...{Colors.END}")
                config.process.terminate()
                try:
                    config.process.wait(timeout=10)
                    print(f"{Colors.GREEN}✅ {config.name} stopped{Colors.END}")
                except subprocess.TimeoutExpired:
                    print(f"{Colors.RED}Force killing {config.name}...{Colors.END}")
                    config.process.kill()
                    
    def print_status(self):
        """Print service status"""
        print(f"\n{Colors.CYAN}{Colors.BOLD}🎉 RemoteHive Services Started Successfully!{Colors.END}\n")
        
        print(f"{Colors.WHITE}Access your services:{Colors.END}")
        for service_name, config in self.services.items():
            if service_name in self.running_services:
                if 'backend' in service_name or 'autoscraper' in service_name:
                    url = f"http://localhost:{config.port}"
                else:
                    url = f"http://localhost:{config.port}"
                print(f"{Colors.GREEN}• {config.name}: {url}{Colors.END}")
                
        print(f"\n{Colors.YELLOW}Press Ctrl+C to stop all services{Colors.END}")
        
    def monitor_services(self):
        """Monitor running services"""
        try:
            while True:
                time.sleep(30)  # Check every 30 seconds
                
                for service_name in self.running_services.copy():
                    config = self.services[service_name]
                    if config.process and config.process.poll() is not None:
                        print(f"{Colors.RED}❌ {config.name} has stopped unexpectedly{Colors.END}")
                        self.running_services.remove(service_name)
                        
        except KeyboardInterrupt:
            pass
            
    def run(self):
        """Main run method"""
        self.print_banner()
        
        if not self.check_prerequisites():
            print(f"{Colors.RED}Prerequisites not met. Exiting.{Colors.END}")
            return 1
            
        self.install_dependencies()
        self.setup_services()
        
        if not self.start_all_services():
            print(f"{Colors.RED}Failed to start services. Exiting.{Colors.END}")
            return 1
            
        self.print_status()
        self.monitor_services()
        
        return 0

def main():
    """Main entry point"""
    starter = RemoteHiveStarter()
    return starter.run()

if __name__ == '__main__':
    sys.exit(main())