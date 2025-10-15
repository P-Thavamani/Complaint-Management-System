#!/usr/bin/env python3
"""
Railway deployment entry point for Complaint Management System
"""

import os
import sys

# Add backend directory to Python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_dir)

# Change working directory to backend
os.chdir(backend_dir)

try:
    # Import and run the Flask app
    from app import app
    
    if __name__ == '__main__':
        port = int(os.environ.get('PORT', 5000))
        print(f"Starting Complaint Management System on port {port}")
        app.run(host='0.0.0.0', port=port, debug=False)
        
except ImportError as e:
    print(f"Error importing app: {e}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Python path: {sys.path}")
    sys.exit(1)