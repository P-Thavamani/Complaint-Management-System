#!/usr/bin/env python3
"""
Environment variable checker for debugging Render deployment
"""

import os
from dotenv import load_dotenv

# Load .env file if it exists (for local development)
load_dotenv()

print("=== Environment Variables Check ===")
print(f"MONGO_URI: {'SET' if os.getenv('MONGO_URI') else 'NOT SET'}")
print(f"SECRET_KEY: {'SET' if os.getenv('SECRET_KEY') else 'NOT SET'}")
print(f"GEMINI_API_KEY: {'SET' if os.getenv('GEMINI_API_KEY') else 'NOT SET'}")
print(f"FLASK_ENV: {os.getenv('FLASK_ENV', 'NOT SET')}")
print(f"PORT: {os.getenv('PORT', 'NOT SET')}")

if os.getenv('MONGO_URI'):
    mongo_uri = os.getenv('MONGO_URI')
    # Hide password for security
    if '@' in mongo_uri:
        parts = mongo_uri.split('@')
        if len(parts) > 1:
            print(f"MONGO_URI format: {parts[0].split('://')[0]}://***@{parts[1]}")
    else:
        print("MONGO_URI format: Invalid format")
else:
    print("MONGO_URI: Environment variable not found!")

print("=== End Check ===")