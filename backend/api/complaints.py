from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from datetime import datetime
from utils.auth_middleware import token_required
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
    user = db.users.find_one({'_id': ObjectId(current_user['id'])})
    
    # Create complaint document
    complaint = {
        'subject': data['subject'],
        'description': data['description'],
        'category': data['category'],
        'subcategory': data.get('subcategory', ''),
        'subcategoryName': data.get('subcategoryName', ''),
        'problem': data.get('problem', ''),
        'status': 'pending',
        'priority': data.get('priority', 'medium'),  # Default to medium priority
        'user_id': ObjectId(current_user['id']),
        'user': {
            'name': user['name'],
            'email': user['email']
        },
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow(),
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
    
    return jsonify(formatted_complaint), 201

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
    
    # Format complaint for response
    formatted_complaint = format_complaint(complaint)
    
    return jsonify(formatted_complaint)

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