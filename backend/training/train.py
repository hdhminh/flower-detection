"""
High-Performance Training script for YOLOv11s on Diverse Real Flower Dataset.
Trained on NVIDIA GeForce RTX 4070 Ti SUPER with target mAP50 >= 0.90 (90%).
"""
import os
import sys
import shutil
import glob
import torch

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def train_and_evaluate():
    from ultralytics import YOLO

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    CONFIG_PATH = os.path.join(BASE_DIR, "config_real.yaml")
    
    # Remove old caches
    for c in glob.glob(os.path.join(BASE_DIR, "dataset_real", "labels", "*.cache")):
        try: os.remove(c)
        except: pass

    device = 0 if torch.cuda.is_available() else "cpu"
    device_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    
    print("==================================================")
    print("🌸 Starting YOLOv11s Precise Flower Training")
    print(f"Device: {device} ({device_name})")
    print(f"Dataset Config: {CONFIG_PATH}")
    print("Config: cls=2.0, hsv_h=0.01 (Preserve petal colors & distinct features)")
    print("==================================================")

    # Initialize model from base YOLOv11s
    base_model_path = os.path.join(BASE_DIR, "yolo11s.pt")
    if not os.path.exists(base_model_path):
        base_model_path = "yolo11s.pt"

    model = YOLO(base_model_path)

    epochs = 40
    batch_size = 8
    imgsz = 640

    results = model.train(
        data=CONFIG_PATH,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        workers=0,
        device=device,
        project=os.path.join(BASE_DIR, "runs", "detect"),
        name="flower_precise_yolo11s",
        exist_ok=True,
        optimizer="AdamW",
        lr0=0.003,
        lrf=0.0005,
        cos_lr=True,
        warmup_epochs=3.0,
        cls=2.0,         # High classification loss weight to strongly separate species
        box=5.0,         # Balanced box loss
        hsv_h=0.01,      # Minimal hue shift to prevent white petals shifting to yellow
        hsv_s=0.6,       # Saturation variation
        hsv_v=0.4,       # Brightness variation
        degrees=15.0,    # Controlled rotation
        scale=0.4,       # Scale jitter
        fliplr=0.5,      # Horizontal flip
        mosaic=0.8,      # Controlled mosaic
        mixup=0.1,       # Controlled mixup
        patience=25,     # Early stopping patience
        save=True,
        plots=True,
        val=True
    )

    best_weights = os.path.join(BASE_DIR, "runs", "detect", "flower_precise_yolo11s", "weights", "best.pt")
    print(f"\n📊 Evaluating best checkpoint: {best_weights}")
    best_model = YOLO(best_weights)
    val_results = best_model.val(data=CONFIG_PATH, imgsz=imgsz, device=device)

    map50 = val_results.box.map50
    map50_95 = val_results.box.map
    precision = val_results.box.mp
    recall = val_results.box.mr

    print("\n==================================================")
    print("🎯 VALIDATION RESULTS:")
    print(f"  • mAP@50:     {map50*100:.2f}%")
    print(f"  • mAP@50-95:  {map50_95*100:.2f}%")
    print(f"  • Precision:  {precision*100:.2f}%")
    print(f"  • Recall:     {recall*100:.2f}%")
    print("==================================================")

    # Export to ONNX
    print("\n📦 Exporting Best Model to ONNX FP32 640x640...")
    onnx_path = best_model.export(
        format="onnx",
        opset=12,
        simplify=True,
        dynamic=False,
        imgsz=640
    )

    frontend_model_path = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "frontend", "public", "models", "flower_yolo11s.onnx"))
    os.makedirs(os.path.dirname(frontend_model_path), exist_ok=True)
    shutil.copy2(onnx_path, frontend_model_path)
    size_mb = os.path.getsize(frontend_model_path) / (1024 * 1024)
    print(f"✅ Successfully deployed ONNX model to: {frontend_model_path} ({size_mb:.2f} MB)")
    print(f"🎉 Model training, validation (mAP50={map50*100:.2f}%), and deployment COMPLETE!")

if __name__ == "__main__":
    train_and_evaluate()
