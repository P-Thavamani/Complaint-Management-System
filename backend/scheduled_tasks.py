import os
import time
import atexit
from datetime import datetime, timedelta
from flask import Flask
from apscheduler.schedulers.background import BackgroundScheduler
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId

# Import utility functions
from utils.notifications import send_notification

# Load environment variables
load_dotenv()

# MongoDB Atlas connection
MONGO_URI = os.getenv('MONGO_URI')
client = MongoClient(
    MONGO_URI,
    tls=True,
    tlsAllowInvalidCertificates=True,
    serverSelectionTimeoutMS=5000
)
db = client.get_database()

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
        # Get the complaint creation time
        created_at = complaint.get('created_at')
        if not created_at:
            continue
            
        # Convert string date to datetime object if needed
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            except ValueError:
                continue
        
        # Get the complaint priority
        priority = complaint.get('priority', 'low').lower()
        
        # Calculate the threshold in hours
        threshold_hours = thresholds.get(priority, 120)  # Default to 120 hours if priority not found
        
        # Calculate the time difference
        time_diff = datetime.now() - created_at
        hours_diff = time_diff.total_seconds() / 3600
        
        # Check if the complaint needs escalation
        if hours_diff >= threshold_hours:
            # Update the complaint status to 'escalated'
            complaint_id = complaint.get('_id')
            
            # Add a system comment about the escalation
            escalation_comment = {
                'user_id': 'system',
                'user_name': 'System',
                'comment': f'This complaint has been automatically escalated after {threshold_hours} hours without resolution.',
                'timestamp': datetime.now().isoformat()
            }
            
            # Update the complaint in the database
            db.complaints.update_one(
                {'_id': complaint_id},
                {
                    '$set': {'status': 'escalated'},
                    '$push': {'comments': escalation_comment}
                }
            )
            
            # Send notification to the user
            user_id = complaint.get('user_id')
            user = db.users.find_one({'_id': ObjectId(user_id)}) if user_id else None
            
            if user:
                notification_message = f"Your complaint (ID: {complaint.get('complaint_id')}) has been escalated due to exceeding the resolution time threshold."
                send_notification(user, 'Complaint Escalated', notification_message)
            
            # Add to the list of escalated complaints
            escalated_complaints.append({
                'complaint_id': complaint.get('complaint_id'),
                'subject': complaint.get('subject'),
                'priority': priority,
                'hours_exceeded': round(hours_diff, 2),
                'threshold_hours': threshold_hours
            })
    
    # Log the results
    if escalated_complaints:
        print(f"[{datetime.now()}] Escalated {len(escalated_complaints)} complaints:")
        for complaint in escalated_complaints:
            print(f"  - Complaint ID: {complaint['complaint_id']}, Subject: {complaint['subject']}, Priority: {complaint['priority']}")
    else:
        print(f"[{datetime.now()}] No complaints needed escalation.")
    
    return escalated_complaints

def init_scheduler(app):
    """
    Initialize the scheduler with the Flask app context
    """
    scheduler = BackgroundScheduler()
    
    # Schedule the escalation check to run every hour
    scheduler.add_job(
        func=check_and_escalate_complaints,
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