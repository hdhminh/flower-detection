import pathlib
original_exists = pathlib.Path.exists
def safe_exists(self):
    try:
        return original_exists(self)
    except OSError:
        return False
pathlib.Path.exists = safe_exists

from ultralytics import YOLO
import sys

# Fix for windows unicode stdout
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def main():
    print("🚀 Starting YOLO26s Training (v6) with MuSGD & ProgLoss...")
    
    # Load YOLO26s base model
    model = YOLO("yolo26s.pt")
    
    # YOLO26 is NMS-free and uses MuSGD by default when optimizer='auto' (default)
    # So we don't set lr0 or lrf to let MuSGD use its own optimal schedule.
    # DFL is also naturally removed in YOLO26.
    model.train(
        data="config_v11.yaml",
        epochs=50,
        imgsz=640,
        batch=32,
        workers=8,
        device=0,
        amp=True,
        warmup_epochs=3.0,  # YOLO26 converges faster
        patience=20,        # Enable early stopping
        # Strong augmentations good for our fake flowers
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
        name="flower_yolo26s_v12"
    )

    print("\n✅ Training Complete!")
    print("🚀 Exporting model to ONNX...")
    
    # Export the best model
    best_model = YOLO("runs/detect/flower_yolo26s_v12/weights/best.pt")
    best_model.export(format="onnx", imgsz=640, opset=12, simplify=True)
    
    print("\n✅ YOLO26s ONNX export complete! Path: runs/detect/flower_yolo26s_v12/weights/best.onnx")

if __name__ == "__main__":
    main()
