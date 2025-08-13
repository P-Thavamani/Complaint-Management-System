from flask import current_app
from flask_mail import Message
from twilio.base.exceptions import TwilioRestException
import os
from datetime import datetime

def send_email(recipient_email, subject, body, html=None):
    """
    Send an email to the specified recipient
    
    Args:
        recipient_email (str): The recipient's email address
        subject (str): Email subject
        body (str): Plain text email body
        html (str, optional): HTML email body. Defaults to None.
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        msg = Message(
            subject=subject,
            recipients=[recipient_email],
            body=body,
            html=html
        )
        
        mail = current_app.extensions.get('mail')
        if mail:
            mail.send(msg)
            return True
        else:
            print("Mail extension not initialized")
            return False
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

def send_whatsapp(to_number, message):
    """
    Send a WhatsApp message using Twilio
    
    Args:
        to_number (str): The recipient's phone number in E.164 format (e.g., +1234567890)
        message (str): The message to send
    
    Returns:
        bool: True if message was sent successfully, False otherwise
    """
    try:
        # Get Twilio client from app context
        twilio_client = current_app.config.get('twilio_client')
        from_whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER')
        
        if not twilio_client or not from_whatsapp_number:
            print("Twilio client not initialized or WhatsApp number not configured")
            return False
        
        # Format WhatsApp numbers
        from_whatsapp = f"whatsapp:{from_whatsapp_number}"
        to_whatsapp = f"whatsapp:{to_number}"
        
        # Send message
        twilio_client.messages.create(
            body=message,
            from_=from_whatsapp,
            to=to_whatsapp
        )
        
        return True
    except TwilioRestException as e:
        print(f"Twilio error: {str(e)}")
        return False
    except Exception as e:
        print(f"Error sending WhatsApp message: {str(e)}")
        return False

def send_thank_you_notifications(user_email, user_phone=None):
    """
    Send thank you notifications to the user via email and WhatsApp (if available)
    
    Args:
        user_email (str): User's email address
        user_phone (str, optional): User's phone number in E.164 format. Defaults to None.
    
    Returns:
        dict: Status of email and WhatsApp notifications
    """
    result = {
        'email_sent': False,
        'whatsapp_sent': False
    }
    
    # Email content
    email_subject = "Thank You for Using Our Complaint Management System"
    email_body = """
    Dear User,
    
    Thank you for using our Complaint Management System. We're glad we could help resolve your issue.
    
    If you have any further questions or concerns, please don't hesitate to contact us.
    
    Best regards,
    The Support Team
    """
    
    # HTML email content
    email_html = """
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Thank You!</h2>
        <p>Dear User,</p>
        <p>Thank you for using our <strong>Complaint Management System</strong>. We're glad we could help resolve your issue.</p>
        <p>If you have any further questions or concerns, please don't hesitate to contact us.</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <p style="margin: 0;"><strong>Best regards,</strong><br>The Support Team</p>
        </div>
    </div>
    """
    
    # Send email
    result['email_sent'] = send_email(user_email, email_subject, email_body, email_html)
    
    # Send WhatsApp message if phone number is provided
    if user_phone:
        whatsapp_message = "Thank you for using our Complaint Management System. We're glad we could help resolve your issue. If you have any further questions, please don't hesitate to contact us."
        result['whatsapp_sent'] = send_whatsapp(user_phone, whatsapp_message)
    
    return result

def send_notification(user, subject, message, html_message=None):
    """
    Send a notification to a user via email and WhatsApp (if available)
    
    Args:
        user (dict): User object containing email and phone
        subject (str): Notification subject
        message (str): Plain text message
        html_message (str, optional): HTML formatted message. Defaults to None.
    
    Returns:
        dict: Status of email and WhatsApp notifications
    """
    result = {
        'email_sent': False,
        'whatsapp_sent': False
    }
    
    # Get user contact information
    user_email = user.get('email')
    user_phone = user.get('phone')
    
    # Send email if email is available
    if user_email:
        result['email_sent'] = send_email(user_email, subject, message, html_message)
    
    # Send WhatsApp message if phone number is available
    if user_phone:
        result['whatsapp_sent'] = send_whatsapp(user_phone, message)
    
    return result

def send_ticket_creation_notification(user_email, user_phone=None, ticket_id=None, ticket_subject=None, created_at=None):
    """
    Send notification to the user when a ticket is created
    
    Args:
        user_email (str): User's email address
        user_phone (str, optional): User's phone number in E.164 format. Defaults to None.
        ticket_id (str, optional): The ticket ID. Defaults to None.
        ticket_subject (str, optional): The ticket subject. Defaults to None.
        created_at (datetime, optional): The ticket creation timestamp. Defaults to None.
    
    Returns:
        dict: Status of email and WhatsApp notifications
    """
    result = {
        'email_sent': False,
        'whatsapp_sent': False
    }
    
    # Format ticket ID for display
    display_ticket_id = ticket_id[-6:].upper() if ticket_id else 'N/A'
    
    # Format timestamp
    if created_at is None:
        created_at = datetime.utcnow()
    timestamp_str = created_at.strftime('%Y-%m-%d %H:%M:%S UTC')
    
    # Email content
    email_subject = "Ticket Received - Complaint Management System"
    email_body = f"""
    Dear User,
    
    Thank you for submitting your ticket to our Complaint Management System.
    
    Ticket Details:
    - Ticket ID: {display_ticket_id}
    - Subject: {ticket_subject or 'N/A'}
    - Created: {timestamp_str}
    
    We have received your ticket and will process it as soon as possible. You can track the status of your ticket using the Ticket ID provided above.
    
    If you have any questions, please don't hesitate to contact us.
    
    Best regards,
    The Support Team
    """
    
    # HTML email content
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Ticket Received</h2>
        <p>Dear User,</p>
        <p>Thank you for submitting your ticket to our <strong>Complaint Management System</strong>.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <h3 style="margin-top: 0;">Ticket Details:</h3>
            <p><strong>Ticket ID:</strong> {display_ticket_id}</p>
            <p><strong>Subject:</strong> {ticket_subject or 'N/A'}</p>
            <p><strong>Created:</strong> {timestamp_str}</p>
        </div>
        
        <p>We have received your ticket and will process it as soon as possible. You can track the status of your ticket using the Ticket ID provided above.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <p style="margin: 0;"><strong>Best regards,</strong><br>The Support Team</p>
        </div>
    </div>
    """
    
    # Send email
    result['email_sent'] = send_email(user_email, email_subject, email_body, email_html)
    
    # Send WhatsApp message if phone number is provided
    if user_phone:
        whatsapp_message = f"Ticket Received - ID: {display_ticket_id}\n\nSubject: {ticket_subject or 'N/A'}\nCreated: {timestamp_str}\n\nWe have received your ticket and will process it as soon as possible. You can track the status using the Ticket ID provided above."
        result['whatsapp_sent'] = send_whatsapp(user_phone, whatsapp_message)
    
    return result