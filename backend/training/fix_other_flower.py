import os
import shutil
import cv2
import pathlib
import scipy.io
import glob

# Monkey patch to avoid WinError 1337 on F:\WpSystem\.git from ultralytics
_old_exists = pathlib.Path.exists
def _safe_exists(self):
    try: return _old_exists(self)
    except OSError: return False
pathlib.Path.exists = _safe_exists

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset_v11")
OXFORD_DIR = os.path.join(BASE_DIR, "data", "flowers-102")
IMAGES_DIR = os.path.join(OXFORD_DIR, "jpg")
LABELS_FILE = os.path.join(OXFORD_DIR, "imagelabels.mat")

YOLO_WORLD_CONF_THRESH = 0.15

# Class indices to exclude because they belong to our main classes
# Oxford 102 mapping:
# 74: rose
# 54: sunflower
# 43: carnation
EXCLUDED_LABELS = {74, 54, 43}

_yolo_world_model = None
def get_yolo_world():
    global _yolo_world_model
    if _yolo_world_model is None:
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
    print("🚀 Đang dọn dẹp các ảnh other_flower cũ bị lệch...")
    for split in ['train', 'val']:
        for file in glob.glob(os.path.join(DATASET_DIR, 'images', split, "other_flower_real_*.jpg")):
            os.remove(file)
        for file in glob.glob(os.path.join(DATASET_DIR, 'labels', split, "other_flower_real_*.txt")):
            os.remove(file)
            
    print("🚀 Bắt đầu trích xuất Other Flower cân bằng từ Oxford 102")
    
    if not os.path.exists(LABELS_FILE):
        print(f"[!] Không tìm thấy {LABELS_FILE}")
        return
        
    labels = scipy.io.loadmat(LABELS_FILE)['labels'][0]
    
    # Gom ảnh theo từng nhãn
    label_to_images = {}
    for i, label in enumerate(labels):
        if label in EXCLUDED_LABELS: continue
        if label not in label_to_images:
            label_to_images[label] = []
        label_to_images[label].append(i + 1)
        
    saved = 0
    class_id = 5 # index for other_flower
    
    # Lấy 6 ảnh từ mỗi loài hoa khác nhau (khoảng 99 loài x 6 = ~594 ảnh, dừng ở 500)
    print("[AI] Loading YOLO-World for Bounding Box...")
    
    for label, img_indices in label_to_images.items():
        if saved >= 500: break
        
        taken_for_this_label = 0
        for idx in img_indices:
            if taken_for_this_label >= 6: break # Tối đa 6 ảnh mỗi loại hoa để đảm bảo đa dạng
            if saved >= 500: break
                
            img_name = f"image_{idx:05d}.jpg"
            img_path = os.path.join(IMAGES_DIR, img_name)
            
            if not os.path.exists(img_path): continue
            
            split = 'val' if (saved % 5 == 0) else 'train'
            final_img = os.path.join(DATASET_DIR, 'images', split, f"other_flower_real_{saved:04d}.jpg")
            final_txt = os.path.join(DATASET_DIR, 'labels', split, f"other_flower_real_{saved:04d}.txt")
            
            if annotate_and_save(img_path, final_img, final_txt, class_id):
                saved += 1
                taken_for_this_label += 1
                if saved % 50 == 0:
                    print(f"  [+] Đã lấy {saved}/500 ảnh (Đa dạng 100 loài)")
                    
    print(f"\n🎉 Hoàn thành: Lấy được {saved} ảnh đa dạng cho Other Flower từ Oxford 102")

if __name__ == '__main__':
    main()
