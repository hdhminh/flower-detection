import os
import glob
import pathlib

# Fix for windows unicode stdout and WinError 1337
original_exists = pathlib.Path.exists
def safe_exists(self):
    try: return original_exists(self)
    except OSError: return False
pathlib.Path.exists = safe_exists

from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset_v11")

CLASS_MAPPING = {
    'chrysanthemum': 0,
    'rose': 1,
    'hydrangea': 2,
    'carnation': 3,
    'sunflower': 4,
    'other_flower': 5
}

def main():
    print("🚀 Bắt đầu re-annotate 1433 ảnh Real bằng YOLO-World...")
    
    model = YOLO("yolov8s-worldv2.pt")
    
    # Set classes ONCE to avoid CUDA/CPU device mismatch errors
    all_classes = ['chrysanthemum', 'rose', 'hydrangea', 'carnation', 'sunflower', 'flower', 'plant']
    model.set_classes(all_classes)
    
    # Duyệt qua train và val
    for split in ['train', 'val']:
        split_dir = os.path.join(DATASET_DIR, 'images', split)
        
        for class_name, class_id in CLASS_MAPPING.items():
            class_dir = os.path.join(split_dir, class_name)
            if not os.path.exists(class_dir):
                continue
                
            images = glob.glob(os.path.join(class_dir, "*.*"))
            if not images:
                continue
                
            print(f"📦 Đang xử lý {len(images)} ảnh {class_name} trong tập {split}...")
            
            # Cấu hình từ khóa tìm kiếm cho YOLO-World
            target_class_idx = all_classes.index(class_name) if class_name in all_classes else all_classes.index('flower')
            flower_idx = all_classes.index('flower')
            plant_idx = all_classes.index('plant')
            
            for img_path in images:
                basename = os.path.basename(img_path)
                txt_name = os.path.splitext(basename)[0] + ".txt"
                label_dir = os.path.join(DATASET_DIR, 'labels', split, class_name)
                os.makedirs(label_dir, exist_ok=True)
                txt_path = os.path.join(label_dir, txt_name)
                
                # Chạy inference conf 0.1
                results = model(img_path, conf=0.1, verbose=False)
                valid_boxes = [b for b in results[0].boxes if int(b.cls[0].item()) in [target_class_idx, flower_idx, plant_idx]]
                
                if len(valid_boxes) == 0:
                    # Lớp 2: Rà vét, tìm conf cực thấp 0.01
                    results = model(img_path, conf=0.01, verbose=False)
                    valid_boxes = [b for b in results[0].boxes if int(b.cls[0].item()) in [target_class_idx, flower_idx, plant_idx]]
                
                # Viết lại file txt
                with open(txt_path, "w", encoding="utf-8") as f:
                    if len(valid_boxes) > 0:
                        for box in valid_boxes:
                            # Lấy tọa độ center_x, center_y, width, height (chuẩn YOLO)
                            x_c, y_c, w, h = box.xywhn[0].tolist()
                            f.write(f"{class_id} {x_c:.6f} {y_c:.6f} {w:.6f} {h:.6f}\n")
                    else:
                        # Tuyệt đối không bỏ qua ảnh, nếu mọi lớp quét đều fail (rất hiếm), 
                        # lấy vùng trung tâm 60% ảnh
                        f.write(f"{class_id} 0.5 0.5 0.6 0.6\n")

    print("✅ Đã hoàn tất Re-annotate cho toàn bộ dataset!")

if __name__ == '__main__':
    main()
