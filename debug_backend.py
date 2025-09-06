#!/usr/bin/env python3

import subprocess
import sys
import time
from pathlib import Path

def start_backend_debug():
    """Start backend server with full debug output"""
    backend_dir = Path(".").resolve()
    
    print(f"Starting backend server from: {backend_dir}")
    print("Command: python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print("=" * 60)
    
    try:
        # Start uvicorn server with real-time output
        process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        print("Backend server starting...")
        
        # Read output in real-time
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())
                
        # Check final status
        return_code = process.poll()
        print(f"\nProcess exited with code: {return_code}")
        
    except Exception as e:
        print(f"Error starting backend: {e}")

if __name__ == "__main__":
    start_backend_debug()