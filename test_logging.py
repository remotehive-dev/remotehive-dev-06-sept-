#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from loguru import logger
import logging

# Test both loguru and standard logging
logger.info("=== LOGURU TEST MESSAGE ===")
logging.info("=== STANDARD LOGGING TEST MESSAGE ===")

# Also test print
print("=== PRINT TEST MESSAGE ===")

# Write to a file to verify
with open('debug_log_test.txt', 'w') as f:
    f.write("=== FILE WRITE TEST MESSAGE ===\n")

print("Test completed. Check debug_log_test.txt file.")