import os
import glob
import random
import cv2
import numpy as np
from PIL import Image
import pathlib
import shutil

# Avoid Windows git error
_old_exists = pathlib.Path.exists
def _safe_exists(self):
    try: return _old_exists(self)
    except OSError: return False
pathlib.Path.exists = _safe_exists

from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset_v11")
TEMP_PROCESSED_DIR = os.path.join(BASE_DIR, "temp_carnation_processed")

CLASS_ID = 3 # Carnation

def load_image_rgb(file_path):
    # Try PIL first (handles webp, avif, png, jpg)
    try:
        pil_img = Image.open(file_path).convert('RGB')
        return np.array(pil_img)[:, :, ::-1] # Convert RGB to BGR for OpenCV
    except Exception:
        pass
    
    # Try OpenCV
    try:
        cv_img = cv2.imread(file_path)
        if cv_img is not None:
            return cv_img
    except Exception:
        pass
        
    return None

def main():
    print("🚀 [Bước 1] Thu thập và chuẩn hóa toàn bộ ảnh Carnation của người dùng...")
    
    train_img_dir = os.path.join(DATASET_DIR, 'images', 'train', 'carnation')
    val_img_dir = os.path.join(DATASET_DIR, 'images', 'val', 'carnation')
    train_lbl_dir = os.path.join(DATASET_DIR, 'labels', 'train', 'carnation')
    val_lbl_dir = os.path.join(DATASET_DIR, 'labels', 'val', 'carnation')
    
    # Collect all image paths
    raw_images = glob.glob(os.path.join(train_img_dir, "*.*")) + glob.glob(os.path.join(val_img_dir, "*.*"))
    print(f"  --> Tìm thấy {len(raw_images)} ảnh gốc.")
    
    # Load and standardize in memory / temp folder
    os.makedirs(TEMP_PROCESSED_DIR, exist_ok=True)
    valid_cv_images = []
    
    for idx, fpath in enumerate(raw_images):
        bgr_img = load_image_rgb(fpath)
        if bgr_img is None:
            print(f"  [!] Bỏ qua ảnh lỗi không đọc được: {fpath}")
            continue
            
        h, w = bgr_img.shape[:2]
        if h < 50 or w < 50:
            continue
            
        temp_path = os.path.join(TEMP_PROCESSED_DIR, f"temp_{idx:04d}.jpg")
        cv2.imwrite(temp_path, bgr_img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        valid_cv_images.append(temp_path)
        
    print(f"  --> Chuẩn hóa thành công {len(valid_cv_images)} ảnh sang định dạng JPG chuẩn.")
    
    # Clean old carnation folders
    for d in [train_img_dir, val_img_dir, train_lbl_dir, val_lbl_dir]:
        shutil.rmtree(d, ignore_errors=True)
        os.makedirs(d, exist_ok=True)
        
    # Shuffle with fixed seed for reproducibility
    random.seed(42)
    random.shuffle(valid_cv_images)
    
    # Split 80% train / 20% val
    val_count = max(1, int(len(valid_cv_images) * 0.20))
    train_count = len(valid_cv_images) - val_count
    
    print(f"\n📊 Tỷ lệ phân chia: {train_count} ảnh Train (80%) | {val_count} ảnh Val (20%)")
    
    # Load YOLO-World model for annotation
    print("\n🏷️ Đang tải YOLO-World để tự động khoanh vùng nhãn cho từng ảnh...")
    model = YOLO('yolov8s-worldv2.pt')
    model.set_classes(["carnation", "flower", "fresh flower", "plant"])
    
    saved_train = 0
    saved_val = 0
    
    for idx, temp_img_path in enumerate(valid_cv_images):
        img_id = idx + 1
        is_val = (idx < val_count) # First 20% to val
        split = 'val' if is_val else 'train'
        
        target_img_name = f"carnation_real_{img_id:04d}.jpg"
        target_txt_name = f"carnation_real_{img_id:04d}.txt"
        
        target_img_path = os.path.join(DATASET_DIR, 'images', split, 'carnation', target_img_name)
        target_txt_path = os.path.join(DATASET_DIR, 'labels', split, 'carnation', target_txt_name)
        
        img = cv2.imread(temp_img_path)
        
        # Inference with YOLO-World
        results = model(img, conf=0.10, verbose=False)
        r = results[0]
        
        if len(r.boxes) == 0:
            results = model(img, conf=0.01, verbose=False)
            r = results[0]
            
        boxes_to_write = []
        if len(r.boxes) > 0:
            for box in r.boxes:
                cx, cy, bw, bh = box.xywhn[0].cpu().numpy()
                boxes_to_write.append(f"{CLASS_ID} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}\n")
        else:
            # Center tight bounding box fallback
            boxes_to_write.append(f"{CLASS_ID} 0.500000 0.500000 0.800000 0.800000\n")
            
        with open(target_txt_path, 'w', encoding='utf-8') as f:
            f.writelines(boxes_to_write)
            
        shutil.copy(temp_img_path, target_img_path)
        
        if is_val: saved_val += 1
        else: saved_train += 1
        
    # Cleanup temp directory
    shutil.rmtree(TEMP_PROCESSED_DIR, ignore_errors=True)
    
    print(f"\n✅ [Hoàn Tất Bước 1] Đã chuẩn hóa & gán nhãn thành công:")
    print(f"  - Train: {saved_train} ảnh & nhãn tương ứng")
    print(f"  - Val:   {saved_val} ảnh & nhãn tương ứng")
    print(f"  - Tổng:  {saved_train + saved_val} ảnh Hoa Cẩm Chướng")

if __name__ == '__main__':
    main()
