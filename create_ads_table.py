import os
import sys
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from core.database import get_supabase_admin

def create_ads_table():
    """Create the ads table in Supabase"""
    try:
        supabase_admin = get_supabase_admin()
        
        # Create ads table using SQL
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS public.ads (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100) NOT NULL,
            content TEXT,
            image_url VARCHAR(500),
            link_url VARCHAR(500),
            position VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            start_date TIMESTAMP,
            end_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_ads_type ON public.ads(type);
        CREATE INDEX IF NOT EXISTS idx_ads_position ON public.ads(position);
        CREATE INDEX IF NOT EXISTS idx_ads_active ON public.ads(is_active);
        """
        
        # Execute the SQL using rpc function
        result = supabase_admin.rpc('exec_sql', {'sql': create_table_sql}).execute()
        print("✅ Ads table created successfully")
        
        # Insert sample ads data
        sample_ads = [
            {
                'name': 'Google AdSense - Header Banner',
                'type': 'banner',
                'content': 'Premium job opportunities await you',
                'image_url': 'https://via.placeholder.com/728x90/4F46E5/FFFFFF?text=Premium+Jobs',
                'link_url': 'https://example.com/premium-jobs',
                'position': 'header',
                'is_active': True,
                'start_date': datetime.utcnow().isoformat(),
                'end_date': None
            },
            {
                'name': 'Meta Ads - Sidebar',
                'type': 'sidebar',
                'content': 'Boost your career with our courses',
                'image_url': 'https://via.placeholder.com/300x250/10B981/FFFFFF?text=Career+Courses',
                'link_url': 'https://example.com/courses',
                'position': 'sidebar',
                'is_active': True,
                'start_date': datetime.utcnow().isoformat(),
                'end_date': None
            },
            {
                'name': 'Footer Promotion',
                'type': 'promotion',
                'content': 'Join thousands of successful job seekers',
                'image_url': 'https://via.placeholder.com/1200x100/EF4444/FFFFFF?text=Join+Now',
                'link_url': 'https://example.com/register',
                'position': 'footer',
                'is_active': True,
                'start_date': datetime.utcnow().isoformat(),
                'end_date': None
            }
        ]
        
        # Insert sample data
        for ad in sample_ads:
            try:
                result = supabase_admin.table('ads').insert(ad).execute()
                print(f"✅ Added ad: {ad['name']}")
            except Exception as e:
                print(f"❌ Error adding ad {ad['name']}: {e}")
        
        print("🎉 Ads table setup completed!")
        
    except Exception as e:
        print(f"❌ Error creating ads table: {e}")
        # Try alternative approach without rpc
        try:
            print("Trying alternative approach...")
            supabase_admin = get_supabase_admin()
            
            # Just try to insert a test record to see if table exists
            test_ad = {
                'name': 'Test Ad',
                'type': 'test',
                'content': 'Test content',
                'position': 'test',
                'is_active': True
            }
            
            result = supabase_admin.table('ads').insert(test_ad).execute()
            print("✅ Ads table already exists and working")
            
            # Delete test record
            supabase_admin.table('ads').delete().eq('name', 'Test Ad').execute()
            
        except Exception as e2:
            print(f"❌ Ads table does not exist and cannot be created: {e2}")
            print("Please create the ads table manually in Supabase dashboard")

if __name__ == "__main__":
    create_ads_table()