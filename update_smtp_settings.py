import requests
import json

def update_smtp_settings():
    try:
        # Login to get admin token
        login_data = {'email': 'admin@remotehive.in', 'password': 'Ranjeet11$'}
        login_response = requests.post(
            'http://localhost:8000/api/v1/auth/admin/login',
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Login Status: {login_response.status_code}")
        print(f"Login Response: {login_response.json()}")
        
        if login_response.status_code != 200:
            print("Login failed")
            return
            
        login_data = login_response.json()
        token = login_data.get('access_token')
        
        if not token:
            print("No access token received")
            return
            
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Update SMTP settings
        smtp_data = {
            'email_host': 'smtp.gmail.com',
            'email_port': 587,
            'email_username': 'remotehive.official@gmail.com',
            'email_password': 'Ranjeet11$',
            'email_from': 'noreply@remotehive.com',
            'email_use_tls': True,
            'email_use_ssl': False
        }
        
        print("\nUpdating SMTP settings...")
        response = requests.put(
            'http://localhost:8000/api/v1/admin/email/smtp-settings',
            headers=headers,
            json=smtp_data
        )
        
        print(f"SMTP Update Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ SMTP settings updated successfully!")
        else:
            print("❌ Failed to update SMTP settings")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_smtp_settings()