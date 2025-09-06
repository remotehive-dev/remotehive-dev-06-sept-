from app.core.database import get_supabase_admin

def add_sample_cms_data():
    try:
        client = get_supabase_admin()
        
        # Add sample CMS pages (matching actual schema)
        sample_pages = [
            {
                'title': 'Home Page',
                'slug': 'home',
                'content': '<h1>Welcome to RemoteHive</h1><p>Find your perfect remote job opportunity with thousands of listings from top companies worldwide.</p>',
                'meta_title': 'RemoteHive - Find Your Perfect Remote Job',
                'meta_description': 'Discover remote job opportunities from top companies. Join RemoteHive and work from anywhere.',
                'is_published': True
            },
            {
                'title': 'About Us',
                'slug': 'about',
                'content': '<h1>About RemoteHive</h1><p>We are dedicated to connecting talented professionals with remote work opportunities.</p>',
                'meta_title': 'About RemoteHive - Remote Job Platform',
                'meta_description': 'Learn about RemoteHive mission to connect professionals with remote work opportunities.',
                'is_published': True
            },
            {
                'title': 'Contact',
                'slug': 'contact',
                'content': '<h1>Contact Us</h1><p>Get in touch with our team for any questions or support.</p>',
                'meta_title': 'Contact RemoteHive',
                'meta_description': 'Contact RemoteHive for support, questions, or partnership opportunities.',
                'is_published': True
            }
        ]
        
        print("Adding sample CMS pages...")
        
        # Check if pages already exist
        existing_pages = client.table('cms_pages').select('*').execute()
        if existing_pages.data:
            print(f"✅ Found {len(existing_pages.data)} existing pages")
            for page in existing_pages.data:
                print(f"  - {page.get('title', 'Untitled')} ({page.get('slug', 'no-slug')})")
        else:
            print("📝 No existing pages found, inserting sample data...")
            result = client.table('cms_pages').insert(sample_pages).execute()
            print(f"✅ Inserted {len(result.data)} sample pages")
        
        # Check SEO settings
        print("\nChecking SEO settings...")
        seo_result = client.table('seo_settings').select('*').execute()
        if seo_result.data:
            print(f"✅ Found {len(seo_result.data)} SEO settings")
            seo = seo_result.data[0]
            print(f"  - Site Title: {seo.get('site_title', 'Not set')}")
            print(f"  - Description: {seo.get('site_description', 'Not set')[:50]}...")
        else:
            print("❌ No SEO settings found")
        
        # Try to check reviews and ads tables
        print("\nChecking reviews table...")
        try:
            reviews_result = client.table('reviews').select('*').execute()
            print(f"✅ Found {len(reviews_result.data)} reviews")
        except Exception as e:
            print(f"❌ Reviews table error: {e}")
        
        print("\nChecking ads table...")
        try:
            ads_result = client.table('ads').select('*').execute()
            print(f"✅ Found {len(ads_result.data)} ads")
        except Exception as e:
            print(f"❌ Ads table error: {e}")
        
        print("\n🎉 CMS data check completed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    add_sample_cms_data()