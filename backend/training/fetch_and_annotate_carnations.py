import os
import glob
import hashlib
import cv2
import pathlib
import shutil
from icrawler.builtin import BingImageCrawler

# Avoid Windows git error
_old_exists = pathlib.Path.exists
def _safe_exists(self):
    try: return _old_exists(self)
    except OSError: return False
pathlib.Path.exists = _safe_exists

from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset_v11")
TEMP_CRAWL_DIR = os.path.join(BASE_DIR, "temp_carnation_crawl")

CLASS_ID = 3 # Carnation

QUERIES = [
    ("hoa cam chuong", 35),
    ("hoa cam chuong don", 25),
    ("hoa cam chuong chum", 25),
    ("hoa cam chuong hong", 25),
    ("hoa cam chuong do", 25),
    ("dianthus caryophyllus flower", 35),
    ("carnation flower real", 35),
    ("pink carnations bouquet", 25)
]

def get_yolo_world():
    print("[AI] Loading YOLO-World for Bounding Box Annotation...")
    model = YOLO('yolov8s-worldv2.pt')
    model.set_classes(["carnation", "flower", "fresh flower", "plant"])
    return model

def calculate_md5(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def main():
    print("🚀 [Step 2] Bắt đầu tải ảnh Hoa Cẩm Chướng từ Internet...")
    os.makedirs(TEMP_CRAWL_DIR, exist_ok=True)
    
    # 1. Crawl images with diverse queries
    for query, max_num in QUERIES:
        print(f"  --> Đang tải từ khóa: '{query}' ({max_num} ảnh)...")
        sub_dir = os.path.join(TEMP_CRAWL_DIR, query.replace(" ", "_"))
        os.makedirs(sub_dir, exist_ok=True)
        try:
            crawler = BingImageCrawler(storage={'root_dir': sub_dir}, log_level=30)
            crawler.crawl(keyword=query, max_num=max_num)
        except Exception as e:
            print(f"      Lỗi tải '{query}': {e}")

    # 2. Gather, deduplicate and validate images
    print("\n🔍 Đang lọc trùng lặp và kiểm tra tính hợp lệ của ảnh...")
    all_raw_files = glob.glob(os.path.join(TEMP_CRAWL_DIR, "**", "*.*"), recursive=True)
    
    seen_hashes = set()
    valid_images = []
    
    for fpath in all_raw_files:
        if not fpath.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            continue
        try:
            img = cv2.imread(fpath)
            if img is None: continue
            h, w = img.shape[:2]
            if h < 200 or w < 200: continue # Skip too small images
            
            fhash = calculate_md5(fpath)
            if fhash in seen_hashes: continue
            seen_hashes.add(fhash)
            
            valid_images.append(fpath)
        except Exception:
            continue

    print(f"✅ Đã thu thập được {len(valid_images)} ảnh Cẩm Chướng hợp lệ (không trùng).")

    # 3. Auto-annotate with YOLO-World
    print("\n🏷️ [Step 3] Bắt đầu tự động khoanh vùng nhãn (YOLO-World)...")
    yolo_world = get_yolo_world()
    
    # Check existing carnation counts to avoid overwriting
    existing_train = len(glob.glob(os.path.join(DATASET_DIR, 'images', 'train', 'carnation', '*.jpg')))
    existing_val = len(glob.glob(os.path.join(DATASET_DIR, 'images', 'val', 'carnation', '*.jpg')))
    print(f"  [Info] Hiện có {existing_train} train, {existing_val} val cẩm chướng chuẩn sẵn có.")

    saved_count = 0
    saved_train = 0
    saved_val = 0
    
    for idx, img_path in enumerate(valid_images):
        try:
            img = cv2.imread(img_path)
            if img is None: continue
            
            results = yolo_world(img, conf=0.10, verbose=False)
            r = results[0]
            
            if len(r.boxes) == 0:
                # Fallback lower conf
                results = yolo_world(img, conf=0.03, verbose=False)
                r = results[0]
                if len(r.boxes) == 0: continue

            # Split 80% train, 20% val
            is_val = (saved_count % 5 == 0)
            split = 'val' if is_val else 'train'
            
            bname = f"carnation_web_{saved_count+1:04d}.jpg"
            txt_name = f"carnation_web_{saved_count+1:04d}.txt"
            
            out_img = os.path.join(DATASET_DIR, 'images', split, 'carnation', bname)
            out_txt = os.path.join(DATASET_DIR, 'labels', split, 'carnation', txt_name)
            
            boxes_to_write = []
            for box in r.boxes:
                cx, cy, bw, bh = box.xywhn[0].cpu().numpy()
                boxes_to_write.append(f"{CLASS_ID} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}\n")
                
            if not boxes_to_write: continue
            
            with open(out_txt, 'w', encoding='utf-8') as f:
                f.writelines(boxes_to_write)
                
            cv2.imwrite(out_img, img)
            
            saved_count += 1
            if is_val: saved_val += 1
            else: saved_train += 1
            
            if saved_count % 25 == 0:
                print(f"  [+] Đã gắn nhãn thành công: {saved_count}/{len(valid_images)} ảnh")
        except Exception as e:
            continue

    # Cleanup temp
    shutil.rmtree(TEMP_CRAWL_DIR, ignore_errors=True)
    
    print(f"\n🎉 [Hoàn Tất] Đã thêm thành công {saved_count} ảnh Hoa Cẩm Chướng mới:")
    print(f"  - Train mới: +{saved_train} ảnh (Tổng Train Carnation: {existing_train + saved_train})")
    print(f"  - Val mới: +{saved_val} ảnh (Tổng Val Carnation: {existing_val + saved_val})")
    print(f"  - Tổng số ảnh Carnation hiện tại: {existing_train + saved_train + existing_val + saved_val} ảnh")

if __name__ == '__main__':
    main()
