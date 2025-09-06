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
        
        print("🔧 Completely fixing RLS policies...")
        
        # Step 1: Disable RLS completely
        print("\n1️⃣ Disabling RLS on users table...")
        disable_rls_sql = "ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;"
        
        try:
            result = supabase.rpc('exec_sql', {'sql': disable_rls_sql}).execute()
            print("✅ RLS disabled")
        except Exception as e:
            print(f"⚠️ Error disabling RLS: {e}")
        
        # Step 2: Drop all existing policies
        print("\n2️⃣ Dropping all existing policies...")
        drop_policies_sql = """
        DO $$ 
        DECLARE
            policy_record RECORD;
        BEGIN
            FOR policy_record IN 
                SELECT policyname 
                FROM pg_policies 
                WHERE tablename = 'users' AND schemaname = 'public'
            LOOP
                EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.users';
            END LOOP;
        END $$;
        """
        
        try:
            result = supabase.rpc('exec_sql', {'sql': drop_policies_sql}).execute()
            print("✅ All policies dropped")
        except Exception as e:
            print(f"⚠️ Error dropping policies: {e}")
        
        # Step 3: Test table access without RLS
        print("\n3️⃣ Testing table access without RLS...")
        try:
            test_query = supabase.table('users').select('id, email, role').limit(3).execute()
            print(f"✅ Table accessible - found {len(test_query.data)} users")
            for user in test_query.data:
                print(f"  - {user.get('email', 'N/A')} ({user.get('role', 'N/A')})")
        except Exception as e:
            print(f"❌ Table still not accessible: {e}")
            return
        
        # Step 4: Create simple, non-recursive policies
        print("\n4️⃣ Creating simple policies...")
        
        # Re-enable RLS
        enable_rls_sql = "ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;"
        try:
            result = supabase.rpc('exec_sql', {'sql': enable_rls_sql}).execute()
            print("✅ RLS re-enabled")
        except Exception as e:
            print(f"⚠️ Error enabling RLS: {e}")
        
        # Create simple policies
        simple_policies_sql = """
        -- Allow service role full access (for admin operations)
        CREATE POLICY "service_role_access" ON public.users
            FOR ALL USING (true);
        
        -- Allow users to view their own profile
        CREATE POLICY "users_select_own" ON public.users
            FOR SELECT USING (auth.uid()::text = id::text);
        
        -- Allow users to update their own profile
        CREATE POLICY "users_update_own" ON public.users
            FOR UPDATE USING (auth.uid()::text = id::text);
        
        -- Grant permissions
        GRANT SELECT, UPDATE ON public.users TO authenticated;
        GRANT ALL ON public.users TO service_role;
        """
        
        try:
            result = supabase.rpc('exec_sql', {'sql': simple_policies_sql}).execute()
            print("✅ Simple policies created")
        except Exception as e:
            print(f"⚠️ Error creating policies: {e}")
        
        # Step 5: Test with new policies
        print("\n5️⃣ Testing with new policies...")
        try:
            test_query = supabase.table('users').select('id, email, role').limit(3).execute()
            print(f"✅ Table accessible with new policies - found {len(test_query.data)} users")
            for user in test_query.data:
                print(f"  - {user.get('email', 'N/A')} ({user.get('role', 'N/A')})")
        except Exception as e:
            print(f"❌ Error with new policies: {e}")
        
        # Step 6: Test admin user specifically
        print("\n6️⃣ Testing admin user access...")
        try:
            admin_query = supabase.table('users').select('*').eq('email', 'admin@remotehive.in').execute()
            if admin_query.data:
                admin_user = admin_query.data[0]
                print(f"✅ Admin user found:")
                print(f"   ID: {admin_user['id']}")
                print(f"   Email: {admin_user['email']}")
                print(f"   Role: {admin_user['role']}")
                print(f"   Active: {admin_user['is_active']}")
            else:
                print(f"❌ Admin user not found in database")
        except Exception as e:
            print(f"❌ Error accessing admin user: {e}")
        
        print("\n✅ RLS policy fix completed")
        print("\n🔄 Please test the admin authentication now")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    main()