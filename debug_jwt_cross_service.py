#!/usr/bin/env python3
"""
Debug JWT Cross-Service Authentication
Tests JWT token creation and validation between main service and autoscraper service
"""

import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Set environment variables for both services
os.environ.setdefault("JWT_SECRET_KEY", "8b0aceeaa899e15c513ea9b6f9de82edef07bd6ba6d36c30007856f7a3db5f77")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "30")

# Set autoscraper-specific environment variables
os.environ.setdefault("AUTOSCRAPER_JWT_SECRET_KEY", "8b0aceeaa899e15c513ea9b6f9de82edef07bd6ba6d36c30007856f7a3db5f77")
os.environ.setdefault("AUTOSCRAPER_JWT_ALGORITHM", "HS256")
os.environ.setdefault("AUTOSCRAPER_JWT_EXPIRE_MINUTES", "30")

def test_main_service_jwt():
    """Test JWT creation and validation in main service"""
    print("\n=== Testing Main Service JWT ===")
    
    try:
        from app.utils.jwt_auth import get_jwt_manager, JWTConfig
        
        # Create JWT manager for main service
        jwt_manager = get_jwt_manager()
        print(f"Main Service JWT Config:")
        print(f"  Secret Key: {jwt_manager.config.secret_key[:20]}...")
        print(f"  Algorithm: {jwt_manager.config.algorithm}")
        print(f"  Issuer: {jwt_manager.config.issuer}")
        print(f"  Audience: {jwt_manager.config.audience}")
        
        # Create a test token
        user_data = {
            "email": "admin@remotehive.com",
            "role": "admin",
            "user_id": 1
        }
        
        token = jwt_manager.create_access_token(
            subject="admin@remotehive.com",
            user_data=user_data
        )
        
        print(f"\nCreated token: {token[:50]}...")
        
        # Verify the token
        payload = jwt_manager.decode_token(token)
        print(f"\nDecoded payload:")
        for key, value in payload.items():
            print(f"  {key}: {value}")
        
        return token, payload
        
    except Exception as e:
        print(f"Error in main service JWT: {e}")
        import traceback
        traceback.print_exc()
        return None, None

def test_autoscraper_jwt_direct(token_from_main=None):
    """Test JWT validation in autoscraper service using direct imports"""
    print("\n=== Testing AutoScraper Service JWT (Direct) ===")
    
    try:
        # Add autoscraper service to path
        autoscraper_path = project_root / "autoscraper-service"
        if str(autoscraper_path) not in sys.path:
            sys.path.insert(0, str(autoscraper_path))
        
        # Import JWT utilities directly
        from app.utils.jwt_auth import JWTManager, JWTConfig
        
        # Create JWT config manually to avoid settings issues
        jwt_config = JWTConfig(
            secret_key="8b0aceeaa899e15c513ea9b6f9de82edef07bd6ba6d36c30007856f7a3db5f77",
            algorithm="HS256",
            access_token_expire_minutes=30,
            issuer="RemoteHive",
            audience="RemoteHive-Services"
        )
        
        # Create JWT manager for autoscraper service
        autoscraper_jwt_manager = JWTManager(jwt_config)
        print(f"AutoScraper JWT Manager Config:")
        print(f"  Secret Key: {autoscraper_jwt_manager.config.secret_key[:20]}...")
        print(f"  Algorithm: {autoscraper_jwt_manager.config.algorithm}")
        print(f"  Issuer: {autoscraper_jwt_manager.config.issuer}")
        print(f"  Audience: {autoscraper_jwt_manager.config.audience}")
        
        # Test token validation if provided
        if token_from_main:
            print(f"\nTesting token from main service...")
            try:
                # Remove Bearer prefix if present
                clean_token = token_from_main.replace("Bearer ", "")
                payload = autoscraper_jwt_manager.decode_token(clean_token)
                print(f"✅ Token validation successful!")
                print(f"Decoded payload:")
                for key, value in payload.items():
                    print(f"  {key}: {value}")
                return True
            except Exception as e:
                print(f"❌ Token validation failed: {e}")
                import traceback
                traceback.print_exc()
                return False
        
        return True
        
    except Exception as e:
        print(f"Error in autoscraper service JWT: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_middleware_simulation(token_from_main=None):
    """Simulate the middleware authentication process"""
    print("\n=== Testing Middleware Simulation ===")
    
    if not token_from_main:
        print("No token provided for middleware test")
        return False
    
    try:
        # Add autoscraper service to path
        autoscraper_path = project_root / "autoscraper-service"
        if str(autoscraper_path) not in sys.path:
            sys.path.insert(0, str(autoscraper_path))
        
        # Import middleware components
        from app.middleware.auth import AuthMiddleware
        from app.utils.jwt_auth import get_jwt_manager
        
        # Create a mock request object
        class MockRequest:
            def __init__(self, token):
                self.headers = {"authorization": f"Bearer {token}"}
                self.state = type('obj', (object,), {})()
        
        # Create middleware instance
        auth_middleware = AuthMiddleware()
        
        # Create mock request
        mock_request = MockRequest(token_from_main)
        
        # Test token extraction
        extracted_token = auth_middleware._extract_token_from_request(mock_request)
        print(f"Extracted token: {extracted_token[:50] if extracted_token else 'None'}...")
        
        if extracted_token:
            # Test token decoding
            jwt_manager = get_jwt_manager()
            try:
                payload = jwt_manager.decode_token(extracted_token)
                print(f"✅ Middleware token validation successful!")
                print(f"Decoded payload:")
                for key, value in payload.items():
                    print(f"  {key}: {value}")
                return True
            except Exception as e:
                print(f"❌ Middleware token validation failed: {e}")
                return False
        else:
            print(f"❌ Token extraction failed")
            return False
        
    except Exception as e:
        print(f"Error in middleware simulation: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("JWT Cross-Service Authentication Debug")
    print("=" * 50)
    
    # Test main service JWT
    token, payload = test_main_service_jwt()
    
    if token:
        # Test autoscraper service JWT with direct imports
        success1 = test_autoscraper_jwt_direct(token)
        
        # Test middleware simulation
        success2 = test_middleware_simulation(token)
        
        if success1 and success2:
            print("\n✅ JWT cross-service authentication is working!")
        else:
            print("\n❌ JWT cross-service authentication failed!")
            if not success1:
                print("  - Direct JWT validation failed")
            if not success2:
                print("  - Middleware simulation failed")
    else:
        print("\n❌ Could not create token in main service")
    
    print("\n" + "=" * 50)
    print("Debug complete")

if __name__ == "__main__":
    main()