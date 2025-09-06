#!/usr/bin/env python3
import jwt
import json

# Test JWT token decoding with autoscraper service settings
JWT_SECRET = 'your-super-secret-jwt-key-change-in-production'
JWT_ALGORITHM = 'HS256'
JWT_ISSUER = 'RemoteHive'
JWT_AUDIENCE = 'RemoteHive-Services'

# Sample token from our test (you'll need to update this with actual token)
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi11c2VyLWlkIiwiZW1haWwiOiJhZG1pbkByZW1vdGVoaXZlLmluIiwicm9sZXMiOlsiYWRtaW4iXSwidXNlcklkIjoiYWRtaW4tdXNlci1pZCIsInR5cGUiOiJhY2Nlc3MiLCJpc3MiOiJSZW1vdGVIaXZlIiwiYXVkIjoiUmVtb3RlSGl2ZS1TZXJ2aWNlcyIsImlhdCI6MTc1Njk2ODU3NSwiZXhwIjoxNzU3MDU0OTc1fQ.555Msh_26kiXQ1gQYU5mxpF26_QiuF_WvpnGJC2kako"

print("Testing JWT token decoding...")
print(f"Token: {token[:50]}...")
print()

# First, decode without verification to see the payload
try:
    payload_unverified = jwt.decode(token, options={"verify_signature": False})
    print("Unverified payload:")
    print(json.dumps(payload_unverified, indent=2))
    print()
except Exception as e:
    print(f"Error decoding unverified: {e}")
    print()

# Now try with full verification
try:
    payload = jwt.decode(
        token,
        JWT_SECRET,
        algorithms=[JWT_ALGORITHM],
        audience=JWT_AUDIENCE,
        issuer=JWT_ISSUER
    )
    print("✓ Token successfully verified!")
    print("Verified payload:")
    print(json.dumps(payload, indent=2))
except jwt.ExpiredSignatureError:
    print("✗ Token has expired")
except jwt.InvalidAudienceError as e:
    print(f"✗ Invalid audience: {e}")
except jwt.InvalidIssuerError as e:
    print(f"✗ Invalid issuer: {e}")
except jwt.InvalidTokenError as e:
    print(f"✗ Invalid token: {e}")
except Exception as e:
    print(f"✗ Unexpected error: {e}")