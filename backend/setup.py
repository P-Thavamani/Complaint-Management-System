import os
import sys
import subprocess

def run_script(script_path, description):
    """Run a Python script and return success status"""
    print(f"\n{'=' * 50}")
    print(f"Running: {description}")
    print(f"{'=' * 50}")
    
    try:
        result = subprocess.run([sys.executable, script_path], check=True)
        print(f"\n✅ {description} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ {description} failed with error code {e.returncode}")
        return False
    except Exception as e:
        print(f"\n❌ {description} failed with error: {str(e)}")
        return False

def setup_application():
    """Run all setup and test scripts"""
    # Get the base directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define scripts to run in order
    scripts = [
        (os.path.join(base_dir, 'utils', 'setup_dirs.py'), "Setting up directories"),
        (os.path.join(base_dir, 'init_db.py'), "Initializing database"),
        (os.path.join(base_dir, 'utils', 'download_model.py'), "Downloading YOLOv8 model"),
        (os.path.join(base_dir, 'utils', 'test_yolo.py'), "Testing YOLOv8 installation"),
        (os.path.join(base_dir, 'utils', 'test_speech.py'), "Testing speech recognition"),
        (os.path.join(base_dir, 'utils', 'test_gemini.py'), "Testing Gemini API integration")
    ]
    
    # Run each script
    success_count = 0
    for script_path, description in scripts:
        if run_script(script_path, description):
            success_count += 1
    
    # Print summary
    print(f"\n{'=' * 50}")
    print(f"Setup Summary: {success_count}/{len(scripts)} tasks completed successfully")
    print(f"{'=' * 50}")
    
    if success_count == len(scripts):
        print("\n🎉 All setup tasks completed successfully! The application is ready to run.")
        print("\nTo start the application, run:")
        print(f"    {sys.executable} {os.path.join(base_dir, 'run.py')}")
    else:
        print(f"\n⚠️ {len(scripts) - success_count} setup tasks failed. Please resolve the issues before running the application.")

if __name__ == "__main__":
    print("Starting Complaint Management System setup...")
    setup_application()