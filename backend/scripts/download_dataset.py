"""
Dataset utility: generates synthetic/sample dataset images or downloads flower dataset for training & verification.
"""
import os
import sys
import argparse
import random
from pathlib import Path
from PIL import Image, ImageDraw

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CLASSES = [
    {"id": 0, "name": "chrysanthemum", "color": (255, 220, 50)},
    {"id": 1, "name": "rose", "color": (230, 40, 70)},
    {"id": 2, "name": "hydrangea", "color": (120, 180, 245)},
    {"id": 3, "name": "lavender", "color": (160, 110, 230)},
    {"id": 4, "name": "sunflower", "color": (250, 190, 20)}
]

def generate_sample_dataset(output_dir: str = "../training/dataset", num_per_class: int = 15):
    """Generates sample procedural images for each flower class to bootstrap dataset & test pipelines."""
    out_path = Path(output_dir).resolve()
    print(f"[Dataset] Generating sample dataset at: {out_path}")

    for split in ["train", "val"]:
        (out_path / "images" / split).mkdir(parents=True, exist_ok=True)
        (out_path / "labels" / split).mkdir(parents=True, exist_ok=True)

    total = 0
    for cls in CLASSES:
        cid = cls["id"]
        cname = cls["name"]
        base_color = cls["color"]

        for i in range(num_per_class):
            split = "val" if i < max(2, int(num_per_class * 0.2)) else "train"
            img_name = f"{cname}_{i:03d}"
            
            # Create a 640x640 canvas
            bg_color = (random.randint(220, 255), random.randint(220, 255), random.randint(220, 255))
            img = Image.new("RGB", (640, 640), bg_color)
            draw = ImageDraw.Draw(img)

            # Randomize flower position and size
            cx = random.randint(220, 420)
            cy = random.randint(220, 420)
            r = random.randint(100, 180)

            # Decorative color shift (simulating decorative artificial flowers)
            color_shift = (
                max(0, min(255, base_color[0] + random.randint(-40, 40))),
                max(0, min(255, base_color[1] + random.randint(-40, 40))),
                max(0, min(255, base_color[2] + random.randint(-40, 40)))
            )

            # Draw representative flower morphology
            if cid == 0:  # Chrysanthemum - multiple layered petals
                for angle_deg in range(0, 360, 15):
                    rad = angle_deg * 3.14159 / 180.0
                    px = cx + int((r - 20) * (0.8 + 0.2 * random.random()) * 0.7 * (1 if angle_deg % 30 == 0 else 0.9) * (random.random() * 0.2 + 0.9))
                    py = cy + int((r - 20) * (0.8 + 0.2 * random.random()) * 0.7 * (random.random() * 0.2 + 0.9))
                    draw.ellipse([cx - r + 30, cy - r + 30, cx + r - 30, cy + r - 30], outline=color_shift, width=3)
                draw.ellipse([cx - 30, cy - 30, cx + 30, cy + 30], fill=(255, 180, 0))
            elif cid == 1:  # Rose - spiral swirl
                draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color_shift)
                for step in range(10, r, 15):
                    draw.arc([cx - step, cy - step, cx + step, cy + step], start=random.randint(0, 90), end=random.randint(200, 350), fill=(180, 20, 40), width=4)
            elif cid == 2:  # Hydrangea - cluster of small spheres
                for _ in range(25):
                    ox = cx + random.randint(-r//2, r//2)
                    oy = cy + random.randint(-r//2, r//2)
                    draw.ellipse([ox - 25, oy - 25, ox + 25, oy + 25], fill=color_shift, outline=(255, 255, 255))
            elif cid == 3:  # Lavender - vertical spike
                for sy in range(cy - r, cy + r, 16):
                    for sx in [cx - 15, cx, cx + 15]:
                        draw.ellipse([sx - 10, sy - 8, sx + 10, sy + 8], fill=color_shift)
            elif cid == 4:  # Sunflower - dark center disk + bright petals
                draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 200, 0), fill=(255, 215, 0), width=10)
                draw.ellipse([cx - r//2, cy - r//2, cx + r//2, cy + r//2], fill=(90, 50, 20))

            img_path = out_path / "images" / split / f"{img_name}.jpg"
            lbl_path = out_path / "labels" / split / f"{img_name}.txt"

            img.save(img_path, quality=95)

            # YOLO bbox: x_center, y_center, width, height normalized
            norm_cx = cx / 640.0
            norm_cy = cy / 640.0
            norm_w = min(1.0, (r * 2.2) / 640.0)
            norm_h = min(1.0, (r * 2.2) / 640.0)

            with open(lbl_path, "w", encoding="utf-8") as lf:
                lf.write(f"{cid} {norm_cx:.4f} {norm_cy:.4f} {norm_w:.4f} {norm_h:.4f}\n")

            total += 1

    print(f"[Dataset] Generated {total} sample images and labels across 5 classes!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=str, default="../training/dataset")
    parser.add_argument("--count", type=int, default=15)
    args = parser.parse_args()
    generate_sample_dataset(args.output, args.count)
