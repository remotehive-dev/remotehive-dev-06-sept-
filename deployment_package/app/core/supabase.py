import os
from supabase import create_client, Client
from typing import Optional

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Global Supabase client instances
_supabase_client: Optional[Client] = None
_supabase_admin_client: Optional[Client] = None

def get_supabase() -> Client:
    """Get Supabase client with anon key for regular operations."""
    global _supabase_client
    
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")
        
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    return _supabase_client

def get_supabase_admin() -> Client:
    """Get Supabase client with service role key for admin operations."""
    global _supabase_admin_client
    
    if _supabase_admin_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables")
        
        _supabase_admin_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    return _supabase_admin_client

# For backward compatibility - default to anon client
supabase = get_supabase()