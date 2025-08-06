from ultralytics import YOLO
import os
import sys

def download_yolo_model(model_name='yolov8n.pt'):
    """Download the YOLOv8 model if it doesn't exist"""
    try:
        print(f"Checking for YOLOv8 model: {model_name}")
        
        # The model will be downloaded automatically when initialized if it doesn't exist
        model = YOLO(model_name)
        
        # Get the model file path
        model_dir = os.path.expanduser(os.path.join('~', '.ultralytics', 'models'))
        model_path = os.path.join(model_dir, model_name) if os.path.isdir(model_dir) else model_name
        
        if os.path.exists(model_path):
            print(f"✅ YOLOv8 model found at: {model_path}")
        else:
            print(f"⚠️ Model initialized but file not found at expected location: {model_path}")
            print("This might be normal if the model is stored in a different location.")
        
        print(f"YOLOv8 model {model_name} is ready to use!")
        return True
    except Exception as e:
        print(f"❌ Error downloading YOLOv8 model: {e}")
        return False

if __name__ == "__main__":
    # Allow specifying a different model as command line argument
    model_name = sys.argv[1] if len(sys.argv) > 1 else 'yolov8n.pt'
    
    print(f"Downloading YOLOv8 model: {model_name}")
    success = download_yolo_model(model_name)
    
    if success:
        print("Model download completed successfully!")
        sys.exit(0)
    else:
        print("Model download failed!")
        sys.exit(1)