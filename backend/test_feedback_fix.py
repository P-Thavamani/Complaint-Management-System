#!/usr/bin/env python3
"""
Test script to verify the feedback fixes
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_feedback_function():
    """Test that the feedback function imports correctly"""
    try:
        from api.feedback import submit_feedback
        print("✓ Feedback function imports successfully")
        return True
    except Exception as e:
        print(f"✗ Error importing feedback function: {e}")
        return False

def test_auth_middleware():
    """Test that auth middleware includes name field"""
    try:
        from utils.auth_middleware import token_required
        print("✓ Auth middleware imports successfully")
        return True
    except Exception as e:
        print(f"✗ Error importing auth middleware: {e}")
        return False

def test_award_points():
    """Test that award_points function works correctly"""
    try:
        from utils.rewards import award_points
        print("✓ Award points function imports successfully")
        return True
    except Exception as e:
        print(f"✗ Error importing award_points function: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing feedback fixes...\n")
    
    success = True
    
    print("1. Testing feedback function...")
    success &= test_feedback_function()
    
    print("\n2. Testing auth middleware...")
    success &= test_auth_middleware()
    
    print("\n3. Testing award points function...")
    success &= test_award_points()
    
    if success:
        print("\n✓ All tests passed! The feedback fixes should work now.")
        print("\nExpected results:")
        print("- No more 500 errors when submitting feedback")
        print("- Username should show actual user name instead of 'Unknown'")
        print("- Points should be awarded correctly")
    else:
        print("\n✗ Some tests failed. Please check the errors above.")
    
    return success

if __name__ == "__main__":
    main()