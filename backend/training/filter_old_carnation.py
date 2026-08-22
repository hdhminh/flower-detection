import os
import glob
import cv2
import numpy as np
import scipy.io
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset_v11")
OXFORD_DIR = os.path.join(BASE_DIR, "data", "flowers-102")
LABELS_FILE = os.path.join(OXFORD_DIR, "imagelabels.mat")

def main():
    print("[Step 1] Bat dau loc 102 anh Hoa Lay On ra khoi nhom Carnation...")
    
    if not os.path.exists(LABELS_FILE):
        print(f"[-] Không tìm thấy {LABELS_FILE}")
        return

    labels = scipy.io.loadmat(LABELS_FILE)['labels'][0]
    
    # Load thumbnails of Oxford images labeled 31 and 43
    oxford_thumbs = {}
    for i, l in enumerate(labels):
        if l in [31, 43]:
            fname = f"image_{i+1:05d}.jpg"
            fpath = os.path.join(OXFORD_DIR, "jpg", fname)
            if os.path.exists(fpath):
                img = cv2.imread(fpath)
                if img is not None:
                    thumb = cv2.resize(img, (32, 32)).astype(np.float32)
                    oxford_thumbs[fname] = (thumb, l)
                    
    moved_count = 0
    kept_count = 0
    
    for split in ['train', 'val']:
        carnation_img_dir = os.path.join(DATASET_DIR, 'images', split, 'carnation')
        carnation_lbl_dir = os.path.join(DATASET_DIR, 'labels', split, 'carnation')
        other_img_dir = os.path.join(DATASET_DIR, 'images', split, 'other_flower')
        other_lbl_dir = os.path.join(DATASET_DIR, 'labels', split, 'other_flower')
        
        os.makedirs(other_img_dir, exist_ok=True)
        os.makedirs(other_lbl_dir, exist_ok=True)
        
        img_files = glob.glob(os.path.join(carnation_img_dir, "*.jpg"))
        
        for img_p in img_files:
            bname = os.path.basename(img_p)
            base_no_ext = os.path.splitext(bname)[0]
            txt_p = os.path.join(carnation_lbl_dir, base_no_ext + ".txt")
            
            img = cv2.imread(img_p)
            if img is None:
                continue
                
            thumb = cv2.resize(img, (32, 32)).astype(np.float32)
            
            best_mse = float('inf')
            best_lbl = None
            
            for fname, (othumb, olbl) in oxford_thumbs.items():
                mse = np.mean((thumb - othumb) ** 2)
                if mse < best_mse:
                    best_mse = mse
                    best_lbl = olbl
                    
            if best_lbl == 43: # Sword Lily -> Move to other_flower
                target_img_p = os.path.join(other_img_dir, f"sword_lily_{bname}")
                shutil.move(img_p, target_img_p)
                
                if os.path.exists(txt_p):
                    target_txt_p = os.path.join(other_lbl_dir, f"sword_lily_{base_no_ext}.txt")
                    # Update label class_id to 5 (other_flower)
                    with open(txt_p, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    new_lines = []
                    for line in lines:
                        parts = line.strip().split()
                        if parts:
                            parts[0] = '5' # other_flower
                            new_lines.append(" ".join(parts) + "\n")
                    with open(target_txt_p, 'w', encoding='utf-8') as f:
                        f.writelines(new_lines)
                    os.remove(txt_p)
                moved_count += 1
            else:
                kept_count += 1
                
    print(f"[Done] Da chuyen {moved_count} anh Hoa Lay On sang other_flower, giu lai {kept_count} anh Cam Chuong chuan.")

if __name__ == '__main__':
    main()
