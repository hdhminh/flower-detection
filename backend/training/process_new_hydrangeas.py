import os
import glob
import re
from PIL import Image
import hashlib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset_v11")
CLASS_ID = 2  # hydrangea

def md5(fname):
    hash_md5 = hashlib.md5()
    with open(fname, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def main():
    print("🚀 Bắt đầu quét ảnh Hydrangea mới...")
    
    train_dir = os.path.join(DATASET_DIR, 'images', 'train', 'hydrangea')
    val_dir = os.path.join(DATASET_DIR, 'images', 'val', 'hydrangea')
    
    # Dọn trùng lặp MD5
    all_images = glob.glob(os.path.join(train_dir, "*.*")) + glob.glob(os.path.join(val_dir, "*.*"))
    seen_hashes = {}
    duplicates = 0
    for img_path in all_images:
        if not os.path.exists(img_path): continue
        h = md5(img_path)
        if h in seen_hashes:
            os.remove(img_path)
            duplicates += 1
        else:
            seen_hashes[h] = img_path
    print(f"✅ Đã xóa {duplicates} ảnh trùng lặp.")
    
    # Ép nhãn ảnh mới
    all_images = glob.glob(os.path.join(train_dir, "*.*")) + glob.glob(os.path.join(val_dir, "*.*"))
    new_images = [f for f in all_images if not os.path.basename(f).startswith("hydrangea_real_")]
    
    if not new_images:
        print("✅ Không có ảnh Hydrangea nào mới.")
    else:
        existing_images = [f for f in all_images if os.path.basename(f).startswith("hydrangea_real_")]
        indices = []
        for f in existing_images:
            match = re.search(r'hydrangea_real_(\d+)', os.path.basename(f))
            if match:
                indices.append(int(match.group(1)))
        current_index = max(indices) + 1 if indices else 0
        
        processed = 0
        for img_path in new_images:
            try:
                img = Image.open(img_path)
                img = img.convert("RGB")
            except Exception as e:
                print(f"[!] Bỏ qua file lỗi: {os.path.basename(img_path)}")
                os.remove(img_path)
                continue
                
            dirname = os.path.dirname(img_path)
            split = 'train' if 'train' in dirname else 'val'
            os.makedirs(os.path.join(DATASET_DIR, 'labels', split, 'hydrangea'), exist_ok=True)
            
            new_img_name = f"hydrangea_real_{current_index:04d}.jpg"
            new_img_path = os.path.join(dirname, new_img_name)
            txt_path = os.path.join(DATASET_DIR, 'labels', split, 'hydrangea', f"hydrangea_real_{current_index:04d}.txt")
            
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(f"{CLASS_ID} 0.500000 0.500000 0.980000 0.980000\n")
                
            img.save(new_img_path, "JPEG")
            img.close()
            os.remove(img_path)
            
            processed += 1
            current_index += 1
            
        print(f"✅ Đã ép nhãn và đổi tên thành công {processed} ảnh Hydrangea.")

    # Cập nhật số liệu
    train_count = len(glob.glob(os.path.join(DATASET_DIR, 'images', 'train', 'hydrangea', '*.jpg')))
    val_count = len(glob.glob(os.path.join(DATASET_DIR, 'images', 'val', 'hydrangea', '*.jpg')))
    total = train_count + val_count
    print(f"📊 Cập nhật bảng: Train={train_count}, Val={val_count}, Tổng={total}")

    # Đọc Artifact để cập nhật (không dùng file ở base dir)
    artifact_path = r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\dataset_status.md"
    if os.path.exists(artifact_path):
        with open(artifact_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        content = re.sub(
            r'\| \*\*Hydrangea\*\* \(Cẩm tú cầu\) \| \d+ \| \d+ \| \*\*\d+\*\* \| \d+ \|',
            f'| **Hydrangea** (Cẩm tú cầu) | {train_count} | {val_count} | **{total}** | 0 |',
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
        
        with open(artifact_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("✅ Đã cập nhật file dataset_status.md trong Artifacts.")

if __name__ == '__main__':
    main()
