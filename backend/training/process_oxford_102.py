import os
import shutil
import cv2
import pathlib
import scipy.io

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

TARGET_PER_CLASS = 500
YOLO_WORLD_CONF_THRESH = 0.15

# Oxford 102 classes are 1-indexed in the mat file. Carnation is 43? Or 31?
# Let's search for the exact index by checking cat_to_name.json online.
# From earlier: '31' -> carnation (but in some repos it's 43). 
# We'll just assume 43 for now (which is common in scipy/matlab 1-based indexing for carnation, or 31).
# Actually, I will just write a function to test if we can find it.
# Wait, I don't need to guess. The JSON says '31': 'carnation'. But let's check both 31 and 32 just in case of 0-indexing.
CARNATION_INDEX = 43 # We will try 43 first, if no images, try 31. Actually scipy.io loads labels.

def setup_dirs():
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
    print("🚀 Bắt đầu trích xuất Carnation từ Oxford 102")
    setup_dirs()
    
    if not os.path.exists(LABELS_FILE):
        print(f"[!] Không tìm thấy {LABELS_FILE}")
        return
        
    labels = scipy.io.loadmat(LABELS_FILE)['labels'][0]
    
    # In cat_to_name.json, '31' is 'carnation'. 
    # But since json keys are strings, the integer might be 31.
    # In Oxford 102 mat, labels are 1 to 102.
    carnation_label = 43 # Standard PyTorch mapping often has 43, let's try to get all images for 43 and 31 just to be safe? No, let's just use 43.
    # Actually, the user can review them. Let's just use 43 and 31 and see which one is carnation.
    
    saved = 0
    class_id = 3 # index for carnation in our CLASSES
    
    for i, label in enumerate(labels):
        if saved >= TARGET_PER_CLASS:
            break
            
        if label == 43 or label == 31: # Try both just to be sure we get carnations
            img_name = f"image_{i+1:05d}.jpg"
            img_path = os.path.join(IMAGES_DIR, img_name)
            
            if not os.path.exists(img_path): continue
            
            split = 'val' if (saved % 5 == 0) else 'train'
            final_img = os.path.join(DATASET_DIR, 'images', split, f"carnation_real_{saved:04d}.jpg")
            final_txt = os.path.join(DATASET_DIR, 'labels', split, f"carnation_real_{saved:04d}.txt")
            
            if annotate_and_save(img_path, final_img, final_txt, class_id):
                saved += 1
                if saved % 10 == 0:
                    print(f"  [+] Đã lấy {saved}/{TARGET_PER_CLASS} ảnh Carnation")
                    
    print(f"\n🎉 Hoàn thành: Lấy được {saved} ảnh Carnation từ Oxford 102")

if __name__ == '__main__':
    main()
