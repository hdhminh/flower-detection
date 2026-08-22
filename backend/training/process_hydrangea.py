import os
import glob
import cv2
import random
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset_v11")
SOURCE_DIR = r"C:\Users\Admin\.cache\kagglehub\datasets\aksha05\flower-image-dataset\versions\1\flowers"

CLASS_ID = 2  # hydrangea

def main():
    print("🚀 Trích xuất nhanh 60 ảnh Hydrangea chất lượng cao từ Dataset 1...")
    
    images = glob.glob(os.path.join(SOURCE_DIR, "*hydrangea*.jpg"))
    
    if not images:
        print("❌ Không tìm thấy ảnh nào!")
        return
        
    random.shuffle(images)
    
    saved_count = 0
    for i, img_path in enumerate(images):
        try:
            split = 'val' if (saved_count % 5 == 0) else 'train'
            
            os.makedirs(os.path.join(DATASET_DIR, 'images', split, 'hydrangea'), exist_ok=True)
            os.makedirs(os.path.join(DATASET_DIR, 'labels', split, 'hydrangea'), exist_ok=True)
            
            img_name = f"hydrangea_real_{saved_count:04d}.jpg"
            final_img = os.path.join(DATASET_DIR, 'images', split, 'hydrangea', img_name)
            final_txt = os.path.join(DATASET_DIR, 'labels', split, 'hydrangea', f"hydrangea_real_{saved_count:04d}.txt")
            
            # Gán Box ở giữa (ảnh classification crop rất sát)
            with open(final_txt, 'w', encoding='utf-8') as f:
                f.write(f"{CLASS_ID} 0.500000 0.500000 0.980000 0.980000\n")
                
            shutil.copy(img_path, final_img)
            saved_count += 1
                
        except Exception as e:
            continue
            
    print(f"\n✅ Hoàn tất! Đã copy {saved_count} ảnh Hydrangea.")
    
    # Update status markdown
    with open(os.path.join(BASE_DIR, "..", "..", "dataset_status.md"), "r", encoding="utf-8") as f:
        content = f.read()
    
    content = content.replace("| **Hydrangea** (Cẩm tú cầu) | 0 | 0 |", f"| **Hydrangea** (Cẩm tú cầu) | {saved_count} | 0 |")
    
    with open(os.path.join(BASE_DIR, "..", "..", "dataset_status.md"), "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == '__main__':
    main()
