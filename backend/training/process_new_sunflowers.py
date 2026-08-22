import os
import glob
import re
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset_v11")
CLASS_ID = 4

def main():
    print("🚀 Bắt đầu xử lý nốt các file cứng đầu (chữ tiếng Việt có dấu, đuôi .avif, .webp)...")
    
    train_dir = os.path.join(DATASET_DIR, 'images', 'train', 'sunflower')
    val_dir = os.path.join(DATASET_DIR, 'images', 'val', 'sunflower')
    
    all_images = glob.glob(os.path.join(train_dir, "*.*")) + glob.glob(os.path.join(val_dir, "*.*"))
    new_images = [f for f in all_images if not os.path.basename(f).startswith("sunflower_real_")]
    
    if not new_images:
        print("✅ Đã hết sạch ảnh tồn đọng.")
        return
        
    print(f"🌸 Xử lý bằng Pillow cho {len(new_images)} ảnh cứng đầu...")
    
    existing_images = [f for f in all_images if os.path.basename(f).startswith("sunflower_real_")]
    indices = []
    for f in existing_images:
        match = re.search(r'sunflower_real_(\d+)', os.path.basename(f))
        if match:
            indices.append(int(match.group(1)))
    current_index = max(indices) + 1 if indices else 0
    
    processed_count = 0
    for img_path in new_images:
        try:
            # Dùng Pillow để xử lý tên tiếng Việt hoặc đuôi lạ
            try:
                img = Image.open(img_path)
                img = img.convert("RGB")
            except Exception as e:
                print(f"[!] Pillow cũng bó tay với file {os.path.basename(img_path)} (Có thể do đuôi .avif chưa cài plugin hoặc file hỏng). Lệnh: Xóa rác này.")
                os.remove(img_path)
                continue
                
            dirname = os.path.dirname(img_path)
            split = 'train' if 'train' in dirname else 'val'
            
            os.makedirs(os.path.join(DATASET_DIR, 'labels', split, 'sunflower'), exist_ok=True)
            
            new_img_name = f"sunflower_real_{current_index:04d}.jpg"
            new_img_path = os.path.join(dirname, new_img_name)
            txt_path = os.path.join(DATASET_DIR, 'labels', split, 'sunflower', f"sunflower_real_{current_index:04d}.txt")
            
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(f"{CLASS_ID} 0.500000 0.500000 0.980000 0.980000\n")
                
            img.save(new_img_path, "JPEG")
            img.close()
            os.remove(img_path)
            
            processed_count += 1
            current_index += 1
            
        except Exception as e:
            print(f"[Lỗi] {os.path.basename(img_path)}: {e}")
            continue
            
    print(f"✅ Hoàn tất! Đã vớt vát được {processed_count} ảnh.")
    
    train_count = len(glob.glob(os.path.join(DATASET_DIR, 'images', 'train', 'sunflower', '*.jpg')))
    val_count = len(glob.glob(os.path.join(DATASET_DIR, 'images', 'val', 'sunflower', '*.jpg')))
    total = train_count + val_count
    
    print(f"📊 Cập nhật bảng: Train={train_count}, Val={val_count}, Tổng={total}")

    with open(os.path.join(BASE_DIR, "..", "..", "dataset_status.md"), "r", encoding="utf-8") as f:
        content = f.read()
    
    content = re.sub(
        r'\| \*\*Sunflower\*\* \(Hướng dương\) \| \d+ \| \d+ \| \*\*\d+\*\* \| \d+ \|',
        f'| **Sunflower** (Hướng dương) | {train_count} | {val_count} | **{total}** | 0 |',
        content
    )
    
    lines = content.split('\n')
    new_total = sum([int(re.search(r'\| \*\*(\d+)\*\* \|', line).group(1)) for line in lines if line.startswith('| **') and 'TỔNG CỘNG' not in line and re.search(r'\| \*\*(\d+)\*\* \|', line)])
    new_train_total = sum([int(re.findall(r'\|\s*(\d+)\s*\|', line)[0]) for line in lines if line.startswith('| **') and 'TỔNG CỘNG' not in line and re.findall(r'\|\s*(\d+)\s*\|', line)])
    new_val_total = sum([int(re.findall(r'\|\s*(\d+)\s*\|', line)[1]) for line in lines if line.startswith('| **') and 'TỔNG CỘNG' not in line and len(re.findall(r'\|\s*(\d+)\s*\|', line)) > 1])
    
    content = re.sub(
        r'\| \*\*TỔNG CỘNG\*\* \| \*\*\d+\*\* \| \*\*\d+\*\* \| \*\*\d+\*\* \| \*\*\d+\*\* \|',
        f'| **TỔNG CỘNG** | **{new_train_total}** | **{new_val_total}** | **{new_total}** | **0** |',
        content
    )
    
    with open(os.path.join(BASE_DIR, "..", "..", "dataset_status.md"), "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == '__main__':
    main()
