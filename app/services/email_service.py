import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional
import os
from pathlib import Path
from jinja2 import Template
from motor.motor_asyncio import AsyncIOMotorDatabase
# from bson import ObjectId  # Removed to fix Pydantic schema generation
from app.core.config import settings
from app.database.services import UserService
# TODO: Migrate email models to MongoDB or handle differently
# from app.models.email import EmailUser, EmailMessage
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.smtp_server = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('EMAIL_PORT', '587'))
        self.email_username = os.getenv('EMAIL_USERNAME')
        self.email_password = os.getenv('EMAIL_PASSWORD')
        
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        from_email: Optional[str] = None,
        attachments: Optional[List[str]] = None,
        is_html: bool = True
    ) -> bool:
        """Send email using SMTP"""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = from_email or self.email_username
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add body
            if is_html:
                msg.attach(MIMEText(body, 'html'))
            else:
                msg.attach(MIMEText(body, 'plain'))
            
            # Add attachments if any
            if attachments:
                for file_path in attachments:
                    if os.path.isfile(file_path):
                        with open(file_path, "rb") as attachment:
                            part = MIMEBase('application', 'octet-stream')
                            part.set_payload(attachment.read())
                        
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename= {os.path.basename(file_path)}'
                        )
                        msg.attach(part)
            
            # Create SMTP session
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.email_username, self.email_password)
                server.send_message(msg)
            
            # Log email
            await self._log_email(to_email, subject, body, 'sent', from_email)
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            await self._log_email(to_email, subject, body, 'failed', from_email, str(e))
            return False
    
    async def send_template_email(
        self,
        to_email: str,
        template_name: str,
        context: dict,
        from_email: Optional[str] = None
    ) -> bool:
        """Send email using template"""
        try:
            # Get template
            template = await self.db.email_templates.find_one(
                {"name": template_name}
            )
            
            if not template:
                logger.error(f"Template {template_name} not found")
                return False
            
            # Render template
            subject_template = Template(template["subject"])
            body_template = Template(template["body"])
            
            subject = subject_template.render(**context)
            body = body_template.render(**context)
            
            return await self.send_email(
                to_email=to_email,
                subject=subject,
                body=body,
                from_email=from_email,
                is_html=True
            )
            
        except Exception as e:
            logger.error(f"Failed to send template email: {str(e)}")
            return False
    
    async def send_password_reset_email(self, to_email: str, reset_token: str, user_name: str) -> bool:
        """Send password reset email"""
        context = {
            'user_name': user_name,
            'reset_link': f"{settings.FRONTEND_URL}/reset-password?token={reset_token}",
            'app_name': 'RemoteHive'
        }
        
        return await self.send_template_email(
            to_email=to_email,
            template_name='password_reset',
            context=context
        )
    
    async def send_welcome_email(self, to_email: str, user_name: str, temp_password: str) -> bool:
        """Send welcome email with temporary password"""
        context = {
            'user_name': user_name,
            'temp_password': temp_password,
            'login_link': f"{settings.FRONTEND_URL}/login",
            'app_name': 'RemoteHive'
        }
        
        return await self.send_template_email(
            to_email=to_email,
            template_name='welcome_email',
            context=context
        )
    
    async def send_notification_email(self, to_email: str, title: str, message: str) -> bool:
        """Send general notification email"""
        context = {
            'title': title,
            'message': message,
            'app_name': 'RemoteHive'
        }
        
        return await self.send_template_email(
            to_email=to_email,
            template_name='notification_general',
            context=context
        )
    
    async def _log_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        status: str,
        from_email: Optional[str] = None,
        error_message: Optional[str] = None
    ):
        """Log email activity"""
        try:
            email_log_data = {
                "to_email": to_email,
                "from_email": from_email or self.email_username,
                "subject": subject,
                "body": body,
                "status": status,
                "error_message": error_message,
                "sent_at": datetime.utcnow()
            }
            await self.db.email_logs.insert_one(email_log_data)
        except Exception as e:
            logger.error(f"Failed to log email: {str(e)}")
    
    async def get_email_logs(self, limit: int = 50, offset: int = 0):
        """Get email logs"""
        return await self.db.email_logs.find().sort(
            "sent_at", -1
        ).skip(offset).limit(limit).to_list(length=limit)
    
    def test_email_connection(self) -> bool:
        """Test SMTP connection"""
        try:
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.email_username, self.email_password)
            return True
        except Exception as e:
            logger.error(f"SMTP connection test failed: {str(e)}")
            return False