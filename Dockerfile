# Use Python 3.9 alpine for smallest image size
FROM python:3.9-alpine

# Install system dependencies for Python packages
RUN apk add --no-cache gcc musl-dev libffi-dev

# Set working directory
WORKDIR /app

# Copy backend requirements first for better caching
COPY backend/requirements.txt ./backend/

# Install Python dependencies with no cache to reduce image size
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy only necessary files
COPY backend/ ./backend/
COPY main.py ./

# Set working directory to backend
WORKDIR /app/backend

# Make start script executable
RUN chmod +x start.sh

# Create non-root user for security
RUN adduser -D -s /bin/sh appuser
USER appuser

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Run the application using startup script
CMD ["./start.sh"]