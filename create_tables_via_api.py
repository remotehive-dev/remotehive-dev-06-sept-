#!/usr/bin/env python3

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_payment_tables_via_api():
    """Create payment tables using Supabase REST API"""
    
    supabase_url = os.getenv('SUPABASE_URL')
    service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not service_role_key:
        print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
        return False
    
    # Headers for API requests
    headers = {
        'apikey': service_role_key,
        'Authorization': f'Bearer {service_role_key}',
        'Content-Type': 'application/json'
    }
    
    # SQL commands to create tables
    sql_commands = [
        # Create payment_plans table
        """
        CREATE TABLE IF NOT EXISTS payment_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'INR',
          billing_period VARCHAR(20) NOT NULL,
          features JSONB,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        
        # Insert default payment plans
        """
        INSERT INTO payment_plans (name, description, price, billing_period, features) VALUES
        ('Free', 'Perfect for job seekers getting started', 0.00, 'one-time', '["Browse unlimited jobs", "Apply to 5 jobs per month", "Basic profile creation", "Email notifications", "Mobile app access"]'),
        ('Pro', 'For serious job seekers who want more opportunities', 299.00, 'monthly', '["Everything in Free", "Unlimited job applications", "Advanced search filters", "Profile analytics & insights", "Resume builder with templates", "Priority customer support", "Application tracking", "Salary insights", "Interview preparation resources", "Profile visibility boost"]'),
        ('Business', 'For small to medium companies hiring remote talent', 2999.00, 'monthly', '["Post up to 10 jobs per month", "Access to candidate database", "Basic applicant tracking", "Company profile page", "Email support", "Job posting templates", "Basic analytics"]'),
        ('Enterprise', 'For large organizations with extensive hiring needs', 9999.00, 'monthly', '["Everything in Business", "Unlimited job postings", "Advanced applicant tracking system", "Candidate screening & assessment tools", "Custom integrations (ATS, HRIS)", "Dedicated account manager", "Priority support (24/7)", "Advanced analytics & reporting", "White-label solutions", "Custom onboarding & training"]')
        ON CONFLICT DO NOTHING;
        """
    ]
    
    # Execute SQL commands via RPC
    for i, sql in enumerate(sql_commands):
        try:
            print(f"Executing SQL command {i+1}...")
            
            # Use Supabase RPC to execute SQL
            response = requests.post(
                f"{supabase_url}/rest/v1/rpc/exec_sql",
                headers=headers,
                json={"sql": sql}
            )
            
            if response.status_code == 200:
                print(f"✓ SQL command {i+1} executed successfully")
            else:
                print(f"✗ SQL command {i+1} failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"Error executing SQL command {i+1}: {e}")
    
    # Test if payment_plans table exists by making a simple query
    try:
        response = requests.get(
            f"{supabase_url}/rest/v1/payment_plans?select=*&limit=1",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ payment_plans table verified - found {len(data)} records")
            return True
        else:
            print(f"✗ Could not verify payment_plans table: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Error verifying table: {e}")
        return False

if __name__ == "__main__":
    create_payment_tables_via_api()