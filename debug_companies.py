#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.database.services import EmployerService
import traceback

def test_companies_endpoint():
    """Test the companies endpoint logic directly"""
    try:
        # Get database session
        db_gen = get_db()
        db = next(db_gen)
        
        print("Testing EmployerService.get_employers...")
        
        # Test the get_employers method
        employers = EmployerService.get_employers(
            db,
            search=None,
            skip=0,
            limit=10
        )
        
        print(f"Found {len(employers)} employers")
        
        # Test converting to company format
        companies = []
        for employer in employers:
            print(f"Processing employer: {employer.id}")
            company = {
                "id": str(employer.id),
                "name": employer.company_name,
                "description": employer.company_description,
                "website": employer.company_website,
                "logo_url": employer.company_logo,
                "location": employer.location,
                "industry": employer.industry,
                "size": employer.company_size,
                "created_at": employer.created_at.isoformat() if employer.created_at else None
            }
            companies.append(company)
            print(f"Company data: {company}")
        
        print(f"Successfully processed {len(companies)} companies")
        return companies
        
    except Exception as e:
        print(f"Error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return None
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    test_companies_endpoint()