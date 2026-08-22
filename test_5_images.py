import os
from ultralytics import YOLO

model = YOLO(r"backend\training\runs\detect\flower_real_v4\weights\best.pt")

images = [
    r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\.user_uploaded\media_1787072171166.jpg",
    r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\.user_uploaded\media_1787072177524.png",
    r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\.user_uploaded\media_1787072180875.jpg",
    r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\.user_uploaded\media_1787072186892.jpg",
    r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\.user_uploaded\media_1787072191630.png"
]

results = model(images, verbose=False, conf=0.1)
for i, r in enumerate(results, 1):
    print(f"--- Hình {i} ---")
    if len(r.boxes) > 0:
        for box in r.boxes:
            cls = int(box.cls[0].item())
            conf = box.conf[0].item()
            name = r.names[cls]
            print(f"Detected: {name} (Confidence: {conf:.2f})")
    else:
        print("No flower detected (Background/unknown)")
