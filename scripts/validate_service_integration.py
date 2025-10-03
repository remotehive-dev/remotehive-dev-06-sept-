#!/usr/bin/env python3
"""
RemoteHive Service Integration Validation Script
Validates that all services are properly integrated with centralized JWT authentication
"""

import asyncio
import sys
import os
from pathlib import Path
from loguru import logger
from typing import Dict, List, Any
import importlib.util

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


class ServiceIntegrationValidator:
    """Validates service integration and JWT authentication setup"""
    
    def __init__(self):
        self.project_root = project_root
        self.validation_results: Dict[str, Dict[str, Any]] = {}
    
    def validate_file_exists(self, file_path: Path, description: str) -> bool:
        """Validate that a required file exists"""
        exists = file_path.exists()
        logger.info(f"{'✅' if exists else '❌'} {description}: {file_path}")
        return exists
    
    def validate_import(self, module_path: str, description: str) -> bool:
        """Validate that a module can be imported"""
        try:
            spec = importlib.util.spec_from_file_location("test_module", module_path)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                logger.success(f"✅ {description}: Import successful")
                return True
        except Exception as e:
            logger.error(f"❌ {description}: Import failed - {e}")
            return False
        
        logger.error(f"❌ {description}: Module spec creation failed")
        return False
    
    def validate_env_files(self) -> Dict[str, bool]:
        """Validate .env files exist and have required configurations"""
        logger.info("\n🔍 Validating Environment Files...")
        
        results = {}
        
        # Main service .env
        main_env = self.project_root / ".env"
        results["main_env"] = self.validate_file_exists(main_env, "Main service .env file")
        
        # Autoscraper service .env
        autoscraper_env = self.project_root / "autoscraper-service" / ".env"
        results["autoscraper_env"] = self.validate_file_exists(autoscraper_env, "Autoscraper service .env file")
        
        # Check JWT configuration consistency
        if results["main_env"] and results["autoscraper_env"]:
            try:
                # Read main .env
                main_jwt_secret = None
                with open(main_env, 'r') as f:
                    for line in f:
                        if line.startswith('JWT_SECRET_KEY='):
                            main_jwt_secret = line.split('=', 1)[1].strip()
                            break
                
                # Read autoscraper .env
                autoscraper_jwt_secret = None
                with open(autoscraper_env, 'r') as f:
                    for line in f:
                        if line.startswith('JWT_SECRET_KEY='):
                            autoscraper_jwt_secret = line.split('=', 1)[1].strip()
                            break
                
                if main_jwt_secret and autoscraper_jwt_secret:
                    jwt_consistent = main_jwt_secret == autoscraper_jwt_secret
                    results["jwt_consistency"] = jwt_consistent
                    logger.info(f"{'✅' if jwt_consistent else '❌'} JWT secret key consistency between services")
                else:
                    results["jwt_consistency"] = False
                    logger.error("❌ JWT secret key not found in one or both .env files")
                    
            except Exception as e:
                results["jwt_consistency"] = False
                logger.error(f"❌ Error checking JWT consistency: {e}")
        
        return results
    
    def validate_jwt_utilities(self) -> Dict[str, bool]:
        """Validate JWT utilities and centralized authentication"""
        logger.info("\n🔍 Validating JWT Utilities...")
        
        results = {}
        
        # Check JWT auth utility file
        jwt_auth_file = self.project_root / "app" / "utils" / "jwt_auth.py"
        results["jwt_auth_file"] = self.validate_file_exists(jwt_auth_file, "JWT authentication utility")
        
        # Check service discovery utility
        service_discovery_file = self.project_root / "app" / "utils" / "service_discovery.py"
        results["service_discovery_file"] = self.validate_file_exists(service_discovery_file, "Service discovery utility")
        
        # Test JWT utility import
        if results["jwt_auth_file"]:
            results["jwt_auth_import"] = self.validate_import(
                str(jwt_auth_file), 
                "JWT authentication utility import"
            )
        
        # Test service discovery import
        if results["service_discovery_file"]:
            results["service_discovery_import"] = self.validate_import(
                str(service_discovery_file), 
                "Service discovery utility import"
            )
        
        return results
    
    def validate_service_auth_updates(self) -> Dict[str, bool]:
        """Validate that services have been updated to use centralized JWT"""
        logger.info("\n🔍 Validating Service Authentication Updates...")
        
        results = {}
        
        # Files that should be updated to use centralized JWT
        files_to_check = [
            ("backend/core/auth.py", "Main service auth.py"),
            ("backend/core/local_auth.py", "Main service local_auth.py"),
            ("backend/core/security.py", "Main service security.py"),
            ("backend/core/deps.py", "Main service deps.py"),
            ("autoscraper-engine-api/backend/middleware/auth.py", "Autoscraper service auth middleware")
        ]
        
        for file_path, description in files_to_check:
            full_path = self.project_root / file_path
            if full_path.exists():
                try:
                    with open(full_path, 'r') as f:
                        content = f.read()
                        
                    # Check if file uses centralized JWT utilities
                    uses_centralized = "from app.utils.jwt_auth import" in content
                    # Check if file still uses old JWT imports
                    uses_old_jwt = "from jose import jwt" in content or "import jwt" in content
                    
                    is_updated = uses_centralized and not uses_old_jwt
                    results[file_path.replace("/", "_")] = is_updated
                    
                    status = "✅" if is_updated else "❌"
                    logger.info(f"{status} {description}: {'Updated' if is_updated else 'Needs update'}")
                    
                    if not is_updated:
                        if not uses_centralized:
                            logger.warning(f"   - Missing centralized JWT import")
                        if uses_old_jwt:
                            logger.warning(f"   - Still uses old JWT imports")
                            
                except Exception as e:
                    results[file_path.replace("/", "_")] = False
                    logger.error(f"❌ {description}: Error reading file - {e}")
            else:
                results[file_path.replace("/", "_")] = False
                logger.warning(f"⚠️ {description}: File not found")
        
        return results
    
    def validate_startup_scripts(self) -> Dict[str, bool]:
        """Validate startup and test scripts"""
        logger.info("\n🔍 Validating Startup Scripts...")
        
        results = {}
        
        # Check startup script
        startup_script = self.project_root / "scripts" / "start_services.py"
        results["startup_script"] = self.validate_file_exists(startup_script, "Service startup script")
        
        # Check integration test script
        test_script = self.project_root / "scripts" / "test_service_integration.py"
        results["test_script"] = self.validate_file_exists(test_script, "Service integration test script")
        
        # Test startup script import
        if results["startup_script"]:
            results["startup_script_import"] = self.validate_import(
                str(startup_script), 
                "Service startup script import"
            )
        
        return results
    
    def generate_summary_report(self) -> None:
        """Generate a summary report of all validations"""
        logger.info("\n" + "=" * 60)
        logger.info("📊 VALIDATION SUMMARY REPORT")
        logger.info("=" * 60)
        
        total_checks = 0
        passed_checks = 0
        
        for category, results in self.validation_results.items():
            logger.info(f"\n📋 {category.upper().replace('_', ' ')}:")
            
            category_passed = 0
            category_total = len(results)
            
            for check_name, passed in results.items():
                status = "✅ PASS" if passed else "❌ FAIL"
                logger.info(f"  {check_name}: {status}")
                if passed:
                    category_passed += 1
            
            logger.info(f"  Category Score: {category_passed}/{category_total}")
            
            total_checks += category_total
            passed_checks += category_passed
        
        logger.info(f"\n🎯 OVERALL SCORE: {passed_checks}/{total_checks} ({(passed_checks/total_checks*100):.1f}%)")
        
        if passed_checks == total_checks:
            logger.success("🎉 ALL VALIDATIONS PASSED! Service integration is ready.")
        else:
            failed_checks = total_checks - passed_checks
            logger.error(f"💥 {failed_checks} validation(s) failed. Please address the issues above.")
    
    def run_all_validations(self) -> bool:
        """Run all validation checks"""
        logger.info("🚀 Starting RemoteHive Service Integration Validation")
        logger.info("=" * 60)
        
        # Run all validation categories
        self.validation_results["env_files"] = self.validate_env_files()
        self.validation_results["jwt_utilities"] = self.validate_jwt_utilities()
        self.validation_results["service_auth_updates"] = self.validate_service_auth_updates()
        self.validation_results["startup_scripts"] = self.validate_startup_scripts()
        
        # Generate summary report
        self.generate_summary_report()
        
        # Return True if all validations passed
        all_passed = all(
            all(results.values()) 
            for results in self.validation_results.values()
        )
        
        return all_passed


def main():
    """Main validation runner"""
    # Configure logging
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
        level="INFO"
    )
    
    try:
        validator = ServiceIntegrationValidator()
        success = validator.run_all_validations()
        
        if not success:
            logger.error("\n❌ Validation failed. Please fix the issues above before proceeding.")
            sys.exit(1)
        else:
            logger.success("\n✅ All validations passed! Service integration is ready.")
            
    except KeyboardInterrupt:
        logger.warning("Validation interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Validation runner failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()