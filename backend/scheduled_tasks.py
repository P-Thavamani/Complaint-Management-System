import os
import time
import atexit
from datetime import datetime, timedelta
from flask import Flask
from apscheduler.schedulers.background import BackgroundScheduler  # type: ignore[import]
from pymongo import MongoClient
from typing import Any
from dotenv import load_dotenv
from bson import ObjectId

# Import utility functions
from utils.notifications import send_notification

# Load environment variables
load_dotenv()

# MongoDB Atlas connection - will be set by Flask app context
client = None
db = None

def check_and_escalate_complaints():
    """
    Automatically checks for complaints that need escalation based on priority and time thresholds:
    - High priority: 24 hours
    - Medium priority: 72 hours
    - Low priority: 120 hours
    
    If a complaint exceeds its threshold and is still in 'pending' or 'in-progress' status,
    it will be automatically escalated.
    """
    print(f"[{datetime.now()}] Running scheduled escalation check...")
    
    # Get database from Flask app context
    from flask import current_app
    db = current_app.config.get('db')
    if not db:
        print("Database not available in app context")
        return []
    
    # Define time thresholds for each priority level
    thresholds = {
        'high': 24,  # 24 hours for high priority
        'medium': 72,  # 72 hours for medium priority
        'low': 120  # 120 hours for low priority
    }
    
    escalated_complaints = []
    
    # Get all complaints that are pending or in-progress
    complaints = db.complaints.find({
        'status': {'$in': ['pending', 'in-progress']}
    })
    
    for complaint in complaints:
        # Get the complaint creation time (use camelCase createdAt used by API)
        created_at = complaint.get('createdAt')
        if not created_at:
            continue
        
        # Get the complaint priority
        priority = complaint.get('priority', 'low').lower()
        
        # Calculate the threshold in hours
        threshold_hours = thresholds.get(priority, 120)  # Default to 120 hours if priority not found
        
        # Calculate the time difference
        time_diff = datetime.utcnow() - created_at
        hours_diff = time_diff.total_seconds() / 3600
        
        # Check if the complaint needs escalation
        if hours_diff >= threshold_hours:
            # Update the complaint status to 'escalated'
            complaint_id = complaint.get('_id')

            # Add a system comment about the escalation
            system_comment = {
                '_id': ObjectId(),
                'content': f"Complaint automatically escalated due to exceeding time threshold for {priority} priority.",
                'user_id': ObjectId(),
                'user': {
                    'name': 'System',
                    'email': 'system@example.com'
                },
                'createdAt': datetime.utcnow(),
                'isSystem': True
            }

            # Update the complaint in the database
            db.complaints.update_one(
                {'_id': complaint_id},
                {
                    '$set': {
                        'status': 'escalated',
                        'escalatedAt': datetime.utcnow(),
                        'updatedAt': datetime.utcnow()
                    },
                    '$push': {'comments': system_comment}
                }
            )
            
            # Send notification to the user
            user_id = complaint.get('user_id')
            user = db.users.find_one({'_id': user_id}) if user_id else None
            
            if user:
                from utils.notifications import send_email
                try:
                    send_email(
                        recipient_email=user['email'],
                        subject="Your complaint has been escalated",
                        body=f"Your complaint (ID: {str(complaint_id)[-6:].upper()}) has been escalated due to exceeding the resolution time threshold."
                    )
                except Exception as e:
                    print(f"Failed to send escalation notification: {e}")
            
            # Format complaint data for return
            escalated_complaint = {
                'complaintId': str(complaint_id),
                'subject': complaint.get('subject', 'No subject'),
                'priority': priority,
                'createdAt': created_at.isoformat() if created_at else None,
                'escalatedAt': datetime.utcnow().isoformat()
            }
            
            # Add to the list of escalated complaints
            escalated_complaints.append(escalated_complaint)
    
    # Log the results
    if escalated_complaints:
        print(f"[{datetime.now()}] Escalated {len(escalated_complaints)} complaints:")
        for complaint in escalated_complaints:
            print(f"  - Complaint ID: {complaint['complaintId']}, Subject: {complaint['subject']}, Priority: {complaint['priority']}")
    else:
        print(f"[{datetime.now()}] No complaints needed escalation.")
    
    return escalated_complaints

def init_scheduler(app):
    """
    Initialize the scheduler with the Flask app context
    """
    scheduler = BackgroundScheduler()

    # Wrap job to ensure Flask application context is available for notifications
    def _job_with_app_context():
        try:
            with app.app_context():
                check_and_escalate_complaints()
        except Exception as e:
            print(f"Error during scheduled escalation check: {e}")

    # Schedule the escalation check to run every hour
    scheduler.add_job(
        func=_job_with_app_context,
        trigger='interval',
        hours=1,
        id='escalation_check',
        replace_existing=True
    )
    
    # Start the scheduler
    scheduler.start()
    print(f"[{datetime.now()}] Scheduler started. Automatic escalation check will run every hour.")
    
    # Shut down the scheduler when the app is shutting down
    atexit.register(lambda: scheduler.shutdown())