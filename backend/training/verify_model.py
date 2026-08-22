import os
from ultralytics import YOLO

def verify():
    import glob
    runs = sorted(glob.glob(r"f:\AI_Model\flower dectection\runs\detect\flower_real_model_v2*"))
    latest_run = runs[-1] if runs else r"f:\AI_Model\flower dectection\runs\detect\flower_real_model_v2"
    model_path = os.path.join(latest_run, "weights", "best.pt")
    val_dir = r"f:\AI_Model\flower dectection\backend\training\dataset_real\images\val"
    
    print(f"Testing model from: {model_path}")
    
    model = YOLO(model_path)
    names = model.names
    results = model.predict(val_dir, save=True, device="cpu", conf=0.005)
    
    print("\n=======================================================")
    print("           🌸 MODEL VERIFICATION TEST REPORT           ")
    print("=======================================================")
    correct = 0
    total = len(results)
    
    for r in results:
        fname = os.path.basename(r.path)
        expected = fname.split("_")[0]
        detected = [names[int(c)] for c in r.boxes.cls.tolist()]
        confs = [round(float(c), 3) for c in r.boxes.conf.tolist()]
        
        is_hit = expected in detected if len(detected) > 0 else False
        if is_hit:
            correct += 1
            status = "✅ PASS"
        elif len(detected) == 0:
            status = "⚪ NO DETECT"
        else:
            status = "❌ MISMATCH"
            
        print(f"[{status}] File: {fname:<28} Expected: {expected:<15} Detected: {str(detected):<30} Confs: {confs}")
        
    print("=======================================================")
    print(f"Summary: {correct}/{total} images matched expected class.")
    print("=======================================================")

if __name__ == "__main__":
    verify()
