#!/usr/bin/env python3
"""
JWT Key Rotation Script for RemoteHive

This script automates the process of generating a new secure JWT secret key
and updating it across all service environment files.

Usage:
    python rotate_jwt_keys.py
"""

import os
import re
import secrets
import glob
from datetime import datetime

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATTERNS = [
    ".env",
    ".env.production",
    ".env.staging",
    ".env.development",
]
SERVICE_DIRS = [
    "",  # Main service (root directory)
    "autoscraper-service",
    "remotehive-admin",
    # Add other service directories as needed
]

# JWT key patterns to replace
JWT_KEY_PATTERNS = [
    r"(JWT_SECRET_KEY=)[^\n]*",
    r"(SECRET_KEY=)[^\n]*",
    r"(AUTOSCRAPER_JWT_SECRET_KEY=)[^\n]*",
]

def generate_new_jwt_key():
    """Generate a new secure JWT secret key"""
    return secrets.token_hex(32)

def find_env_files():
    """Find all environment files that need updating"""
    env_files = []
    
    for service_dir in SERVICE_DIRS:
        service_path = os.path.join(PROJECT_ROOT, service_dir)
        if not os.path.isdir(service_path):
            print(f"Warning: Service directory not found: {service_path}")
            continue
            
        for pattern in ENV_PATTERNS:
            matches = glob.glob(os.path.join(service_path, pattern))
            env_files.extend(matches)
    
    return env_files

def update_env_file(file_path, new_key):
    """Update JWT secret keys in an environment file"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Make backup of original file
        backup_path = f"{file_path}.bak.{datetime.now().strftime('%Y%m%d%H%M%S')}"
        with open(backup_path, 'w') as f:
            f.write(content)
        
        # Replace all JWT key patterns
        for pattern in JWT_KEY_PATTERNS:
            content = re.sub(pattern, f"\g<1>{new_key}", content)
        
        with open(file_path, 'w') as f:
            f.write(content)
            
        return True
    except Exception as e:
        print(f"Error updating {file_path}: {str(e)}")
        return False

def main():
    print("JWT Key Rotation Script for RemoteHive")
    print("-" * 50)
    
    # Generate new key
    new_key = generate_new_jwt_key()
    print(f"Generated new JWT secret key")
    
    # Find environment files
    env_files = find_env_files()
    print(f"Found {len(env_files)} environment files to update")
    
    # Confirm with user
    print("\nFiles to update:")
    for file in env_files:
        print(f"  - {file}")
    
    confirm = input("\nProceed with updating these files? (y/n): ")
    if confirm.lower() != 'y':
        print("Operation cancelled.")
        return
    
    # Update files
    success_count = 0
    for file in env_files:
        print(f"Updating {file}...")
        if update_env_file(file, new_key):
            success_count += 1
            print(f"  ✓ Success")
        else:
            print(f"  ✗ Failed")
    
    print(f"\nCompleted: {success_count}/{len(env_files)} files updated successfully")
    print("\nRemember to restart all services for the changes to take effect.")

if __name__ == "__main__":
    main()