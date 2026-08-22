"""
Convert raw classified image directories (e.g. raw_data/rose/*.jpg) into YOLO format.
Generates images/train, images/val, labels/train, labels/val and config.yaml.
"""
import os
import shutil
import random
import argparse
from pathlib import Path
from PIL import Image

CLASS_MAPPING = {
    "chrysanthemum": 0,
    "cuc": 0,
    "hoa_cuc": 0,
    "rose": 1,
    "hong": 1,
    "hoa_hong": 1,
    "hydrangea": 2,
    "cam_tu_cau": 2,
    "tu_cau": 2,
    "carnation": 3,
    "cam_chuong": 3,
    "hoa_cam_chuong": 3,
    "sunflower": 4,
    "huong_duong": 4,
    "hoa_huong_duong": 4
}

def convert_to_yolo(source_dir: str, output_dir: str, val_ratio: float = 0.2, seed: int = 42):
    random.seed(seed)
    src_path = Path(source_dir).resolve()
    out_path = Path(output_dir).resolve()

    print(f"🔄 Converting directory from: {src_path}")
    print(f"📁 Target YOLO dataset path : {out_path}")

    # Prepare directories
    for split in ["train", "val"]:
        (out_path / "images" / split).mkdir(parents=True, exist_ok=True)
        (out_path / "labels" / split).mkdir(parents=True, exist_ok=True)

    total_processed = 0

    for class_folder in src_path.iterdir():
        if not class_folder.is_dir():
            continue

        folder_name = class_folder.name.lower()
        class_id = CLASS_MAPPING.get(folder_name)
        if class_id is None:
            # Try partial matching
            for key, cid in CLASS_MAPPING.items():
                if key in folder_name:
                    class_id = cid
                    break

        if class_id is None:
            print(f"⚠️ Skipping unrecognized directory: {class_folder.name}")
            continue

        images = list(class_folder.glob("*.[jJ][pP][gG]")) + \
                 list(class_folder.glob("*.[jJ][pP][eE][gG]")) + \
                 list(class_folder.glob("*.[pP][nN][gG]")) + \
                 list(class_folder.glob("*.[wW][eE][bB][pP]"))

        random.shuffle(images)
        val_count = int(len(images) * val_ratio)
        val_images = set(images[:val_count])

        print(f"🌸 Processing class '{class_folder.name}' (ID {class_id}): {len(images)} images -> {len(images) - val_count} train / {val_count} val")

        for img in images:
            split = "val" if img in val_images else "train"
            dst_img = out_path / "images" / split / f"{class_id}_{img.stem}{img.suffix}"
            dst_lbl = out_path / "labels" / split / f"{class_id}_{img.stem}.txt"

            shutil.copy2(img, dst_img)

            # Auto-generate centered bounding box for single-flower images:
            # x_center=0.5, y_center=0.5, width=0.9, height=0.9
            with open(dst_lbl, "w", encoding="utf-8") as lf:
                lf.write(f"{class_id} 0.5 0.5 0.9 0.9\n")

            total_processed += 1

    print(f"✅ Converted {total_processed} images into YOLO dataset structure at: {out_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert directory of flower images into YOLO format")
    parser.add_argument("--source", type=str, required=True, help="Path to folder containing subfolders of flower classes")
    parser.add_argument("--output", type=str, default="../training/dataset", help="Destination YOLO dataset folder")
    parser.add_argument("--val-ratio", type=float, default=0.2, help="Ratio of validation set")
    args = parser.parse_args()

    convert_to_yolo(args.source, args.output, args.val_ratio)
