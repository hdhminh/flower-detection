"""
Export script: converts PyTorch (.pt) weights to ONNX format optimized for web browser execution.
Automatically copies the resulting .onnx model to frontend/public/models/
"""
import os
import sys
import shutil
import argparse
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def export_to_onnx(model_path="runs/detect/train/weights/best.pt", output_dir="../../frontend/public/models", model_name="flower_yolo11n.onnx"):
    from ultralytics import YOLO

    model_path_obj = Path(model_path)
    if not model_path_obj.exists():
        print(f"[Warning] Weights not found at {model_path}. Using base 'yolo11n.pt' for export...")
        model_input = "yolo11n.pt"
    else:
        model_input = str(model_path_obj)

    print(f"[Export] Loading model {model_input} and exporting to ONNX...")
    model = YOLO(model_input)

    exported_path = model.export(
        format="onnx",
        opset=12,
        simplify=True,
        dynamic=False,
        imgsz=640
    )

    print(f"[Export] Model exported to: {exported_path}")

    # Ensure frontend destination folder exists
    dest_dir = Path(output_dir).resolve()
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_file = dest_dir / model_name

    shutil.copy2(exported_path, dest_file)
    size_mb = os.path.getsize(dest_file) / (1024 * 1024)
    print(f"[Export] Successfully copied ONNX model to: {dest_file} ({size_mb:.2f} MB)")
    return dest_file

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export YOLO model to ONNX for web browser")
    parser.add_argument("--weights", type=str, default="runs/detect/train/weights/best.pt", help="Path to .pt weights file")
    parser.add_argument("--output-dir", type=str, default="frontend/public/models", help="Destination directory in frontend")
    parser.add_argument("--name", type=str, default="flower_yolo11n.onnx", help="Destination file name")
    args = parser.parse_args()

    export_to_onnx(
        model_path=args.weights,
        output_dir=args.output_dir,
        model_name=args.name
    )
