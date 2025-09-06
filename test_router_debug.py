#!/usr/bin/env python3

import sys
sys.path.append('.')

from app.api.v1.endpoints.auth_endpoints import router

print("=== AUTH ROUTER DEBUG ===")
print(f"Router type: {type(router)}")
print(f"Number of routes: {len(router.routes)}")

print("\n=== ALL ROUTES ===")
for i, route in enumerate(router.routes):
    print(f"{i+1}. {route.methods} {route.path}")

print("\n=== LOOKING FOR TEST-LOGGING ===")
test_logging_routes = [route for route in router.routes if 'test-logging' in route.path]
print(f"Found {len(test_logging_routes)} test-logging routes:")
for route in test_logging_routes:
    print(f"  - {route.methods} {route.path}")

print("\n=== LOOKING FOR TEST-DEBUG ===")
test_debug_routes = [route for route in router.routes if 'test-debug' in route.path]
print(f"Found {len(test_debug_routes)} test-debug routes:")
for route in test_debug_routes:
    print(f"  - {route.methods} {route.path}")