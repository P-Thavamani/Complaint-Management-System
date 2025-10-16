#!/bin/sh
# Startup script for Railway deployment

# Set default port if not provided
PORT=${PORT:-5000}

echo "Starting Complaint Management System on port $PORT"

# Start the application with gunicorn
exec gunicorn --bind "0.0.0.0:$PORT" --workers 1 --timeout 120 app:app