#!/usr/bin/env python3
"""
Railway deployment entry point - uses run.py like local development
"""

import os
import sys

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Starting Complaint Management System using run.py")
    print(f"Current working directory: {os.getcwd()}")
    
    # Execute run.py (same as local development)
    if os.path.exists('run.py'):
        exec(open('run.py').read())
    else:
        print("Error: run.py not found")
        print(f"Files in current directory: {os.listdir('.')}")
        sys.exit(1)
        
except Exception as e:
    print(f"Error starting application: {e}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Python path: {sys.path}")
    sys.exit(1)