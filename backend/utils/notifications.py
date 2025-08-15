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

def send_ticket_creation_notification(user_email, user_name, ticket_id, subject, category, priority):
    """
    Send email notification when a ticket is created
    """
    email_subject = f"Ticket Created - #{ticket_id[-6:].upper()}"
    
    email_body = f"""
Dear {user_name},

Your complaint ticket has been successfully created and is now in our system.

Ticket Details:
- Ticket ID: #{ticket_id[-6:].upper()}
- Subject: {subject}
- Category: {category}
- Priority: {priority.capitalize()}
- Status: Pending

Our support team will review your ticket and begin working on it as soon as possible. You will receive updates as the status changes.

You can track your ticket status by logging into your account.

Thank you for using our Complaint Management System.

Best regards,
Support Team
    """
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Ticket Created Successfully</h2>
        <p>Dear {user_name},</p>
        <p>Your complaint ticket has been successfully created and is now in our system.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">Ticket Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Ticket ID:</strong> #{ticket_id[-6:].upper()}</li>
                <li><strong>Subject:</strong> {subject}</li>
                <li><strong>Category:</strong> {category}</li>
                <li><strong>Priority:</strong> {priority.capitalize()}</li>
                <li><strong>Status:</strong> Pending</li>
            </ul>
        </div>
        
        <p>Our support team will review your ticket and begin working on it as soon as possible. You will receive updates as the status changes.</p>
        <p>You can track your ticket status by logging into your account.</p>
        <p>Thank you for using our Complaint Management System.</p>
        <p><strong>Best regards,<br>Support Team</strong></p>
    </div>
    """
    
    return send_email(user_email, email_subject, email_body, html_body)

def send_status_change_notification(user_email, user_name, ticket_id, old_status, new_status, assigned_to=None):
    """
    Send email notification when ticket status changes
    """
    status_descriptions = {
        'pending': 'Your ticket is pending review by our support team.',
        'in-progress': 'Your ticket is now being actively worked on by our support team.',
        'escalated': 'Your ticket has been escalated to senior support staff for further review.',
        'resolved': 'Your ticket has been resolved successfully.'
    }
    
    email_subject = f"Ticket Status Updated - #{ticket_id[-6:].upper()}"
    
    status_message = status_descriptions.get(new_status, f"Your ticket status has been changed to {new_status}.")
    assigned_message = f" Your ticket has been assigned to {assigned_to}." if assigned_to else ""
    
    email_body = f"""
Dear {user_name},

Your ticket status has been updated.

Ticket ID: #{ticket_id[-6:].upper()}
Previous Status: {old_status.capitalize()}
New Status: {new_status.capitalize()}

{status_message}{assigned_message}

You can view the full details of your ticket by logging into your account.

Thank you for your patience.

Best regards,
Support Team
    """
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Ticket Status Updated</h2>
        <p>Dear {user_name},</p>
        <p>Your ticket status has been updated.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">Status Change:</h3>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Ticket ID:</strong> #{ticket_id[-6:].upper()}</li>
                <li><strong>Previous Status:</strong> {old_status.capitalize()}</li>
                <li><strong>New Status:</strong> {new_status.capitalize()}</li>
            </ul>
        </div>
        
        <p>{status_message}{assigned_message}</p>
        <p>You can view the full details of your ticket by logging into your account.</p>
        <p>Thank you for your patience.</p>
        <p><strong>Best regards,<br>Support Team</strong></p>
    </div>
    """
    
    return send_email(user_email, email_subject, email_body, html_body)

def send_ticket_resolved_notification(user_email, user_name, ticket_id, resolution_message=None):
    """
    Send email notification when ticket is resolved
    """
    email_subject = f"Ticket Resolved - #{ticket_id[-6:].upper()}"
    
    resolution_text = f"\n\nResolution Details:\n{resolution_message}" if resolution_message else ""
    
    email_body = f"""
Dear {user_name},

Great news! Your ticket has been successfully resolved.

Ticket ID: #{ticket_id[-6:].upper()}
Status: Resolved{resolution_text}

We hope this resolves your issue completely. If you have any further questions or if the issue persists, please don't hesitate to create a new ticket.

Thank you for using our Complaint Management System. We appreciate your feedback and hope to serve you again soon.

Best regards,
Support Team
    """
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Ticket Resolved Successfully</h2>
        <p>Dear {user_name},</p>
        <p>Great news! Your ticket has been successfully resolved.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #065f46;">Resolution Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Ticket ID:</strong> #{ticket_id[-6:].upper()}</li>
                <li><strong>Status:</strong> Resolved</li>
            </ul>
            {f'<p><strong>Resolution:</strong> {resolution_message}</p>' if resolution_message else ''}
        </div>
        
        <p>We hope this resolves your issue completely. If you have any further questions or if the issue persists, please don't hesitate to create a new ticket.</p>
        <p>Thank you for using our Complaint Management System. We appreciate your feedback and hope to serve you again soon.</p>
        <p><strong>Best regards,<br>Support Team</strong></p>
    </div>
    """
    
    return send_email(user_email, email_subject, email_body, html_body)

def send_ticket_escalation_notification(user_email, user_name, ticket_id, reason=None):
    """
    Send email notification when ticket is escalated
    """
    email_subject = f"Ticket Escalated - #{ticket_id[-6:].upper()}"
    
    reason_text = f"\n\nReason for escalation: {reason}" if reason else "\n\nYour ticket has been escalated to senior support staff for further review."
    
    email_body = f"""
Dear {user_name},

Your ticket has been escalated to ensure you receive the best possible support.

Ticket ID: #{ticket_id[-6:].upper()}
Status: Escalated{reason_text}

This escalation means your ticket is now being handled by our senior support team who have additional expertise to resolve your issue.

We apologize for any inconvenience and appreciate your patience while we work to resolve your issue.

Best regards,
Support Team
    """
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Ticket Escalated</h2>
        <p>Dear {user_name},</p>
        <p>Your ticket has been escalated to ensure you receive the best possible support.</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #991b1b;">Escalation Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Ticket ID:</strong> #{ticket_id[-6:].upper()}</li>
                <li><strong>Status:</strong> Escalated</li>
            </ul>
            {f'<p><strong>Reason:</strong> {reason}</p>' if reason else '<p>Your ticket has been escalated to senior support staff for further review.</p>'}
        </div>
        
        <p>This escalation means your ticket is now being handled by our senior support team who have additional expertise to resolve your issue.</p>
        <p>We apologize for any inconvenience and appreciate your patience while we work to resolve your issue.</p>
        <p><strong>Best regards,<br>Support Team</strong></p>
    </div>
    """
    
    return send_email(user_email, email_subject, email_body, html_body)

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
    
    We value your feedback and hope to serve you again soon.
    
    Best regards,
    Support Team
    """
    
    html_body = """
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Thank You!</h2>
        <p>Dear User,</p>
        <p>Thank you for using our Complaint Management System. We're glad we could help resolve your issue.</p>
        <p>We value your feedback and hope to serve you again soon.</p>
        <p><strong>Best regards,<br>Support Team</strong></p>
    </div>
    """
    
    # Send email
    result['email_sent'] = send_email(user_email, email_subject, email_body, html_body)
    
    # WhatsApp content
    whatsapp_message = """
    Thank you for using our Complaint Management System! 🎉
    
    We're glad we could help resolve your issue. We value your feedback and hope to serve you again soon.
    
    Best regards,
    Support Team
    """
    
    # Send WhatsApp if phone number is provided
    if user_phone:
        result['whatsapp_sent'] = send_whatsapp(user_phone, whatsapp_message)
    
    return result

def send_notification(user, notification_type, message):
    """
    Send notification to user via email and WhatsApp (if available)
    
    Args:
        user (dict): User object containing email and phone
        notification_type (str): Type of notification
        message (str): Notification message
    
    Returns:
        dict: Status of notifications sent
    """
    result = {
        'email_sent': False,
        'whatsapp_sent': False
    }
    
    # Send email
    if user.get('email'):
        result['email_sent'] = send_email(
            user['email'],
            notification_type,
            message
        )
    
    # Send WhatsApp if phone number is available
    if user.get('phone'):
        result['whatsapp_sent'] = send_whatsapp(user['phone'], message)
    
    return result