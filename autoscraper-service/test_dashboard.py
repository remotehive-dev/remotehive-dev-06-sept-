import requests
import json

# Test different possible dashboard endpoint paths
base_urls = [
    "http://localhost:8001",
    "http://localhost:8000"
]

endpoint_paths = [
    "/dashboard",
    "/api/dashboard", 
    "/api/v1/dashboard",
    "/autoscraper/dashboard"
]

for base_url in base_urls:
    print(f"\nTesting server: {base_url}")
    
    # First test health endpoint
    try:
        health_response = requests.get(f"{base_url}/health", timeout=5)
        print(f"Health check: {health_response.status_code}")
    except:
        print(f"Health check failed - server may not be running")
        continue
    
    # Test dashboard endpoints
    for path in endpoint_paths:
        url = f"{base_url}{path}"
        print(f"\nTesting: {url}")
        
        try:
            response = requests.get(url, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"SUCCESS! Dashboard data keys: {list(data.keys())}")
                break
            elif response.status_code == 404:
                print("Not Found")
            elif response.status_code == 403:
                print(f"Forbidden: {response.text}")
            elif response.status_code == 401:
                print(f"Unauthorized: {response.text}")
            else:
                print(f"Error {response.status_code}: {response.text}")
                
        except requests.exceptions.ConnectionError as e:
            print(f"Connection failed: {e}")
        except Exception as e:
            print(f"Request failed: {e}")
    else:
        continue
    break  # Break outer loop if we found a working endpoint