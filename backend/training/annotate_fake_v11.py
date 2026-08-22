import os
import glob
import cv2
import pathlib

# Monkey patch to avoid WinError 1337 on F:\WpSystem\.git from ultralytics
_old_exists = pathlib.Path.exists
def _safe_exists(self):
    try: return _old_exists(self)
    except OSError: return False
pathlib.Path.exists = _safe_exists

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset_v11")
RAW_FAKE_DIR = os.path.join(DATASET_DIR, "raw_fake_images")

CLASSES = ["chrysanthemum", "rose", "hydrangea", "carnation", "sunflower", "other_flower"]
YOLO_WORLD_CONF_THRESH = 0.10

_yolo_world_model = None
def get_yolo_world():
    global _yolo_world_model
    if _yolo_world_model is None:
        print("[AI] Loading YOLO-World for Bounding Box...")
        from ultralytics import YOLO
        _yolo_world_model = YOLO('yolov8s-worldv2.pt')
        _yolo_world_model.set_classes(["artificial flower", "fake flower", "flower bouquet", "plastic flower"])
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
        print(f"Lỗi khi xử lý {img_path}: {e}")
        return False

def main():
    print("🚀 Bắt đầu tự động vẽ khung (Bounding Box) cho Hoa Giả (Fake Flowers)")
    
    for class_id, class_name in enumerate(CLASSES):
        source_dir = os.path.join(RAW_FAKE_DIR, class_name)
        if not os.path.exists(source_dir):
            continue
            
        images = []
        for ext in ["*.jpg", "*.jpeg", "*.png", "*.webp"]:
            images.extend(glob.glob(os.path.join(source_dir, ext)))
            images.extend(glob.glob(os.path.join(source_dir, ext.upper())))
            
        if not images:
            print(f"[-] Thư mục {class_name} chưa có ảnh.")
            continue
            
        print(f"\n🌸 Tìm thấy {len(images)} ảnh giả cho {class_name}. Bắt đầu xử lý...")
        
        saved = 0
        for i, img_path in enumerate(images):
            split = 'val' if (i % 5 == 0) else 'train'
            img_name = f"{class_name}_fake_{i:04d}.jpg"
            # Lưu ảnh vào thư mục con ứng với class
            os.makedirs(os.path.join(DATASET_DIR, 'images', split, class_name), exist_ok=True)
            os.makedirs(os.path.join(DATASET_DIR, 'labels', split, class_name), exist_ok=True)
            
            final_img = os.path.join(DATASET_DIR, 'images', split, class_name, img_name)
            final_txt = os.path.join(DATASET_DIR, 'labels', split, class_name, f"{class_name}_fake_{i:04d}.txt")
            
            if annotate_and_save(img_path, final_img, final_txt, class_id):
                saved += 1
                if saved % 10 == 0:
                    print(f"  [+] Đã gắn nhãn {saved}/{len(images)} ảnh")
        print(f"✅ Đã lưu thành công {saved} ảnh giả cho {class_name}.")
        
if __name__ == '__main__':
    main()
