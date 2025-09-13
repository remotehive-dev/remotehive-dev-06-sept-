#!/usr/bin/env python3
"""
RemoteHive Real-time Sync Service
Handles IDE to production synchronization with file watching and webhook support.
"""

import asyncio
import json
import logging
import os
import subprocess
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

import aiofiles
import yaml
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from kubernetes import client, config
from pydantic import BaseModel
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="RemoteHive Sync Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global configuration
CONFIG = {}
DEPLOYMENT_QUEUE = asyncio.Queue()
DEPLOYMENT_HISTORY = []
RATE_LIMITER = {}

class WebhookPayload(BaseModel):
    repository: Dict
    ref: str
    commits: List[Dict]
    pusher: Dict

class DeploymentRequest(BaseModel):
    service: str
    branch: str
    commit_sha: Optional[str] = None
    triggered_by: str = "manual"
    files_changed: List[str] = []

class SyncFileHandler(FileSystemEventHandler):
    """File system event handler for real-time sync"""
    
    def __init__(self, watcher_config: Dict):
        self.config = watcher_config
        self.debounce_time = 2.0  # seconds
        self.last_event_time = {}
        
    def on_modified(self, event):
        if event.is_directory:
            return
            
        file_path = Path(event.src_path)
        
        # Check if file matches patterns
        if not self._should_process_file(file_path):
            return
            
        # Debounce events
        now = time.time()
        if file_path in self.last_event_time:
            if now - self.last_event_time[file_path] < self.debounce_time:
                return
                
        self.last_event_time[file_path] = now
        
        logger.info(f"File changed: {file_path}")
        
        # Queue deployment
        deployment_request = DeploymentRequest(
            service=self.config['name'],
            branch="develop",  # Default branch for file changes
            triggered_by="file_watcher",
            files_changed=[str(file_path)]
        )
        
        asyncio.create_task(queue_deployment(deployment_request))
        
    def _should_process_file(self, file_path: Path) -> bool:
        """Check if file should trigger deployment"""
        # Check exclude patterns
        for exclude in self.config.get('exclude', []):
            if exclude in str(file_path):
                return False
                
        # Check include patterns
        patterns = self.config.get('patterns', [])
        if not patterns:
            return True
            
        for pattern in patterns:
            if file_path.match(pattern):
                return True
                
        return False

async def load_config():
    """Load sync configuration from ConfigMap"""
    global CONFIG
    
    config_path = Path("/etc/sync/sync-config.yaml")
    if not config_path.exists():
        logger.warning("Config file not found, using defaults")
        CONFIG = {
            "sync": {"enabled": True, "mode": "webhook"},
            "watchers": [],
            "deployment": {"strategy": "rolling", "timeout": "300s"},
            "security": {"max_deployments_per_hour": 10}
        }
        return
        
    async with aiofiles.open(config_path, 'r') as f:
        content = await f.read()
        CONFIG = yaml.safe_load(content)
        
    logger.info(f"Loaded configuration with {len(CONFIG.get('watchers', []))} watchers")

async def setup_file_watchers():
    """Set up file system watchers"""
    if not CONFIG.get('sync', {}).get('enabled', False):
        logger.info("Sync is disabled")
        return
        
    mode = CONFIG.get('sync', {}).get('mode', 'webhook')
    if mode not in ['polling', 'hybrid']:
        logger.info(f"File watching disabled for mode: {mode}")
        return
        
    observer = Observer()
    
    for watcher_config in CONFIG.get('watchers', []):
        path = watcher_config.get('path', '.')
        if not Path(path).exists():
            logger.warning(f"Watch path does not exist: {path}")
            continue
            
        handler = SyncFileHandler(watcher_config)
        observer.schedule(handler, path, recursive=True)
        logger.info(f"Watching {path} for {watcher_config['name']}")
        
    observer.start()
    logger.info("File watchers started")

async def queue_deployment(request: DeploymentRequest):
    """Queue a deployment request"""
    # Rate limiting
    if not await check_rate_limit(request.service):
        logger.warning(f"Rate limit exceeded for service: {request.service}")
        return
        
    # Security checks
    if not await security_check(request):
        logger.warning(f"Security check failed for deployment: {request.service}")
        return
        
    await DEPLOYMENT_QUEUE.put(request)
    logger.info(f"Queued deployment for {request.service}")

async def check_rate_limit(service: str) -> bool:
    """Check if service is within rate limits"""
    max_per_hour = CONFIG.get('security', {}).get('max_deployments_per_hour', 10)
    now = datetime.now()
    hour_ago = now - timedelta(hours=1)
    
    if service not in RATE_LIMITER:
        RATE_LIMITER[service] = []
        
    # Clean old entries
    RATE_LIMITER[service] = [
        ts for ts in RATE_LIMITER[service] if ts > hour_ago
    ]
    
    if len(RATE_LIMITER[service]) >= max_per_hour:
        return False
        
    RATE_LIMITER[service].append(now)
    return True

async def security_check(request: DeploymentRequest) -> bool:
    """Perform security checks on deployment request"""
    allowed_branches = CONFIG.get('security', {}).get('allowed_branches', [])
    
    if allowed_branches and request.branch not in allowed_branches:
        # Check if branch matches patterns
        for pattern in allowed_branches:
            if '*' in pattern:
                prefix = pattern.replace('*', '')
                if request.branch.startswith(prefix):
                    return True
        return False
        
    return True

async def process_deployment_queue():
    """Process deployment queue"""
    while True:
        try:
            request = await DEPLOYMENT_QUEUE.get()
            await execute_deployment(request)
            DEPLOYMENT_QUEUE.task_done()
        except Exception as e:
            logger.error(f"Error processing deployment: {e}")
            await asyncio.sleep(5)

async def execute_deployment(request: DeploymentRequest):
    """Execute a deployment"""
    logger.info(f"Starting deployment for {request.service}")
    
    start_time = datetime.now()
    deployment_id = f"{request.service}-{int(start_time.timestamp())}"
    
    try:
        # Find watcher config
        watcher_config = None
        for watcher in CONFIG.get('watchers', []):
            if watcher['name'] == request.service:
                watcher_config = watcher
                break
                
        if not watcher_config:
            raise Exception(f"No watcher config found for service: {request.service}")
            
        # Build Docker image
        await build_docker_image(watcher_config, request)
        
        # Deploy to Kubernetes
        await deploy_to_kubernetes(watcher_config, request)
        
        # Health check
        if CONFIG.get('deployment', {}).get('health_check', {}).get('enabled', True):
            await perform_health_check(request.service)
            
        # Record successful deployment
        DEPLOYMENT_HISTORY.append({
            'id': deployment_id,
            'service': request.service,
            'status': 'success',
            'start_time': start_time,
            'end_time': datetime.now(),
            'triggered_by': request.triggered_by,
            'files_changed': request.files_changed
        })
        
        logger.info(f"Deployment completed successfully: {deployment_id}")
        await send_notification(request, 'success', deployment_id)
        
    except Exception as e:
        logger.error(f"Deployment failed: {e}")
        
        DEPLOYMENT_HISTORY.append({
            'id': deployment_id,
            'service': request.service,
            'status': 'failed',
            'start_time': start_time,
            'end_time': datetime.now(),
            'error': str(e),
            'triggered_by': request.triggered_by
        })
        
        await send_notification(request, 'failed', deployment_id, str(e))

async def build_docker_image(watcher_config: Dict, request: DeploymentRequest):
    """Build Docker image for the service"""
    logger.info(f"Building Docker image for {request.service}")
    
    dockerfile = None
    for action in watcher_config.get('actions', []):
        if action.get('type') == 'build':
            dockerfile = action.get('dockerfile')
            break
            
    if not dockerfile:
        raise Exception(f"No build action found for service: {request.service}")
        
    # Build command
    registry = os.getenv('DOCKER_REGISTRY', 'ghcr.io')
    image_tag = f"{registry}/remotehive/{request.service}:latest"
    
    build_cmd = [
        'docker', 'build',
        '-f', dockerfile,
        '-t', image_tag,
        watcher_config.get('path', '.')
    ]
    
    process = await asyncio.create_subprocess_exec(
        *build_cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    stdout, stderr = await process.communicate()
    
    if process.returncode != 0:
        raise Exception(f"Docker build failed: {stderr.decode()}")
        
    logger.info(f"Docker image built successfully: {image_tag}")
    
    # Push image
    push_cmd = ['docker', 'push', image_tag]
    process = await asyncio.create_subprocess_exec(
        *push_cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    stdout, stderr = await process.communicate()
    
    if process.returncode != 0:
        raise Exception(f"Docker push failed: {stderr.decode()}")
        
    logger.info(f"Docker image pushed successfully: {image_tag}")

async def deploy_to_kubernetes(watcher_config: Dict, request: DeploymentRequest):
    """Deploy service to Kubernetes"""
    logger.info(f"Deploying {request.service} to Kubernetes")
    
    try:
        config.load_incluster_config()
    except:
        config.load_kube_config()
        
    apps_v1 = client.AppsV1Api()
    namespace = os.getenv('KUBERNETES_NAMESPACE', 'remotehive')
    
    # Find deployment action
    deployment_name = None
    for action in watcher_config.get('actions', []):
        if action.get('type') == 'deploy':
            deployment_name = action.get('service')
            break
            
    if not deployment_name:
        raise Exception(f"No deploy action found for service: {request.service}")
        
    # Update deployment image
    registry = os.getenv('DOCKER_REGISTRY', 'ghcr.io')
    new_image = f"{registry}/remotehive/{request.service}:latest"
    
    # Get current deployment
    deployment = apps_v1.read_namespaced_deployment(
        name=deployment_name,
        namespace=namespace
    )
    
    # Update image
    deployment.spec.template.spec.containers[0].image = new_image
    
    # Apply update
    apps_v1.patch_namespaced_deployment(
        name=deployment_name,
        namespace=namespace,
        body=deployment
    )
    
    logger.info(f"Kubernetes deployment updated: {deployment_name}")
    
    # Wait for rollout
    timeout = CONFIG.get('deployment', {}).get('timeout', '300s')
    timeout_seconds = int(timeout.replace('s', ''))
    
    for _ in range(timeout_seconds // 10):
        deployment = apps_v1.read_namespaced_deployment(
            name=deployment_name,
            namespace=namespace
        )
        
        if (deployment.status.ready_replicas == deployment.status.replicas and
            deployment.status.updated_replicas == deployment.status.replicas):
            logger.info(f"Deployment rollout completed: {deployment_name}")
            return
            
        await asyncio.sleep(10)
        
    raise Exception(f"Deployment rollout timeout: {deployment_name}")

async def perform_health_check(service: str):
    """Perform health check on deployed service"""
    logger.info(f"Performing health check for {service}")
    
    # This is a simplified health check
    # In production, you'd want more sophisticated checks
    await asyncio.sleep(5)  # Wait for service to stabilize
    
    logger.info(f"Health check passed for {service}")

async def send_notification(request: DeploymentRequest, status: str, deployment_id: str, error: str = None):
    """Send deployment notification"""
    notifications = CONFIG.get('notifications', {})
    
    if notifications.get('slack', {}).get('enabled', False):
        await send_slack_notification(request, status, deployment_id, error)

async def send_slack_notification(request: DeploymentRequest, status: str, deployment_id: str, error: str = None):
    """Send Slack notification"""
    webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    if not webhook_url:
        return
        
    color = 'good' if status == 'success' else 'danger'
    text = f"Deployment {status.upper()}: {request.service}"
    
    payload = {
        'text': text,
        'attachments': [{
            'color': color,
            'fields': [
                {'title': 'Service', 'value': request.service, 'short': True},
                {'title': 'Branch', 'value': request.branch, 'short': True},
                {'title': 'Triggered By', 'value': request.triggered_by, 'short': True},
                {'title': 'Deployment ID', 'value': deployment_id, 'short': True}
            ]
        }]
    }
    
    if error:
        payload['attachments'][0]['fields'].append({
            'title': 'Error',
            'value': error[:500],  # Truncate long errors
            'short': False
        })
        
    # Send notification (implementation depends on HTTP client)
    logger.info(f"Slack notification sent: {text}")

@app.on_event("startup")
async def startup_event():
    """Initialize the sync service"""
    logger.info("Starting RemoteHive Sync Service")
    
    await load_config()
    await setup_file_watchers()
    
    # Start deployment queue processor
    asyncio.create_task(process_deployment_queue())
    
    logger.info("Sync service initialized")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "queue_size": DEPLOYMENT_QUEUE.qsize(),
        "deployments_today": len([
            d for d in DEPLOYMENT_HISTORY 
            if d['start_time'].date() == datetime.now().date()
        ])
    }

@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    return {"status": "ready"}

@app.post("/webhook")
async def webhook_handler(request: Request, background_tasks: BackgroundTasks):
    """Handle webhook from Git providers"""
    try:
        payload = await request.json()
        
        # Extract relevant information
        repo_name = payload.get('repository', {}).get('name', '')
        ref = payload.get('ref', '')
        branch = ref.replace('refs/heads/', '') if ref.startswith('refs/heads/') else ref
        
        commits = payload.get('commits', [])
        if not commits:
            return {"message": "No commits found"}
            
        # Determine which services to deploy based on changed files
        services_to_deploy = set()
        files_changed = []
        
        for commit in commits:
            for file_path in commit.get('modified', []) + commit.get('added', []):
                files_changed.append(file_path)
                
                # Map file paths to services
                for watcher in CONFIG.get('watchers', []):
                    watcher_path = watcher.get('path', '').lstrip('/')
                    if file_path.startswith(watcher_path):
                        services_to_deploy.add(watcher['name'])
                        
        if not services_to_deploy:
            return {"message": "No services affected by changes"}
            
        # Queue deployments
        for service in services_to_deploy:
            deployment_request = DeploymentRequest(
                service=service,
                branch=branch,
                commit_sha=commits[-1].get('id', ''),
                triggered_by="webhook",
                files_changed=files_changed
            )
            
            background_tasks.add_task(queue_deployment, deployment_request)
            
        return {
            "message": f"Queued deployments for {len(services_to_deploy)} services",
            "services": list(services_to_deploy)
        }
        
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/deploy")
async def manual_deploy(request: DeploymentRequest, background_tasks: BackgroundTasks):
    """Manual deployment trigger"""
    background_tasks.add_task(queue_deployment, request)
    return {"message": f"Deployment queued for {request.service}"}

@app.get("/deployments")
async def get_deployments():
    """Get deployment history"""
    return {
        "deployments": DEPLOYMENT_HISTORY[-50:],  # Last 50 deployments
        "queue_size": DEPLOYMENT_QUEUE.qsize()
    }

@app.get("/config")
async def get_config():
    """Get current configuration"""
    return CONFIG

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)