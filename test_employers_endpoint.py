import requests
import json

# Check OpenAPI docs after server restart
url = "http://localhost:8000/openapi.json"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        openapi_data = response.json()
        print("\nLooking for test endpoints:")
        test_endpoints = []
        for path in openapi_data.get('paths', {}).keys():
            if any(test in path for test in ['test-serialization', 'debug-test', 'simple-test', 'test-endpoint']):
                test_endpoints.append(path)
                print(f"  Found: {path}")
        
        if not test_endpoints:
            print("  No test endpoints found in OpenAPI docs")
            print("\nAll admin/workflow paths:")
            for path in openapi_data.get('paths', {}).keys():
                if 'admin/workflow' in path:
                    print(f"  {path}")
        else:
            print(f"\n✅ Found {len(test_endpoints)} test endpoints!")
    else:
        print(f"Error Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
    print(f"Response text: {response.text if 'response' in locals() else 'No response'}")