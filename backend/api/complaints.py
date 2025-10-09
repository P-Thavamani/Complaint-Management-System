from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from datetime import datetime
from utils.auth_middleware import token_required, admin_required
from utils.rewards import award_points
from utils.notifications import send_ticket_creation_notification
import json

complaints_bp = Blueprint('complaints', __name__)

# Helper function to format complaint for response
def format_complaint(complaint):
    if not complaint:
        return None
    
    # Convert ObjectId to string for JSON serialization
    complaint['_id'] = str(complaint['_id'])
    
    # Convert user_id to string if it exists
    if 'user_id' in complaint:
        complaint['user_id'] = str(complaint['user_id'])
    
    # Convert assigned_to to string if it exists
    if 'assigned_to' in complaint and complaint['assigned_to']:
        complaint['assigned_to'] = str(complaint['assigned_to'])
    
    # Format dates for JSON serialization
    for date_field in ['createdAt', 'updatedAt', 'assignedAt', 'inProgressAt', 'resolvedAt', 'escalatedAt']:
        if date_field in complaint and complaint[date_field]:
            complaint[date_field] = complaint[date_field].isoformat()
    
    # Format comments if they exist
    if 'comments' in complaint and complaint['comments']:
        for comment in complaint['comments']:
            if '_id' in comment:
                comment['_id'] = str(comment['_id'])
            if 'user_id' in comment:
                comment['user_id'] = str(comment['user_id'])
            if 'createdAt' in comment:
                comment['createdAt'] = comment['createdAt'].isoformat()
    
    return complaint

@complaints_bp.route('/', methods=['GET'])
@token_required
def get_user_complaints(current_user):
    db = current_app.config['db']
    
    # Get all complaints for the current user
    user_complaints = list(db.complaints.find({'user_id': ObjectId(current_user['id'])}))
    
    # Format complaints for response
    formatted_complaints = [format_complaint(complaint) for complaint in user_complaints]
    
    return jsonify(formatted_complaints)

@complaints_bp.route('/user', methods=['GET'])
@token_required
def get_user_complaints_endpoint(current_user):
    db = current_app.config['db']
    
    # Get all complaints for the current user
    user_complaints = list(db.complaints.find({'user_id': ObjectId(current_user['id'])}))
    
    # Format complaints for response
    formatted_complaints = [format_complaint(complaint) for complaint in user_complaints]
    
    return jsonify(formatted_complaints)

@complaints_bp.route('/stats', methods=['GET'])
@token_required
def get_user_complaint_stats(current_user):
    db = current_app.config['db']
    
    # Get counts for different status types
    total = db.complaints.count_documents({'user_id': ObjectId(current_user['id'])})
    pending = db.complaints.count_documents({'user_id': ObjectId(current_user['id']), 'status': 'pending'})
    in_progress = db.complaints.count_documents({'user_id': ObjectId(current_user['id']), 'status': 'in-progress'})
    resolved = db.complaints.count_documents({'user_id': ObjectId(current_user['id']), 'status': 'resolved'})
    escalated = db.complaints.count_documents({'user_id': ObjectId(current_user['id']), 'status': 'escalated'})
    
    return jsonify({
        'total': total,
        'pending': pending,
        'inProgress': in_progress,
        'resolved': resolved,
        'escalated': escalated
    })

@complaints_bp.route('/', methods=['POST'])
@token_required
def create_complaint(current_user):
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('subject', 'description', 'category')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    db = current_app.config['db']
    
    # Get user details

@complaints_bp.route('/<complaint_id>/claim', methods=['POST'])
@token_required
def claim_complaint(current_user, complaint_id):
    """
    Allow workers to claim unassigned complaints
    """
    db = current_app.config['db']
    
    # Check if user is a worker
    if not current_user.get('is_worker', False) and not current_user.get('is_admin', False):
        return jsonify({'error': 'Worker privileges required'}), 403
    
    try:
        # Convert complaint_id to ObjectId
        complaint_obj_id = ObjectId(complaint_id)
    except:
        return jsonify({'error': 'Invalid complaint ID'}), 400
    
    # Get complaint from database
    complaint = db.complaints.find_one({'_id': complaint_obj_id})
    
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    # Check if complaint is already assigned
    if complaint.get('assigned_to'):
        return jsonify({'error': 'Complaint is already assigned'}), 400
    
    # Assign complaint to worker
    now = datetime.utcnow()
    result = db.complaints.update_one(
        {'_id': complaint_obj_id, 'assigned_to': None},  # Ensure it's still unassigned
        {
            '$set': {
                'assigned_to': ObjectId(current_user['id']),
                'assignedAt': now,
                'status': 'in-progress',
                'inProgressAt': now,
                'updatedAt': now
            }
        }
    )
    
    if result.modified_count == 0:
        return jsonify({'error': 'Failed to claim complaint, it may have been claimed by another worker'}), 409
    
    # Get updated complaint
    updated_complaint = db.complaints.find_one({'_id': complaint_obj_id})
    formatted_complaint = format_complaint(updated_complaint)
    
    return jsonify({
        'message': 'Complaint claimed successfully',
        'complaint': formatted_complaint
    }), 200
    user = db.users.find_one({'_id': ObjectId(current_user['id'])})
     
@complaints_bp.route('/<complaint_id>/escalate', methods=['POST'])
@token_required
def escalate_complaint(current_user, complaint_id):
    """
    Allow workers to escalate complaints to admin
    """
    db = current_app.config['db']
    data = request.get_json()
    
    # Check if user is a worker
    if not current_user.get('is_worker', False) and not current_user.get('is_admin', False):
        return jsonify({'error': 'Worker privileges required'}), 403
    
    try:
        # Convert complaint_id to ObjectId
        complaint_obj_id = ObjectId(complaint_id)
    except:
        return jsonify({'error': 'Invalid complaint ID'}), 400
    
    # Get complaint from database
    complaint = db.complaints.find_one({'_id': complaint_obj_id})
    
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    # Check if complaint is assigned to this worker
    if not complaint.get('assigned_to') or str(complaint['assigned_to']) != current_user['id']:
        return jsonify({'error': 'You can only escalate complaints assigned to you'}), 403
    
    # Get escalation reason
    reason = data.get('reason', 'Escalated by worker')
    
    # Update complaint status to escalated
    now = datetime.utcnow()
    result = db.complaints.update_one(
        {'_id': complaint_obj_id},
        {
            '$set': {
                'status': 'escalated',
                'escalatedAt': now,
                'escalationReason': reason,
                'updatedAt': now
            }
        }
    )
    
    if result.modified_count == 0:
        return jsonify({'error': 'Failed to escalate complaint'}), 500
    
    # Add system comment about escalation
    comment = {
        '_id': ObjectId(),
        'content': f"Complaint escalated to admin. Reason: {reason}",
        'user_id': ObjectId(current_user['id']),
        'user': {
            'name': current_user.get('name', 'Worker'),
            'email': current_user.get('email', '')
        },
        'createdAt': now,
        'isSystem': True
    }
    
    db.complaints.update_one(
        {'_id': complaint_obj_id},
        {'$push': {'comments': comment}}
    )
    
    # Get updated complaint
    updated_complaint = db.complaints.find_one({'_id': complaint_obj_id})
    formatted_complaint = format_complaint(updated_complaint)
    
    return jsonify({
        'message': 'Complaint escalated successfully',
        'complaint': formatted_complaint
    }), 200
    
    # Map "urgent" priority to "high"
    priority = data.get('priority', 'medium')
    if priority == 'urgent':
        priority = 'high'

    # Create complaint document
    complaint = {
        'subject': data['subject'],
        'description': data['description'],
        'category': data['category'],
        'subcategory': data.get('subcategory', ''),
        'subcategoryName': data.get('subcategoryName', ''),
        'problem': data.get('problem', ''),
        'status': 'pending',
        'priority': priority,  # Use the mapped priority
        'user_id': ObjectId(current_user['id']),
        'user': {
            'name': user['name'],
            'email': user['email']
        },
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow(),
        'lastViewedAt': datetime.utcnow(),  # Add lastViewedAt field for tracking updates
        'comments': [],
        'imageUrl': data.get('imageUrl'),
        'detectedObjects': data.get('detectedObjects', [])
    }
    
    # Insert complaint into database
    result = db.complaints.insert_one(complaint)
    complaint_id = result.inserted_id
    
    # Get the created complaint
    created_complaint = db.complaints.find_one({'_id': complaint_id})
    
    # Format complaint for response
    formatted_complaint = format_complaint(created_complaint)
    
    # Send notification to user about ticket creation
    notification_result = send_ticket_creation_notification(
        user_email=user['email'],
        user_name=user['name'],
        ticket_id=str(complaint_id),
        subject=data.get('subject'),
        category=data.get('category'),
        priority=priority
    )
    
    # Award points for creating a ticket
    reward_result = award_points(current_user['id'], 'create_ticket', str(complaint_id))
    
    response = {
        'complaint': formatted_complaint,
        'notifications': notification_result
    }
    
    # Add reward information to the response
    if reward_result.get('awarded', False):
        response['reward'] = {
            'points_earned': reward_result.get('points', 0),
            'total_points': reward_result.get('total_points', 0),
            'message': reward_result.get('message', '')
        }
    
    return jsonify(response), 201

@complaints_bp.route('/<complaint_id>', methods=['GET'])
@token_required
def get_complaint_detail(current_user, complaint_id):
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
    if str(complaint['user_id']) != current_user['id'] and not current_user['is_admin']:
        return jsonify({'error': 'Unauthorized to view this complaint'}), 403
    
    # If complaint has assigned_to, get the agent details
    if 'assigned_to' in complaint and complaint['assigned_to']:
        agent = db.users.find_one({'_id': complaint['assigned_to']})
        if agent:
            complaint['assignedTo'] = {
                'name': agent['name'],
                'email': agent['email']
            }
    
    # Update lastViewedAt timestamp when user views complaint
    db.complaints.update_one(
        {'_id': complaint_obj_id},
        {'$set': {'lastViewedAt': datetime.utcnow()}}
    )
    
    # Format complaint for response
    formatted_complaint = format_complaint(complaint)
    
    return jsonify(formatted_complaint)

@complaints_bp.route('/<complaint_id>', methods=['GET', 'DELETE'])
@admin_required
def delete_complaint(current_user, complaint_id):
    """
    Delete a complaint by its ID (admin only)
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
    
    # Delete the complaint from the database
    result = db.complaints.delete_one({'_id': complaint_obj_id})
    
    if result.deleted_count > 0:
        return jsonify({'message': 'Complaint deleted successfully'}), 200
    else:
        return jsonify({'error': 'Complaint deletion failed'}), 500

@complaints_bp.route('/escalation-check', methods=['POST'])
@token_required
def check_escalation(current_user):
    """Check if complaints need escalation based on various criteria"""
    try:
        data = request.get_json()
        complaint_id = data.get('complaint_id')
        db = current_app.config['db']
        
        # If complaint_id is provided, check specific complaint
        if complaint_id:
            complaint = db.complaints.find_one({'_id': ObjectId(complaint_id)})
            if not complaint:
                return jsonify({'error': 'Complaint not found'}), 404
            
            complaints_to_check = [complaint]
        else:
            # Check all active complaints
            complaints_to_check = list(db.complaints.find({
                'status': {'$in': ['pending', 'in-progress']}
            }))
        
        escalation_results = []
        current_time = datetime.utcnow()
        
        for complaint in complaints_to_check:
            escalation_needed = False
            reasons = []
            
            # Check response time (2 hours for initial response)
            if complaint['status'] == 'pending' and \
               (current_time - complaint['createdAt']).total_seconds() > 7200:
                escalation_needed = True
                reasons.append('No response within 2 hours')
            
            # Check resolution time (24 hours for standard complaints)
            if complaint['status'] == 'in-progress' and \
               not complaint.get('is_complex', False) and \
               (current_time - complaint['createdAt']).total_seconds() > 86400:
                escalation_needed = True
                reasons.append('Not resolved within 24 hours')
            
            # Check priority level
            if complaint.get('priority') == 'high' and complaint['status'] == 'pending':
                escalation_needed = True
                reasons.append('High priority ticket requires immediate attention')
            
            if escalation_needed:
                # Update complaint status and add escalation note
                update_data = {
                    '$set': {
                        'needs_escalation': True,
                        'escalation_reasons': reasons,
                        'escalatedAt': current_time,
                        'status': 'escalated'
                    }
                }
                
                db.complaints.update_one(
                    {'_id': complaint['_id']},
                    update_data
                )
                
                escalation_results.append({
                    'complaint_id': str(complaint['_id']),
                    'escalated': True,
                    'reasons': reasons
                })
            else:
                escalation_results.append({
                    'complaint_id': str(complaint['_id']),
                    'escalated': False,
                    'message': 'No escalation needed'
                })
        
        return jsonify({
            'message': 'Escalation check completed',
            'results': escalation_results
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@complaints_bp.route('/worker', methods=['GET'])
@token_required
def get_worker_complaints(current_user):
    """
    Get complaints assigned to the worker or available for claiming
    """
    db = current_app.config['db']
    
    # Check if user is a worker
    if not current_user.get('is_worker', False) and not current_user.get('is_admin', False):
        return jsonify({'error': 'Worker privileges required'}), 403
    
    worker_id = ObjectId(current_user['id'])
    
    # Get complaints assigned to this worker
    assigned_complaints = list(db.complaints.find({
        'assigned_to': worker_id
    }).sort('createdAt', -1))
    
    # Get unassigned complaints that workers can claim
    unassigned_complaints = list(db.complaints.find({
        'assigned_to': None,
        'status': 'pending'
    }).sort('createdAt', -1))
    
    # Combine and format complaints
    all_complaints = assigned_complaints + unassigned_complaints
    formatted_complaints = [format_complaint(c) for c in all_complaints]
    
    return jsonify(formatted_complaints)

@complaints_bp.route('/worker/stats', methods=['GET'])
@token_required
def get_worker_stats(current_user):
    """
    Get statistics for worker dashboard
    """
    db = current_app.config['db']
    
    # Check if user is a worker
    if not current_user.get('is_worker', False) and not current_user.get('is_admin', False):
        return jsonify({'error': 'Worker privileges required'}), 403
    
    worker_id = ObjectId(current_user['id'])
    
    # Get counts for different statuses
    assigned_count = db.complaints.count_documents({'assigned_to': worker_id})
    pending_count = db.complaints.count_documents({'assigned_to': worker_id, 'status': 'pending'})
    in_progress_count = db.complaints.count_documents({'assigned_to': worker_id, 'status': 'in-progress'})
    resolved_count = db.complaints.count_documents({'assigned_to': worker_id, 'status': 'resolved'})
    
    # Get available complaints count
    available_count = db.complaints.count_documents({'assigned_to': None, 'status': 'pending'})
    
    # Get average resolution time for this worker
    resolved_complaints = list(db.complaints.find({
        'assigned_to': worker_id,
        'status': 'resolved',
        'assignedAt': {'$exists': True},
        'resolvedAt': {'$exists': True}
    }))
    
    total_resolution_time = 0
    for complaint in resolved_complaints:
        assigned_time = complaint.get('assignedAt')
        resolved_time = complaint.get('resolvedAt')
        if assigned_time and resolved_time:
            resolution_time = (resolved_time - assigned_time).total_seconds() / 3600  # in hours
            total_resolution_time += resolution_time
    
    avg_resolution_time = round(total_resolution_time / len(resolved_complaints), 2) if resolved_complaints else 0
    
    return jsonify({
        'assigned': assigned_count,
        'pending': pending_count,
        'inProgress': in_progress_count,
        'resolved': resolved_count,
        'available': available_count,
        'avgResolutionTime': avg_resolution_time
    })

@complaints_bp.route('/<complaint_id>/comments', methods=['POST'])
@token_required
def add_comment(current_user, complaint_id):
    data = request.get_json()
    
    # Validate required fields
    if 'content' not in data or not data['content'].strip():
        return jsonify({'error': 'Comment content is required'}), 400
    
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
    
    # Check if user is authorized to comment on this complaint
    if str(complaint['user_id']) != current_user['id'] and not current_user['is_admin']:
        return jsonify({'error': 'Unauthorized to comment on this complaint'}), 403
    
    # Get user details
    user = db.users.find_one({'_id': ObjectId(current_user['id'])})
    
    # Create comment
    comment = {
        '_id': ObjectId(),
        'content': data['content'],
        'user_id': ObjectId(current_user['id']),
        'user': {
            'name': user['name'],
            'email': user['email']
        },
        'createdAt': datetime.utcnow()
    }
    
    # Add comment to complaint
    db.complaints.update_one(
        {'_id': complaint_obj_id},
        {
            '$push': {'comments': comment},
            '$set': {'updatedAt': datetime.utcnow()}
        }
    )
    
    # Format comment for response
    formatted_comment = {
        '_id': str(comment['_id']),
        'content': comment['content'],
        'user': comment['user'],
        'createdAt': comment['createdAt'].isoformat()
    }
    
    return jsonify(formatted_comment), 201