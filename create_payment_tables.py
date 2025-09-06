#!/usr/bin/env python3

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_payment_tables():
    """Create payment tables in PostgreSQL database"""
    
    # Database connection string
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("Error: DATABASE_URL not found in environment variables")
        return False
    
    # Read the payment schema SQL file
    schema_file = 'remotehive-admin/database/payment_schema.sql'
    
    try:
        with open(schema_file, 'r') as f:
            sql_content = f.read()
        
        print("Connecting to database...")
        
        # Connect to PostgreSQL database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("Executing payment schema SQL...")
        
        # Execute the SQL schema
        cursor.execute(sql_content)
        
        # Commit the changes
        conn.commit()
        
        print("✓ Payment tables created successfully!")
        
        # Verify tables were created
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
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"✓ {table} table created with {count} records")
        
        # Close connections
        cursor.close()
        conn.close()
        
        return True
        
    except FileNotFoundError:
        print(f"Error: Could not find schema file: {schema_file}")
        return False
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return False
    except Exception as e:
        print(f"Error creating payment tables: {e}")
        return False

if __name__ == "__main__":
    create_payment_tables()