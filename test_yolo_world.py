from ultralytics import YOLOWorld

def test_yolo_world():
    # Load YOLO-World model
    model = YOLOWorld('yolov8s-worldv2.pt')
    
    # Set custom classes
    model.set_classes(["chrysanthemum flower", "rose flower", "hydrangea flower", "carnation flower", "sunflower", "flower"])
    
    images = [
        r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\.user_uploaded\media_1787072171166.jpg",
        r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\.user_uploaded\media_1787072177524.png",
        r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\.user_uploaded\media_1787072180875.jpg",
        r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\.user_uploaded\media_1787072186892.jpg",
        r"C:\Users\Admin\.gemini\antigravity-ide\brain\793124c9-f742-4a64-b7be-4bd5984c4d91\.user_uploaded\media_1787072191630.png"
    ]
    
    results = model(images)
    for i, r in enumerate(results, 1):
        print(f"--- Image {i} ---")
        for box in r.boxes:
            cls = int(box.cls[0].item())
            conf = box.conf[0].item()
            name = r.names[cls]
            print(f"  Detected: {name} (Conf: {conf:.2f})")

if __name__ == "__main__":
    test_yolo_world()
