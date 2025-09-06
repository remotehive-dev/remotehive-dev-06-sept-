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

print("Creating reviews and ads tables...")

# SQL to create reviews table
reviews_sql = """
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT NOT NULL,
    pros TEXT,
    cons TEXT,
    work_life_balance INTEGER CHECK (work_life_balance >= 1 AND work_life_balance <= 5),
    salary_benefits INTEGER CHECK (salary_benefits >= 1 AND salary_benefits <= 5),
    career_growth INTEGER CHECK (career_growth >= 1 AND career_growth <= 5),
    management_quality INTEGER CHECK (management_quality >= 1 AND management_quality <= 5),
    is_current_employee BOOLEAN DEFAULT false,
    employment_duration VARCHAR(100),
    location VARCHAR(255),
    is_approved BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_company_name ON public.reviews(company_name);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);
"""

# SQL to create ads table
ads_sql = """
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    target_url TEXT NOT NULL,
    ad_type VARCHAR(50) DEFAULT 'banner' CHECK (ad_type IN ('banner', 'sidebar', 'popup', 'inline')),
    position VARCHAR(50) DEFAULT 'top' CHECK (position IN ('top', 'bottom', 'left', 'right', 'center')),
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    click_count INTEGER DEFAULT 0,
    impression_count INTEGER DEFAULT 0,
    budget_limit DECIMAL(10,2),
    cost_per_click DECIMAL(10,2),
    target_audience JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_is_active ON public.ads(is_active);
CREATE INDEX IF NOT EXISTS idx_ads_ad_type ON public.ads(ad_type);
CREATE INDEX IF NOT EXISTS idx_ads_position ON public.ads(position);
CREATE INDEX IF NOT EXISTS idx_ads_start_date ON public.ads(start_date);
CREATE INDEX IF NOT EXISTS idx_ads_end_date ON public.ads(end_date);
"""

try:
    # Execute reviews table creation
    print("Creating reviews table...")
    supabase_admin.rpc('exec_sql', {'sql': reviews_sql}).execute()
    print("✓ Reviews table created successfully")
    
    # Execute ads table creation
    print("Creating ads table...")
    supabase_admin.rpc('exec_sql', {'sql': ads_sql}).execute()
    print("✓ Ads table created successfully")
    
    # Insert sample data for reviews
    print("Inserting sample reviews...")
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
        },
        {
            "company_name": "RemoteFirst Inc",
            "job_title": "UX Designer",
            "rating": 5,
            "review_text": "Amazing remote-first company. They really understand how to make remote work effective.",
            "pros": "Excellent remote culture, great tools, very collaborative",
            "cons": "None that I can think of",
            "work_life_balance": 5,
            "salary_benefits": 5,
            "career_growth": 4,
            "management_quality": 5,
            "is_current_employee": True,
            "employment_duration": "3 years",
            "location": "Remote - Europe",
            "is_approved": True,
            "is_featured": True
        }
    ]
    
    result = supabase_admin.table("reviews").insert(sample_reviews).execute()
    print(f"✓ Inserted {len(result.data)} sample reviews")
    
    # Insert sample data for ads
    print("Inserting sample ads...")
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
        },
        {
            "title": "Career Development Course",
            "description": "Advance your remote career with our online courses",
            "target_url": "/courses",
            "ad_type": "inline",
            "position": "center",
            "is_active": True
        }
    ]
    
    result = supabase_admin.table("ads").insert(sample_ads).execute()
    print(f"✓ Inserted {len(result.data)} sample ads")
    
except Exception as e:
    print(f"Error creating tables: {e}")
    # Try direct SQL execution if RPC fails
    try:
        print("Trying alternative method...")
        # Note: This might not work with Supabase client, but we'll try
        print("Please run the following SQL manually in Supabase dashboard:")
        print("\n--- REVIEWS TABLE ---")
        print(reviews_sql)
        print("\n--- ADS TABLE ---")
        print(ads_sql)
    except Exception as e2:
        print(f"Alternative method also failed: {e2}")

print("\nDone!")