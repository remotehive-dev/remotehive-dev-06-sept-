# Simple test to verify server is loading our code
print("[TEST] This file was executed - server is loading code changes!")
print("[TEST] Current working directory and Python path check")
import os
import sys
print(f"[TEST] CWD: {os.getcwd()}")
print(f"[TEST] Python path includes: {[p for p in sys.path if 'Remotehive' in p]}")