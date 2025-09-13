#!/usr/bin/env python3
"""
GitHub Webhook Test Script
Tests the webhook endpoint with a simulated GitHub push event
"""

import json
import hmac
import hashlib
import requests
from datetime import datetime

# Webhook configuration
WEBHOOK_URL = "http://210.79.128.167:9000/webhook"
WEBHOOK_SECRET = "remotehive_webhook_secret_2024"

def create_signature(payload, secret):
    """Create GitHub-style webhook signature"""
    signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"

def test_webhook():
    """Test the webhook with a simulated GitHub push event"""
    
    # Simulate a GitHub push event payload
    test_payload = {
        "ref": "refs/heads/main",
        "repository": {
            "name": "remotehive-test",
            "full_name": "user/remotehive-test",
            "html_url": "https://github.com/user/remotehive-test"
        },
        "commits": [
            {
                "id": "abc123def456",
                "message": "Test webhook integration",
                "author": {
                    "name": "Test User",
                    "email": "test@example.com"
                },
                "timestamp": datetime.now().isoformat()
            }
        ],
        "pusher": {
            "name": "test-user",
            "email": "test@example.com"
        }
    }
    
    payload_json = json.dumps(test_payload)
    signature = create_signature(payload_json, WEBHOOK_SECRET)
    
    headers = {
        "Content-Type": "application/json",
        "X-GitHub-Event": "push",
        "X-Hub-Signature-256": signature,
        "User-Agent": "GitHub-Hookshot/test"
    }
    
    print("🚀 Testing GitHub Webhook...")
    print(f"📡 Endpoint: {WEBHOOK_URL}")
    print(f"🔐 Signature: {signature[:20]}...")
    print("📦 Payload: Simulated push event")
    print("-" * 50)
    
    try:
        response = requests.post(
            WEBHOOK_URL,
            data=payload_json,
            headers=headers,
            timeout=10
        )
        
        print(f"✅ Response Status: {response.status_code}")
        print(f"📄 Response Body: {response.text}")
        
        if response.status_code == 200:
            print("🎉 Webhook test SUCCESSFUL!")
            print("✅ GitHub webhook is working and connected to VPC")
            print("✅ Real-time updates are ready")
        else:
            print(f"⚠️  Unexpected status code: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection Error: {e}")
        print("🔍 Check if webhook service is running")
    
    print("-" * 50)
    print("📋 Next steps:")
    print("1. Configure this webhook URL in your GitHub repository")
    print("2. Use the secret key: remotehive_webhook_secret_2024")
    print("3. Test with real push events")

if __name__ == "__main__":
    test_webhook()