import os
import sys
import cv2
import shutil
import numpy as np
from bing_image_downloader import downloader

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CLASSES = ['chrysanthemum', 'rose', 'hydrangea', 'lavender', 'sunflower']

# Sub-queries for maximum diversity per class, with negative tags
DIVERSE_QUERIES = {
    'chrysanthemum': [
        'white daisy flower bellis perennis macro close up',
        'cuc hoa mi hoa trang close up',
        'yellow chrysanthemum blossom close up bloom',
        'chrysanthemum morifolium flower close up macro',
        'spider mum flower bloom isolated',
        'pompon chrysanthemum bloom macro',
        'chamomile daisy flower close up macro bloom',
        'wild marguerite daisy bloom close up'
    ],
    'rose': [
        'red rose flower bloom close up macro',
        'pink english garden rose flower close up',
        'white rose blossom petals close up macro',
        'yellow tea rose flower close up bloom',
        'wild shrub rose bloom close up',
        'david austin rose bloom close up macro',
        'hoa hong nhung do tham close up'
    ],
    'hydrangea': [
        'blue hydrangea macrophylla bloom close up macro',
        'pink hydrangea flower cluster close up',
        'purple mophead hydrangea bloom macro',
        'white panicle hydrangea flower close up',
        'lacecap hydrangea blossom close up macro',
        'hoa cam tu cau no ro close up'
    ],
    'lavender': [
        'english lavender angustifolia flower spike close up macro',
        'french lavender stoechas butterfly flower close up',
        'lavender flower sprig close up macro',
        'purple lavender blossom garden close up macro',
        'blooming lavender flower spikes macro'
    ],
    'sunflower': [
        'giant sunflower head close up yellow macro',
        'single sunflower bloom bright close up macro',
        'dwarf teddy bear sunflower flower macro close up',
        'autumn beauty red sunflower bloom close up',
        'hoa huong duong don no ro close up'
    ]
}

TARGET_PER_CLASS = 250  # ~200 train, ~50 val per class

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, 'dataset_real')
TEMP_DIR = os.path.join(BASE_DIR, 'temp_downloads')

# Preload AI filter model to detect persons / garbage objects
_filter_detector = None

def get_filter_detector():
    global _filter_detector
    if _filter_detector is None:
        from ultralytics import YOLO
        print("[AI-Filter] Loading COCO filter model (yolo11s.pt)...")
        _filter_detector = YOLO("yolo11s.pt")
    return _filter_detector

def setup_dirs():
    if os.path.exists(DATASET_DIR):
        shutil.rmtree(DATASET_DIR)
    for split in ['train', 'val']:
        os.makedirs(os.path.join(DATASET_DIR, 'images', split), exist_ok=True)
        os.makedirs(os.path.join(DATASET_DIR, 'labels', split), exist_ok=True)

# COCO classes to strictly REJECT:
# 0: person, 1-8: vehicles, 14-23: animals, 24-28: accessories (backpack, umbrella, handbag, tie, suitcase),
# 39-45: sports, 56-61: furniture (chair, couch, bed, table), 62-73: electronics
REJECT_CLASSES = {0, 1, 2, 3, 4, 5, 6, 7, 8, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 56, 57, 58, 59, 60, 61, 62, 63, 67}

def filter_and_annotate(img_path, txt_path, class_id):
    try:
        img = cv2.imread(img_path)
        if img is None:
            return False
        h, w = img.shape[:2]
        if h < 180 or w < 180:
            return False
        
        # 1. AI Gate: Check for humans or unwanted objects
        detector = get_filter_detector()
        results = detector(img, verbose=False, conf=0.25)
        if len(results) > 0 and results[0].boxes is not None:
            detected_classes = [int(c) for c in results[0].boxes.cls.tolist()]
            for cls_idx in detected_classes:
                if cls_idx in REJECT_CLASSES:
                    # Found person or unwanted object -> REJECT
                    return False

        # 2. Extract salient flower region using color/saliency bounding box
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Adaptive threshold to find foreground flower petals
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 4)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        valid_boxes = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > (w * h * 0.05):  # At least 5% of image area
                bx, by, bw, bh = cv2.boundingRect(cnt)
                valid_boxes.append((bx, by, bw, bh))
                
        if valid_boxes:
            # Union of major contours
            min_x = max(0, min(b[0] for b in valid_boxes) - 10)
            min_y = max(0, min(b[1] for b in valid_boxes) - 10)
            max_x = min(w, max(b[0] + b[2] for b in valid_boxes) + 10)
            max_y = min(h, max(b[1] + b[3] for b in valid_boxes) + 10)
            
            box_w = (max_x - min_x) / w
            box_h = (max_y - min_y) / h
            center_x = (min_x + max_x) / (2.0 * w)
            center_y = (min_y + max_y) / (2.0 * h)
        else:
            # Clean centered crop box
            center_x = 0.5
            center_y = 0.5
            box_w = 0.85
            box_h = 0.85

        # Clamp normalized values
        center_x = max(0.01, min(0.99, center_x))
        center_y = max(0.01, min(0.99, center_y))
        box_w = max(0.1, min(0.99, box_w))
        box_h = max(0.1, min(0.99, box_h))

        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write(f"{class_id} {center_x:.6f} {center_y:.6f} {box_w:.6f} {box_h:.6f}\n")
            
        return True
    except Exception as e:
        return False

def scrape_diverse_class(cls_name, class_id):
    print(f"\n==================================================")
    print(f"🌸 Scraping clean & diverse dataset for: {cls_name.upper()} (Class {class_id})")
    print(f"==================================================")
    
    queries = DIVERSE_QUERIES.get(cls_name, [f"{cls_name} flower macro close up"])
    images_per_query = max(40, (TARGET_PER_CLASS // len(queries)) + 15)
    
    total_saved = 0
    
    for q_idx, query in enumerate(queries):
        if total_saved >= TARGET_PER_CLASS:
            break
        print(f"\n[{cls_name}] ({q_idx+1}/{len(queries)}) Searching: '{query}'...")
        
        query_temp_dir = os.path.join(TEMP_DIR, f"q_{class_id}_{q_idx}")
        try:
            downloader.download(
                query,
                limit=images_per_query,
                output_dir=query_temp_dir,
                adult_filter_off=False,
                force_replace=False,
                timeout=8,
                verbose=False
            )
        except Exception as e:
            print(f"Download warning for query '{query}': {e}")
            continue
            
        # Find downloaded folder
        downloaded_dirs = [os.path.join(query_temp_dir, d) for d in os.listdir(query_temp_dir) if os.path.isdir(os.path.join(query_temp_dir, d))] if os.path.exists(query_temp_dir) else []
        if not downloaded_dirs:
            continue
            
        downloaded_folder = downloaded_dirs[0]
        img_files = [f for f in os.listdir(downloaded_folder) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        
        saved_for_query = 0
        rejected_count = 0
        for img_file in img_files:
            if total_saved >= TARGET_PER_CLASS:
                break
            src_path = os.path.join(downloaded_folder, img_file)
            
            # 80/20 train/val split: every 5th image goes to val
            split = 'val' if (total_saved % 5 == 0) else 'train'
            
            img_name = f"{cls_name}_{total_saved:04d}.jpg"
            final_img = os.path.join(DATASET_DIR, 'images', split, img_name)
            final_txt = os.path.join(DATASET_DIR, 'labels', split, f"{cls_name}_{total_saved:04d}.txt")
            
            if filter_and_annotate(src_path, final_txt, class_id):
                try:
                    img = cv2.imread(src_path)
                    if img is not None:
                        cv2.imwrite(final_img, img)
                        total_saved += 1
                        saved_for_query += 1
                except Exception:
                    pass
            else:
                rejected_count += 1
                    
        print(f"  -> Accepted {saved_for_query} clean images (Filtered out {rejected_count} garbage/person images). Total: {total_saved}/{TARGET_PER_CLASS}")
    
    print(f"✅ Completed {cls_name}: Saved {total_saved} high-quality, person-free images.")
    return total_saved

if __name__ == '__main__':
    print("🚀 Starting AI-Filtered Diverse Multi-Variety Flower Scraping...")
    setup_dirs()
    
    total_all = 0
    for i, cls in enumerate(CLASSES):
        count = scrape_diverse_class(cls, i)
        total_all += count
        
    # Clean up temp
    if os.path.exists(TEMP_DIR):
        try:
            shutil.rmtree(TEMP_DIR)
        except Exception:
            pass
            
    print(f"\n🎉 CLEAN DATASET COMPLETE: Total {total_all} pure botanical images collected across all 5 classes!")
