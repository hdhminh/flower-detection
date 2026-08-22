import os
import glob
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
import gc

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset_v11")

# Use GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading CLIP model on {device}...")

model_id = "openai/clip-vit-base-patch32"
model = CLIPModel.from_pretrained(model_id, use_safetensors=True).to(device)
processor = CLIPProcessor.from_pretrained(model_id)

CLASSES = ["chrysanthemum", "rose", "hydrangea", "carnation", "sunflower", "other_flower"]

candidate_labels = [
    "a beautiful, high quality, clear, close-up photo of a real flower",
    "a drawing, painting, sketch, cartoon, or digital illustration of a flower",
    "a photo of a person or people",
    "a wide landscape, garden, or far away shot with many tiny flowers",
    "a blurry, noisy, dark, or low quality photo",
    "an advertisement, text, watermark, or graphic design"
]

def review_images():
    images = glob.glob(os.path.join(DATASET_DIR, 'images', '*', 'hydrangea', '*.jpg'))
    if not images:
        images = glob.glob(os.path.join(DATASET_DIR, 'images', '*', 'hydrangea_*.jpg'))
    print(f"🔍 Đang rà soát tổng cộng {len(images)} ảnh bằng CLIP Agent...")
    
    deleted_count = 0
    counts_before = {c: 0 for c in CLASSES}
    counts_after = {c: 0 for c in CLASSES}
    
    # Calculate counts before
    for img_path in images:
        for c in CLASSES:
            if os.path.basename(img_path).startswith(c):
                counts_before[c] += 1
                break

    for i, img_path in enumerate(images):
        try:
            image = Image.open(img_path).convert("RGB")
            
            # Prepare inputs
            inputs = processor(text=candidate_labels, images=image, return_tensors="pt", padding=True)
            inputs = {k: v.to(device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = model(**inputs)
                
            logits_per_image = outputs.logits_per_image # this is the image-text similarity score
            probs = logits_per_image.softmax(dim=1).cpu().numpy()[0]
            
            # Index 0 is the "good" label
            good_prob = probs[0]
            drawing_prob = probs[1]
            person_prob = probs[2]
            landscape_prob = probs[3]
            blurry_prob = probs[4]
            text_prob = probs[5]
            
            is_bad = False
            reason = ""
            
            if good_prob < 0.4:
                is_bad = True
                reason = "Not a good close-up photo"
            if drawing_prob > 0.3:
                is_bad = True
                reason = "Looks like a drawing"
            if person_prob > 0.15:
                is_bad = True
                reason = "Contains people"
            if landscape_prob > 0.4:
                is_bad = True
                reason = "Landscape/Too far"
            if text_prob > 0.2:
                is_bad = True
                reason = "Contains text/ads"
            if blurry_prob > 0.3:
                is_bad = True
                reason = "Blurry/Low quality"
                
            if is_bad:
                print(f"[X] Xóa {os.path.basename(img_path)} (Lý do: {reason} | Điểm tốt: {good_prob:.2f})")
                image.close()
                os.remove(img_path)
                txt_path = img_path.replace('images', 'labels').replace('.jpg', '.txt')
                if os.path.exists(txt_path):
                    os.remove(txt_path)
                deleted_count += 1
                continue
                
            # If good, count it
            image.close()
            for c in CLASSES:
                if os.path.basename(img_path).startswith(c):
                    counts_after[c] += 1
                    break
                    
        except Exception as e:
            print(f"[!] Lỗi khi xử lý {img_path}: {e}")
            
        if (i + 1) % 100 == 0:
            print(f"  -> Đã quét {i + 1}/{len(images)} ảnh...")
            gc.collect()

    print("\n==================================================")
    print(f"🧹 Dọn dẹp hoàn tất! Đã xóa {deleted_count} ảnh rác / chất lượng kém.")
    print("Thống kê số lượng ảnh Real CÒN LẠI:")
    for c in CLASSES:
        print(f"  - {c:15s}: {counts_after[c]} (trước đây: {counts_before[c]})")
        
    # Update dataset_status.md
    with open(os.path.join(BASE_DIR, "..", "..", "dataset_status.md"), "w", encoding="utf-8") as f:
        f.write("# Báo cáo Trạng thái Dataset V11 (SAU KHI LỌC BẰNG CLIP)\n\n")
        f.write("| Loại hoa (Class) | Hoa Thật (Đã lọc) | Hoa Giả (Chờ bạn) |\n")
        f.write("| :--- | :--- | :--- |\n")
        for c in CLASSES:
            f.write(f"| **{c}** | {counts_after[c]} | 0 |\n")
        total = sum(counts_after.values())
        f.write(f"| **Tổng cộng** | **{total}** | **0** |\n")

if __name__ == "__main__":
    review_images()
