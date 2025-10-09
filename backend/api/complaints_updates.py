from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from utils.auth_middleware import token_required, admin_required
from utils.notifications import send_thank_you_notifications, send_notification
from utils.rewards import award_points
from scheduled_tasks import check_and_escalate_complaints

complaint_updates_bp = Blueprint('complaint_updates', __name__)



@complaint_updates_bp.route('/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint to verify the blueprint is working"""
    return jsonify({'message': 'Complaint updates blueprint is working', 'status': 'ok'})

@complaint_updates_bp.route('/check-escalations', methods=['GET', 'POST'])
@admin_required
def trigger_escalation_check(current_user):
    """
    Admin endpoint to manually trigger the escalation check
    """
    try:
        # Run the escalation check
        escalated_complaints = check_and_escalate_complaints()
        
        # Format the escalated complaints for the response
        formatted_complaints = []
        if escalated_complaints:
            db = current_app.config['db']
            for complaint in escalated_complaints:
                try:
                    # Get the complaint ID directly if it's an ObjectId or from the dict if it's an object
                    complaint_id = complaint if isinstance(complaint, ObjectId) else complaint.get('complaintId')
                    complaint_obj = db.complaints.find_one({'_id': ObjectId(complaint_id)})
                    
                    if complaint_obj:
                        formatted_complaint = {
                            'id': str(complaint_obj['_id']),
                            'subject': complaint_obj.get('subject', 'No subject'),
                            'status': 'escalated',
                            'priority': complaint_obj.get('priority', 'medium'),
                            'category': complaint_obj.get('category', 'General'),
                            'escalatedAt': complaint_obj.get('escalatedAt', datetime.utcnow()).isoformat()
                        }
                        formatted_complaints.append(formatted_complaint)
                except Exception as complaint_error:
                    print(f"Error formatting complaint {complaint_id}: {str(complaint_error)}")
        
        return jsonify({
            'success': True,
            'message': f'Escalation check completed. {len(escalated_complaints)} complaints were escalated.',
            'escalated_complaints': formatted_complaints
        }), 200
    except Exception as e:
        error_message = f"Error during escalation check: {str(e)}"
        print(error_message)
        import traceback
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': error_message
        }), 500

@complaint_updates_bp.route('/updates', methods=['GET'])
@token_required
def get_complaint_updates(current_user):
    """
    Get recent updates for user's complaints
    """
    db = current_app.config['db']
    
    # Get user's complaints that have been updated in the last 24 hours
    one_day_ago = datetime.utcnow() - timedelta(hours=24)
    
    # Find complaints that have been updated recently
    updated_complaints = list(db.complaints.find({
        'user_id': ObjectId(current_user['id']),
        'updatedAt': {'$gte': one_day_ago},
        # Exclude complaints that the user has already viewed the updates for
        'lastViewedAt': {'$lt': '$updatedAt'}
    }))
    
    # Format updates for response
    updates = []
    for complaint in updated_complaints:
        # Get the status change from the most recent system comment if available
        status_message = ""
        if 'comments' in complaint and complaint['comments']:
            # Sort comments by createdAt in descending order
            sorted_comments = sorted(complaint['comments'], key=lambda x: x.get('createdAt', datetime.min), reverse=True)
            
            # Find the most recent system comment about status change
            for comment in sorted_comments:
                if comment.get('isSystem', False) and 'Status changed' in comment.get('content', ''):
                    status_message = comment['content']
                    break
        
        # If no system comment found, create a generic message based on status
        if not status_message:
            status = complaint.get('status', 'unknown')
            if status == 'pending':
                status_message = "Your complaint has been registered and is pending review."
            elif status == 'in-progress':
                status_message = "Your complaint is now being processed."
            elif status == 'resolved':
                status_message = "Your complaint has been resolved."
            elif status == 'escalated':
                status_message = "Your complaint has been escalated for further review."
            else:
                status_message = f"Your complaint status is now: {status}"
        
        # Create update object
        update = {
            'complaintId': str(complaint['_id']),
            'ticketNumber': str(complaint['_id'])[-6:].upper(),  # Use last 6 chars of ID as ticket number
            'subject': complaint.get('subject', 'No subject'),
            'status': complaint.get('status', 'unknown'),
            'message': status_message,
            'updatedAt': complaint.get('updatedAt', datetime.utcnow()).isoformat()
        }
        
        updates.append(update)
        
        # Update lastViewedAt to mark this update as viewed
        db.complaints.update_one(
            {'_id': complaint['_id']},
            {'$set': {'lastViewedAt': datetime.utcnow()}}
        )
    
    return jsonify(updates)

@complaint_updates_bp.route('/status/<complaint_id>', methods=['GET'])
@token_required
def get_complaint_status(current_user, complaint_id):
    """
    Get real-time status of a specific complaint
    """
    db = current_app.config['db']
    
    try:
        # Convert complaint_id to ObjectId
        complaint_obj_id = ObjectId(complaint_id)
    except:
        return jsonify({'error': 'Invalid complaint ID'}), 400
    
    # Get complaint from database
    complaint = db.complaints.find_one({'_id': complaint_obj_id})
    
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    # Check if user is authorized to view this complaint
    if str(complaint['user_id']) != current_user['id'] and not current_user.get('is_admin', False):
        return jsonify({'error': 'Unauthorized to view this complaint'}), 403
    
    # Format status response
    status_info = {
        'complaintId': str(complaint['_id']),
        'ticketNumber': str(complaint['_id'])[-6:].upper(),
        'subject': complaint.get('subject', 'No subject'),
        'status': complaint.get('status', 'unknown'),
        'priority': complaint.get('priority', 'medium'),
        'category': complaint.get('category', 'other'),
        'createdAt': complaint.get('createdAt', datetime.min).isoformat(),
        'updatedAt': complaint.get('updatedAt', datetime.min).isoformat(),
    }
    
    # Add timestamps for status changes if available
    for field in ['assignedAt', 'inProgressAt', 'resolvedAt', 'escalatedAt']:
        if field in complaint and complaint[field]:
            status_info[field] = complaint[field].isoformat()
    
    # Add assigned agent info if available
    if 'assigned_to' in complaint and complaint['assigned_to']:
        agent = db.users.find_one({'_id': complaint['assigned_to']})
        if agent:
            status_info['assignedTo'] = {
                'name': agent.get('name', 'Unknown'),
                'email': agent.get('email', 'Unknown')
            }
    
    # Add estimated resolution time if available or calculate based on priority
    if 'estimatedResolutionTime' in complaint:
        status_info['estimatedResolutionTime'] = complaint['estimatedResolutionTime']
    else:
        # Calculate estimated resolution time based on priority
        priority = complaint.get('priority', 'medium')
        created_at = complaint.get('createdAt', datetime.utcnow())
        
        if priority == 'urgent':
            est_resolution = created_at + timedelta(hours=4)
        elif priority == 'high':
            est_resolution = created_at + timedelta(hours=24)
        elif priority == 'medium':
            est_resolution = created_at + timedelta(hours=72)
        else:  # low
            est_resolution = created_at + timedelta(hours=120)
        
        status_info['estimatedResolutionTime'] = est_resolution.isoformat()
    
    # Update lastViewedAt to mark this complaint as viewed
    db.complaints.update_one(
        {'_id': complaint_obj_id},
        {'$set': {'lastViewedAt': datetime.utcnow()}}
    )
    
    return jsonify(status_info)

@complaint_updates_bp.route('/resolve/<complaint_id>', methods=['POST'])
@token_required
def mark_complaint_resolved(current_user, complaint_id):
    """
    Mark a complaint as resolved by the user
    """
    db = current_app.config['db']
    
    try:
        # Convert complaint_id to ObjectId
        complaint_obj_id = ObjectId(complaint_id)
    except:
        return jsonify({'error': 'Invalid complaint ID'}), 400
    
    # Get complaint from database
    complaint = db.complaints.find_one({'_id': complaint_obj_id})
    
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    # Check if user is authorized to resolve this complaint
    if str(complaint['user_id']) != current_user['id']:
        return jsonify({'error': 'Unauthorized to resolve this complaint'}), 403
    
    # Update complaint status to resolved
    db.complaints.update_one(
        {'_id': complaint_obj_id},
        {
            '$set': {
                'status': 'resolved',
                'resolvedAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow(),
                'lastViewedAt': datetime.utcnow()
            }
        }
    )
    
    # Get user details
    user = db.users.find_one({'_id': ObjectId(current_user['id'])})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Send thank you notifications
    notification_result = send_thank_you_notifications(
        user_email=user['email'],
        user_phone=user.get('phone')  # Send WhatsApp if phone is available
    )
    
    # Award points for resolving a ticket
    reward_result = award_points(current_user['id'], 'resolved_ticket', complaint_id)
    
    response = {
        'message': 'Complaint marked as resolved',
        'complaintId': complaint_id,
        'notifications': notification_result,
        'showThankYouPopup': True
    }
    
    # Add reward information to the response
    if reward_result.get('awarded', False):
        response['reward'] = {
            'points_earned': reward_result.get('points', 0),
            'total_points': reward_result.get('total_points', 0),
            'message': reward_result.get('message', '')
        }
    
    return jsonify(response)

