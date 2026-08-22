"""
Augment hydrangea images to boost class count.
Creates augmented copies of existing hydrangea images using flips, rotations, color jitter.
"""
import os
import cv2
import numpy as np
import shutil
import glob

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, 'dataset_real')

def augment_image(img):
    """Apply random augmentations to an image."""
    augmented = []
    h, w = img.shape[:2]
    
    # Flip horizontal
    augmented.append(('hflip', cv2.flip(img, 1)))
    # Flip vertical
    augmented.append(('vflip', cv2.flip(img, 0)))
    # Rotate 90
    augmented.append(('rot90', cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)))
    # Rotate 180
    augmented.append(('rot180', cv2.rotate(img, cv2.ROTATE_180)))
    # Rotate 270
    augmented.append(('rot270', cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)))
    # Brightness up
    bright = cv2.convertScaleAbs(img, alpha=1.3, beta=20)
    augmented.append(('bright', bright))
    # Brightness down
    dark = cv2.convertScaleAbs(img, alpha=0.7, beta=-20)
    augmented.append(('dark', dark))
    # Hue shift (bluish -> purplish)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:,:,0] = (hsv[:,:,0] + 15) % 180
    augmented.append(('hue+', cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)))
    # Hue shift (other direction)
    hsv2 = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv2[:,:,0] = (hsv2[:,:,0] - 15) % 180
    augmented.append(('hue-', cv2.cvtColor(hsv2.astype(np.uint8), cv2.COLOR_HSV2BGR)))
    # Gaussian blur
    blurred = cv2.GaussianBlur(img, (5, 5), 0)
    augmented.append(('blur', blurred))
    # Combined: hflip + bright
    augmented.append(('hflip_bright', cv2.convertScaleAbs(cv2.flip(img, 1), alpha=1.2, beta=10)))
    # Combined: rot90 + hue
    hsv3 = cv2.cvtColor(cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE), cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv3[:,:,0] = (hsv3[:,:,0] + 10) % 180
    augmented.append(('rot90_hue', cv2.cvtColor(hsv3.astype(np.uint8), cv2.COLOR_HSV2BGR)))
    
    return augmented

def fix_label_for_transform(label_txt, transform_name, img_shape):
    """Adjust bounding box for geometric transforms."""
    with open(label_txt) as f:
        lines = f.readlines()
    
    new_lines = []
    for line in lines:
        parts = line.strip().split()
        if not parts:
            continue
        cls, cx, cy, bw, bh = parts[0], float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4])
        
        if transform_name == 'hflip':
            cx = 1.0 - cx
        elif transform_name == 'vflip':
            cy = 1.0 - cy
        elif transform_name == 'rot90':
            cx, cy = cy, 1.0 - cx
            bw, bh = bh, bw
        elif transform_name == 'rot180':
            cx, cy = 1.0 - cx, 1.0 - cy
        elif transform_name == 'rot270':
            cx, cy = 1.0 - cy, cx
            bw, bh = bh, bw
        # Color transforms keep same bbox
        elif transform_name == 'hflip_bright':
            cx = 1.0 - cx
        elif transform_name == 'rot90_hue':
            cx, cy = cy, 1.0 - cx
            bw, bh = bh, bw
        
        new_lines.append(f"{cls} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}\n")
    
    return new_lines

def main():
    print("=" * 60)
    print("AUGMENTING HYDRANGEA IMAGES TO BALANCE DATASET")
    print("=" * 60)
    
    # Find all hydrangea images in train
    train_img_dir = os.path.join(DATASET_DIR, 'images', 'train')
    train_lbl_dir = os.path.join(DATASET_DIR, 'labels', 'train')
    
    hydrangea_imgs = []
    for img_file in os.listdir(train_img_dir):
        lbl_file = img_file.replace('.jpg', '.txt')
        lbl_path = os.path.join(train_lbl_dir, lbl_file)
        if os.path.exists(lbl_path):
            with open(lbl_path) as f:
                content = f.read().strip()
                if content and content.split()[0] == '2':  # class 2 = hydrangea
                    hydrangea_imgs.append((
                        os.path.join(train_img_dir, img_file),
                        lbl_path,
                        os.path.splitext(img_file)[0]
                    ))
    
    print(f"Found {len(hydrangea_imgs)} hydrangea training images.")
    
    # Target: ~100 hydrangea images total
    target = 100
    current = len(hydrangea_imgs)
    needed = target - current
    
    aug_count = 0
    source_idx = 0
    
    while aug_count < needed:
        src_img_path, src_lbl_path, base_name = hydrangea_imgs[source_idx % len(hydrangea_imgs)]
        source_idx += 1
        
        img = cv2.imread(src_img_path)
        if img is None:
            continue
        
        augmentations = augment_image(img)
        
        for aug_name, aug_img in augmentations:
            if aug_count >= needed:
                break
            
            new_name = f"aug_hyd_{aug_count:04d}_{aug_name}"
            new_img_path = os.path.join(train_img_dir, f"{new_name}.jpg")
            new_lbl_path = os.path.join(train_lbl_dir, f"{new_name}.txt")
            
            cv2.imwrite(new_img_path, aug_img)
            new_lines = fix_label_for_transform(src_lbl_path, aug_name, aug_img.shape)
            with open(new_lbl_path, 'w') as f:
                f.writelines(new_lines)
            
            aug_count += 1
    
    print(f"Generated {aug_count} augmented hydrangea images.")
    
    # Final class count
    from collections import Counter
    class_counts = Counter()
    for lbl_file in os.listdir(train_lbl_dir):
        lbl_path = os.path.join(train_lbl_dir, lbl_file)
        with open(lbl_path) as f:
            for line in f:
                parts = line.strip().split()
                if parts:
                    class_counts[int(parts[0])] += 1
    
    names = {0: 'chrysanthemum', 1: 'rose', 2: 'hydrangea', 3: 'carnation', 4: 'sunflower', 5: 'other_flower'}
    print("\n=== Final Class Distribution (Train) ===")
    for cls in sorted(class_counts.keys()):
        print(f"  Class {cls} ({names.get(cls, '?'):15s}): {class_counts[cls]} annotations")
    
    total_train = len(os.listdir(train_img_dir))
    total_val = len(os.listdir(os.path.join(DATASET_DIR, 'images', 'val')))
    print(f"\nTotal train: {total_train} | Total val: {total_val} | Grand total: {total_train + total_val}")
    print("=" * 60)
    print("DONE - Ready to train!")

if __name__ == '__main__':
    main()
