import os
from flask import Flask, jsonify, current_app
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from flask_mail import Mail
from twilio.rest import Client
from datetime import datetime

# Import scheduler
from scheduled_tasks import init_scheduler

# Import routes
from api.auth import auth_bp
from api.complaints import complaints_bp
from api.admin import admin_bp
from api.chatbot import chatbot_bp
from api.users import users_bp
from api.categories import categories_bp
from api.complaints_updates import complaint_updates_bp
from api.rewards import rewards_bp
from api.feedback import feedback_bp

# Initialize mail and WhatsApp services
mail = Mail()
twilio_client = None


# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS with explicit settings
CORS(app, 
     origins=["http://localhost:3000"], 
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])

# MongoDB Atlas connection
print('Connecting to MongoDB Atlas cloud database...')
MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    print('MONGO_URI environment variable not set. Please configure your MongoDB Atlas connection string.')
    print('Creating mock database for development...')
    from unittest.mock import MagicMock
    mock_db = MagicMock()
    app.config['db'] = mock_db
    print('Mock database created. Application will run with limited functionality.')
    
    # Initialize collections in the mock database
    mock_db.users = MagicMock()
    mock_db.complaints = MagicMock()
    mock_db.categories = MagicMock()
    mock_db.agents = MagicMock()
else:
    try:
        # Configure MongoDB client with TLS for cloud connection
        client = MongoClient(
            MONGO_URI,
            tls=True,
            tlsAllowInvalidCertificates=True,  # Disable certificate verification (for development only)
            serverSelectionTimeoutMS=5000  # Reduce timeout for faster feedback
        )
        # Test the connection
        client.admin.command('ping')
        print('Successfully connected to MongoDB Atlas!')
        db = client.get_database()
        # Make db available to routes
        app.config['db'] = db
    except Exception as e:
        print('Failed to connect to MongoDB Atlas:')
        print(f'Error: {str(e)}')
        # Create a mock database for development if MongoDB connection fails
        print('Creating mock database for development...')
        from unittest.mock import MagicMock
        mock_db = MagicMock()
        app.config['db'] = mock_db
        print('Mock database created. Application will run with limited functionality.')
        
        # Initialize collections in the mock database
        mock_db.users = MagicMock()
        mock_db.complaints = MagicMock()
        mock_db.categories = MagicMock()
        mock_db.agents = MagicMock()

# Secret key for JWT
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Configure email settings
app.config['MAIL_SERVER'] = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('SMTP_PORT', 587))
app.config['MAIL_USE_TLS'] = True  # Always use TLS for security
app.config['MAIL_USERNAME'] = os.getenv('SMTP_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('SMTP_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('FROM_EMAIL')
mail.init_app(app)

# Configure Twilio for WhatsApp
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.getenv('TWILIO_WHATSAPP_NUMBER')

if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        app.config['twilio_client'] = twilio_client
        print('Successfully initialized Twilio client')
    except Exception as e:
        print(f'Failed to initialize Twilio client: {str(e)}')

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
from api.worker import worker_bp

app.register_blueprint(complaints_bp, url_prefix='/api/complaints')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(categories_bp, url_prefix='/api/categories')
app.register_blueprint(complaint_updates_bp, url_prefix='/api/complaint_updates')
app.register_blueprint(rewards_bp, url_prefix='/api/rewards')
app.register_blueprint(feedback_bp, url_prefix='/api/feedback')
app.register_blueprint(worker_bp, url_prefix='/api/worker')

# Root route
@app.route('/')
def index():
    return jsonify({
        'message': 'Welcome to the Complaint Management System API',
        'status': 'online'
    })

# Health check endpoint
@app.route('/api/health')
def health_check():
    # Check database connection
    db_status = 'connected'
    try:
        # Try to ping the database
        current_app.config['db'].command('ping')
    except Exception as e:
        db_status = f'error: {str(e)}'
    
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat(),
        'database': db_status,
        'version': '1.0.0'
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

# Initialize the scheduler
init_scheduler(app)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')