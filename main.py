#!/usr/bin/env python3
"""
Railway deployment entry point for Complaint Management System
"""

import os
import sys
import subprocess

# Add backend directory to Python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_dir)

try:
    # Run the backend using run.py (same as local development)
    print("Starting Complaint Management System using run.py")
    print(f"Backend directory: {backend_dir}")
    
    # Execute run.py from backend directory
    run_py_path = os.path.join(backend_dir, 'run.py')
    
    if os.path.exists(run_py_path):
        # Change to backend directory and run
        os.chdir(backend_dir)
        exec(open('run.py').read())
    else:
        print(f"Error: run.py not found at {run_py_path}")
        sys.exit(1)
        
except Exception as e:
    print(f"Error starting application: {e}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Python path: {sys.path}")
    if os.path.exists(backend_dir):
        print(f"Files in backend directory: {os.listdir(backend_dir)}")
    sys.exit(1)