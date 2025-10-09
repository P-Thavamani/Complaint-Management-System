from flask import request, jsonify, current_app
import jwt
from bson.objectid import ObjectId
from functools import wraps

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode token
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Get user from database
            db = current_app.config['db']
            user = db.users.find_one({'_id': ObjectId(payload['sub'])})
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Create current_user object
            current_user = {
                'id': str(user['_id']),
                'name': user.get('name', 'Unknown'),
                'email': user['email'],
                'is_admin': user.get('is_admin', False),
                'is_worker': user.get('is_worker', False)
            }
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode token
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Get user from database
            db = current_app.config['db']
            user = db.users.find_one({'_id': ObjectId(payload['sub'])})
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Check if user is admin
            if not user.get('is_admin', False):
                return jsonify({'error': 'Admin privileges required'}), 403
            
            # Create current_user object
            current_user = {
                'id': str(user['_id']),
                'name': user.get('name', 'Unknown'),
                'email': user['email'],
                'is_admin': True
            }
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def worker_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode token
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Get user from database
            db = current_app.config['db']
            user = db.users.find_one({'_id': ObjectId(payload['sub'])})
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Check if user is a worker
            is_worker = user.get('role') == 'worker' or user.get('is_worker', False) or payload.get('worker', False)
            if not is_worker and not user.get('is_admin', False):
                return jsonify({'error': 'Worker privileges required'}), 403
            
            # Create current_user object
            current_user = {
                'id': str(user['_id']),
                'email': user['email'],
                'name': user.get('name', ''),
                'is_admin': user.get('is_admin', False),
                'is_worker': is_worker
            }
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode token
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Get user from database
            db = current_app.config['db']
            user = db.users.find_one({'_id': ObjectId(payload['sub'])})
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Check if user is worker
            if not user.get('is_worker', False):
                return jsonify({'error': 'Worker privileges required'}), 403
            
            # Create current_user object
            current_user = {
                'id': str(user['_id']),
                'email': user['email'],
                'is_worker': True
            }
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated