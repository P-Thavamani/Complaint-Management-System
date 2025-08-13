from pymongo import MongoClient
import os
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

# MongoDB Atlas connection
MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    print('MONGO_URI environment variable not set. Please configure your MongoDB Atlas connection string.')
    sys.exit(1)

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
    
    # Get email from command line argument
    if len(sys.argv) != 2:
        print('Usage: python make_admin.py <email>')
        sys.exit(1)
    
    email_to_update = sys.argv[1]
    
    # Find the user
    user = db.users.find_one({'email': email_to_update})
    
    if not user:
        print(f"User with email {email_to_update} not found.")
        sys.exit(1)
    
    # Update user to make them admin
    result = db.users.update_one(
        {'email': email_to_update},
        {'$set': {'is_admin': True}}
    )
    
    if result.modified_count > 0:
        print(f"Successfully updated user {email_to_update} to admin status.")
        # Get the updated user
        updated_user = db.users.find_one({'email': email_to_update})
        print(f"User details:")
        print(f"  Name: {updated_user.get('name')}")
        print(f"  Email: {updated_user.get('email')}")
        print(f"  Admin: {updated_user.get('is_admin')}")
        print(f"\nAdmin credentials:")
        print(f"  Email: {updated_user.get('email')}")
        print(f"  Password: [Use the password you set when registering]")
    else:
        print(f"User {email_to_update} was already an admin or update failed.")
    
except Exception as e:
    print(f'Failed to connect to MongoDB Atlas or update user:')
    print(f'Error: {str(e)}')