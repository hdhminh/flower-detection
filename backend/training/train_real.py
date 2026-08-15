import os
import pathlib
original_exists = pathlib.Path.exists
def safe_exists(self):
    try:
        return original_exists(self)
    except OSError:
        return False
pathlib.Path.exists = safe_exists

from ultralytics import YOLO
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def main():
    # Load YOLOv11 Small model
    model = YOLO("yolo11s.pt")
    
    # Train the model
    yaml_path = os.path.join(BASE_DIR, "config_real.yaml")
    
    # We use a small number of epochs (e.g. 5) to finish reasonably quickly in this session
    # but still learn the real features.
    results = model.train(
        data=yaml_path,
        epochs=5,
        imgsz=320,
        batch=16,
        name="flower_real_model"
    )
    
    print("Training finished!")
    
if __name__ == "__main__":
    main()
