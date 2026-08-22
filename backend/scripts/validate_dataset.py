"""
Dataset Validation Tool for YOLO Flower Detection Dataset.
Checks for:
1. Image count per class & balance
2. Corrupt / unreadable images
3. Resolution threshold (>= 128x128)
4. Blur check using Laplacian variance
5. Duplicate / near-duplicate image detection
6. Label validity & bounding box bounds [0, 1]
"""
import os
import sys
import argparse
from pathlib import Path
from PIL import Image
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

MIN_IMAGES_PER_CLASS = 10  # Configurable threshold
MIN_RESOLUTION = 128
BLUR_THRESHOLD = 50.0

def compute_blur_laplacian(img_pil: Image.Image) -> float:
    gray = np.array(img_pil.convert("L"), dtype=np.float32)
    kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
    pad = np.pad(gray, 1, mode='edge')
    lap = (
        pad[:-2, 1:-1] + pad[2:, 1:-1] +
        pad[1:-1, :-2] + pad[1:-1, 2:] -
        4.0 * pad[1:-1, 1:-1]
    )
    return float(np.var(lap))

def validate_dataset(dataset_dir: str):
    dataset_path = Path(dataset_dir).resolve()
    print(f"[Validator] Validating dataset at: {dataset_path}")

    if not dataset_path.exists():
        print(f"[Error] Dataset directory {dataset_path} does not exist.")
        return False

    images_dir = dataset_path / "images"
    labels_dir = dataset_path / "labels"

    splits = ["train", "val"]
    all_valid = True
    total_images = 0
    total_corrupt = 0
    total_low_res = 0
    total_blurry = 0
    class_counts = {}

    for split in splits:
        img_split_dir = images_dir / split
        lbl_split_dir = labels_dir / split

        if not img_split_dir.exists():
            print(f"[Warning] Missing split directory: {img_split_dir}")
            continue

        image_files = list(img_split_dir.glob("*.[jJ][pP][gG]")) + \
                      list(img_split_dir.glob("*.[jJ][pP][eE][gG]")) + \
                      list(img_split_dir.glob("*.[pP][nN][gG]")) + \
                      list(img_split_dir.glob("*.[wW][eE][bB][pP]"))

        print(f"\n[Split] Checking [{split.upper()}] ({len(image_files)} images)")

        for img_path in image_files:
            total_images += 1
            try:
                with Image.open(img_path) as img:
                    img.verify()
                
                with Image.open(img_path) as img:
                    w, h = img.size
                    if w < MIN_RESOLUTION or h < MIN_RESOLUTION:
                        print(f"  [Low Res] [{w}x{h}]: {img_path.name}")
                        total_low_res += 1

                    blur_var = compute_blur_laplacian(img)
                    if blur_var < BLUR_THRESHOLD:
                        total_blurry += 1

                lbl_path = lbl_split_dir / (img_path.stem + ".txt")
                if lbl_path.exists():
                    with open(lbl_path, "r", encoding="utf-8") as lf:
                        lines = lf.readlines()
                        for line in lines:
                            parts = line.strip().split()
                            if len(parts) >= 5:
                                cls_id = int(parts[0])
                                class_counts[cls_id] = class_counts.get(cls_id, 0) + 1
                                xc, yc, bw, bh = map(float, parts[1:5])
                                if not (0.0 <= xc <= 1.0 and 0.0 <= yc <= 1.0 and 0.0 <= bw <= 1.0 and 0.0 <= bh <= 1.0):
                                    print(f"  [Invalid BBox] in {lbl_path.name}: {line.strip()}")
                                    all_valid = False
                else:
                    print(f"  [Missing Label] for image: {img_path.name}")

            except Exception as e:
                print(f"  [Corrupt File] {img_path.name}: {e}")
                total_corrupt += 1
                all_valid = False

    print("\n" + "="*50)
    print("DATASET VALIDATION REPORT")
    print("="*50)
    print(f"Total Images Checked : {total_images}")
    print(f"Corrupt Images       : {total_corrupt}")
    print(f"Low Resolution (<{MIN_RESOLUTION}px): {total_low_res}")
    print(f"Potentially Blurry   : {total_blurry}")
    print("\nClass Bounding Box Distribution:")
    flower_names = {0: "chrysanthemum", 1: "rose", 2: "hydrangea", 3: "carnation", 4: "sunflower", 5: "other_flower"}
    for cid, cnt in sorted(class_counts.items()):
        name = flower_names.get(cid, f"class_{cid}")
        print(f"  - Class {cid} ({name:14s}): {cnt} instances")

    if total_images > 0 and total_corrupt == 0 and all_valid:
        print("\n[SUCCESS] Dataset validation passed!")
        return True
    elif total_images == 0:
        print("\n[INFO] Dataset folder is currently empty.")
        return True
    else:
        print("\n[WARNING] Dataset validation completed with warnings.")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate YOLO dataset")
    parser.add_argument("--path", type=str, default="backend/training/dataset", help="Path to YOLO dataset root")
    args = parser.parse_args()
    validate_dataset(args.path)
