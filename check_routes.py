import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app

def check_routes():
    """Check all available routes in the FastAPI app"""
    print("=== All Available Routes ===")
    
    routes = []
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            route_info = f"{list(route.methods)} {route.path}"
            routes.append(route_info)
            print(route_info)
    
    print(f"\nTotal routes: {len(routes)}")
    
    # Look for email-related routes
    email_routes = [route for route in routes if 'email' in route.lower()]
    print(f"\nEmail-related routes: {len(email_routes)}")
    for route in email_routes:
        print(f"  {route}")
    
    # Look for admin routes
    admin_routes = [route for route in routes if 'admin' in route.lower()]
    print(f"\nAdmin-related routes: {len(admin_routes)}")
    for route in admin_routes:
        print(f"  {route}")
    
    # Look specifically for smtp
    smtp_routes = [route for route in routes if 'smtp' in route.lower()]
    print(f"\nSMTP-related routes: {len(smtp_routes)}")
    for route in smtp_routes:
        print(f"  {route}")

if __name__ == "__main__":
    check_routes()