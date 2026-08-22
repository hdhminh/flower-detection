import os
import cv2
import pathlib
original_exists = pathlib.Path.exists
def safe_exists(self):
    try: return original_exists(self)
    except OSError: return False
pathlib.Path.exists = safe_exists

from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_DIR = os.path.join(BASE_DIR, "dataset_v11", "test_fake_images")
WEIGHTS_PATH = os.path.join(BASE_DIR, "runs", "detect", "flower_yolo26s_v12", "weights", "best.pt")
OUTPUT_MD = os.path.join(BASE_DIR, "inference_results_v12.md")

CLASS_NAMES = {
    0: 'chrysanthemum (Cúc)',
    1: 'rose (Hồng)',
    2: 'hydrangea (Cẩm tú cầu)',
    3: 'carnation (Cẩm chướng)',
    4: 'sunflower (Hướng dương)',
    5: 'other_flower (Hoa khác)'
}

def main():
    if not os.path.exists(WEIGHTS_PATH):
        print(f"Lỗi: Không tìm thấy file weights {WEIGHTS_PATH}")
        return

    print("🚀 Đang tải mô hình YOLO V12 tốt nhất...")
    model = YOLO(WEIGHTS_PATH)
    
    test_files = sorted([f for f in os.listdir(TEST_DIR) if f.endswith('.jpg')])
    
    results_md = "# Báo cáo Kết quả Dự đoán 5 Hoa Giả (Mô hình V12)\n\n"
    results_md += "| File Ảnh | Nhãn Thực Tế | Nhãn AI Dự Đoán (V12) | Độ Tin Cậy | Đánh Giá |\n"
    results_md += "| :--- | :--- | :--- | :--- | :--- |\n"
    
    expected_labels = {
        '01_cuc.jpg': 'chrysanthemum (Cúc)',
        '02_cam_tu_cau.jpg': 'hydrangea (Cẩm tú cầu)',
        '03_cam_chuong.jpg': 'carnation (Cẩm chướng)',
        '04_huong_duong.jpg': 'sunflower (Hướng dương)',
        '05_hong.jpg': 'rose (Hồng)'
    }
    
    for f in test_files:
        img_path = os.path.join(TEST_DIR, f)
        expected = expected_labels.get(f, 'Không rõ')
        
        results = model(img_path, verbose=False)
        r = results[0]
        
        predicted = "Không nhận diện được"
        conf_str = "0%"
        status = "❌ FAIL"
        
        if len(r.boxes) > 0:
            best_box = max(r.boxes, key=lambda b: b.conf[0].item())
            cls_id = int(best_box.cls[0].item())
            conf = best_box.conf[0].item()
            
            predicted = CLASS_NAMES.get(cls_id, f"Class {cls_id}")
            conf_str = f"{conf*100:.1f}%"
            
            if predicted == expected:
                status = "✅ PASS"
            else:
                status = "⚠️ WRONG CLASS"
        
        # We will reference the images stored in scratch for embedding
        img_embed = f"![{f}](/C:/Users/Admin/.gemini/antigravity-ide/brain/793124c9-f742-4a64-b7be-4bd5984c4d91/scratch/predicted_v12_{f})"
        
        results_md += f"| {img_embed} | **{expected}** | {predicted} | {conf_str} | **{status}** |\n"
        
        img = r.plot()
        out_img_path = os.path.join(r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\scratch", f"predicted_v12_{f}")
        cv2.imwrite(out_img_path, img)

    with open(OUTPUT_MD, "w", encoding="utf-8") as file:
        file.write(results_md)
        
    print(f"✅ Hoàn tất dự đoán! Đã xuất bảng báo cáo tại {OUTPUT_MD}")

if __name__ == '__main__':
    main()
