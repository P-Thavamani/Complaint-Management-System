import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient

# Import routes
from api.auth import auth_bp
from api.complaints import complaints_bp
from api.admin import admin_bp
from api.chatbot import chatbot_bp
from api.users import users_bp


# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI')
try:
    print('Attempting to connect to MongoDB...')
    client = MongoClient(MONGO_URI)
    # Test the connection
    client.admin.command('ping')
    print('Successfully connected to MongoDB!')
    db = client.get_database()
    # Make db available to routes
    app.config['db'] = db
except Exception as e:
    print('Failed to connect to MongoDB:')
    print(f'Error: {str(e)}')
    raise

# Secret key for JWT
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(complaints_bp, url_prefix='/api/complaints')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
app.register_blueprint(users_bp, url_prefix='/api/users')

# Root route
@app.route('/')
def index():
    return jsonify({
        'message': 'Welcome to the Complaint Management System API',
        'status': 'online'
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found on this server.'
    }), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred.'
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')