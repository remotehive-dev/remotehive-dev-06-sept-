#!/usr/bin/env python3

try:
    from app.api.employers import router as employers_router
    print(f"✓ Successfully imported employers router")
    print(f"✓ Router has {len(employers_router.routes)} routes:")
    for route in employers_router.routes:
        print(f"  - {getattr(route, 'methods', 'N/A')} {route.path}")
except Exception as e:
    print(f"✗ Failed to import employers router: {e}")
    import traceback
    traceback.print_exc()

try:
    from fastapi import FastAPI
    test_app = FastAPI()
    test_app.include_router(employers_router, prefix="/api/employers")
    print(f"\n✓ Successfully included router in test app")
    print(f"✓ Test app has {len(test_app.routes)} total routes")
except Exception as e:
    print(f"\n✗ Failed to include router in test app: {e}")
    import traceback
    traceback.print_exc()