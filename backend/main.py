#!/usr/bin/env python3
"""
Railway deployment entry point for Complaint Management System Backend
"""

import os
import sys

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    # Import and run the Flask app
    from app import app
    
    if __name__ == '__main__':
        port = int(os.environ.get('PORT', 5000))
        print(f"Starting Complaint Management System on port {port}")
        print(f"Current working directory: {os.getcwd()}")
        app.run(host='0.0.0.0', port=port, debug=False)
        
except ImportError as e:
    print(f"Error importing app: {e}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Python path: {sys.path}")
    print(f"Files in current directory: {os.listdir('.')}")
    sys.exit(1)