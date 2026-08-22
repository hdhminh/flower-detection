import os
import shutil
import glob

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset_v11")

CLASSES = ["chrysanthemum", "rose", "hydrangea", "carnation", "sunflower", "other_flower"]

def reorganize():
    print("🚀 Bắt đầu tổ chức lại thư mục theo từng loại hoa...")
    moved_count = 0
    
    for split in ['train', 'val']:
        for sub in ['images', 'labels']:
            base_path = os.path.join(DATASET_DIR, sub, split)
            if not os.path.exists(base_path):
                continue
                
            # Tạo các thư mục con cho từng loài hoa
            for c in CLASSES:
                os.makedirs(os.path.join(base_path, c), exist_ok=True)
                
            # Lấy tất cả các file trực tiếp trong thư mục (không lấy trong thư mục con)
            for ext in ['*.jpg', '*.png', '*.webp', '*.txt']:
                for file_path in glob.glob(os.path.join(base_path, ext)):
                    if os.path.isdir(file_path): continue
                    
                    filename = os.path.basename(file_path)
                    
                    # Xác định file thuộc hoa nào dựa vào prefix
                    target_class = None
                    for c in CLASSES:
                        if filename.startswith(c):
                            target_class = c
                            break
                            
                    if target_class:
                        new_path = os.path.join(base_path, target_class, filename)
                        shutil.move(file_path, new_path)
                        moved_count += 1
                        
    print(f"✅ Hoàn thành! Đã di chuyển và phân loại {moved_count} files vào các thư mục con tương ứng.")

if __name__ == '__main__':
    reorganize()
