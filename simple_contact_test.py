#!/usr/bin/env python3
"""
Simple Contact Form API Test
Tests the contact form API endpoint directly to see exact error
"""

import requests
import json
from datetime import datetime

def test_contact_api():
    """
    Test contact form API endpoint with detailed error reporting
    """
    print("🚀 Testing Contact Form API Endpoint")
    print("=" * 50)
    
    # Test data
    contact_data = {
        "name": "Test User",
        "email": "ranjeettiwari105@gmail.com",
        "subject": "Test Contact Form",
        "message": "This is a test message to verify the contact form API endpoint is working correctly.",
        "phone": "+1-555-123-4567",
        "company_name": "Test Company",
        "inquiry_type": "general"
    }
    
    print(f"📋 Test Data:")
    print(f"   Name: {contact_data['name']}")
    print(f"   Email: {contact_data['email']}")
    print(f"   Subject: {contact_data['subject']}")
    print(f"   Company: {contact_data['company_name']}")
    print(f"   Inquiry Type: {contact_data['inquiry_type']}")
    
    # Test API endpoint
    api_url = "http://localhost:8000/api/v1/contact/submit"
    print(f"\n🌐 API URL: {api_url}")
    
    try:
        print("\n📤 Sending POST request...")
        
        response = requests.post(
            api_url,
            json=contact_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("\n✅ SUCCESS! Contact form submission worked!")
            try:
                result = response.json()
                print(f"📋 Response Data: {json.dumps(result, indent=2)}")
                return True, result
            except json.JSONDecodeError:
                print(f"📋 Response Text: {response.text}")
                return True, response.text
        else:
            print(f"\n❌ FAILED! Status Code: {response.status_code}")
            print(f"📋 Response Text: {response.text}")
            
            # Try to parse error as JSON
            try:
                error_data = response.json()
                print(f"📋 Error Data: {json.dumps(error_data, indent=2)}")
            except json.JSONDecodeError:
                print("📋 Error response is not valid JSON")
            
            return False, response.text
            
    except requests.exceptions.ConnectionError:
        print("\n❌ CONNECTION ERROR: Cannot connect to API server")
        print("   Is the server running on http://localhost:8000?")
        return False, "Connection Error"
    except requests.exceptions.Timeout:
        print("\n❌ TIMEOUT ERROR: Request timed out after 10 seconds")
        return False, "Timeout Error"
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {str(e)}")
        print(f"   Error Type: {type(e).__name__}")
        return False, str(e)

def test_health_endpoint():
    """
    Test the health endpoint first
    """
    print("\n🏥 Testing API Health Endpoint")
    print("=" * 50)
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        print(f"📊 Health Status: {response.status_code}")
        
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ API Server is healthy")
            print(f"📋 Health Data: {json.dumps(health_data, indent=2)}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def main():
    """
    Main test function
    """
    print("🚀 Simple Contact Form API Test")
    print("=" * 60)
    print(f"⏰ Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Test health endpoint
    health_ok = test_health_endpoint()
    
    if not health_ok:
        print("\n💥 Cannot proceed - API server is not healthy")
        return False
    
    # Step 2: Test contact form endpoint
    contact_ok, contact_result = test_contact_api()
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    print(f"Health Endpoint: {'✅ WORKING' if health_ok else '❌ FAILED'}")
    print(f"Contact Form API: {'✅ WORKING' if contact_ok else '❌ FAILED'}")
    
    if contact_ok:
        print("\n🎉 SUCCESS! The contact form API is working correctly!")
        print("\n✅ This means:")
        print("   • Public website can submit contact forms")
        print("   • API endpoint is responding correctly")
        print("   • Data is being processed and stored")
        return True
    else:
        print("\n💥 FAILED! The contact form API has issues.")
        print(f"\n❌ Error Details: {contact_result}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 Contact form API test completed successfully!")
    else:
        print("\n💥 Contact form API test failed!")
        exit(1)