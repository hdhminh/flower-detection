import os
import collections

lbl_dir = os.path.join(os.path.dirname(__file__), 'dataset_real', 'labels', 'train')
class_counts = collections.Counter()
for f in os.listdir(lbl_dir):
    with open(os.path.join(lbl_dir, f)) as fp:
        for line in fp:
            parts = line.strip().split()
            if parts:
                class_counts[parts[0]] += 1

names = {0: 'chrysanthemum', 1: 'rose', 2: 'hydrangea', 3: 'carnation', 4: 'sunflower', 5: 'other_flower'}
print("=== Class Distribution (Train) ===")
for cls, cnt in sorted(class_counts.items()):
    print(f"  Class {cls} ({names.get(int(cls), '?')}) : {cnt} annotations")
print(f"Total files: {len(os.listdir(lbl_dir))}")
