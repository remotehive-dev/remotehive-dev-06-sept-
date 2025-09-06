import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

def test_smtp_connection():
    """Test SMTP connection and email sending"""
    
    # Email settings from .env
    EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
    EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
    EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@remotehive.com")
    EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "true").lower() == "true"
    
    print("🔧 SMTP Configuration:")
    print(f"   Host: {EMAIL_HOST}")
    print(f"   Port: {EMAIL_PORT}")
    print(f"   Username: {EMAIL_USERNAME}")
    print(f"   From: {EMAIL_FROM}")
    print(f"   Use TLS: {EMAIL_USE_TLS}")
    print(f"   Password: {'*' * len(EMAIL_PASSWORD) if EMAIL_PASSWORD else 'NOT SET'}")
    print()
    
    if not EMAIL_USERNAME or not EMAIL_PASSWORD:
        print("❌ Email username or password not configured!")
        return False
    
    try:
        print("🔌 Testing SMTP connection...")
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = EMAIL_FROM
        msg['To'] = "ranjeettiwary589@gmail.com"
        msg['Subject'] = "SMTP Test from RemoteHive"
        
        html_content = """
        <html>
        <body>
            <h2>SMTP Test Email</h2>
            <p>This is a test email to verify SMTP configuration.</p>
            <p>If you receive this, the email system is working correctly!</p>
        </body>
        </html>
        """
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Connect and send
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            print(f"✅ Connected to {EMAIL_HOST}:{EMAIL_PORT}")
            
            if EMAIL_USE_TLS:
                print("🔒 Starting TLS...")
                server.starttls()
                print("✅ TLS enabled")
            
            print("🔑 Authenticating...")
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            print("✅ Authentication successful")
            
            print("📧 Sending email...")
            server.send_message(msg)
            print("✅ Email sent successfully!")
            
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP Authentication failed: {e}")
        print("   Check your email username and password")
        return False
    except smtplib.SMTPConnectError as e:
        print(f"❌ SMTP Connection failed: {e}")
        print("   Check your email host and port settings")
        return False
    except smtplib.SMTPException as e:
        print(f"❌ SMTP Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting SMTP test...")
    print("=" * 50)
    
    success = test_smtp_connection()
    
    print("=" * 50)
    if success:
        print("✅ SMTP test completed successfully!")
    else:
        print("❌ SMTP test failed!")