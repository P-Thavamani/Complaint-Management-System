import os
from pymongo import MongoClient
from passlib.hash import pbkdf2_sha256
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/complaint_system')
client = MongoClient(MONGO_URI)
db = client.get_database()

def init_db():
    # Check if admin user already exists
    admin_exists = db.users.find_one({'email': 'admin@example.com'})
    
    if not admin_exists:
        # Create admin user
        admin_user = {
            'name': 'Admin User',
            'email': 'admin@example.com',
            'password': pbkdf2_sha256.hash('admin123'),  # Change this in production
            'is_admin': True,
            'phone': '123-456-7890',
            'department': 'Administration',
            'createdAt': datetime.utcnow(),
            'lastLogin': None
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
            'lastLogin': None
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
    
    print("Database initialization completed.")

if __name__ == '__main__':
    init_db()