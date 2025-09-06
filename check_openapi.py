import requests
import json

# Get the OpenAPI spec and check for specific endpoints
response = requests.get("http://localhost:8000/openapi.json")
spec = response.json()

print("Checking for specific endpoints in OpenAPI spec...")
print("=" * 60)

endpoints_to_find = [
    "/api/v1/scraper/memory",
    "/api/v1/admin/websites", 
    "/api/v1/sessions",
    "/api/v1/scraper/analytics"
]

found_endpoints = []
all_paths = list(spec.get('paths', {}).keys())

print(f"Total endpoints found: {len(all_paths)}")
print("\nLooking for our target endpoints:")

for target in endpoints_to_find:
    found = False
    for path in all_paths:
        if target in path or path.endswith(target.split('/')[-1]):
            print(f"✅ Found: {path} (matches {target})")
            found_endpoints.append(path)
            found = True
            break
    if not found:
        print(f"❌ Missing: {target}")

print("\n" + "=" * 60)
print("\nSample of available endpoints:")
for i, path in enumerate(all_paths[:20]):
    print(f"  {path}")
if len(all_paths) > 20:
    print(f"  ... and {len(all_paths) - 20} more")

# Check for endpoints containing key terms
print("\n" + "=" * 60)
print("\nEndpoints containing 'memory':")
for path in all_paths:
    if 'memory' in path.lower():
        print(f"  {path}")

print("\nEndpoints containing 'website':")
for path in all_paths:
    if 'website' in path.lower():
        print(f"  {path}")

print("\nEndpoints containing 'session':")
for path in all_paths:
    if 'session' in path.lower():
        print(f"  {path}")

print("\nEndpoints containing 'analytics':")
for path in all_paths:
    if 'analytics' in path.lower():
        print(f"  {path}")