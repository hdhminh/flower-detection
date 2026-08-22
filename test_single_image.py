from ultralytics import YOLO
import shutil
import os

model = YOLO(r"backend\training\runs\detect\flower_real_v5_m\weights\best.pt")
img_path = r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\.user_uploaded\media_1787154532099.jpg"

# Use Test-Time Augmentation (augment=True)
results = model.predict(img_path, save=True, conf=0.15, augment=True)
for i, r in enumerate(results):
    print("--- DETECTIONS with TTA ---")
    if len(r.boxes) > 0:
        for box in r.boxes:
            cls = int(box.cls[0].item())
            conf = box.conf[0].item()
            name = r.names[cls]
            print(f"Detected: {name} (Confidence: {conf:.2f})")
    else:
        print("No flower detected")

    saved_img = r.save_dir + "\\" + os.path.basename(img_path)
    scratch_dir = r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\scratch"
    os.makedirs(scratch_dir, exist_ok=True)
    dst = os.path.join(scratch_dir, "predicted_img_tta.jpg")
    shutil.copy2(saved_img, dst)
    print(f"Saved predicted image to: {dst}")
