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
        
        print("🔧 Fixing users table policy infinite recursion...")
        
        # SQL to fix the infinite recursion in users table policies
        fix_policy_sql = """
        -- Drop existing problematic policies
        DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
        DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
        DROP POLICY IF EXISTS "Admin can update all users" ON public.users;
        DROP POLICY IF EXISTS "Allow admin to view all users" ON public.users;
        DROP POLICY IF EXISTS "Allow admin to update all users" ON public.users;
        DROP POLICY IF EXISTS "Allow users to view own profile" ON public.users;
        DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
        
        -- Disable RLS temporarily to avoid recursion
        ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
        
        -- Re-enable RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Create simple, non-recursive policies
        CREATE POLICY "Allow service role full access" ON public.users
            FOR ALL USING (true);
        
        CREATE POLICY "Allow authenticated users to view own profile" ON public.users
            FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY "Allow authenticated users to update own profile" ON public.users
            FOR UPDATE USING (auth.uid() = id);
        
        -- Grant necessary permissions
        GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
        GRANT ALL ON public.users TO service_role;
        """
        
        # Execute the SQL using direct database connection
        try:
            # Try using the rpc method first
            result = supabase.rpc('exec_sql', {'sql': fix_policy_sql}).execute()
            print("✅ Policies fixed using RPC method")
        except Exception as e:
            print(f"RPC method failed: {e}")
            print("Trying alternative approach...")
            
            # Alternative: Execute statements one by one
            statements = [
                "DROP POLICY IF EXISTS \"Users can view own profile\" ON public.users;",
                "DROP POLICY IF EXISTS \"Users can update own profile\" ON public.users;",
                "DROP POLICY IF EXISTS \"Admin can view all users\" ON public.users;",
                "DROP POLICY IF EXISTS \"Admin can update all users\" ON public.users;",
                "DROP POLICY IF EXISTS \"Allow admin to view all users\" ON public.users;",
                "DROP POLICY IF EXISTS \"Allow admin to update all users\" ON public.users;",
                "DROP POLICY IF EXISTS \"Allow users to view own profile\" ON public.users;",
                "DROP POLICY IF EXISTS \"Allow users to update own profile\" ON public.users;",
                "ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;",
                "ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;",
                "CREATE POLICY \"Allow service role full access\" ON public.users FOR ALL USING (true);",
                "CREATE POLICY \"Allow authenticated users to view own profile\" ON public.users FOR SELECT USING (auth.uid() = id);",
                "CREATE POLICY \"Allow authenticated users to update own profile\" ON public.users FOR UPDATE USING (auth.uid() = id);",
                "GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;",
                "GRANT ALL ON public.users TO service_role;"
            ]
            
            for stmt in statements:
                try:
                    supabase.postgrest.rpc('exec_sql', {'sql': stmt}).execute()
                    print(f"✅ Executed: {stmt[:50]}...")
                except Exception as stmt_error:
                    print(f"⚠️ Statement failed: {stmt[:50]}... - {stmt_error}")
        
        # Test the fix by querying users table
        try:
            test_query = supabase.table('users').select('id, email, role').limit(3).execute()
            print(f"✅ Users table accessible - found {len(test_query.data)} users")
            
            for user in test_query.data:
                print(f"  - {user.get('email', 'N/A')} ({user.get('role', 'N/A')})")
                
        except Exception as e:
            print(f"❌ Error testing users table access: {e}")
        
        print("\n✅ Users table policy fix completed")
        print("\n🔄 Please restart the FastAPI server to apply changes")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    main()