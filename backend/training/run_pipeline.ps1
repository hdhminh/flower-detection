$PythonExe = "C:\Users\Admin\AppData\Local\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\python.exe"

Write-Host "--- STEP 1: DOWNLOADING REAL IMAGES ---"
& $PythonExe scrape_and_annotate.py

Write-Host "--- STEP 2: TRAINING YOLOv11s ON REAL DATASET ---"
& $PythonExe train_real.py

Write-Host "--- STEP 3: EXPORTING ONNX AND DEPLOYING TO FRONTEND ---"
& $PythonExe export_real.py

Write-Host "--- ALL DONE ---"
