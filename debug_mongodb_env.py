#!/usr/bin/env python3
"""
Debug MongoDB Environment Variables
Checks if the application can read the MongoDB connection string correctly
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=== MongoDB Environment Debug ===")
print(f"MONGODB_URL from env: {os.getenv('MONGODB_URL')}")
print(f"MONGODB_DATABASE_NAME from env: {os.getenv('MONGODB_DATABASE_NAME')}")
print(f"MONGODB_DATABASE from env: {os.getenv('MONGODB_DATABASE')}")

# Check if .env file exists
if os.path.exists('.env'):
    print("\n.env file exists")
    with open('.env', 'r') as f:
        lines = f.readlines()
        for i, line in enumerate(lines[:10], 1):  # First 10 lines
            if 'MONGODB' in line:
                print(f"Line {i}: {line.strip()}")
else:
    print(".env file not found")

print("\n=== Current Working Directory ===")
print(f"CWD: {os.getcwd()}")
print(f"Files in CWD: {[f for f in os.listdir('.') if f.startswith('.env')]}")