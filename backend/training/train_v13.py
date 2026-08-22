import os
import sys
import shutil
import pathlib

# Fix for windows unicode stdout
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Avoid WinError 1337 from ultralytics checking git root
original_exists = pathlib.Path.exists
def safe_exists(self):
    try: return original_exists(self)
    except OSError: return False
pathlib.Path.exists = safe_exists

from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_MODELS_DIR = os.path.join(BASE_DIR, "..", "..", "frontend", "public", "models")

def main():
    print("🚀 [Bước 2] Bắt đầu huấn luyện mô hình YOLO26s (v13)...")
    
    # Load base YOLO26s model
    model = YOLO("yolo26s.pt")
    
    # Train YOLO26s with NMS-free MuSGD optimizer
    results = model.train(
        data=os.path.join(BASE_DIR, "config_v11.yaml"),
        epochs=50,
        imgsz=640,
        batch=32,
        workers=8,
        device=0, # CUDA GPU
        amp=True,
        warmup_epochs=3.0,
        patience=15,
        # Optimal augmentations
        hsv_h=0.02,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=25.0,
        scale=0.6,
        fliplr=0.5,
        flipud=0.2,
        mosaic=1.0,
        mixup=0.2,
        copy_paste=0.1,
        close_mosaic=10,
        name="flower_yolo26s_v13"
    )

    print("\n✅ Huấn luyện hoàn tất!")
    print("🚀 Đang xuất mô hình ra định dạng ONNX...")
    
    # Export best checkpoint to ONNX
    best_pt_path = os.path.join(BASE_DIR, "runs", "detect", "flower_yolo26s_v13", "weights", "best.pt")
    best_model = YOLO(best_pt_path)
    exported_onnx = best_model.export(format="onnx", imgsz=640, opset=12, simplify=True)
    
    print(f"\n✅ Xuất ONNX thành công: {exported_onnx}")
    
    # Copy ONNX to frontend models directory
    os.makedirs(FRONTEND_MODELS_DIR, exist_ok=True)
    target_onnx = os.path.join(FRONTEND_MODELS_DIR, "flower_yolo26s_v12.onnx")
    target_v13_onnx = os.path.join(FRONTEND_MODELS_DIR, "flower_yolo26s_v13.onnx")
    
    shutil.copy(exported_onnx, target_onnx)
    shutil.copy(exported_onnx, target_v13_onnx)
    
    print(f"📦 Đã cập nhật file ONNX vào Frontend: {target_onnx}")

if __name__ == "__main__":
    main()
