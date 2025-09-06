import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def check_and_create_tables():
    print("Checking and creating CMS tables...")
    
    # Check if tables exist
    try:
        # Check cms_pages table
        result = supabase.table('cms_pages').select('*').limit(1).execute()
        print("✅ cms_pages table exists")
    except Exception as e:
        print(f"❌ cms_pages table missing: {e}")
        print("Creating cms_pages table...")
        # Create cms_pages table via SQL
        sql = """
        CREATE TABLE IF NOT EXISTS cms_pages (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            slug VARCHAR(200) UNIQUE NOT NULL,
            content TEXT,
            meta_title VARCHAR(200),
            meta_description TEXT,
            status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
            page_type VARCHAR(50) DEFAULT 'page' CHECK (page_type IN ('page', 'blog', 'landing')),
            featured_image VARCHAR(500),
            author_id UUID,
            published_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        try:
            supabase.rpc('exec_sql', {'sql': sql}).execute()
            print("✅ cms_pages table created")
        except Exception as e:
            print(f"Error creating cms_pages: {e}")
    
    # Check seo_settings table
    try:
        result = supabase.table('seo_settings').select('*').limit(1).execute()
        print("✅ seo_settings table exists")
    except Exception as e:
        print(f"❌ seo_settings table missing: {e}")
        
    # Check reviews table
    try:
        result = supabase.table('reviews').select('*').limit(1).execute()
        print("✅ reviews table exists")
    except Exception as e:
        print(f"❌ reviews table missing: {e}")
        
    # Check ads table
    try:
        result = supabase.table('ads').select('*').limit(1).execute()
        print("✅ ads table exists")
    except Exception as e:
        print(f"❌ ads table missing: {e}")

def populate_sample_data():
    print("\nPopulating sample CMS data...")
    
    # Add sample pages for the public website
    sample_pages = [
        {
            'title': 'Home Page',
            'slug': 'home',
            'content': '<h1>Welcome to RemoteHive</h1><p>Find your dream remote job today!</p>',
            'meta_title': 'RemoteHive - Find Remote Jobs',
            'meta_description': 'Discover thousands of remote job opportunities from top companies worldwide.',
            'status': 'published',
            'page_type': 'page'
        },
        {
            'title': 'About Us',
            'slug': 'about',
            'content': '<h1>About RemoteHive</h1><p>We connect talented professionals with remote opportunities.</p>',
            'meta_title': 'About RemoteHive',
            'meta_description': 'Learn about RemoteHive mission to connect remote workers with great opportunities.',
            'status': 'published',
            'page_type': 'page'
        },
        {
            'title': 'Contact Us',
            'slug': 'contact',
            'content': '<h1>Contact RemoteHive</h1><p>Get in touch with our team.</p>',
            'meta_title': 'Contact RemoteHive',
            'meta_description': 'Contact RemoteHive for support, partnerships, or general inquiries.',
            'status': 'published',
            'page_type': 'page'
        },
        {
            'title': 'Pricing',
            'slug': 'pricing',
            'content': '<h1>Pricing Plans</h1><p>Choose the perfect plan for your needs.</p>',
            'meta_title': 'RemoteHive Pricing',
            'meta_description': 'Affordable pricing plans for job seekers and employers.',
            'status': 'published',
            'page_type': 'page'
        }
    ]
    
    try:
        for page in sample_pages:
            # Check if page already exists
            existing = supabase.table('cms_pages').select('*').eq('slug', page['slug']).execute()
            if not existing.data:
                result = supabase.table('cms_pages').insert(page).execute()
                print(f"✅ Created page: {page['title']}")
            else:
                print(f"⚠️ Page already exists: {page['title']}")
    except Exception as e:
        print(f"Error creating sample pages: {e}")

if __name__ == "__main__":
    check_and_create_tables()
    populate_sample_data()
    print("\n🎉 CMS setup complete! You can now manage your website from the admin panel.")