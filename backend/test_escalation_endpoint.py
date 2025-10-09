#!/usr/bin/env python3
"""
Test script to verify the escalation endpoint is working
"""

import requests
import json

def test_escalation_endpoint():
    """Test the escalation endpoint directly"""
    base_url = "http://localhost:5000"
    
    print("Testing escalation endpoint...")
    
    # Test 1: Check if server is running
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        print(f"✓ Server is running: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"✗ Server not reachable: {e}")
        return False
    
    # Test 1.5: Try to login as admin to get a token
    admin_token = None
    try:
        login_data = {
            "email": "admin@example.com",  # You might need to adjust this
            "password": "admin123"  # You might need to adjust this
        }
        response = requests.post(f"{base_url}/api/auth/login", 
                               json=login_data, 
                               headers={'Content-Type': 'application/json'},
                               timeout=5)
        if response.status_code == 200:
            admin_token = response.json().get('token')
            print(f"✓ Admin login successful, got token")
        else:
            print(f"✗ Admin login failed: {response.status_code} - {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"✗ Admin login request failed: {e}")
    
    # Test 2: Check if complaint_updates blueprint is accessible
    try:
        response = requests.get(f"{base_url}/api/complaint_updates/test", timeout=5)
        print(f"✓ Complaint updates blueprint accessible: {response.status_code}")
        print(f"  Response: {response.json()}")
    except requests.exceptions.RequestException as e:
        print(f"✗ Complaint updates blueprint not accessible: {e}")
        return False
    
    # Test 3: Check OPTIONS request (CORS preflight)
    try:
        response = requests.options(f"{base_url}/api/complaint_updates/check-escalations", 
                                  headers={
                                      'Origin': 'http://localhost:3000',
                                      'Access-Control-Request-Method': 'GET',
                                      'Access-Control-Request-Headers': 'Authorization,Content-Type'
                                  }, timeout=5)
        print(f"✓ OPTIONS request works: {response.status_code}")
        print(f"  CORS headers: {dict(response.headers)}")
    except requests.exceptions.RequestException as e:
        print(f"✗ OPTIONS request failed: {e}")
    
    # Test 4: Check GET request without auth (should fail with 401)
    try:
        response = requests.get(f"{base_url}/api/complaint_updates/check-escalations", timeout=5)
        print(f"✓ GET request without auth: {response.status_code} (expected 401)")
        if response.status_code == 401:
            print("  This is expected - endpoint requires authentication")
    except requests.exceptions.RequestException as e:
        print(f"✗ GET request failed: {e}")
    
    # Test 5: Check GET request with auth token (if we have one)
    if admin_token:
        try:
            headers = {
                'Authorization': f'Bearer {admin_token}',
                'Content-Type': 'application/json'
            }
            response = requests.get(f"{base_url}/api/complaint_updates/check-escalations", 
                                  headers=headers, timeout=10)
            print(f"✓ GET request with auth: {response.status_code}")
            if response.status_code == 200:
                print(f"  Response: {response.json()}")
            else:
                print(f"  Error: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"✗ Authenticated GET request failed: {e}")
    
    return True

if __name__ == "__main__":
    test_escalation_endpoint()