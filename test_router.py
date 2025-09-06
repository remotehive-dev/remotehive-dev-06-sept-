#!/usr/bin/env python3

from fastapi import FastAPI
from app.api.employers import router as employers_router

# Create a simple test app
app = FastAPI()

# Include the employers router
app.include_router(employers_router, prefix="/api/employers")

if __name__ == "__main__":
    import uvicorn
    print("Starting test server with employers router...")
    print(f"Employers router has {len(employers_router.routes)} routes:")
    for route in employers_router.routes:
        print(f"  - {route.methods} {route.path}")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)