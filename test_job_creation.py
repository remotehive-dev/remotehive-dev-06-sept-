import requests
import json

# First, login to get token
login_url = "http://127.0.0.1:8000/api/v1/auth/admin/login"
login_data = {
    "email": "admin@remotehive.in",
    "password": "Ranjeet11$"
}

print("Logging in...")
login_response = requests.post(login_url, json=login_data)
print(f"Login status: {login_response.status_code}")

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print(f"Token obtained: {token[:20]}...")
    
    # Now try to create a job
    job_url = "http://127.0.0.1:8000/api/v1/jobs/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    job_data = {
        "title": "Senior Python Developer",
        "description": "We are looking for an experienced Python developer to join our team. The ideal candidate should have strong experience with FastAPI, SQLAlchemy, and modern web development practices.",
        "job_type": "full_time",
        "work_location": "remote",
        "experience_level": "senior",
        "salary_min": 80000,
        "salary_max": 120000,
        "salary_currency": "USD",
        "skills_required": ["Python", "FastAPI", "SQLAlchemy"],
        "location_city": "Remote",
        "location_country": "USA",
        "employer_id": "8dda48f3-0f90-4edb-b514-28748ae393fc"
    }
    
    print("\nCreating job post...")
    print(f"Job data: {json.dumps(job_data, indent=2)}")
    
    job_response = requests.post(job_url, json=job_data, headers=headers)
    print(f"\nJob creation status: {job_response.status_code}")
    print(f"Response: {job_response.text}")
    
    if job_response.status_code != 200:
        try:
            error_detail = job_response.json()
            print(f"\nDetailed error: {json.dumps(error_detail, indent=2)}")
        except:
            print(f"Raw response: {job_response.text}")
else:
    print(f"Login failed: {login_response.text}")