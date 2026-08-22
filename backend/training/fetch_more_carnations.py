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
TEMP_CRAWL_DIR = os.path.join(BASE_DIR, "temp_carnation_crawl_batch2")

CLASS_ID = 3 # Carnation

EXPANDED_QUERIES = [
    ("hoa cam chuong da lat", 40),
    ("hoa cam chuong chau", 35),
    ("hoa cam chuong vang", 35),
    ("hoa cam chuong trang", 35),
    ("hoa cam chuong vien", 35),
    ("hoa cam chuong cat canh", 35),
    ("carnation flower garden", 40),
    ("carnation flower close up", 40),
    ("red carnation single stem", 35),
    ("white carnation flower macro", 35),
    ("yellow carnations flower", 35),
    ("dianthus caryophyllus macro", 40),
    ("dianthus flower blossom", 35),
    ("carnations in vase", 35)
]

def calculate_md5(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def main():
    print("🚀 [Batch 2] Bắt đầu tải thêm ảnh Hoa Cẩm Chướng từ Internet...")
    os.makedirs(TEMP_CRAWL_DIR, exist_ok=True)
    
    # Pre-hash all existing images in dataset to prevent duplicate downloads
    existing_hashes = set()
    existing_files = glob.glob(os.path.join(DATASET_DIR, "images", "**", "*.*"), recursive=True)
    for ef in existing_files:
        try:
            existing_hashes.add(calculate_md5(ef))
        except Exception:
            pass
    print(f"  [Info] Đã nạp {len(existing_hashes)} hash của ảnh sẵn có trong dataset.")

    # 1. Crawl images with expanded queries
    for query, max_num in EXPANDED_QUERIES:
        print(f"  --> Đang tải từ khóa: '{query}' ({max_num} ảnh)...")
        sub_dir = os.path.join(TEMP_CRAWL_DIR, query.replace(" ", "_"))
        os.makedirs(sub_dir, exist_ok=True)
        try:
            crawler = BingImageCrawler(storage={'root_dir': sub_dir}, log_level=40)
            crawler.crawl(keyword=query, max_num=max_num)
        except Exception as e:
            print(f"      Lỗi tải '{query}': {e}")

    # 2. Gather, deduplicate and validate images
    print("\n🔍 Đang lọc trùng lặp và kiểm tra chất lượng ảnh...")
    all_raw_files = glob.glob(os.path.join(TEMP_CRAWL_DIR, "**", "*.*"), recursive=True)
    
    seen_hashes = set(existing_hashes)
    valid_images = []
    
    for fpath in all_raw_files:
        if not fpath.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            continue
        try:
            img = cv2.imread(fpath)
            if img is None: continue
            h, w = img.shape[:2]
            if h < 200 or w < 200: continue
            
            fhash = calculate_md5(fpath)
            if fhash in seen_hashes: continue
            seen_hashes.add(fhash)
            
            valid_images.append(fpath)
        except Exception:
            continue

    print(f"✅ Đã thu thập thêm {len(valid_images)} ảnh Cẩm Chướng hợp lệ (không trùng lặp).")

    # 3. Auto-annotate with YOLO-World
    print("\n🏷️ Bắt đầu tự động khoanh vùng nhãn (YOLO-World)...")
    model = YOLO('yolov8s-worldv2.pt')
    model.set_classes(["carnation", "flower", "fresh flower", "plant"])

    # Count existing carnations to determine index offset
    existing_all = glob.glob(os.path.join(DATASET_DIR, 'images', '**', 'carnation', '*.jpg'), recursive=True)
    start_idx = len(existing_all) + 1

    saved_count = 0
    saved_train = 0
    saved_val = 0
    
    for idx, img_path in enumerate(valid_images):
        try:
            img = cv2.imread(img_path)
            if img is None: continue
            
            results = model(img, conf=0.10, verbose=False)
            r = results[0]
            
            if len(r.boxes) == 0:
                results = model(img, conf=0.03, verbose=False)
                r = results[0]
                if len(r.boxes) == 0: continue

            is_val = (saved_count % 5 == 0)
            split = 'val' if is_val else 'train'
            
            num_id = start_idx + saved_count
            bname = f"carnation_web2_{num_id:04d}.jpg"
            txt_name = f"carnation_web2_{num_id:04d}.txt"
            
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
    
    # Final counts
    total_train = len(glob.glob(os.path.join(DATASET_DIR, 'images', 'train', 'carnation', '*.jpg')))
    total_val = len(glob.glob(os.path.join(DATASET_DIR, 'images', 'val', 'carnation', '*.jpg')))
    
    print(f"\n🎉 [Hoàn Tất Batch 2] Đã bổ sung thêm {saved_count} ảnh Cẩm Chướng:")
    print(f"  - Train mới: +{saved_train} ảnh (Tổng Train Carnation: {total_train})")
    print(f"  - Val mới: +{saved_val} ảnh (Tổng Val Carnation: {total_val})")
    print(f"  - TỔNG CỘNG CARNATION HIỆN TẠI: {total_train + total_val} ảnh")

if __name__ == '__main__':
    main()
