#!/usr/bin/env python3
"""
Diagnostic script to test email-users messages endpoint and identify 404 errors
"""

import asyncio
import sys
import os
import requests
import json
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

try:
    from app.core.database import DatabaseManager
    from app.models.email import EmailUser, EmailFolder, EmailMessage, EmailMessageFolder
    from app.services.email_management_service import EmailManagementService
    from sqlalchemy import text
except ImportError as e:
    print(f"Import error: {e}")
    print("Some modules may not be available")

class EmailEndpointDiagnostic:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.admin_token = None
        self.db_manager = None
        
    async def setup_database(self):
        """Initialize database connection"""
        try:
            self.db_manager = DatabaseManager()
            await self.db_manager.initialize()
            print("✓ Database connection established")
            return True
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            return False
    
    def get_admin_token(self):
        """Get admin authentication token"""
        try:
            # Try to get token from admin login endpoint
            login_data = {
                "email": "admin@remotehive.in",
                "password": "Ranjeet11$"
            }
            response = requests.post(f"{self.base_url}/api/v1/auth/admin/login", json=login_data)
            if response.status_code == 200:
                token_data = response.json()
                self.admin_token = token_data.get("access_token")
                print("✓ Admin token obtained")
                return True
            else:
                print(f"✗ Failed to get admin token: {response.status_code}")
                # Try with a test token for debugging
                self.admin_token = "test-admin-token"
                print("Using test token for debugging")
                return True
        except Exception as e:
            print(f"✗ Error getting admin token: {e}")
            self.admin_token = "test-admin-token"
            return True
    
    async def check_database_tables(self):
        """Check if email-related tables exist"""
        print("\n=== Checking Database Tables ===")
        
        if not self.db_manager:
            print("✗ Database not initialized")
            return False
        
        try:
            async with self.db_manager.get_session() as session:
                # Check each table
                tables_to_check = [
                    "email_users",
                    "email_folders", 
                    "email_messages",
                    "email_message_folders"
                ]
                
                for table_name in tables_to_check:
                    try:
                        result = await session.execute(
                            text(f"SELECT COUNT(*) FROM {table_name} LIMIT 1")
                        )
                        count = result.scalar()
                        print(f"✓ Table '{table_name}' exists with {count} records")
                    except Exception as e:
                        print(f"✗ Table '{table_name}' error: {e}")
                
                # Check table structure
                try:
                    result = await session.execute(
                        text("""
                        SELECT table_name, column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name IN ('email_users', 'email_folders', 'email_messages', 'email_message_folders')
                        ORDER BY table_name, ordinal_position
                        """)
                    )
                    columns = result.fetchall()
                    print(f"\n✓ Found {len(columns)} columns across email tables")
                    
                    # Group by table
                    table_columns = {}
                    for row in columns:
                        table_name = row[0]
                        if table_name not in table_columns:
                            table_columns[table_name] = []
                        table_columns[table_name].append(f"{row[1]} ({row[2]})")
                    
                    for table, cols in table_columns.items():
                        print(f"  {table}: {', '.join(cols[:5])}{'...' if len(cols) > 5 else ''}")
                        
                except Exception as e:
                    print(f"✗ Error checking table structure: {e}")
                    
                return True
                
        except Exception as e:
            print(f"✗ Database check failed: {e}")
            return False
    
    def test_api_endpoints(self):
        """Test various API endpoints"""
        print("\n=== Testing API Endpoints ===")
        
        headers = {}
        if self.admin_token:
            headers["Authorization"] = f"Bearer {self.admin_token}"
        
        endpoints_to_test = [
            "/api/v1/health",
            "/api/v1/admin/email-users/",
            "/api/v1/admin/email-users/messages/inbox",
            "/api/v1/admin/email-users/messages/sent",
            "/api/v1/admin/email-users/messages/drafts"
        ]
        
        results = {}
        for endpoint in endpoints_to_test:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", headers=headers, timeout=10)
                status = response.status_code
                results[endpoint] = status
                
                if status == 200:
                    print(f"✓ {endpoint}: {status} OK")
                elif status == 404:
                    print(f"✗ {endpoint}: {status} NOT FOUND")
                elif status == 401:
                    print(f"⚠ {endpoint}: {status} UNAUTHORIZED")
                else:
                    print(f"⚠ {endpoint}: {status} {response.reason}")
                    
                # Show response content for errors
                if status >= 400:
                    try:
                        error_content = response.json()
                        print(f"    Error details: {error_content}")
                    except:
                        print(f"    Error text: {response.text[:200]}")
                        
            except Exception as e:
                print(f"✗ {endpoint}: Connection error - {e}")
                results[endpoint] = "ERROR"
        
        return results
    
    def check_imports_and_dependencies(self):
        """Check if all required modules can be imported"""
        print("\n=== Checking Imports and Dependencies ===")
        
        modules_to_check = [
            ("app.models.email", ["EmailUser", "EmailFolder", "EmailMessage", "EmailMessageFolder"]),
            ("app.services.email_management_service", ["EmailManagementService"]),
            ("app.api.v1.endpoints.email_users", ["router"]),
            ("app.core.database", ["DatabaseManager"]),
        ]
        
        for module_name, classes in modules_to_check:
            try:
                module = __import__(module_name, fromlist=classes)
                missing_classes = []
                for class_name in classes:
                    if not hasattr(module, class_name):
                        missing_classes.append(class_name)
                
                if missing_classes:
                    print(f"⚠ {module_name}: Missing {missing_classes}")
                else:
                    print(f"✓ {module_name}: All classes available")
                    
            except ImportError as e:
                print(f"✗ {module_name}: Import failed - {e}")
            except Exception as e:
                print(f"✗ {module_name}: Error - {e}")
    
    async def test_email_service_directly(self):
        """Test EmailManagementService directly"""
        print("\n=== Testing EmailManagementService Directly ===")
        
        if not self.db_manager:
            print("✗ Database not available for service testing")
            return
        
        try:
            from app.services.email_management_service import EmailManagementService
            
            service = EmailManagementService()
            
            # Test getting user messages for inbox
            async with self.db_manager.get_session() as session:
                try:
                    # Try to get messages for a test user
                    messages = await service.get_user_messages(
                        session=session,
                        user_id=1,  # Test user ID
                        folder_name="inbox",
                        limit=10,
                        offset=0
                    )
                    print(f"✓ EmailManagementService.get_user_messages works: {len(messages)} messages")
                except Exception as e:
                    print(f"✗ EmailManagementService.get_user_messages failed: {e}")
                    
        except Exception as e:
            print(f"✗ EmailManagementService test failed: {e}")
    
    def check_router_registration(self):
        """Check if email_users router is properly registered"""
        print("\n=== Checking Router Registration ===")
        
        try:
            # Check if we can import the main API router
            from app.api.v1.api import api_router
            print("✓ Main API router imported successfully")
            
            # Check routes
            routes = []
            for route in api_router.routes:
                if hasattr(route, 'path'):
                    routes.append(route.path)
            
            print(f"✓ Found {len(routes)} routes in main router")
            
            # Look for email-users related routes
            email_routes = [r for r in routes if 'email-users' in r]
            if email_routes:
                print(f"✓ Found email-users routes: {email_routes}")
            else:
                print("⚠ No email-users routes found in main router")
                
        except Exception as e:
            print(f"✗ Router check failed: {e}")
    
    async def run_full_diagnostic(self):
        """Run complete diagnostic"""
        print("Email Endpoint Diagnostic Tool")
        print("=" * 50)
        
        # Step 1: Setup
        print("\n1. Setting up connections...")
        db_ok = await self.setup_database()
        auth_ok = self.get_admin_token()
        
        # Step 2: Check imports
        print("\n2. Checking imports and dependencies...")
        self.check_imports_and_dependencies()
        
        # Step 3: Check router registration
        print("\n3. Checking router registration...")
        self.check_router_registration()
        
        # Step 4: Check database
        if db_ok:
            print("\n4. Checking database tables...")
            await self.check_database_tables()
            
            print("\n5. Testing email service directly...")
            await self.test_email_service_directly()
        
        # Step 5: Test API endpoints
        print("\n6. Testing API endpoints...")
        endpoint_results = self.test_api_endpoints()
        
        # Summary
        print("\n" + "=" * 50)
        print("DIAGNOSTIC SUMMARY")
        print("=" * 50)
        
        failed_endpoints = [ep for ep, status in endpoint_results.items() if status == 404]
        if failed_endpoints:
            print(f"\n❌ FOUND 404 ERRORS:")
            for ep in failed_endpoints:
                print(f"   - {ep}")
        else:
            print("\n✅ No 404 errors found")
        
        print(f"\nDatabase connection: {'✓' if db_ok else '✗'}")
        print(f"Authentication: {'✓' if auth_ok else '✗'}")
        
        if self.db_manager:
            await self.db_manager.close()

async def main():
    diagnostic = EmailEndpointDiagnostic()
    await diagnostic.run_full_diagnostic()

if __name__ == "__main__":
    asyncio.run(main())