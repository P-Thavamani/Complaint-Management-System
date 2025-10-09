#!/usr/bin/env python3
"""
Test script to verify the escalation endpoint fix
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_function_signature():
    """Test that the function signature is correct"""
    try:
        from api.complaints_updates import trigger_escalation_check
        import inspect
        
        # Get function signature
        sig = inspect.signature(trigger_escalation_check)
        params = list(sig.parameters.keys())
        
        print(f"Function signature: {sig}")
        print(f"Parameters: {params}")
        
        # Should have exactly one parameter: current_user
        if len(params) == 1 and params[0] == 'current_user':
            print("✓ Function signature is correct")
            return True
        else:
            print(f"✗ Function signature is incorrect. Expected ['current_user'], got {params}")
            return False
            
    except Exception as e:
        print(f"✗ Error checking function signature: {e}")
        return False

def test_decorator_stack():
    """Test that decorators are properly applied"""
    try:
        from api.complaints_updates import trigger_escalation_check
        
        # Check if function has the right decorators
        func_name = trigger_escalation_check.__name__
        print(f"Function name: {func_name}")
        
        # The function should be wrapped by admin_required only
        if hasattr(trigger_escalation_check, '__wrapped__'):
            print("✓ Function is properly decorated")
            return True
        else:
            print("✗ Function may not be properly decorated")
            return False
            
    except Exception as e:
        print(f"✗ Error checking decorators: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing escalation endpoint fix...\n")
    
    success = True
    
    print("1. Testing function signature...")
    success &= test_function_signature()
    
    print("\n2. Testing decorator application...")
    success &= test_decorator_stack()
    
    if success:
        print("\n✓ All tests passed! The escalation endpoint should work now.")
        print("\nThe TypeError should be fixed. Try the escalation check button again.")
    else:
        print("\n✗ Some tests failed. Please check the errors above.")
    
    return success

if __name__ == "__main__":
    main()