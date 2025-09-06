from app.main import app
from fastapi.routing import APIRoute

print('All registered routes:')
for route in app.routes:
    if hasattr(route, 'path'):
        print(f'  {route.path} - {getattr(route, "methods", "N/A")}')
        if '/api/employers' in route.path:
            print(f'    -> Employers route found: {route}')
            print(f'    -> Route type: {type(route)}')
            if hasattr(route, 'endpoint'):
                print(f'    -> Endpoint: {route.endpoint}')

print('\nChecking OpenAPI paths:')
try:
    openapi_schema = app.openapi()
    paths = openapi_schema.get('paths', {})
    employer_paths = [path for path in paths.keys() if 'employer' in path.lower()]
    print(f'Employer paths in OpenAPI: {employer_paths}')
except Exception as e:
    print(f'Error getting OpenAPI schema: {e}')