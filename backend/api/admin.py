from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from utils.auth_middleware import admin_required

admin_bp = Blueprint('admin', __name__)

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

@admin_bp.route('/complaints', methods=['GET'])
@admin_required
def get_all_complaints(current_user):
    db = current_app.config['db']
    
    # Get all complaints
    all_complaints = list(db.complaints.find().sort('createdAt', -1))
    
    # Format complaints for response
    formatted_complaints = [format_complaint(complaint) for complaint in all_complaints]
    
    return jsonify(formatted_complaints)

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_admin_stats(current_user):
    db = current_app.config['db']
    
    # Get counts for different status types
    total = db.complaints.count_documents({})
    pending = db.complaints.count_documents({'status': 'pending'})
    in_progress = db.complaints.count_documents({'status': 'in-progress'})
    resolved = db.complaints.count_documents({'status': 'resolved'})
    escalated = db.complaints.count_documents({'status': 'escalated'})
    
    # Get counts by category
    pipeline = [
        {'$group': {'_id': '$category', 'count': {'$sum': 1}}}
    ]
    category_results = list(db.complaints.aggregate(pipeline))
    category_counts = {item['_id']: item['count'] for item in category_results}
    
    # Get timeline data (complaints per day for the last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    pipeline = [
        {'$match': {'createdAt': {'$gte': thirty_days_ago}}},
        {'$group': {
            '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$createdAt'}},
            'count': {'$sum': 1}
        }},
        {'$sort': {'_id': 1}}
    ]
    
    timeline_results = list(db.complaints.aggregate(pipeline))
    
    # Format timeline data
    timeline = [{'date': item['_id'], 'count': item['count']} for item in timeline_results]
    
    # Get user count
    user_count = db.users.count_documents({'is_admin': False})
    
    # Get average resolution time (in hours)
    pipeline = [
        {'$match': {'status': 'resolved', 'resolvedAt': {'$exists': True}}},
        {'$project': {
            'resolution_time': {
                '$divide': [
                    {'$subtract': ['$resolvedAt', '$createdAt']},
                    3600000  # Convert milliseconds to hours
                ]
            }
        }},
        {'$group': {
            '_id': None,
            'avg_resolution_time': {'$avg': '$resolution_time'}
        }}
    ]
    
    resolution_time_result = list(db.complaints.aggregate(pipeline))
    avg_resolution_time = resolution_time_result[0]['avg_resolution_time'] if resolution_time_result else 0
    
    return jsonify({
        'statusCounts': {
            'total': total,
            'pending': pending,
            'inProgress': in_progress,
            'resolved': resolved,
            'escalated': escalated
        },
        'categoryCounts': category_counts,
        'timeline': timeline,
        'userCount': user_count,
        'avgResolutionTime': round(avg_resolution_time, 2)
    })

@admin_bp.route('/complaints/<complaint_id>/manage', methods=['PUT'])
@admin_required
def manage_complaint(current_user, complaint_id):
    data = request.get_json()
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
    
    # Fields that can be updated
    allowed_fields = ['status', 'priority', 'assigned_to', 'resolution']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    # Add timestamps based on status changes
    current_status = complaint.get('status')
    new_status = data.get('status')
    
    if new_status and new_status != current_status:
        if new_status == 'in-progress':
            update_data['inProgressAt'] = datetime.utcnow()
        elif new_status == 'resolved':
            update_data['resolvedAt'] = datetime.utcnow()
        elif new_status == 'escalated':
            update_data['escalatedAt'] = datetime.utcnow()
    
    # If assigning to someone, add assignedAt timestamp
    if 'assigned_to' in update_data and update_data['assigned_to']:
        try:
            update_data['assigned_to'] = ObjectId(update_data['assigned_to'])
            update_data['assignedAt'] = datetime.utcnow()
        except:
            return jsonify({'error': 'Invalid assigned_to ID'}), 400
    
    # Add updated timestamp
    update_data['updatedAt'] = datetime.utcnow()
    
    # Update complaint in database
    db.complaints.update_one(
        {'_id': complaint_obj_id},
        {'$set': update_data}
    )
    
    # Add system comment about the update
    comment_text = f"Complaint updated by admin: "
    changes = []
    
    if new_status and new_status != current_status:
        changes.append(f"Status changed from {current_status} to {new_status}")
    
    if 'priority' in update_data and update_data['priority'] != complaint.get('priority'):
        changes.append(f"Priority changed from {complaint.get('priority')} to {update_data['priority']}")
    
    if 'assigned_to' in update_data and str(update_data['assigned_to']) != str(complaint.get('assigned_to', '')):
        # Get assigned user name
        assigned_user = db.users.find_one({'_id': update_data['assigned_to']})
        if assigned_user:
            changes.append(f"Assigned to {assigned_user['name']}")
    
    if 'resolution' in update_data:
        changes.append("Resolution added")
    
    if changes:
        comment_text += ", ".join(changes)
        
        system_comment = {
            '_id': ObjectId(),
            'content': comment_text,
            'user_id': ObjectId(current_user['id']),
            'user': {
                'name': 'System',
                'email': 'system@example.com'
            },
            'createdAt': datetime.utcnow(),
            'isSystem': True
        }
        
        db.complaints.update_one(
            {'_id': complaint_obj_id},
            {'$push': {'comments': system_comment}}
        )
    
    # Get the updated complaint
    updated_complaint = db.complaints.find_one({'_id': complaint_obj_id})
    
    # If complaint has assigned_to, get the agent details
    if 'assigned_to' in updated_complaint and updated_complaint['assigned_to']:
        agent = db.users.find_one({'_id': updated_complaint['assigned_to']})
        if agent:
            updated_complaint['assignedTo'] = {
                'name': agent['name'],
                'email': agent['email']
            }
    
    # Format complaint for response
    formatted_complaint = format_complaint(updated_complaint)
    
    return jsonify(formatted_complaint)

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users(current_user):
    db = current_app.config['db']
    
    # Get all non-admin users
    users = list(db.users.find({'is_admin': False}, {
        'password': 0  # Exclude password field
    }))
    
    # Format users for response
    formatted_users = []
    for user in users:
        user['_id'] = str(user['_id'])
        
        # Format dates
        for date_field in ['createdAt', 'updatedAt', 'lastLogin']:
            if date_field in user and user[date_field]:
                user[date_field] = user[date_field].isoformat()
        
        formatted_users.append(user)
    
    return jsonify(formatted_users)