#!/usr/bin/env python3
"""
RemoteHive VPC Service Diagnostic and Fix Script
Diagnoses and attempts to fix VPC frontend service issues
"""

import requests
import json
import time
import sys
from typing import Dict, List, Optional

class VPCServiceManager:
    def __init__(self, vpc_host: str = "210.79.129.9"):
        self.vpc_host = vpc_host
        self.backend_url = f"http://{vpc_host}:8000"
        self.services = {
            "Backend API": {"url": f"http://{vpc_host}:8000/health", "port": 8000, "type": "backend"},
            "Autoscraper": {"url": f"http://{vpc_host}:8001/health", "port": 8001, "type": "backend"},
            "Admin Panel": {"url": f"http://{vpc_host}:3000", "port": 3000, "type": "frontend"},
            "Public Website": {"url": f"http://{vpc_host}:5173", "port": 5173, "type": "frontend"}
        }
    
    def check_service_status(self) -> Dict[str, bool]:
        """Check the status of all services"""
        print("\n=== VPC Service Status Check ===")
        status = {}
        
        for service_name, config in self.services.items():
            try:
                response = requests.get(config["url"], timeout=10)
                if response.status_code == 200:
                    print(f"✓ {service_name}: Running (Port {config['port']})")
                    status[service_name] = True
                else:
                    print(f"✗ {service_name}: Status {response.status_code} (Port {config['port']})")
                    status[service_name] = False
            except requests.exceptions.RequestException as e:
                print(f"✗ {service_name}: Not responding (Port {config['port']}) - {str(e)[:50]}")
                status[service_name] = False
        
        return status
    
    def diagnose_frontend_issues(self) -> Dict[str, str]:
        """Diagnose frontend service issues"""
        print("\n=== Frontend Service Diagnosis ===")
        issues = {}
        
        # Check if PM2 is running (via backend API if available)
        try:
            # Try to get system info from backend
            response = requests.get(f"{self.backend_url}/api/v1/system/info", timeout=10)
            if response.status_code == 200:
                print("✓ Backend API system endpoint accessible")
            else:
                print(f"✗ Backend API system endpoint returned: {response.status_code}")
        except:
            print("✗ Backend API system endpoint not available")
        
        # Check individual frontend ports
        frontend_services = {k: v for k, v in self.services.items() if v["type"] == "frontend"}
        
        for service_name, config in frontend_services.items():
            port = config["port"]
            
            # Try different endpoints
            endpoints_to_try = [
                f"http://{self.vpc_host}:{port}/",
                f"http://{self.vpc_host}:{port}/health",
                f"http://{self.vpc_host}:{port}/api/health"
            ]
            
            service_responding = False
            for endpoint in endpoints_to_try:
                try:
                    response = requests.get(endpoint, timeout=5)
                    if response.status_code in [200, 301, 302]:
                        print(f"✓ {service_name}: Responding on {endpoint}")
                        service_responding = True
                        break
                except:
                    continue
            
            if not service_responding:
                issues[service_name] = f"Port {port} not responding - likely PM2/npm issue"
                print(f"✗ {service_name}: No response on any endpoint (Port {port})")
        
        return issues
    
    def attempt_service_restart(self) -> bool:
        """Attempt to restart services via various methods"""
        print("\n=== Attempting Service Restart ===")
        
        # Method 1: Try backend API restart endpoints
        restart_endpoints = [
            "/api/v1/admin/services/restart",
            "/api/v1/system/restart-frontend",
            "/admin/restart",
            "/system/restart"
        ]
        
        for endpoint in restart_endpoints:
            try:
                print(f"Trying restart via {endpoint}...")
                response = requests.post(f"{self.backend_url}{endpoint}", timeout=30)
                if response.status_code in [200, 202]:
                    print(f"✓ Restart triggered via {endpoint}")
                    time.sleep(10)  # Wait for services to restart
                    return True
            except Exception as e:
                print(f"✗ Failed to restart via {endpoint}: {str(e)[:50]}")
        
        print("✗ No restart endpoints available")
        return False
    
    def generate_fix_recommendations(self, issues: Dict[str, str]) -> List[str]:
        """Generate recommendations to fix the issues"""
        recommendations = []
        
        if issues:
            recommendations.append("\n=== Fix Recommendations ===")
            recommendations.append("\n1. SSH to VPC and check PM2 status:")
            recommendations.append("   ssh root@210.79.129.9")
            recommendations.append("   pm2 status")
            recommendations.append("   pm2 logs")
            
            recommendations.append("\n2. Restart PM2 services:")
            recommendations.append("   pm2 restart all")
            recommendations.append("   pm2 reload ecosystem.config.js")
            
            recommendations.append("\n3. Check npm installations:")
            recommendations.append("   cd /opt/remotehive/remotehive-admin && npm install")
            recommendations.append("   cd /opt/remotehive/remotehive-public && npm install")
            
            recommendations.append("\n4. Manual service start:")
            recommendations.append("   cd /opt/remotehive/remotehive-admin && npm run dev")
            recommendations.append("   cd /opt/remotehive/remotehive-public && npm run dev")
            
            recommendations.append("\n5. Check firewall and nginx:")
            recommendations.append("   systemctl status nginx")
            recommendations.append("   netstat -tlnp | grep -E ':(3000|5173)'")
        
        return recommendations
    
    def run_comprehensive_check(self):
        """Run comprehensive VPC service check and diagnosis"""
        print("RemoteHive VPC Service Diagnostic Tool")
        print("=====================================")
        
        # Step 1: Check service status
        status = self.check_service_status()
        
        # Step 2: Diagnose issues
        issues = self.diagnose_frontend_issues()
        
        # Step 3: Attempt restart
        if issues:
            restart_success = self.attempt_service_restart()
            
            if restart_success:
                print("\nWaiting for services to restart...")
                time.sleep(15)
                
                # Re-check status
                print("\n=== Post-Restart Status Check ===")
                new_status = self.check_service_status()
                
                # Check if issues are resolved
                resolved_issues = []
                for service_name in issues.keys():
                    if new_status.get(service_name, False):
                        resolved_issues.append(service_name)
                
                if resolved_issues:
                    print(f"\n✓ Resolved issues for: {', '.join(resolved_issues)}")
                else:
                    print("\n✗ Issues persist after restart attempt")
        
        # Step 4: Generate recommendations
        recommendations = self.generate_fix_recommendations(issues)
        for rec in recommendations:
            print(rec)
        
        # Step 5: Final status summary
        print("\n=== Final Status Summary ===")
        working_services = [name for name, working in status.items() if working]
        broken_services = [name for name, working in status.items() if not working]
        
        print(f"✓ Working Services ({len(working_services)}): {', '.join(working_services)}")
        if broken_services:
            print(f"✗ Non-Responsive Services ({len(broken_services)}): {', '.join(broken_services)}")
            return False
        else:
            print("✓ All services are running correctly!")
            return True

def main():
    manager = VPCServiceManager()
    success = manager.run_comprehensive_check()
    
    if success:
        print("\n🎉 All VPC services are working correctly!")
        print("\nService URLs:")
        print("- Backend API: http://210.79.129.9:8000")
        print("- Autoscraper: http://210.79.129.9:8001")
        print("- Admin Panel: http://210.79.129.9:3000")
        print("- Public Website: http://210.79.129.9:5173")
    else:
        print("\n⚠️  Some services need attention. Please follow the recommendations above.")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())