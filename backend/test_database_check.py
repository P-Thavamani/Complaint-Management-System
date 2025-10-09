#!/usr/bin/env python3
"""
Test script to verify the database check fix
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_escalation_function():
    """Test the escalation function with app context"""
    try:
        from app import app
        from scheduled_tasks import check_and_escalate_complaints
        
        print("Testing escalation function with app context...")
        
        with app.app_context():
            # This should not raise the database truth value error anymore
            result = check_and_escalate_complaints()
            print(f"✓ Escalation function executed successfully")
            print(f"  Result: {len(result)} complaints processed")
            return True
            
    except Exception as e:
        print(f"✗ Error in escalation function: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run the test"""
    print("Testing database check fix...\n")
    
    success = test_escalation_function()
    
    if success:
        print("\n✓ Database check fix successful!")
        print("The escalation endpoint should work now without database errors.")
    else:
        print("\n✗ Database check fix failed.")
    
    return success

if __name__ == "__main__":
    main()