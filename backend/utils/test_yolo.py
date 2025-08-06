from ultralytics import YOLO
import cv2
import numpy as np

def test_yolo_installation():
    try:
        # Attempt to load the model
        model = YOLO('yolov8n.pt')  # This will download the model if it doesn't exist
        print("YOLOv8 model loaded successfully!")
        
        # Create a simple test image (black square on white background)
        img = np.ones((640, 640, 3), dtype=np.uint8) * 255  # White background
        cv2.rectangle(img, (100, 100), (400, 400), (0, 0, 0), -1)  # Black rectangle
        
        # Run inference
        results = model(img)
        
        print("Inference completed successfully!")
        print(f"Detected {len(results[0].boxes)} objects")
        
        return True
    except Exception as e:
        print(f"Error testing YOLOv8: {e}")
        return False

if __name__ == "__main__":
    print("Testing YOLOv8 installation...")
    success = test_yolo_installation()
    
    if success:
        print("YOLOv8 is working correctly!")
    else:
        print("YOLOv8 test failed. Please check your installation.")