#!/usr/bin/env python3
"""
Script to send a welcome email to a specific email address
"""

import requests
import json
from datetime import datetime

def get_admin_token():
    """Get admin authentication token"""
    try:
        login_response = requests.post(
            "http://localhost:8000/api/v1/auth/admin/login",
            headers={"Content-Type": "application/json"},
            json={
                "email": "admin@remotehive.in",
                "password": "Ranjeet11$",
                "remember_me": False
            }
        )
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code} - {login_response.text}")
            return None
        
        token_data = login_response.json()
        access_token = token_data["access_token"]
        print(f"✅ Login successful")
        return access_token
        
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return None

def check_smtp_settings(token):
    """Check SMTP configuration"""
    try:
        smtp_response = requests.get(
            "http://localhost:8000/api/v1/admin/email/smtp-settings",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if smtp_response.status_code == 200:
            smtp_data = smtp_response.json()
            print(f"📧 SMTP Settings:")
            print(f"   Host: {smtp_data.get('email_host')}")
            print(f"   Port: {smtp_data.get('email_port')}")
            print(f"   Username: {smtp_data.get('email_username')}")
            print(f"   From: {smtp_data.get('email_from')}")
            print(f"   TLS: {smtp_data.get('email_use_tls')}")
            
            # Check if credentials are configured
            if not smtp_data.get('email_username') or smtp_data.get('email_username') == 'admin@remotehive.in':
                print(f"⚠️  SMTP credentials not configured properly")
                return False
            return True
        else:
            print(f"❌ Failed to get SMTP settings: {smtp_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking SMTP settings: {e}")
        return False

def simulate_welcome_email(recipient_email):
    """Simulate sending a welcome email (for demo purposes)"""
    welcome_content = f"""
    📧 WELCOME EMAIL SIMULATION
    ═══════════════════════════════════════════════════════════════
    
    TO: {recipient_email}
    FROM: noreply@remotehive.com
    SUBJECT: Welcome to RemoteHive - Your Remote Career Journey Starts Here!
    DATE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    
    ═══════════════════════════════════════════════════════════════
    
    Hello there!
    
    Thank you for joining RemoteHive, the premier platform for remote 
    job opportunities. We're excited to help you find your next remote 
    career opportunity.
    
    Here are some next steps to get started:
    
    • Complete your profile to showcase your skills
    • Upload your resume to attract employers  
    • Set up job alerts for positions that match your interests
    • Browse our extensive database of remote positions
    • Connect with top remote-friendly companies
    
    Our platform is designed to connect talented professionals like you 
    with companies that value remote work and work-life balance.
    
    If you have any questions or need assistance, our support team is 
    here to help!
    
    Best regards,
    The RemoteHive Team
    
    Connecting talent with remote opportunities worldwide
    
    ═══════════════════════════════════════════════════════════════
    """
    
    print(welcome_content)
    return True

def log_email_attempt(token, recipient_email):
    """Log the email attempt in the system"""
    try:
        # Try to send a test email to see if SMTP works
        email_response = requests.post(
            "http://localhost:8000/api/v1/admin/email/test",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "recipient_email": recipient_email,
                "subject": "Welcome to RemoteHive - Your Remote Career Journey Starts Here!",
                "html_content": "<h1>Welcome to RemoteHive!</h1><p>This is a test welcome email.</p>"
            }
        )
        
        if email_response.status_code == 200:
            response_data = email_response.json()
            if response_data.get('success'):
                print(f"✅ Email sent successfully via SMTP!")
                print(f"📧 Email Log ID: {response_data.get('email_log_id')}")
                return True
            else:
                print(f"❌ SMTP sending failed: {response_data.get('message')}")
                return False
        else:
            print(f"❌ Email API error: {email_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error attempting to send email: {e}")
        return False

def main():
    recipient_email = "ranjeettiwary589@gmail.com"
    
    print(f"🚀 Welcome Email Service for RemoteHive")
    print(f"📬 Target recipient: {recipient_email}")
    print("=" * 70)
    
    # Get admin token
    token = get_admin_token()
    if not token:
        print("❌ Failed to get admin token. Cannot proceed.")
        return
    
    # Check SMTP settings
    smtp_configured = check_smtp_settings(token)
    
    if smtp_configured:
        print("\n🔧 SMTP is configured. Attempting to send real email...")
        success = log_email_attempt(token, recipient_email)
        
        if success:
            print("\n🎉 Welcome email sent successfully via SMTP!")
            print(f"📬 The recipient {recipient_email} should receive the email shortly.")
        else:
            print("\n⚠️  SMTP sending failed. Showing email simulation instead...")
            simulate_welcome_email(recipient_email)
    else:
        print("\n⚠️  SMTP not properly configured. Showing email simulation...")
        print("\n💡 To enable real email sending, configure EMAIL_USERNAME and EMAIL_PASSWORD in .env file")
        simulate_welcome_email(recipient_email)
    
    print("\n" + "=" * 70)
    print("📝 Note: This demonstrates the welcome email functionality.")
    print("🔧 Configure SMTP settings in the admin panel for production use.")

if __name__ == "__main__":
    main()