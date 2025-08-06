from flask import Blueprint, request, jsonify, current_app
from passlib.hash import pbkdf2_sha256
import jwt
from datetime import datetime
from bson.objectid import ObjectId
from utils.auth_middleware import token_required

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    # Get user from database
    db = current_app.config['db']
    user = db.users.find_one({'_id': ObjectId(current_user['id'])})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get complaint count for user
    complaint_count = db.complaints.count_documents({'user_id': ObjectId(current_user['id'])})
    
    # Return user profile data
    return jsonify({
        'id': str(user['_id']),
        'name': user['name'],
        'email': user['email'],
        'phone': user.get('phone', ''),
        'department': user.get('department', ''),
        'is_admin': user.get('is_admin', False),
        'createdAt': user.get('createdAt'),
        'lastLogin': user.get('lastLogin'),
        'complaintCount': complaint_count
    })

@users_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    db = current_app.config['db']
    
    # Get user from database
    user = db.users.find_one({'_id': ObjectId(current_user['id'])})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if changing password
    if 'currentPassword' in data and 'newPassword' in data:
        # Verify current password
        if not pbkdf2_sha256.verify(data['currentPassword'], user['password']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password
        if len(data['newPassword']) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400
        
        # Hash new password
        data['password'] = pbkdf2_sha256.hash(data['newPassword'])
        
        # Remove password fields from data
        data.pop('currentPassword', None)
        data.pop('newPassword', None)
    
    # Fields that can be updated
    allowed_fields = ['name', 'phone', 'department', 'password']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    # Handle department field explicitly - allow it to be removed
    if 'department' in data and data['department'] == '':
        update_data['department'] = ''
    
    # Add updated timestamp
    update_data['updatedAt'] = datetime.utcnow()
    
    # Update user in database
    db.users.update_one(
        {'_id': ObjectId(current_user['id'])},
        {'$set': update_data}
    )
    
    # Get updated user
    updated_user = db.users.find_one({'_id': ObjectId(current_user['id'])})
    
    # Return updated user data
    return jsonify({
        'id': str(updated_user['_id']),
        'name': updated_user['name'],
        'email': updated_user['email'],
        'phone': updated_user.get('phone', ''),
        'department': updated_user.get('department', ''),
        'is_admin': updated_user.get('is_admin', False),
        'createdAt': updated_user.get('createdAt'),
        'updatedAt': updated_user.get('updatedAt')
    })