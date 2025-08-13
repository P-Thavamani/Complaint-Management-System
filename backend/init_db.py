import os
from pymongo import MongoClient
from passlib.hash import pbkdf2_sha256
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Atlas connection
MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is not set. Please configure your MongoDB Atlas connection string.")

try:
    print('Attempting to connect to MongoDB Atlas...')
    # Configure MongoDB client with appropriate options for Atlas
    client = MongoClient(
        MONGO_URI,
        tls=True,
        tlsAllowInvalidCertificates=True,  # For development only
        serverSelectionTimeoutMS=5000  # Reduce timeout for faster feedback
    )
    # Test the connection
    client.admin.command('ping')
    print('Successfully connected to MongoDB Atlas!')
    db = client.get_database()
except Exception as e:
    print('Failed to connect to MongoDB Atlas:')
    print(f'Error: {str(e)}')
    print('Please check your connection string and ensure your IP is whitelisted in MongoDB Atlas.')
    raise

def init_db():
    # Check if admin user already exists
    admin_exists = db.users.find_one({'email': 'thavamani.thavamani123@gmail.com'})
    
    if not admin_exists:
        # Create admin user
        admin_user = {
            'name': 'Thavamani',
            'email': 'thavamani.thavamani123@gmail.com',
            'password': pbkdf2_sha256.hash('admin123'),  # Change this in production
            'is_admin': True,
            'phone': '6281107467',
            'department': 'Administration',
            'createdAt': datetime.utcnow(),
            'lastLogin': None,
            'reward_points': 0
        }
        
        db.users.insert_one(admin_user)
        print("Admin user created successfully.")
    else:
        print("Admin user already exists.")
    
    # Check if test user exists
    test_user_exists = db.users.find_one({'email': 'user@example.com'})
    
    if not test_user_exists:
        # Create test user
        test_user = {
            'name': 'Test User',
            'email': 'user@example.com',
            'password': pbkdf2_sha256.hash('user123'),  # Change this in production
            'is_admin': False,
            'phone': '987-654-3210',
            'department': 'Testing',
            'createdAt': datetime.utcnow(),
            'lastLogin': None,
            'reward_points': 0
        }
        
        db.users.insert_one(test_user)
        print("Test user created successfully.")
    else:
        print("Test user already exists.")
    
    # Create indexes
    db.users.create_index('email', unique=True)
    db.complaints.create_index('user_id')
    db.complaints.create_index('status')
    db.complaints.create_index('createdAt')
    db.rewards.create_index('user_id')
    db.rewards.create_index('timestamp')
    
    print("Database initialization completed.")

if __name__ == '__main__':
    init_db()