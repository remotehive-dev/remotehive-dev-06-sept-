#!/usr/bin/env python3
"""
Script to restart the FastAPI server with a fresh Atlas connection
"""

import os
import sys
import subprocess
import time
from dotenv import load_dotenv

def main():
    print("🔄 Restarting server with fresh Atlas connection...")
    
    # Load environment variables
    load_dotenv()
    
    # Verify Atlas connection string
    mongodb_url = os.getenv('MONGODB_URL')
    if not mongodb_url or 'mongodb+srv' not in mongodb_url:
        print("❌ Error: MONGODB_URL not set to Atlas connection string")
        return False
    
    print(f"✅ Using Atlas connection: {mongodb_url[:50]}...")
    
    # Kill any existing uvicorn processes
    try:
        subprocess.run(['pkill', '-f', 'uvicorn'], check=False)
        print("🔪 Killed existing uvicorn processes")
        time.sleep(2)
    except Exception as e:
        print(f"⚠️  Could not kill existing processes: {e}")
    
    # Clear Python cache to ensure fresh imports
    print("🧹 Clearing Python cache...")
    for root, dirs, files in os.walk('.'):
        for d in dirs[:]:
            if d == '__pycache__':
                import shutil
                shutil.rmtree(os.path.join(root, d))
                dirs.remove(d)
    
    # Set environment variables explicitly
    env = os.environ.copy()
    env['MONGODB_URL'] = mongodb_url
    env['MONGODB_DATABASE_NAME'] = os.getenv('MONGODB_DATABASE_NAME', 'remotehive_main')
    
    print("🚀 Starting server with fresh environment...")
    
    # Start uvicorn with fresh environment
    cmd = [
        sys.executable, '-c',
        '''
import os
from dotenv import load_dotenv
load_dotenv()
print(f"Server starting with MONGODB_URL: {os.getenv('MONGODB_URL')[:50]}...")
import uvicorn
uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)
'''
    ]
    
    try:
        subprocess.run(cmd, env=env, check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)