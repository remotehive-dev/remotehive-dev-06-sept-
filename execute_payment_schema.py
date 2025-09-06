#!/usr/bin/env python3
"""
Execute payment schema SQL to create all payment-related tables
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def execute_payment_schema():
    """Execute the payment schema SQL file"""
    
    # Initialize Supabase client
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_service_key:
        print("Error: Missing Supabase environment variables")
        print("Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
        return False
    
    supabase: Client = create_client(supabase_url, supabase_service_key)
    
    # Read the payment schema SQL file
    schema_file = 'remotehive-admin/database/payment_schema.sql'
    
    try:
        with open(schema_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print(f"Executing payment schema from {schema_file}...")
        
        # Split SQL into individual statements
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        success_count = 0
        error_count = 0
        
        for i, statement in enumerate(statements, 1):
            if not statement:
                continue
                
            try:
                # Execute each SQL statement
                result = supabase.rpc('exec_sql', {'sql': statement}).execute()
                print(f"✓ Statement {i} executed successfully")
                success_count += 1
            except Exception as e:
                print(f"✗ Error in statement {i}: {str(e)}")
                error_count += 1
                # Continue with next statement
        
        print(f"\nExecution completed:")
        print(f"✓ Successful statements: {success_count}")
        print(f"✗ Failed statements: {error_count}")
        
        # Verify tables were created
        print("\nVerifying table creation...")
        tables_to_check = [
            'payment_plans',
            'payment_gateways', 
            'transactions',
            'refunds',
            'payment_analytics',
            'fraud_detection_logs',
            'webhook_logs'
        ]
        
        for table in tables_to_check:
            try:
                result = supabase.table(table).select('*').limit(1).execute()
                print(f"✓ Table '{table}' exists and is accessible")
            except Exception as e:
                print(f"✗ Table '{table}' verification failed: {str(e)}")
        
        return error_count == 0
        
    except FileNotFoundError:
        print(f"Error: Schema file not found: {schema_file}")
        return False
    except Exception as e:
        print(f"Error executing schema: {str(e)}")
        return False

if __name__ == '__main__':
    success = execute_payment_schema()
    if success:
        print("\n🎉 Payment schema executed successfully!")
    else:
        print("\n❌ Payment schema execution completed with errors.")
        print("You may need to execute the SQL manually in Supabase dashboard.")