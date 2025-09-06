#!/usr/bin/env python3

import sys
sys.path.append('.')

from app.database import get_db_session
from app.database.services import EmployerService
from app.database.models import Employer

print("=== Testing Database Connection ===")
try:
    db_gen = get_db_session()
    db = next(db_gen)
    print("✓ Database connection successful")
    
    print("\n=== Testing EmployerService ===")
    employers = EmployerService.get_employers(db=db, skip=0, limit=10)
    print(f"✓ Found {len(employers)} employers")
    
    print("\n=== Testing Direct Query ===")
    count = db.query(Employer).count()
    print(f"✓ Total employers in database: {count}")
    
    db.close()
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Testing Endpoint Import ===")
try:
    from app.api.employers import router, get_employers
    print("✓ Employers router imported successfully")
    print(f"✓ Router has {len(router.routes)} routes")
except Exception as e:
    print(f"✗ Import error: {e}")
    import traceback
    traceback.print_exc()