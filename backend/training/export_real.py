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
import shutil
from pathlib import Path

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def main():
    model_path = os.path.join(BASE_DIR, "runs", "detect", "flower_real_model-2", "weights", "best.pt")
    
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return
        
    print(f"Loading {model_path} for export...")
    model = YOLO(model_path)
    
    # Export to ONNX
    exported_path = model.export(
        format="onnx",
        opset=12,
        simplify=True,
        dynamic=False,
        imgsz=320
    )
    
    print(f"Exported to {exported_path}")
    
    # Copy to frontend
    dest_dir = Path(BASE_DIR).parent.parent / "frontend" / "public" / "models"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_file = dest_dir / "flower_yolo11s.onnx"
    
    shutil.copy2(exported_path, dest_file)
    print(f"Successfully deployed ONNX model to {dest_file}")

if __name__ == "__main__":
    main()
