import os

def setup_directories():
    """Create necessary directories for the application"""
    # Define the directories to create
    directories = [
        'static',
        'static/uploads',
        'static/uploads/images',
        'static/uploads/audio'
    ]
    
    # Get the base directory (where app.py is located)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Create each directory if it doesn't exist
    for directory in directories:
        dir_path = os.path.join(base_dir, directory)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
            print(f"Created directory: {dir_path}")
        else:
            print(f"Directory already exists: {dir_path}")

if __name__ == "__main__":
    setup_directories()
    print("Directory setup complete!")