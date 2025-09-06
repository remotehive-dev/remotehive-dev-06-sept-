import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([supabase_url, supabase_service_key]):
    print("Missing Supabase environment variables")
    exit(1)

# Create admin client
supabase_admin = create_client(supabase_url, supabase_service_key)

print("Creating missing tables and inserting sample data...")

try:
    # First, let's try to insert sample data directly into reviews table
    # This will help us understand if the table exists or not
    print("Attempting to insert sample reviews...")
    sample_reviews = [
        {
            "company_name": "TechCorp Remote",
            "job_title": "Senior Developer",
            "rating": 4,
            "review_text": "Great company with excellent remote work culture. Very supportive team and good work-life balance.",
            "pros": "Flexible hours, good benefits, supportive management",
            "cons": "Sometimes communication can be challenging across time zones",
            "work_life_balance": 5,
            "salary_benefits": 4,
            "career_growth": 4,
            "management_quality": 4,
            "is_current_employee": True,
            "employment_duration": "2 years",
            "location": "Remote - USA",
            "is_approved": True,
            "is_featured": True
        },
        {
            "company_name": "StartupXYZ",
            "job_title": "Product Manager",
            "rating": 3,
            "review_text": "Fast-paced environment with lots of learning opportunities. Can be stressful at times.",
            "pros": "Learning opportunities, innovative projects, equity options",
            "cons": "High pressure, long hours, limited benefits",
            "work_life_balance": 2,
            "salary_benefits": 3,
            "career_growth": 5,
            "management_quality": 3,
            "is_current_employee": False,
            "employment_duration": "1.5 years",
            "location": "Remote - Global",
            "is_approved": True,
            "is_featured": False
        }
    ]
    
    # Try to insert into reviews table
    try:
        result = supabase_admin.table("reviews").insert(sample_reviews).execute()
        print(f"✓ Reviews table exists and inserted {len(result.data)} sample reviews")
    except Exception as e:
        print(f"Reviews table error: {e}")
        if "does not exist" in str(e):
            print("Reviews table does not exist - needs to be created manually")
    
    # Try to insert sample ads
    print("Attempting to insert sample ads...")
    sample_ads = [
        {
            "title": "Premium Job Posting",
            "description": "Get your job posting featured at the top of search results",
            "target_url": "/pricing",
            "ad_type": "banner",
            "position": "top",
            "is_active": True
        },
        {
            "title": "Remote Work Tools",
            "description": "Discover the best tools for remote collaboration",
            "target_url": "/tools",
            "ad_type": "sidebar",
            "position": "right",
            "is_active": True
        }
    ]
    
    try:
        result = supabase_admin.table("ads").insert(sample_ads).execute()
        print(f"✓ Ads table exists and inserted {len(result.data)} sample ads")
    except Exception as e:
        print(f"Ads table error: {e}")
        if "does not exist" in str(e):
            print("Ads table does not exist - needs to be created manually")
    
    # Let's also check what tables exist
    print("\nChecking existing tables...")
    try:
        # Try to query each table to see if it exists
        tables_to_check = ["cms_pages", "seo_settings", "reviews", "ads"]
        for table in tables_to_check:
            try:
                result = supabase_admin.table(table).select("*").limit(1).execute()
                print(f"✓ {table} table exists with {len(result.data)} records (showing first 1)")
            except Exception as e:
                if "does not exist" in str(e):
                    print(f"✗ {table} table does not exist")
                else:
                    print(f"? {table} table error: {e}")
    except Exception as e:
        print(f"Error checking tables: {e}")
        
except Exception as e:
    print(f"General error: {e}")

print("\nDone!")