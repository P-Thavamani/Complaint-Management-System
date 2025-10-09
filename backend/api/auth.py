from flask import Blueprint, request, jsonify, current_app
from passlib.hash import pbkdf2_sha256
import jwt
from datetime import datetime, timedelta
from bson.objectid import ObjectId
import re

auth_bp = Blueprint('auth', __name__)

# Helper function to validate email format
def is_valid_email(email):
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_regex, email) is not None

# Helper function to generate JWT token
def generate_token(user_id, is_admin=False, is_worker=False):
    print(f"Generating token for user {user_id} with is_admin={is_admin}, is_worker={is_worker}")
    payload = {
        'exp': datetime.utcnow() + timedelta(days=1),
        'iat': datetime.utcnow(),
        'sub': str(user_id),
        'admin': is_admin,
        'worker': is_worker
    }
    return jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        print(f"Received registration data: {data}")
        
        # Validate required fields
        if not all(k in data for k in ('name', 'email', 'password')):
            print("Missing required fields")
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate email format
        if not is_valid_email(data['email']):
            print(f"Invalid email format: {data['email']}")
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password length
        if len(data['password']) < 6:
            print("Password too short")
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if email already exists
        db = current_app.config['db']
        existing_user = db.users.find_one({'email': data['email']})
        if existing_user:
            print(f"Email already exists: {data['email']}")
            return jsonify({'error': 'Email already registered'}), 409
        
        # Hash password
        hashed_password = pbkdf2_sha256.hash(data['password'])
        
        # Create user document
        user = {
            'name': data['name'],
            'email': data['email'],
            'password': hashed_password,
            'is_admin': False,
            'is_worker': data.get('is_worker', False),
            'phone': data.get('phone', ''),
            'department': data.get('department', ''),
            'createdAt': datetime.utcnow(),
            'lastLogin': None
        }
        
        # Insert user into database
        print("Attempting to insert user into database")
        result = db.users.insert_one(user)
        user_id = result.inserted_id
        print(f"User created with ID: {user_id}")
        
        # Generate token
        token = generate_token(user_id)
        
        # Update last login
        db.users.update_one(
            {'_id': user_id},
            {'$set': {'lastLogin': datetime.utcnow()}}
        )
        
        print("Registration successful")
        return jsonify({
            'token': token,
            'user': {
                'id': str(user_id),
                'name': user['name'],
                'email': user['email'],
                'is_admin': user['is_admin'],
                'phone': user['phone'],
                'department': user['department'],
                'createdAt': user['createdAt']
            }
        }), 201
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed', 'message': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('email', 'password')):
        return jsonify({'message': 'Missing email or password'}), 400
    
    # Find user by email
    db = current_app.config['db']
    user = db.users.find_one({'email': data['email']})
    
    # Check if user exists and password is correct
    if not user or not pbkdf2_sha256.verify(data['password'], user['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Check if this is a worker login
    is_worker = user.get('role') == 'worker' or user.get('is_worker', False)
    is_admin = user.get('is_admin', False)
    
    # Generate token with appropriate roles
    token = generate_token(user['_id'], is_admin, is_worker)
    
    # Update last login
    db.users.update_one(
        {'_id': user['_id']},
        {'$set': {'lastLogin': datetime.utcnow()}}
    )
    
    # Return user info and token
    return jsonify({
        'token': token,
        'user': {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'is_admin': is_admin,
            'is_worker': is_worker,
            'role': user.get('role', 'user'),
            'phone': user.get('phone', ''),
            'department': user.get('department', ''),
            'createdAt': user.get('createdAt')
        }
    })

@auth_bp.route('/worker-login', methods=['POST'])
def worker_login():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('email', 'password')):
        return jsonify({'message': 'Missing email or password'}), 400
    
    # Find worker by email
    db = current_app.config['db']
    worker = db.users.find_one({
        'email': data['email'],
        '$or': [
            {'role': 'worker'},
            {'is_worker': True}
        ]
    })
    
    # Check if worker exists and password is correct
    if not worker or not pbkdf2_sha256.verify(data['password'], worker['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Generate token with worker role
    token = generate_token(worker['_id'], worker.get('is_admin', False), True)
    
    # Update last login
    db.users.update_one(
        {'_id': worker['_id']},
        {'$set': {'lastLogin': datetime.utcnow()}}
    )
    
    # Return worker info and token
    return jsonify({
        'token': token,
        'user': {
            'id': str(worker['_id']),
            'name': worker['name'],
            'email': worker['email'],
            'is_admin': worker.get('is_admin', False),
            'is_worker': True,
            'role': worker.get('role', 'worker'),
            'department': worker.get('department', ''),
            'createdAt': worker.get('createdAt')
        }
    })

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Token is required'}), 400
    
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
        
        # Check roles from token and user record
        is_worker = payload.get('worker', False) or user.get('role') == 'worker' or user.get('is_worker', False)
        is_admin = payload.get('admin', False) or user.get('is_admin', False)
        
        # Return user info
        return jsonify({
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'is_admin': is_admin,
                'is_worker': is_worker,
                'role': user.get('role', 'user'),
                'phone': user.get('phone', ''),
                'department': user.get('department', ''),
                'createdAt': user.get('createdAt')
            }
        })
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401