#!/usr/bin/env python3
"""
RemoteHive Server Memory Manager

This module provides intelligent server connection management with memory capabilities.
It ensures that previous server connections are properly closed before starting new ones,
preventing port conflicts and resource leaks.

Features:
- Persistent memory of running servers
- Graceful shutdown of existing connections
- Port conflict resolution
- Resource cleanup
- Health monitoring
- Dependency management

Usage:
    from server_memory_manager import ServerMemoryManager
    
    manager = ServerMemoryManager()
    manager.start_all_servers()
"""

import os
import sys
import json
import time
import shutil
import signal
import psutil
import requests
import subprocess
from pathlib import Path
from typing import List, Optional, Dict, Set
from contextlib import contextmanager
from datetime import datetime, timedelta

# Get the current working directory (project root)
PROJECT_ROOT = os.getcwd()
MEMORY_FILE = os.path.join(PROJECT_ROOT, '.server_memory.json')
LOG_FILE = os.path.join(PROJECT_ROOT, 'server_manager.log')

# Server Configuration
SERVER_CONFIG = {
    'redis': {
        'port': 6379,
        'command': ['redis-server', '--port', '6379'],
        'cwd': PROJECT_ROOT,
        'health_url': None,
        'name': 'Redis Server',
        'optional': True,
        'check_command': 'redis-cli ping',
        'startup_delay': 2,
        'health_timeout': 30
    },
    'celery_worker': {
        'port': None,
        'command': ['python', '-m', 'celery', '-A', 'app.core.celery', 'worker', '--loglevel=info', '--pool=solo'],
        'cwd': PROJECT_ROOT,
        'health_url': None,
        'name': 'Celery Worker (Email Server)',
        'optional': True,
        'depends_on': ['redis'],
        'startup_delay': 3,
        'health_timeout': 30
    },
    'celery_beat': {
        'port': None,
        'command': ['python', '-m', 'celery', '-A', 'app.core.celery', 'beat', '--loglevel=info'],
        'cwd': PROJECT_ROOT,
        'health_url': None,
        'name': 'Celery Beat (Task Scheduler)',
        'optional': True,
        'depends_on': ['redis'],
        'startup_delay': 3,
        'health_timeout': 30
    },

    'backend': {
        'port': 8000,
        'command': ['python', '-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
        'cwd': PROJECT_ROOT,
        'health_url': 'http://localhost:8000/health',
        'name': 'Backend API',
        'startup_delay': 5,
        'health_timeout': 45
    },
    'admin': {
        'port': 3001,
        'command': ['npm', 'run', 'dev'],
        'cwd': os.path.join(PROJECT_ROOT, 'remotehive-admin'),
        'health_url': 'http://localhost:3001',
        'name': 'Admin Panel',
        'startup_delay': 10,
        'health_timeout': 60
    },
    'public': {
        'port': 5173,
        'command': ['npm', 'run', 'dev'],
        'cwd': os.path.join(PROJECT_ROOT, 'remotehive-public'),
        'health_url': 'http://localhost:5173',
        'name': 'Public Website',
        'startup_delay': 10,
        'health_timeout': 60
    }
}

# Startup order with dependencies
STARTUP_ORDER = [
    'redis',
    'celery_worker',
    'celery_beat',
    'backend',
    'admin',
    'public'
]

# Cleanup paths
CLEANUP_PATHS = [
    os.path.join(PROJECT_ROOT, '__pycache__'),
    os.path.join(PROJECT_ROOT, 'app', '__pycache__'),
    os.path.join(PROJECT_ROOT, '.pytest_cache'),
    os.path.join(PROJECT_ROOT, 'remotehive-admin', '.next'),
    os.path.join(PROJECT_ROOT, 'remotehive-admin', 'node_modules', '.cache'),
    os.path.join(PROJECT_ROOT, 'remotehive-public', 'dist'),
    os.path.join(PROJECT_ROOT, 'remotehive-public', 'node_modules', '.cache'),
    os.path.join(PROJECT_ROOT, 'celerybeat-schedule')
]

class Colors:
    """ANSI color codes for terminal output"""
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

class ServerMemoryManager:
    """Intelligent server connection manager with persistent memory"""
    
    def __init__(self):
        self.processes: Dict[str, subprocess.Popen] = {}
        self.memory: Dict = self._load_memory()
        self.running_services: Set[str] = set()
        self.optional_services: Set[str] = set()
        self.startup_time = datetime.now()
        
    def _load_memory(self) -> Dict:
        """Load server memory from persistent storage"""
        try:
            if os.path.exists(MEMORY_FILE):
                with open(MEMORY_FILE, 'r') as f:
                    memory = json.load(f)
                    self._log(f"Loaded memory: {len(memory.get('servers', {}))} servers tracked")
                    return memory
        except Exception as e:
            self._log(f"Error loading memory: {e}", level="ERROR")
        
        return {
            'servers': {},
            'last_startup': None,
            'last_shutdown': None,
            'startup_count': 0
        }
    
    def _save_memory(self):
        """Save server memory to persistent storage"""
        try:
            self.memory['last_update'] = datetime.now().isoformat()
            with open(MEMORY_FILE, 'w') as f:
                json.dump(self.memory, f, indent=2)
            self._log("Memory saved successfully")
        except Exception as e:
            self._log(f"Error saving memory: {e}", level="ERROR")
    
    def _log(self, message: str, level: str = "INFO"):
        """Log message to file and optionally console"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] [{level}] {message}\n"
        
        try:
            with open(LOG_FILE, 'a') as f:
                f.write(log_entry)
        except Exception:
            pass  # Fail silently for logging errors
    
    def print_step(self, step: str, status: str = "INFO"):
        """Print formatted step message"""
        color = Colors.GREEN if status == "SUCCESS" else Colors.YELLOW if status == "WARNING" else Colors.BLUE
        icon = "✅" if status == "SUCCESS" else "⚠️" if status == "WARNING" else "🔄"
        message = f"{color}{icon} {step}{Colors.END}"
        print(message)
        self._log(f"{icon} {step}")
    
    def print_error(self, message: str):
        """Print error message"""
        error_msg = f"{Colors.RED}❌ {message}{Colors.END}"
        print(error_msg)
        self._log(f"❌ {message}", level="ERROR")
    
    def print_header(self):
        """Print startup header"""
        print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*70}{Colors.END}")
        print(f"{Colors.CYAN}{Colors.BOLD}🧠 RemoteHive Server Memory Manager{Colors.END}")
        print(f"{Colors.CYAN}{Colors.BOLD}{'='*70}{Colors.END}\n")
        
        # Show memory stats
        if self.memory.get('startup_count', 0) > 0:
            print(f"{Colors.BLUE}📊 Memory Stats:{Colors.END}")
            print(f"   Previous startups: {self.memory.get('startup_count', 0)}")
            if self.memory.get('last_startup'):
                print(f"   Last startup: {self.memory['last_startup']}")
            if self.memory.get('last_shutdown'):
                print(f"   Last shutdown: {self.memory['last_shutdown']}")
            print()
    
    def cleanup_previous_connections(self):
        """Clean up any previous server connections from memory"""
        self.print_step("Cleaning up previous server connections...")
        
        cleaned_count = 0
        
        # Check memory for previously running servers
        previous_servers = self.memory.get('servers', {})
        for server_name, server_info in previous_servers.items():
            pid = server_info.get('pid')
            port = server_info.get('port')
            
            if pid:
                try:
                    if psutil.pid_exists(pid):
                        proc = psutil.Process(pid)
                        if proc.is_running():
                            self.print_step(f"Terminating previous {server_name} (PID: {pid})")
                            proc.terminate()
                            try:
                                proc.wait(timeout=5)
                            except psutil.TimeoutExpired:
                                proc.kill()
                            cleaned_count += 1
                except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
                    self._log(f"Process {pid} for {server_name} no longer exists: {e}")
        
        # Kill processes on known ports
        ports = [config['port'] for config in SERVER_CONFIG.values() if config.get('port')]
        cleaned_count += self._kill_processes_on_ports(ports)
        
        # Clear memory of previous servers
        self.memory['servers'] = {}
        self.memory['last_shutdown'] = datetime.now().isoformat()
        self._save_memory()
        
        if cleaned_count > 0:
            self.print_step(f"Cleaned up {cleaned_count} previous connections", "SUCCESS")
        else:
            self.print_step("No previous connections found to clean up", "SUCCESS")
    
    def _kill_processes_on_ports(self, ports: List[int]) -> int:
        """Kill processes running on specified ports"""
        killed_count = 0
        
        for port in ports:
            try:
                for proc in psutil.process_iter(['pid', 'name', 'connections']):
                    try:
                        connections = proc.info.get('connections', [])
                        if connections:
                            for conn in connections:
                                if hasattr(conn, 'laddr') and conn.laddr and conn.laddr.port == port:
                                    try:
                                        proc.terminate()
                                        proc.wait(timeout=3)
                                    except (psutil.TimeoutExpired, psutil.AccessDenied):
                                        try:
                                            proc.kill()
                                            proc.wait(timeout=2)
                                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                                            pass
                                    
                                    killed_count += 1
                                    self.print_step(f"Stopped process {proc.info['name']} (PID: {proc.info['pid']}) on port {port}", "SUCCESS")
                                    break
                    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                        continue
            except Exception as e:
                self._log(f"Error checking port {port}: {e}", level="ERROR")
        
        return killed_count
    
    def cleanup_cache_and_temp_files(self):
        """Clean up cache and temporary files"""
        self.print_step("Cleaning up cache and temporary files")
        cleaned_count = 0
        
        for path_str in CLEANUP_PATHS:
            path = Path(path_str)
            if path.exists():
                try:
                    if path.is_file():
                        path.unlink()
                        cleaned_count += 1
                        self.print_step(f"Removed file: {path.name}", "SUCCESS")
                    elif path.is_dir():
                        shutil.rmtree(path)
                        cleaned_count += 1
                        self.print_step(f"Removed directory: {path.name}", "SUCCESS")
                except Exception as e:
                    self.print_error(f"Failed to remove {path}: {e}")
        
        if cleaned_count == 0:
            self.print_step("No cache files found to clean", "SUCCESS")
        else:
            self.print_step(f"Cleaned {cleaned_count} cache items", "SUCCESS")
    
    def start_server(self, server_name: str) -> bool:
        """Start a specific server with memory tracking"""
        config = SERVER_CONFIG[server_name]
        
        # Check dependencies
        depends_on = config.get('depends_on', [])
        for dep in depends_on:
            if dep not in self.running_services:
                self.print_step(f"{config['name']} skipped (requires {SERVER_CONFIG[dep]['name']})", "WARNING")
                return False
        
        self.print_step(f"Starting {config['name']}...")
        
        try:
            # Prepare command
            command = config['command'].copy()
            
            # Start the process
            if server_name in ['backend', 'redis']:
                process = subprocess.Popen(
                    command,
                    cwd=config['cwd'],
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
                )
            else:
                process = subprocess.Popen(
                    command,
                    cwd=config['cwd'],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
                )
            
            self.processes[server_name] = process
            
            # Store in memory
            self.memory['servers'][server_name] = {
                'pid': process.pid,
                'port': config.get('port'),
                'name': config['name'],
                'started_at': datetime.now().isoformat(),
                'command': ' '.join(command),
                'cwd': config['cwd']
            }
            self._save_memory()
            
            # Wait for startup delay
            startup_delay = config.get('startup_delay', 2)
            time.sleep(startup_delay)
            
            # Check if process is still running
            if process.poll() is None:
                self.running_services.add(server_name)
                self.print_step(f"{config['name']} started successfully (PID: {process.pid})", "SUCCESS")
                return True
            else:
                self.print_error(f"{config['name']} failed to start")
                return False
                
        except Exception as e:
            self.print_error(f"Failed to start {config['name']}: {e}")
            return False
    
    def check_server_health(self, server_name: str) -> bool:
        """Check if a server is healthy"""
        config = SERVER_CONFIG[server_name]
        
        if server_name == 'redis':
            return self._check_redis_health()
        elif config.get('health_url'):
            return self._check_http_health(server_name)
        elif server_name.startswith('celery'):
            return self._check_process_health(server_name)
        
        return True
    
    def _check_redis_health(self) -> bool:
        """Check Redis health using redis-cli ping"""
        try:
            result = subprocess.run(['redis-cli', 'ping'], capture_output=True, text=True, timeout=5)
            return result.returncode == 0 and 'PONG' in result.stdout
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    def _check_http_health(self, server_name: str) -> bool:
        """Check HTTP health endpoint"""
        config = SERVER_CONFIG[server_name]
        try:
            response = requests.get(config['health_url'], timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def _check_process_health(self, server_name: str) -> bool:
        """Check if process is still running"""
        if server_name in self.processes:
            return self.processes[server_name].poll() is None
        return False
    
    def wait_for_server_health(self, server_name: str) -> bool:
        """Wait for server to become healthy"""
        config = SERVER_CONFIG[server_name]
        timeout = config.get('health_timeout', 30)
        
        self.print_step(f"Waiting for {config['name']} to become ready...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.check_server_health(server_name):
                health_info = config.get('health_url', 'Running')
                self.print_step(f"{config['name']} is ready! 🌐 {health_info}", "SUCCESS")
                return True
            time.sleep(2)
        
        self.print_step(f"{config['name']} did not become ready within {timeout} seconds", "WARNING")
        return False
    
    def start_all_servers(self) -> bool:
        """Start all servers in the correct order"""
        try:
            self.print_header()
            
            # Step 1: Clean up previous connections
            self.cleanup_previous_connections()
            
            # Step 2: Clean up cache and temp files
            self.cleanup_cache_and_temp_files()
            
            # Step 3: Start servers sequentially
            successful_services = []
            
            for server_name in STARTUP_ORDER:
                config = SERVER_CONFIG[server_name]
                
                if self.start_server(server_name):
                    if self.wait_for_server_health(server_name):
                        successful_services.append(server_name)
                    else:
                        self.print_step(f"{config['name']} started but may not be fully ready", "WARNING")
                        successful_services.append(server_name)
                else:
                    if config.get('optional', False):
                        self.print_step(f"{config['name']} skipped (optional)", "WARNING")
                    else:
                        self.print_error(f"Failed to start {config['name']}")
            
            # Step 4: Update memory and print summary
            self.memory['startup_count'] = self.memory.get('startup_count', 0) + 1
            self.memory['last_startup'] = datetime.now().isoformat()
            self._save_memory()
            
            self._print_summary(successful_services)
            
            # Check if core services are running
            core_services = ['backend']
            core_running = any(service in successful_services for service in core_services)
            
            if core_running:
                self.print_step("🎉 RemoteHive is ready!", "SUCCESS")
                return True
            else:
                self.print_error("No core services are running")
                return False
                
        except Exception as e:
            self.print_error(f"Unexpected error during startup: {e}")
            return False
    
    def _print_summary(self, successful_services: List[str]):
        """Print startup summary"""
        print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*70}{Colors.END}")
        print(f"{Colors.CYAN}{Colors.BOLD}📊 Startup Summary{Colors.END}")
        print(f"{Colors.CYAN}{Colors.BOLD}{'='*70}{Colors.END}\n")
        
        for server_name in STARTUP_ORDER:
            config = SERVER_CONFIG[server_name]
            if server_name in successful_services:
                status_icon = "✅"
                status_color = Colors.GREEN
                url_info = config.get('health_url', 'Running')
            elif config.get('optional', False):
                status_icon = "⚠️"
                status_color = Colors.YELLOW
                url_info = "Skipped (Optional)"
            else:
                status_icon = "❌"
                status_color = Colors.RED
                url_info = "Failed"
            
            print(f"{status_color}{status_icon} {config['name']}: {url_info}{Colors.END}")
            if server_name in self.processes:
                print(f"   PID: {self.processes[server_name].pid}")
        
        print(f"\n{Colors.CYAN}{Colors.BOLD}🔗 Quick Access Links:{Colors.END}")
        if 'admin' in successful_services:
            print(f"{Colors.GREEN}  🛠️ Admin Panel: http://localhost:3001{Colors.END}")
        if 'public' in successful_services:
            print(f"{Colors.GREEN}  🎨 Public Website: http://localhost:5173{Colors.END}")
        if 'backend' in successful_services:
            print(f"{Colors.GREEN}  📚 API Documentation: http://localhost:8000/docs{Colors.END}")

        
        print(f"\n{Colors.YELLOW}📝 Press Ctrl+C to stop all servers{Colors.END}")
        print(f"{Colors.CYAN}{Colors.BOLD}{'='*70}{Colors.END}\n")
    
    def stop_all_servers(self):
        """Stop all running servers gracefully"""
        self.print_step("Stopping all servers...")
        
        for server_name, process in self.processes.items():
            try:
                if process.poll() is None:
                    config = SERVER_CONFIG[server_name]
                    self.print_step(f"Stopping {config['name']}...")
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                        self.print_step(f"Stopped {config['name']}", "SUCCESS")
                    except subprocess.TimeoutExpired:
                        process.kill()
                        self.print_step(f"Force killed {config['name']}", "WARNING")
            except Exception as e:
                self.print_error(f"Error stopping {server_name}: {e}")
        
        # Clear memory
        self.memory['servers'] = {}
        self.memory['last_shutdown'] = datetime.now().isoformat()
        self._save_memory()
        
        self.print_step("All servers stopped", "SUCCESS")
    
    def keep_alive(self):
        """Keep the manager running and monitor servers"""
        try:
            while True:
                time.sleep(10)
                # Optional: Add health monitoring here
        except KeyboardInterrupt:
            self.print_step("\nReceived interrupt signal")
            self.stop_all_servers()

def main():
    """Main entry point"""
    manager = ServerMemoryManager()
    
    try:
        success = manager.start_all_servers()
        if success:
            manager.keep_alive()
        else:
            sys.exit(1)
    except KeyboardInterrupt:
        manager.print_step("\nShutdown requested")
        manager.stop_all_servers()
    except Exception as e:
        manager.print_error(f"Unexpected error: {e}")
        manager.stop_all_servers()
        sys.exit(1)

if __name__ == "__main__":
    main()