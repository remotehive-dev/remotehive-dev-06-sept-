#!/usr/bin/env python3

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def main():
    try:
        # Get Supabase client
        url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        supabase = create_client(url, service_role_key)
        
        print("🔧 Creating contact submissions table...")
        
        # SQL to create contact_submissions table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS public.contact_submissions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(500),
            message TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);
        CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
        CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at);
        
        -- Enable Row Level Security
        ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        DROP POLICY IF EXISTS "Allow public to insert contact submissions" ON public.contact_submissions;
        CREATE POLICY "Allow public to insert contact submissions" ON public.contact_submissions
            FOR INSERT WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow admin to view all contact submissions" ON public.contact_submissions;
        CREATE POLICY "Allow admin to view all contact submissions" ON public.contact_submissions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE users.id = auth.uid() 
                    AND users.role = 'admin' 
                    AND users.is_active = true
                )
            );
        
        DROP POLICY IF EXISTS "Allow admin to update contact submissions" ON public.contact_submissions;
        CREATE POLICY "Allow admin to update contact submissions" ON public.contact_submissions
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE users.id = auth.uid() 
                    AND users.role = 'admin' 
                    AND users.is_active = true
                )
            );
        
        -- Grant permissions
        GRANT SELECT, INSERT ON public.contact_submissions TO anon;
        GRANT ALL ON public.contact_submissions TO authenticated;
        GRANT ALL ON public.contact_submissions TO service_role;
        """
        
        # Execute the SQL
        try:
            result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
            print("✅ Contact submissions table created successfully")
        except Exception as e:
            # Try alternative method using direct SQL execution
            print(f"Trying alternative method: {e}")
            
            # Split SQL into individual statements
            statements = [
                """
                CREATE TABLE IF NOT EXISTS public.contact_submissions (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    subject VARCHAR(500),
                    message TEXT NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
                """
            ]
            
            for stmt in statements:
                try:
                    supabase.postgrest.rpc('exec_sql', {'sql': stmt}).execute()
                    print("✅ Table creation executed")
                except Exception as e2:
                    print(f"⚠️ SQL execution method failed: {e2}")
                    print("Manual table creation may be required")
        
        # Verify table creation
        try:
            test_query = supabase.table('contact_submissions').select('*').limit(1).execute()
            print("✅ Contact submissions table verified and accessible")
            
            # Insert a test record
            test_data = {
                "name": "Test User",
                "email": "ranjeettiwari105@gmail.com",
                "subject": "Test Subject",
                "message": "This is a test message to verify the table works."
            }
            
            insert_result = supabase.table('contact_submissions').insert(test_data).execute()
            print("✅ Test record inserted successfully")
            print(f"Test record ID: {insert_result.data[0]['id']}")
            
        except Exception as e:
            print(f"❌ Error verifying table: {e}")
        
        print("\n✅ Contact submissions table setup completed")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    main()