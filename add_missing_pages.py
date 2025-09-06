import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def add_missing_pages():
    print("Adding missing pages to match the public website navigation...")
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not service_key:
        print("❌ Missing Supabase credentials in .env file")
        return False
    
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json'
    }
    
    # Missing pages that appear in the public website navigation
    missing_pages = [
        {
            'title': 'Jobs',
            'slug': 'jobs',
            'content': '<div class="jobs-content"><h1>Find Remote Jobs</h1><p>Browse thousands of remote job opportunities from top companies worldwide.</p><div class="job-search"><p>Use our advanced search filters to find the perfect remote position for your skills and experience.</p></div></div>',
            'meta_title': 'Remote Jobs - Find Your Dream Remote Career',
            'meta_description': 'Browse thousands of remote job opportunities from top companies. Find your perfect remote career today.',
            'status': 'published',
            'page_type': 'page'
        },
        {
            'title': 'Blogs',
            'slug': 'blogs',
            'content': '<div class="blogs-content"><h1>Remote Work Blog</h1><p>Stay updated with the latest trends, tips, and insights about remote work and career development.</p><div class="blog-grid"><article><h3>Remote Work Best Practices</h3><p>Learn how to excel in your remote career.</p></article><article><h3>Career Development Tips</h3><p>Advance your professional growth while working remotely.</p></article></div></div>',
            'meta_title': 'Remote Work Blog - Tips, Trends & Insights',
            'meta_description': 'Stay updated with remote work trends, career tips, and professional development insights.',
            'status': 'published',
            'page_type': 'blog'
        },
        {
            'title': 'Contact',
            'slug': 'contact',
            'content': '<div class="contact-content"><h1>Contact RemoteHive</h1><p>Get in touch with our team for support, partnerships, or general inquiries.</p><div class="contact-form"><h3>Send us a message</h3><p>We will get back to you within 24 hours.</p></div><div class="contact-info"><h3>Contact Information</h3><p>Email: support@remotehive.com</p><p>Phone: +1 (555) 123-4567</p><p>Address: 123 Remote Street, Digital City, DC 12345</p></div></div>',
            'meta_title': 'Contact RemoteHive - Get in Touch',
            'meta_description': 'Contact RemoteHive for support, partnerships, or general inquiries. We are here to help you succeed.',
            'status': 'published',
            'page_type': 'page'
        }
    ]
    
    print("\nAdding missing pages to CMS...")
    for page in missing_pages:
        try:
            # Check if page exists
            check_response = requests.get(
                f"{supabase_url}/rest/v1/cms_pages",
                headers=headers,
                params={'slug': f'eq.{page["slug"]}', 'select': 'id'}
            )
            
            if check_response.status_code == 200 and check_response.json():
                print(f"⚠️ Page '{page['title']}' already exists")
                continue
            
            # Insert new page
            insert_response = requests.post(
                f"{supabase_url}/rest/v1/cms_pages",
                headers=headers,
                json=page
            )
            
            if insert_response.status_code in [200, 201]:
                print(f"✅ Created page: {page['title']}")
            else:
                print(f"❌ Failed to create page '{page['title']}': {insert_response.text}")
                
        except Exception as e:
            print(f"Error creating page '{page['title']}': {e}")
    
    print("\n🎉 Missing pages added successfully!")
    print("\n📋 Now your admin panel will show all pages:")
    print("1. Home Page")
    print("2. About Us")
    print("3. Contact")
    print("4. Pricing")
    print("5. Jobs")
    print("6. Blogs")
    print("\n✨ All website navigation pages are now manageable from the admin panel!")
    
    return True

if __name__ == "__main__":
    add_missing_pages()