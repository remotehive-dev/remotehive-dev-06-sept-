from app.core.database import get_supabase_admin
from loguru import logger

def create_reviews_table():
    try:
        supabase = get_supabase_admin()
        
        # First, try to query the reviews table to see if it exists
        try:
            result = supabase.table('reviews').select('*').limit(1).execute()
            print("✓ Reviews table already exists")
            print(f"Current reviews count: {len(result.data)}")
            return
        except Exception as e:
            print(f"Reviews table doesn't exist or has issues: {e}")
            print("Creating reviews table...")
        
        # Create the reviews table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS reviews (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            author_name VARCHAR(255) NOT NULL,
            author_email VARCHAR(255),
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            content TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            featured BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
        CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(featured);
        CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
        
        -- Insert sample data
        INSERT INTO reviews (author_name, rating, content, status, featured) VALUES
        ('Sarah Johnson', 5, 'Amazing platform! Found my dream remote job within a week.', 'approved', true),
        ('Mike Chen', 4, 'Great selection of remote opportunities. Highly recommended!', 'approved', false),
        ('Emily Davis', 5, 'The best remote job platform I have used. Excellent user experience.', 'approved', true),
        ('John Smith', 4, 'Good platform with quality job listings. Would recommend to others.', 'approved', false)
        ON CONFLICT (id) DO NOTHING;
        """
        
        # Execute the SQL
        result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
        print("✓ Reviews table created successfully")
        
        # Verify the table was created
        result = supabase.table('reviews').select('*').execute()
        print(f"✓ Reviews table verified with {len(result.data)} records")
        
    except Exception as e:
        print(f"Error creating reviews table: {e}")
        logger.error(f"Error creating reviews table: {e}")

if __name__ == "__main__":
    create_reviews_table()