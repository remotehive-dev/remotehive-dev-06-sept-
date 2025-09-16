#!/usr/bin/env python3
import requests
import time
import sys

def restart_vpc_services():
    vpc_host = "210.79.129.9"
    backend_url = f"http://{vpc_host}:8000"
    
    print("Checking VPC backend API...")
    try:
        response = requests.get(f"{backend_url}/health", timeout=10)
        if response.status_code == 200:
            print("✓ Backend API is responding")
        else:
            print(f"✗ Backend API returned status: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Backend API not accessible: {e}")
        return False
    
    # Try to trigger service restart via API
    print("Attempting to restart services via API...")
    try:
        # Check if there's an admin endpoint for service management
        endpoints_to_try = [
            "/api/v1/admin/services/restart",
            "/api/v1/system/restart",
            "/admin/restart-services"
        ]
        
        for endpoint in endpoints_to_try:
            try:
                response = requests.post(f"{backend_url}{endpoint}", timeout=30)
                if response.status_code in [200, 202]:
                    print(f"✓ Service restart triggered via {endpoint}")
                    return True
            except:
                continue
        
        print("No restart endpoint found, checking service status...")
        
        # Check individual services
        services = {
            "Backend API": f"http://{vpc_host}:8000/health",
            "Autoscraper": f"http://{vpc_host}:8001/health", 
            "Admin Panel": f"http://{vpc_host}:3000",
            "Public Website": f"http://{vpc_host}:5173"
        }
        
        for service_name, url in services.items():
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    print(f"✓ {service_name}: Running")
                else:
                    print(f"✗ {service_name}: Status {response.status_code}")
            except:
                print(f"✗ {service_name}: Not responding")
        
        return False
        
    except Exception as e:
        print(f"Error during restart attempt: {e}")
        return False

if __name__ == "__main__":
    success = restart_vpc_services()
    sys.exit(0 if success else 1)
