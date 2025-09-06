#!/usr/bin/env python3
import sys
import traceback
import os

print("Starting debug server...")
print(f"Current working directory: {os.getcwd()}")
print(f"Python path: {sys.path[:3]}...")

try:
    print("Importing FastAPI...")
    from fastapi import FastAPI
    print("FastAPI imported successfully")
    
    print("Importing app modules...")
    from app.main import app
    print("App imported successfully")
    
    print("Starting uvicorn...")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug")
    
except Exception as e:
    print(f"Error occurred: {e}")
    print("Full traceback:")
    traceback.print_exc()
    sys.exit(1)