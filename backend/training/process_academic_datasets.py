import os
import shutil
import glob
import cv2
import pathlib
import random

# Monkey patch to avoid WinError 1337 on F:\WpSystem\.git from ultralytics
_old_exists = pathlib.Path.exists
def _safe_exists(self):
    try: return _old_exists(self)
    except OSError: return False
pathlib.Path.exists = _safe_exists

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset_v11")
KAGGLE_DIR = os.path.expanduser("~/.cache/kagglehub/datasets/alxmamaev/flowers-recognition/versions/2/flowers")

# Classes mappings
CLASSES = ["chrysanthemum", "rose", "hydrangea", "carnation", "sunflower", "other_flower"]

MAPPING = {
    "daisy": "chrysanthemum",
    "rose": "rose",
    "sunflower": "sunflower",
    "dandelion": "other_flower",
    "tulip": "other_flower"
}

TARGET_PER_CLASS = 500
YOLO_WORLD_CONF_THRESH = 0.15

def setup_dirs():
    os.makedirs(os.path.join(DATASET_DIR, "raw_fake_images"), exist_ok=True)
    for cls in CLASSES:
        os.makedirs(os.path.join(DATASET_DIR, "raw_fake_images", cls), exist_ok=True)
    for split in ['train', 'val']:
        os.makedirs(os.path.join(DATASET_DIR, 'images', split), exist_ok=True)
        os.makedirs(os.path.join(DATASET_DIR, 'labels', split), exist_ok=True)

_yolo_world_model = None
def get_yolo_world():
    global _yolo_world_model
    if _yolo_world_model is None:
        print("[AI] Loading YOLO-World for Bounding Box...")
        from ultralytics import YOLO
        _yolo_world_model = YOLO('yolov8s-worldv2.pt')
        _yolo_world_model.set_classes(["a single flower", "flower bouquet", "fresh flower"])
    return _yolo_world_model

def annotate_and_save(img_path, final_img, final_txt, class_id):
    try:
        img = cv2.imread(img_path)
        if img is None: return False
        
        model = get_yolo_world()
        results = model(img, verbose=False)
        r = results[0]
        
        if len(r.boxes) == 0: return False
            
        best_box = None
        best_conf = -1
        
        for box in r.boxes:
            conf = box.conf[0].item()
            if conf > YOLO_WORLD_CONF_THRESH and conf > best_conf:
                best_box = box
                best_conf = conf
                
        if best_box is None: return False
            
        xywh = best_box.xywhn[0].cpu().numpy()
        cx, cy, bw, bh = xywh
        
        bw = min(1.0, bw * 1.05)
        bh = min(1.0, bh * 1.05)

        with open(final_txt, 'w', encoding='utf-8') as f:
            f.write(f"{class_id} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}\n")
            
        cv2.imwrite(final_img, img)
        return True
    except Exception as e:
        return False

def main():
    print("🚀 Bắt đầu trích xuất Dataset Học thuật Kaggle (V11)")
    setup_dirs()
    
    # Track counts
    counts = {cls: 0 for cls in CLASSES}
    
    # Process Kaggle Categories
    for source_cat, target_cls in MAPPING.items():
        if counts[target_cls] >= TARGET_PER_CLASS:
            continue
            
        source_dir = os.path.join(KAGGLE_DIR, source_cat)
        if not os.path.exists(source_dir):
            print(f"[!] Không tìm thấy thư mục {source_dir}")
            continue
            
        images = glob.glob(os.path.join(source_dir, "*.jpg"))
        random.shuffle(images)
        
        class_id = CLASSES.index(target_cls)
        print(f"\n🌸 Processing {source_cat} -> {target_cls}")
        
        for img_path in images:
            if counts[target_cls] >= TARGET_PER_CLASS:
                break
                
            split = 'val' if (counts[target_cls] % 5 == 0) else 'train'
            img_name = f"{target_cls}_real_{counts[target_cls]:04d}.jpg"
            final_img = os.path.join(DATASET_DIR, 'images', split, img_name)
            final_txt = os.path.join(DATASET_DIR, 'labels', split, f"{target_cls}_real_{counts[target_cls]:04d}.txt")
            
            if annotate_and_save(img_path, final_img, final_txt, class_id):
                counts[target_cls] += 1
                if counts[target_cls] % 20 == 0:
                    print(f"  [+] Đã lấy {counts[target_cls]}/{TARGET_PER_CLASS} ảnh cho {target_cls}")
                    
    print("\n==================================================")
    print("🎉 Hoàn thành trích xuất Kaggle Flowers Recognition")
    print("==================================================")
    for cls in CLASSES:
        print(f"{cls:15s} | Real: {counts[cls]:3d}")
        
    config_content = f"""path: {DATASET_DIR}
train: images/train
val: images/val

names:
  0: chrysanthemum
  1: rose
  2: hydrangea
  3: carnation
  4: sunflower
  5: other_flower
"""
    with open(os.path.join(BASE_DIR, 'config_v11.yaml'), 'w') as f:
        f.write(config_content)
    print("Wrote config_v11.yaml")

if __name__ == '__main__':
    main()
