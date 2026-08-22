import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, Upload, ScanLine, Brain,
  Package, SlidersHorizontal, Monitor, Server, Leaf, RotateCcw,
  X, Workflow, ArrowRight, Settings2, Gauge, ArrowRightLeft,
  Sparkles
} from 'lucide-react';
import { useLang } from '../lang';
import { RollingTextHeader } from './RollingTextHeader';
import './ArchitectureDiagram.css';

// ─── Canvas dimensions — optimized for full-width presentation ──────────
const VW = 1440;
const VH = 575;
const CY = 270;
const R  = 44;     // regular node radius
const RH = 54;     // hero radius (ONNX)

// ─── Node positions: 6 distinct vertical layers ──────────────────────────
const NODES = {
  camera:  { Icon:Camera,            en:'Camera',          vi:'Camera',          sub:'WebRTC · 30 FPS',       layer:0, x:110,  y:CY-125, color:'#0284C7' },
  upload:  { Icon:Upload,            en:'File Upload',     vi:'Tải Ảnh Lên',     sub:'Drag & Drop',            layer:0, x:110,  y:CY+125, color:'#0284C7' },
  preproc: { Icon:ScanLine,          en:'Preprocessor',    vi:'Tiền Xử Lý',      sub:'Zero-Alloc · 640px',     layer:1, x:350,  y:CY,     color:'#0D9488' },
  onnx:    { Icon:Brain,             en:'YOLOv14 WebGPU',  vi:'YOLOv14 WebGPU',  sub:'Hardware GPU · On-Device', layer:2, x:625,  y:CY,     color:'#F59E0B', hero:true },
  decode:  { Icon:Package,           en:'Box Decoder',     vi:'Giải Mã Hộp',     sub:'Coord Mapping',          layer:3, x:900,  y:CY-125, color:'#8B5CF6' },
  nms:     { Icon:SlidersHorizontal, en:'NMS Filter',      vi:'Lọc NMS',         sub:'Class-Wise · IoU ≤ 0.45', layer:3, x:900,  y:CY+125, color:'#8B5CF6' },
  hud:     { Icon:Monitor,           en:'HUD Canvas',      vi:'Canvas HUD',      sub:'60 FPS · Real-time',     layer:4, x:1145, y:CY,     color:'#06B6D4' },
  api:     { Icon:Server,            en:'FastAPI Server',  vi:'FastAPI Server',  sub:'REST · Python',          layer:5, x:1335, y:CY-125, color:'#10B981' },
  db:      { Icon:Leaf,              en:'Botanical DB',    vi:'CSDL Thực Vật',   sub:'Taxonomic Store',        layer:5, x:1335, y:CY+125, color:'#059669' },
};

// ─── 4-Section Focused Architectural Dossier Data ────────────────────────
export const NODE_DETAILS = {
  camera: {
    layerEn: '01 · INPUT LAYER',
    layerVi: '01 · TẦNG ĐẦU VÀO',
    nameEn: 'Live Camera Stream',
    nameVi: 'Luồng Trực Tiếp Camera',
    techTag: 'navigator.mediaDevices.getUserMedia • 30 FPS • WebRTC',

    flowStepsEn: [
      { num: '01', title: 'Sensor Capture', sub: 'HTML5 getUserMedia() connects hardware camera sensor' },
      { num: '02', title: 'Video Binding', sub: 'Streams live MediaStream to hidden HTML5 <video>' },
      { num: '03', title: 'Frame Clock', sub: '30 FPS synchronized frame extraction to Canvas' }
    ],
    flowStepsVi: [
      { num: '01', title: 'Thu nhận cảm biến', sub: 'Kết nối camera quang học qua HTML5 getUserMedia()' },
      { num: '02', title: 'Gắn thẻ Video', sub: 'Truyền luồng MediaStream vào thẻ <video> ẩn' },
      { num: '03', title: 'Đồng bộ khung hình', sub: 'Trích xuất khung ảnh 30 FPS vào bộ đệm Canvas' }
    ],

    mechanismEn: [
      { step: 'Step 1 (Permission & Constraints)', text: 'Requests user permission for camera access with WebRTC constraints (ideal 1080p/720p, environment rear-facing preference).' },
      { step: 'Step 2 (Memory Stream Buffering)', text: 'Pipes the live MediaStream directly into an in-memory video element without recording or writing to disk.' },
      { step: 'Step 3 (Display Refresh Sync)', text: 'Utilizes requestVideoFrameCallback() / requestAnimationFrame() to synchronize frame processing precisely with monitor refresh cycles.' }
    ],
    mechanismVi: [
      { step: 'Bước 1 (Cấp quyền & Cấu hình)', text: 'Yêu cầu người dùng cấp quyền camera và cấu hình WebRTC (độ phân giải tối ưu 1080p/720p, ưu tiên camera sau trên mobile).' },
      { step: 'Bước 2 (Nạp luồng vào RAM)', text: 'Truyền luồng MediaStream trực tiếp vào thẻ video trong RAM, không ghi đĩa hay lưu trữ trung gian.' },
      { step: 'Bước 3 (Đồng bộ khung hình)', text: 'Sử dụng requestVideoFrameCallback() đồng bộ chu kỳ đọc ảnh với tần số quét màn hình, chống xé hình và nghẽn luồng render.' }
    ],

    perfEn: [
      { label: 'Capture Frame Rate', value: '30 FPS (Constant)' },
      { label: 'Capture Latency', value: '< 5.0 ms overhead' },
      { label: 'Stream Resolution', value: '1280×720 / 1920×1080' },
      { label: 'Network Bandwidth', value: '0 KB/s (100% Offline)' }
    ],
    perfVi: [
      { label: 'Tốc độ khung hình', value: '30 FPS (Ổn định)' },
      { label: 'Độ trễ trích xuất', value: '< 5.0 ms' },
      { label: 'Độ phân giải luồng', value: '1280×720 / 1920×1080' },
      { label: 'Băng thông mạng', value: '0 KB/s (100% Offline)' }
    ],

    dataFlowEn: {
      input: 'Physical optical camera sensor photon stream',
      output: 'HTMLVideoElement in-memory raw frame buffer',
      transform: 'Converts optical stream into continuous video frame buffer'
    },
    dataFlowVi: {
      input: 'Luồng quang học vật lý từ cảm biến camera thiết bị',
      output: 'Khung ảnh đệm thô trong thẻ HTMLVideoElement (RAM)',
      transform: 'Chuyển đổi tín hiệu quang sang luồng khung hình video liên tục'
    }
  },

  upload: {
    layerEn: '01 · INPUT LAYER',
    layerVi: '01 · TẦNG ĐẦU VÀO',
    nameEn: 'Photo Upload & Drag & Drop',
    nameVi: 'Tải Ảnh Lên & Kéo Thả',
    techTag: 'HTML5 File API • DragEvent • EXIF Orientation Fix',

    flowStepsEn: [
      { num: '01', title: 'File Select / Drop', sub: 'Intercepts drag-and-drop or file dialog event' },
      { num: '02', title: 'Blob & EXIF Fix', sub: 'Creates blob URL & automatically corrects EXIF angle' },
      { num: '03', title: 'Bitmap Decode', sub: 'Decodes into memory as an HTMLImageElement object' }
    ],
    flowStepsVi: [
      { num: '01', title: 'Chọn file / Kéo thả', sub: 'Bắt sự kiện kéo thả hoặc hộp thoại tải ảnh' },
      { num: '02', title: 'Khởi tạo Blob & EXIF', sub: 'Tạo URL Blob bộ nhớ và tự động xoay ảnh theo EXIF' },
      { num: '03', title: 'Giải mã Bitmap', sub: 'Giải mã ảnh trực tiếp vào bộ nhớ đối tượng HTMLImageElement' }
    ],

    mechanismEn: [
      { step: 'Step 1 (Event Interception)', text: 'Listens for dragover, drop, and file input changes, rejecting non-image MIME types.' },
      { step: 'Step 2 (Zero-Upload Blob)', text: 'Instantiates URL.createObjectURL(file) for instant client-side rendering without network roundtrips.' },
      { step: 'Step 3 (Image Instantiation)', text: 'Loads bitmap dimensions (naturalWidth, naturalHeight) for downstream letterbox scaling.' }
    ],
    mechanismVi: [
      { step: 'Bước 1 (Bắt sự kiện kéo thả)', text: 'Lắng nghe sự kiện dragover, drop và thay đổi file, lọc bỏ các tệp không phải định dạng hình ảnh.' },
      { step: 'Bước 2 (Tạo Blob cục bộ)', text: 'Khởi tạo URL.createObjectURL(file) để hiển thị ảnh tức thì trên trình duyệt mà không cần gửi lên máy chủ.' },
      { step: 'Bước 3 (Đọc kích thước gốc)', text: 'Đọc độ phân giải gốc (naturalWidth, naturalHeight) phục vụ cho bước tính toán letterbox chuẩn.' }
    ],

    perfEn: [
      { label: 'File Ingestion Latency', value: '< 10 ms (Instant)' },
      { label: 'Supported Formats', value: 'JPG, PNG, WebP, AVIF, HEIC' },
      { label: 'Client Memory Impact', value: 'Temporary Blob RAM only' },
      { label: 'Network Bandwidth', value: '0 KB/s (Zero Server Upload)' }
    ],
    perfVi: [
      { label: 'Thời gian nạp tệp', value: '< 10 ms (Tức thì)' },
      { label: 'Định dạng hỗ trợ', value: 'JPG, PNG, WebP, AVIF, HEIC' },
      { label: 'Dung lượng RAM', value: 'Chỉ lưu đệm Blob tạm thời' },
      { label: 'Băng thông mạng', value: '0 KB/s (Không upload server)' }
    ],

    dataFlowEn: {
      input: 'Local binary image file from user storage / DragEvent',
      output: 'Decoded HTMLImageElement bitmap object',
      transform: 'Decodes raw file bytes into an in-memory bitmap image element'
    },
    dataFlowVi: {
      input: 'File ảnh nhị phân cục bộ từ ổ cứng / DragEvent',
      output: 'Đối tượng ảnh Bitmap HTMLImageElement đã giải mã',
      transform: 'Chuyển đổi byte file nhị phân thành ma trận pixel giải mã trong RAM'
    }
  },

  preproc: {
    layerEn: '02 · PREPROCESS LAYER',
    layerVi: '02 · TẦNG TIỀN XỬ LÝ',
    nameEn: 'Zero-Allocation Preprocessor & Letterbox',
    nameVi: 'Bộ Tiền Xử Lý Zero-Allocation & Letterbox',
    techTag: 'OffscreenCanvas • Zero-Alloc Float32 Recycling • Planar NCHW [1, 3, 640, 640]',

    flowStepsEn: [
      { num: '01', title: 'Letterbox Scaling', sub: 'Calculates exact scale factor to preserve petal morphology' },
      { num: '02', title: 'Canvas Padding', sub: 'Renders onto cached 640×640 OffscreenCanvas with #727272 gray' },
      { num: '03', title: 'Buffer Recycling', sub: 'Pours normalized RGB into pre-allocated Float32Array (0ms GC)' }
    ],
    flowStepsVi: [
      { num: '01', title: 'Khóa tỉ lệ Letterbox', sub: 'Tính hệ số scale chính xác bảo toàn nguyên vẹn hình thái cánh hoa' },
      { num: '02', title: 'Đệm viền Canvas', sub: 'Vẽ lên OffscreenCanvas đệm tĩnh 640×640 với viền xám trung tính #727272' },
      { num: '03', title: 'Tái sử dụng bộ nhớ', sub: 'Đổ RGB chuẩn hóa vào mảng Float32Array cấp phát sẵn (0ms rác GC)' }
    ],

    mechanismEn: [
      { step: 'Step 1 (Aspect Ratio Preservation)', text: 'Calculates scaling multiplier and padding offsets (padX, padY) to fit perfectly inside 640×640 without distortion.' },
      { step: 'Step 2 (Offscreen Draw & Bilinear Filter)', text: 'Fills reusable canvas with neutral gray (114, 114, 114) and draws image centered with bilinear anti-aliasing.' },
      { step: 'Step 3 (Zero-Allocation Planar Tensor)', text: 'Directly reads ImageData and writes normalized [0.0, 1.0] pixels into a persistent static Float32Array, completely avoiding garbage collection pauses.' }
    ],
    mechanismVi: [
      { step: 'Bước 1 (Bảo toàn tỉ lệ khung hình)', text: 'Tính hệ số scale và khoảng đệm viền xám (114, 114, 114) để ảnh vừa khít 640×640 mà không bị co méo hình học.' },
      { step: 'Bước 2 (Vẽ OffscreenCanvas tái sử dụng)', text: 'Lấp viền bằng màu xám tiêu chuẩn YOLO (#727272) và vẽ ảnh căn giữa với bộ lọc khử răng cưa mượt mà.' },
      { step: 'Bước 3 (Ghi trực tiếp vào Tensor tĩnh)', text: 'Trích xuất ImageData và ghi thẳng các giá trị chuẩn hóa [0.0, 1.0] vào mảng Float32Array cố định, triệt tiêu 100% độ trễ dọn rác GC.' }
    ],

    perfEn: [
      { label: 'Execution Runtime', value: '~1.5 - 3.0 ms' },
      { label: 'Target Canvas Size', value: '640 × 640 px' },
      { label: 'Memory Allocation', value: '0 bytes / frame (Recycled Buffer)' },
      { label: 'Tensor Layout', value: 'Planar NCHW Float32 [1, 3, 640, 640]' }
    ],
    perfVi: [
      { label: 'Thời gian xử lý', value: '~1.5 - 3.0 ms' },
      { label: 'Kích thước chuẩn', value: '640 × 640 px' },
      { label: 'Cấp phát bộ nhớ', value: '0 byte / frame (Tái sử dụng)' },
      { label: 'Cấu trúc Tensor', value: 'Planar NCHW Float32 [1, 3, 640, 640]' }
    ],

    dataFlowEn: {
      input: 'Raw HTMLVideoElement or HTMLImageElement',
      output: 'ort.Tensor("float32", [1, 3, 640, 640])',
      transform: 'Letterbox padding + Direct conversion from HWC [0..255] to NCHW Float32 [0..1]'
    },
    dataFlowVi: {
      input: 'Thẻ HTMLVideoElement hoặc HTMLImageElement gốc',
      output: 'ort.Tensor("float32", [1, 3, 640, 640])',
      transform: 'Đệm viền Letterbox + Ghi trực tiếp từ HWC [0..255] sang NCHW Float32 [0..1]'
    }
  },

  onnx: {
    layerEn: '03 · AI INFERENCE LAYER',
    layerVi: '03 · TẦNG SUY LUẬN AI',
    nameEn: 'YOLOv14 Multi-Scale WebGPU Neural Engine',
    nameVi: 'Mô Hình YOLOv14 Multi-Scale WebGPU On-Device',
    techTag: 'ONNX Runtime Web 1.18 • WebGPU (DirectX 12 / Vulkan) • WASM SIMD Fallback • 6 Classes',

    flowStepsEn: [
      { num: '01', title: 'GPU Tensor Ingestion', sub: 'Pipes normalized [1, 3, 640, 640] tensor directly into WebGPU shaders' },
      { num: '02', title: 'Multi-Scale Forward Pass', sub: 'Executes YOLOv14 C3k2, SPPF, & multi-scale dynamic resolution pyramid' },
      { num: '03', title: 'End-to-End Prediction', sub: 'Generates candidate detections matrix [1, 300, 6] on GPU' }
    ],
    flowStepsVi: [
      { num: '01', title: 'Nạp Tensor vào GPU', sub: 'Truyền Tensor chuẩn hóa [1, 3, 640, 640] thẳng vào Shader của GPU qua WebGPU' },
      { num: '02', title: 'Lan truyền Multi-Scale', sub: 'Thực thi các khối C3k2, SPPF và kim tự tháp đặc trưng đa tỷ lệ Multi-Scale' },
      { num: '03', title: 'Xuất ma trận dự đoán', sub: 'Xuất ma trận ứng viên nhận diện [1, 300, 6] trực tiếp từ GPU' }
    ],

    mechanismEn: [
      { step: 'Step 1 (WebGPU Hardware Pipeline)', text: 'Binds ONNX graph directly to device GPU compute shaders (DirectX 12 on Windows, Vulkan on Linux/Android, Metal on macOS/iOS).' },
      { step: 'Step 2 (Multi-Scale Feature Extraction)', text: 'Computes deep convolutions trained with dynamic multi-scale resolutions (448px - 1280px) for extreme detail on both tiny petals and massive blooms.' },
      { step: 'Step 3 (High-Throughput Output)', text: 'Outputs 300 candidate predictions with high-precision bounding box coordinates and 6-class flower probability distributions.' }
    ],
    mechanismVi: [
      { step: 'Bước 1 (Khởi tạo luồng WebGPU phần cứng)', text: 'Nạp đồ thị ONNX trực tiếp vào Shaders tính toán của Card đồ họa (DirectX 12 trên Windows, Vulkan trên Android, Metal trên Apple).' },
      { step: 'Bước 2 (Trích xuất đặc trưng đa tỷ lệ)', text: 'Thực thi mạng nơ-ron huấn luyện Multi-Scale (448px - 1280px), bắt nét vượt trội từ cánh hoa cúc li ti đến chùm cẩm tú cầu lớn.' },
      { step: 'Bước 3 (Xuất ma trận nhận diện tốc độ cao)', text: 'Xuất 300 ứng viên nhận diện với tọa độ bounding box chuẩn xác và phân phối xác suất trên 6 lớp hoa.' }
    ],

    perfEn: [
      { label: 'Inference Latency', value: '~15 - 30 ms / frame (WebGPU)' },
      { label: 'Model File Size', value: '~38.1 MB (ONNX Opset 17)' },
      { label: 'Trained Epochs & Architecture', value: '60 Epochs · Multi-Scale YOLOv14' },
      { label: 'Hardware Acceleration', value: 'WebGPU Shader Engine (GPU Native)' }
    ],
    perfVi: [
      { label: 'Thời gian suy luận', value: '~15 - 30 ms / frame (WebGPU)' },
      { label: 'Dung lượng mô hình', value: '~38.1 MB (ONNX Opset 17)' },
      { label: 'Huấn luyện & Kiến trúc', value: '60 Epochs · Multi-Scale YOLOv14' },
      { label: 'Tăng tốc phần cứng', value: 'WebGPU Native Shaders (Card GPU)' }
    ],

    dataFlowEn: {
      input: 'Normalized float tensor ort.Tensor("float32", [1, 3, 640, 640])',
      output: 'Candidate prediction tensor ort.Tensor("float32", [1, 300, 6])',
      transform: 'Deep multi-scale convolutional neural inference mapping pixel textures to botanical classes'
    },
    dataFlowVi: {
      input: 'Tensor chuẩn hóa ort.Tensor("float32", [1, 3, 640, 640])',
      output: 'Tensor dự đoán ứng viên ort.Tensor("float32", [1, 300, 6])',
      transform: 'Mạng nơ-ron tích chập đa tỷ lệ ánh xạ cấu trúc vân cánh và nhụy hoa thành phân lớp thực vật'
    }
  },

  decode: {
    layerEn: '04 · POST-PROCESS LAYER',
    layerVi: '04 · TẦNG HẬU XỬ LÝ',
    nameEn: 'Bounding Box Decoder & Coordinate Mapper',
    nameVi: 'Bộ Giải Mã Tọa Độ & Ánh Xạ Khung Viền',
    techTag: 'Letterbox Inversion • Aspect Ratio Unpadding • Vectorized Coordinate Mapping',

    flowStepsEn: [
      { num: '01', title: 'Candidate Iteration', sub: 'Iterates through 300 candidate rows in output tensor' },
      { num: '02', title: 'Confidence Gate', sub: 'Filters out low-confidence noise with adaptive threshold (≥ 0.35)' },
      { num: '03', title: 'Coordinate Inversion', sub: 'Maps letterbox coordinates back to original video/image canvas' }
    ],
    flowStepsVi: [
      { num: '01', title: 'Duyệt danh sách ứng viên', sub: 'Quét tuần tự qua 300 hàng ứng viên trong Tensor đầu ra' },
      { num: '02', title: 'Lọc ngưỡng tin cậy', sub: 'Loại bỏ các dự đoán yếu với ngưỡng thích ứng (≥ 0.35)' },
      { num: '03', title: 'Ánh xạ ngược tọa độ', sub: 'Chuyển đổi tọa độ letterbox về không gian điểm ảnh camera gốc' }
    ],

    mechanismEn: [
      { step: 'Step 1 (Matrix Traversal)', text: 'Extracts [x1, y1, x2, y2, score, class_id] vectors from the 300 candidate predictions.' },
      { step: 'Step 2 (Adaptive Confidence Gate)', text: 'Enforces strict confidence threshold (Score ≥ 0.35 for target flowers, ≥ 0.60 for other flowers).' },
      { step: 'Step 3 (Letterbox Inversion Formula)', text: 'Applies origX = (lx - padX) / scale and origY = (ly - padY) / scale to align boxes pixel-perfectly with real flowers.' }
    ],
    mechanismVi: [
      { step: 'Bước 1 (Trích xuất ma trận)', text: 'Đọc các vector [x1, y1, x2, y2, score, class_id] từ 300 hàng ứng viên đầu ra.' },
      { step: 'Bước 2 (Lọc ngưỡng tự tin thích ứng)', text: 'Áp dụng ngưỡng lọc sạch (Score ≥ 0.35 cho 5 loài hoa chính, ≥ 0.60 cho hoa khác).' },
      { step: 'Bước 3 (Công thức khử đệm Letterbox)', text: 'Áp dụng công thức origX = (lx - padX) / scale giúp khung viền ôm khít hoàn hảo từng cánh hoa.' }
    ],

    perfEn: [
      { label: 'Decode Execution Time', value: '< 0.5 ms' },
      { label: 'Target Confidence Threshold', value: 'Score ≥ 0.35' },
      { label: 'Candidate Reduction', value: '300 → ~5-15 active boxes' },
      { label: 'Coordinate Precision', value: 'Sub-pixel accuracy' }
    ],
    perfVi: [
      { label: 'Thời gian giải mã', value: '< 0.5 ms' },
      { label: 'Ngưỡng tin cậy chuẩn', value: 'Score ≥ 0.35' },
      { label: 'Tỉ lệ lọc nhiễu', value: '300 → ~5-15 hộp hợp lệ' },
      { label: 'Độ chính xác tọa độ', value: 'Khớp chuẩn xác từng điểm ảnh' }
    ],

    dataFlowEn: {
      input: 'Raw prediction tensor ort.Tensor("float32", [1, 300, 6])',
      output: 'Array of candidate bounding boxes [{x1, y1, x2, y2, classId, score}]',
      transform: 'Decodes normalized box coordinates and strips letterbox padding'
    },
    dataFlowVi: {
      input: 'Tensor dự đoán thô ort.Tensor("float32", [1, 300, 6])',
      output: 'Danh sách các hộp ứng viên [{x1, y1, x2, y2, classId, score}]',
      transform: 'Giải mã tọa độ chuẩn hóa và loại bỏ hoàn toàn khoảng đệm letterbox'
    }
  },

  nms: {
    layerEn: '04 · POST-PROCESS LAYER',
    layerVi: '04 · TẦNG HẬU XỬ LÝ',
    nameEn: 'Standard Class-Wise NMS Filter',
    nameVi: 'Bộ Lọc Non-Maximum Suppression (NMS) Chuẩn',
    techTag: 'IoU ≤ 0.45 • Standard Greedy Suppression • Multi-Flower Separation',

    flowStepsEn: [
      { num: '01', title: 'Class Partitioning', sub: 'Groups candidate boxes by detected flower species' },
      { num: '02', title: 'Confidence Sorting', sub: 'Sorts candidates in descending order of confidence score' },
      { num: '03', title: 'IoU Suppression', sub: 'Calculates Intersection-over-Union & suppresses duplicates (IoU > 0.45)' }
    ],
    flowStepsVi: [
      { num: '01', title: 'Phân loại theo loài', sub: 'Gom nhóm các hộp dự đoán theo từng loài hoa riêng biệt' },
      { num: '02', title: 'Sắp xếp độ tin cậy', sub: 'Sắp xếp các hộp ứng viên theo điểm tin cậy giảm dần' },
      { num: '03', title: 'Triệt tiêu IoU', sub: 'Tính diện tích giao thoa và loại bỏ hộp trùng lặp (IoU > 0.45)' }
    ],
    mechanismEn: [
      { step: 'Step 1 (Class Isolation)', text: 'Separates candidates by flower species so that different flowers near each other are never suppressed.' },
      { step: 'Step 2 (Greedy Best-Box Selection)', text: 'Picks the highest scoring detection as the primary ground truth anchor.' },
      { step: 'Step 3 (IoU Elimination)', text: 'Computes Area(A ∩ B) / Area(A ∪ B) and suppresses all overlapping redundant boxes with IoU > 0.45.' }
    ],
    mechanismVi: [
      { step: 'Bước 1 (Cách ly theo loài hoa)', text: 'Tách riêng các hộp theo từng loài hoa để đảm bảo nhiều bông hoa khác loài gần nhau đều được giữ nguyên vẹn.' },
      { step: 'Bước 2 (Chọn hộp tối ưu nhất)', text: 'Lấy hộp có điểm tin cậy cao nhất làm mốc chuẩn chính xác nhất.' },
      { step: 'Bước 3 (Tính chỉ số IoU & Triệt tiêu)', text: 'Tính tỉ lệ giao thoa IoU = Diện tích giao / Diện tích hợp, loại bỏ triệt để các khung thừa chồng chéo có IoU > 0.45.' }
    ],

    perfEn: [
      { label: 'Filter Execution Time', value: '< 0.3 ms' },
      { label: 'IoU Overlap Threshold', value: '0.45 (Standard YOLO spec)' },
      { label: 'Multi-Flower Support', value: 'Simultaneous detection of unlimited distinct blooms' },
      { label: 'Time Complexity', value: 'O(N log N)' }
    ],
    perfVi: [
      { label: 'Thời gian xử lý', value: '< 0.3 ms' },
      { label: 'Ngưỡng IoU tiêu chuẩn', value: '0.45 (Chuẩn công nghiệp YOLO)' },
      { label: 'Hỗ trợ đa hoa', value: 'Nhận diện đồng thời nhiều bông hoa không giới hạn' },
      { label: 'Độ phức tạp', value: 'O(N log N)' }
    ],

    dataFlowEn: {
      input: 'Unfiltered candidate boxes (~5-15 boxes)',
      output: 'Clean final detection boxes (1-10 optimal flower boxes)',
      transform: 'Suppresses redundant overlapping bounding boxes per flower'
    },
    dataFlowVi: {
      input: 'Danh sách hộp ứng viên chưa lọc (~5-15 hộp)',
      output: 'Danh sách phát hiện chuẩn xác cuối cùng (1-10 hộp hoa tối ưu)',
      transform: 'Triệt tiêu các khung trùng lặp, giữ lại duy nhất 1 khung bao chuẩn nhất cho mỗi bông hoa'
    }
  },

  hud: {
    layerEn: '05 · OUTPUT LAYER',
    layerVi: '05 · TẦNG ĐẦU RA',
    nameEn: 'Real-time HUD Canvas & AR Overlay',
    nameVi: 'Lớp Hiển Thị HUD & Tương Tác AR',
    techTag: 'HTML5 Canvas2D • 60 FPS • Interactive Touch Badges • Retina HiDPI',

    flowStepsEn: [
      { num: '01', title: 'HiDPI Scaling', sub: 'Synchronizes Canvas coordinate matrix with devicePixelRatio' },
      { num: '02', title: 'Neon Box & Badge', sub: 'Renders glowing species boxes and confidence meters at 60 FPS' },
      { num: '03', title: 'Click Hit-Test', sub: 'Registers touch & click zones to trigger Botanical Dossier' }
    ],
    flowStepsVi: [
      { num: '01', title: 'Chuẩn hóa HiDPI', sub: 'Đồng bộ khung vẽ Canvas theo devicePixelRatio màn hình' },
      { num: '02', title: 'Vẽ khung Neon AR', sub: 'Vẽ viền sáng, nhãn tên hoa & thanh độ tin cậy ở 60 FPS' },
      { num: '03', title: 'Bắt điểm chạm', sub: 'Đăng ký vùng click/chạm để mở bảng Hồ Sơ Thực Vật Học' }
    ],

    mechanismEn: [
      { step: 'Step 1 (Resolution Calibration)', text: 'Calibrates Canvas scale to devicePixelRatio for razor-sharp typography and crisp borders.' },
      { step: 'Step 2 (Graphic Rendering)', text: 'Paints rounded neon bounding boxes, flower name badges, and percentage confidence meters.' },
      { step: 'Step 3 (Hit-Testing)', text: 'Monitors click and tap events within bounding box coordinates to launch full Botanical Dossiers.' }
    ],
    mechanismVi: [
      { step: 'Bước 1 (Đồng bộ độ phân giải)', text: 'Căn chỉnh kích thước Canvas theo devicePixelRatio giúp chữ và đường nét cực kỳ sắc nét.' },
      { step: 'Bước 2 (Vẽ đồ họa AR)', text: 'Vẽ khung bo góc viền sáng theo màu từng loài hoa, hiển thị tên hoa và thanh % tin cậy.' },
      { step: 'Bước 3 (Bắt điểm chạm tương tác)', text: 'Lắng nghe sự kiện click/tap trên tọa độ hộp để kích hoạt hiển thị bảng hồ sơ chi tiết.' }
    ],

    perfEn: [
      { label: 'Display Refresh Rate', value: '60 FPS (16.6ms cycle)' },
      { label: 'Render Overhead', value: '< 2.0 ms' },
      { label: 'Display Resolution', value: 'Native Retina HiDPI (1x - 3x)' },
      { label: 'Rendering Stack', value: 'Canvas2D + CSS Glassmorphism' }
    ],
    perfVi: [
      { label: 'Tần số quét hiển thị', value: '60 FPS (Chu kỳ 16.6ms)' },
      { label: 'Thời gian vẽ Canvas', value: '< 2.0 ms' },
      { label: 'Độ phân giải hiển thị', value: 'Chuẩn Retina HiDPI (1x - 3x)' },
      { label: 'Công nghệ render', value: 'Canvas2D + CSS Glassmorphism' }
    ],

    dataFlowEn: {
      input: 'Clean detection array [{x, y, w, h, name, score}]',
      output: '60 FPS AR visual overlay & Interactive modal click triggers',
      transform: 'Renders mathematical coordinate data into interactive visual elements'
    },
    dataFlowVi: {
      input: 'Danh sách phát hiện hoàn chỉnh [{x, y, w, h, name, score}]',
      output: 'Lớp phủ đồ họa AR thời gian thực & Sự kiện click mở Dossier',
      transform: 'Biến đổi dữ liệu tọa độ số học thành giao diện đồ họa sống động'
    }
  },

  api: {
    layerEn: '06 · BACKEND LAYER',
    layerVi: '06 · TẦNG MÁY CHỦ BACKEND',
    nameEn: 'FastAPI Server & LLM Intelligence',
    nameVi: 'Máy Chủ FastAPI & Trí Tuệ LLM',
    techTag: 'FastAPI • Python 3.11 • OpenRouter API • Asynchronous ASGI',

    flowStepsEn: [
      { num: '01', title: 'Receive Request', sub: 'Receives async client REST requests (/flower/{id})' },
      { num: '02', title: 'Schema Validation', sub: 'Validates payload and parameters via Pydantic v2' },
      { num: '03', title: 'LLM & DB Query', sub: 'Queries botanical catalog and calls OpenRouter AI' }
    ],
    flowStepsVi: [
      { num: '01', title: 'Tiếp nhận yêu cầu', sub: 'Tiếp nhận REST API request từ Frontend (/flower/{id})' },
      { num: '02', title: 'Kiểm thực Pydantic', sub: 'Xác thực schema và tham số qua mô hình Pydantic v2' },
      { num: '03', title: 'Truy vấn & Gọi LLM', sub: 'Truy vấn CSDL hoa và gọi OpenRouter AI tạo phân tích' }
    ],

    mechanismEn: [
      { step: 'Step 1 (Async Ingestion)', text: 'Receives HTTP GET/POST queries asynchronously via Uvicorn ASGI server.' },
      { step: 'Step 2 (Pydantic Validation)', text: 'Enforces type-safe schema checks for species queries and bilingual parameters.' },
      { step: 'Step 3 (AI Enrichment)', text: 'Blends static taxonomy data with dynamic OpenRouter generative AI insights.' }
    ],
    mechanismVi: [
      { step: 'Bước 1 (Tiếp nhận REST Request)', text: 'Lắng nghe các yêu cầu HTTP GET/POST từ trình duyệt bất đồng bộ (FastAPI ASGI).' },
      { step: 'Bước 2 (Xác thực dữ liệu)', text: 'Sử dụng Pydantic v2 kiểm tra tính hợp lệ của tham số và mã loài hoa.' },
      { step: 'Bước 3 (Truy vấn & Phản hồi)', text: 'Tra cứu kho dữ liệu thực vật học và gọi mô hình AI OpenRouter tạo phân tích chuyên sâu dạng JSON.' }
    ],

    perfEn: [
      { label: 'DB Query Latency', value: '~15 ms (In-Memory)' },
      { label: 'LLM Generation Latency', value: '~800 ms (OpenRouter)' },
      { label: 'Concurrency Capacity', value: '10,000+ simultaneous connections' },
      { label: 'Framework & Runtime', value: 'FastAPI + Python 3.11' }
    ],
    perfVi: [
      { label: 'Độ trễ tra cứu DB', value: '~15 ms (In-Memory)' },
      { label: 'Độ trễ sinh AI LLM', value: '~800 ms (OpenRouter)' },
      { label: 'Khả năng xử lý', value: '10.000+ kết nối đồng thời' },
      { label: 'Khung phần mềm', value: 'FastAPI + Python 3.11' }
    ],

    dataFlowEn: {
      input: 'HTTP GET/POST Requests (/flower/{id}, /flower/explain)',
      output: 'JSON Botanical Dossier payload and generative AI insights',
      transform: 'Enriches raw species identification with deep botanical intelligence'
    },
    dataFlowVi: {
      input: 'HTTP GET/POST Request (/flower/{id}, /flower/explain)',
      output: 'JSON Payload (Hồ sơ thực vật học + Phân tích AI)',
      transform: 'Biến đổi câu hỏi và ID loài hoa thành câu trả lời chuyên sâu có cấu trúc'
    }
  },

  db: {
    layerEn: '06 · BACKEND LAYER',
    layerVi: '06 · TẦNG MÁY CHỦ BACKEND',
    nameEn: 'Botanical Taxonomic Knowledge Store',
    nameVi: 'Kho Tri Thức Thực Vật Học',
    techTag: 'Taxonomy Catalog • Horticultural Guides • Full Bilingual Store',

    flowStepsEn: [
      { num: '01', title: 'Species Lookup', sub: 'Matches detected class ID or scientific Latin name' },
      { num: '02', title: 'Metadata Extraction', sub: 'Retrieves symbolism, flourishing seasons, & care guide' },
      { num: '03', title: 'Palette & Dossier', sub: 'Loads signature pigment hex codes & hydrates UI' }
    ],
    flowStepsVi: [
      { num: '01', title: 'Tra cứu danh mục', sub: 'Khớp mã loài hoa nhận diện được hoặc danh pháp Latin' },
      { num: '02', title: 'Trích xuất hồ sơ', sub: 'Lấy dữ liệu ý nghĩa, mùa hoa nở và hướng dẫn chăm sóc' },
      { num: '03', title: 'Bảng màu & Đồng bộ', sub: 'Tải bảng mã màu sắc hoa và đồng bộ ngay lên giao diện' }
    ],

    mechanismEn: [
      { step: 'Step 1 (Indexing)', text: 'Indexes all flower species by standardized Latin nomenclature and model class labels.' },
      { step: 'Step 2 (Record Lookup)', text: 'Retrieves rich structured properties including cultural symbolism, care tips, and origin.' },
      { step: 'Step 3 (Dual Mirroring)', text: 'Cached in backend memory and mirrored client-side for zero-latency lookups.' }
    ],
    mechanismVi: [
      { step: 'Bước 1 (Đánh chỉ mục loài hoa)', text: 'Quản lý cơ sở dữ liệu các loài hoa theo ID và danh pháp khoa học Latin chuẩn quốc tế.' },
      { step: 'Bước 2 (Truy xuất thông tin)', text: 'Truy xuất đầy đủ các trường dữ liệu (ý nghĩa biểu tượng, cẩm nang trồng trọt, thời vụ nở hoa).' },
      { step: 'Bước 3 (Đồng bộ song song)', text: 'Lưu trữ kép trên máy chủ FastAPI và bộ nhớ cục bộ phía Frontend để hiển thị tức thì.' }
    ],

    perfEn: [
      { label: 'Record Query Time', value: '< 1.0 ms (In-Memory RAM)' },
      { label: 'Offline Availability', value: '100% Client-side mirrored' },
      { label: 'Bilingual Support', value: 'English & Vietnamese 100%' },
      { label: 'Data Schema', value: 'Structured JSON Taxonomy' }
    ],
    perfVi: [
      { label: 'Thời gian truy xuất', value: '< 1.0 ms (In-Memory RAM)' },
      { label: 'Khả năng chạy Offline', value: '100% Khả dụng' },
      { label: 'Ngôn ngữ hỗ trợ', value: 'Song ngữ Anh - Việt hoàn chỉnh' },
      { label: 'Cấu trúc lưu trữ', value: 'JSON Taxonomy Schema chuẩn hóa' }
    ],

    dataFlowEn: {
      input: 'Flower Class ID / Latin Scientific Name',
      output: 'Complete structured Botanical Taxonomic Dossier',
      transform: 'Maps numeric AI class label to authoritative botanical intelligence'
    },
    dataFlowVi: {
      input: 'Mã ID loài hoa / Tên khoa học Latin',
      output: 'Bộ dữ liệu hồ sơ thực vật học hoàn chỉnh (Dossier)',
      transform: 'Ánh xạ từ nhãn nhận diện AI sang kho tri thức phong phú'
    }
  }
};

// ─── Connection Edges ────────────────────────────────────────────────────
const ARROWS = [
  { from:'camera',  to:'preproc', reveal:1 },
  { from:'upload',  to:'preproc', reveal:1 },
  { from:'preproc', to:'onnx',    reveal:2 },
  { from:'onnx',    to:'decode',  reveal:3 },
  { from:'onnx',    to:'nms',     reveal:3 },
  { from:'decode',  to:'hud',     reveal:4 },
  { from:'nms',     to:'hud',     reveal:4 },
  { from:'hud',     to:'api',     reveal:5 },
  { from:'hud',     to:'db',      reveal:5 },
];

// ─── Layer Columns with individual badge width to prevent text overflow ─
const LAYERS = [
  { en:'Input',        vi:'Đầu Vào',     color:'#0284C7', x:110,  w:144, badgeW: 110 },
  { en:'Preprocess',   vi:'Tiền Xử Lý', color:'#0D9488', x:350,  w:156, badgeW: 142 },
  { en:'AI Inference', vi:'Suy Luận AI', color:'#F59E0B', x:625,  w:168, badgeW: 154 },
  { en:'Post-process', vi:'Hậu Xử Lý',  color:'#8B5CF6', x:900,  w:164, badgeW: 148 },
  { en:'Output',       vi:'Đầu Ra',      color:'#06B6D4', x:1145, w:144, badgeW: 118 },
  { en:'Backend',      vi:'Backend',     color:'#10B981', x:1335, w:144, badgeW: 118 },
];
const MAX = LAYERS.length - 1;

// ─── Arrow Marker Colors ─────────────────────────────────────────────────
const MARKER_COLORS = ['#0D9488','#F59E0B','#8B5CF6','#06B6D4','#10B981','#059669'];
const COLOR_IDX = Object.fromEntries(MARKER_COLORS.map((c,i)=>[c,i]));

function nodeR(id) { return NODES[id]?.hero ? RH : R; }

// ─── Bezier Path: Horizontal tangent at start and end for true alignment ──
function arrowPath(fromId, toId) {
  const f = NODES[fromId];
  const t = NODES[toId];
  if (!f || !t) return '';
  const fr = nodeR(fromId);
  const tr = nodeR(toId);
  const x1 = f.x + fr + 3;
  const y1 = f.y;
  const x2 = t.x - tr - 8;
  const y2 = t.y;
  const dx = x2 - x1;
  const cx1 = x1 + dx * 0.48;
  const cx2 = x2 - dx * 0.48;
  return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
}

// ─── 4-Section Focused Section 2 Styled Architectural Node Dossier Modal ──
function ArchitectureNodeDossierModal({ nodeId, onClose }) {
  const { lang, t } = useLang();
  const isVi = lang === 'vi';
  const nodeCfg = NODES[nodeId];
  const detail = NODE_DETAILS[nodeId] || NODE_DETAILS.camera;
  const themeColor = nodeCfg?.color || '#0284C7';

  // Handle Esc key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="modal-backdrop-blur"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="modal-dossier-card arch-node-dossier-card" onClick={(e) => e.stopPropagation()}>
        {/* Header — Section 2 Exact Style */}
        <div className="dossier-header" style={{ borderBottomColor: `${themeColor}40` }}>
          <div>
            <span className="dossier-kicker-tag" style={{ color: themeColor }}>
              {isVi ? detail.layerVi : detail.layerEn}
            </span>
            <h2>{isVi ? detail.nameVi : detail.nameEn}</h2>
            <span className="dossier-scientific-name">
              <em>{detail.techTag}</em>
            </span>
          </div>
          <button className="dossier-close-button" onClick={onClose} aria-label={t('btnClose')}>
            <X size={16} />
          </button>
        </div>

        {/* Body Scroll */}
        <div className="dossier-body-scroll">
          {/* ── 1. KHUNG 1: Sơ đồ Diagram chi tiết của Node ── */}
          <div className="arch-flow-diagram-card" style={{ borderColor: `${themeColor}40`, background: `${themeColor}08` }}>
            <div className="arch-card-header-lbl" style={{ color: themeColor }}>
              <Workflow size={13} />
              <span>{t('archDiagramFlow')}</span>
            </div>
            <div className="arch-flow-steps-track">
              {(isVi ? detail.flowStepsVi : detail.flowStepsEn).map((st, idx, arr) => (
                <React.Fragment key={idx}>
                  <div className="arch-flow-step-box" style={{ borderColor: `${themeColor}30` }}>
                    <div className="arch-flow-step-top">
                      <span className="arch-flow-step-num" style={{ background: themeColor }}>{st.num}</span>
                      <span className="arch-flow-step-title">{st.title}</span>
                    </div>
                    <p className="arch-flow-step-desc">{st.sub}</p>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="arch-flow-connector" style={{ color: themeColor }}>
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── 2-Column Grid: Khung 2 (Cơ chế hoạt động) & Khung 3 (Hiệu năng) ── */}
          <div className="arch-dossier-grid-2col">
            {/* ── 2. KHUNG 2: Cơ Chế Hoạt Động ── */}
            <div className="fact-item-card arch-section-card">
              <div className="fact-lbl" style={{ color: themeColor }}>
                <Settings2 size={12} color={themeColor} />
                <span>{t('archOperatingMech')}</span>
              </div>
              <div className="arch-mech-list">
                {(isVi ? detail.mechanismVi : detail.mechanismEn).map((m, idx) => (
                  <div key={idx} className="arch-mech-item">
                    <span
                      className="arch-mech-step-badge"
                      style={{ background: `${themeColor}18`, color: themeColor, borderColor: `${themeColor}40` }}
                    >
                      {idx + 1}
                    </span>
                    <div className="arch-mech-content">
                      <span className="arch-mech-title">{m.step}:</span>
                      <span className="arch-mech-text"> {m.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 3. KHUNG 3: Thông Số & Hiệu Năng ── */}
            <div className="fact-item-card arch-section-card highlight-gold" style={{ borderColor: themeColor }}>
              <div className="fact-lbl" style={{ color: themeColor }}>
                <Gauge size={12} color={themeColor} />
                <span>{t('archPerfSpecs')}</span>
              </div>
              <div className="arch-perf-grid">
                {(isVi ? detail.perfVi : detail.perfEn).map((p, idx) => (
                  <div key={idx} className="arch-perf-cell">
                    <span className="arch-perf-lbl">{p.label}</span>
                    <span className="arch-perf-val">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 4. KHUNG 4: Luồng Dữ Liệu (Data Flow In ➔ Out) ── */}
          <div className="fact-item-card arch-section-card full-span">
            <div className="fact-lbl" style={{ color: themeColor }}>
              <ArrowRightLeft size={12} color={themeColor} />
              <span>{t('archDataFlow')}</span>
            </div>
            <div className="arch-dataflow-container">
              <div className="arch-dataflow-row">
                <span className="arch-dataflow-tag in">INPUT</span>
                <span className="arch-dataflow-desc">{(isVi ? detail.dataFlowVi : detail.dataFlowEn).input}</span>
              </div>
              <div className="arch-dataflow-row">
                <span className="arch-dataflow-tag out">OUTPUT</span>
                <span className="arch-dataflow-desc">{(isVi ? detail.dataFlowVi : detail.dataFlowEn).output}</span>
              </div>
              <div className="arch-dataflow-row">
                <span className="arch-dataflow-tag trans">TRANSFORM</span>
                <span className="arch-dataflow-desc">{(isVi ? detail.dataFlowVi : detail.dataFlowEn).transform}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="dossier-footer-bar">
          <button className="btn-close-dossier" onClick={onClose}>
            {t('btnClose')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main ArchitectureDiagram Component ───────────────────────────────────
export function ArchitectureDiagram({ isActive = false }) {
  const { lang, t } = useLang();
  const isVi = lang === 'vi';
  const [revealed, setRevealed]   = useState(MAX);
  const [animLayer, setAnimLayer] = useState(MAX);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNext = useCallback(() => {
    if (revealed < MAX) {
      const next = revealed + 1;
      setRevealed(next);
      setAnimLayer(next);
    }
  }, [revealed]);

  const handleReset = useCallback((e) => {
    e.stopPropagation();
    setRevealed(0);
    setAnimLayer(0);
    setSelectedNode(null);
  }, []);

  const handleNodeClick = useCallback((nodeKey, e) => {
    e.stopPropagation();
    setSelectedNode(nodeKey);
  }, []);

  return (
    <section className="arch-section" id="architecture">
      <div className="arch-grid-bg" />

      {/* ── Header — 3D Rolling Text Header ── */}
      <div className="arch-header">
        <RollingTextHeader
          isActive={isActive}
          badge={t('archBadge')}
          heading={t('archHeading')}
        />

        <div className="arch-header-actions">
          {/* Hint badge */}
          <span className="arch-click-hint-pill">
            <Sparkles size={13} />
            <span>{t('archClickNodeHint')}</span>
          </span>

          {/* Reset button */}
          <button
            className="arch-reset-pill"
            onClick={handleReset}
            title={isVi ? 'Đặt lại về bước đầu tiên' : 'Reset to initial step'}
          >
            <RotateCcw size={14} strokeWidth={2.4} />
            <span>{isVi ? 'Xem lại' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* ── SVG Diagram Canvas ── */}
      <div className="arch-canvas-wrap" onClick={handleNext}>
        <svg
          className="arch-svg"
          viewBox={`0 0 ${VW} ${VH}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {MARKER_COLORS.map((c, i) => (
              <marker
                key={i}
                id={`am${i}`}
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="8.5"
                markerHeight="8.5"
                orient="auto-start-reverse"
              >
                <polygon points="1,2 8,5 1,8" fill={c} />
              </marker>
            ))}
          </defs>

          {/* ── 6 Column Vertical Boundary Cards ── */}
          {LAYERS.map((l, i) => {
            if (i > revealed) return null;
            const cardX = l.x - l.w / 2;
            const cardY = 16;
            const cardH = 485;
            const isNew = i === animLayer;

            return (
              <g key={`col-card-${i}`} className={isNew ? 'arch-fadein' : ''}>
                {/* Column full vertical card */}
                <rect
                  x={cardX}
                  y={cardY}
                  width={l.w}
                  height={cardH}
                  rx="18"
                  fill={`${l.color}08`}
                  stroke={l.color}
                  strokeWidth="1.5"
                  strokeDasharray="6 5"
                  opacity="0.55"
                />

                {/* Column header badge */}
                <rect
                  x={l.x - l.badgeW / 2}
                  y={cardY + 8}
                  width={l.badgeW}
                  height={24}
                  rx={12}
                  fill={l.color}
                  opacity="0.14"
                  stroke={l.color}
                  strokeWidth="1.2"
                />
                <text
                  x={l.x}
                  y={cardY + 24}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontFamily="'Plus Jakarta Sans', 'JetBrains Mono', monospace"
                  fontWeight="800"
                  fill={l.color}
                  letterSpacing="0.3"
                >
                  {String(i + 1).padStart(2, '0')} · {(isVi ? l.vi : l.en).toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* ── Arrows ── */}
          {ARROWS.map(({ from, to, reveal }) => {
            if (revealed < reveal) return null;
            const toNode = NODES[to];
            if (!toNode) return null;
            const mIdx = COLOR_IDX[toNode.color] ?? 0;
            const isNew = reveal === animLayer;

            return (
              <path
                key={`${from}-${to}`}
                d={arrowPath(from, to)}
                fill="none"
                stroke={toNode.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.9"
                markerEnd={`url(#am${mIdx})`}
                className={isNew ? 'arch-arrow-flow' : ''}
              />
            );
          })}

          {/* ── Interactive Clickable Nodes ── */}
          {Object.entries(NODES).map(([id, node]) => {
            if (node.layer > revealed) return null;
            const r = node.hero ? RH : R;
            const isNew = node.layer === animLayer;
            const iconSize = node.hero ? 36 : 28;

            return (
              <g
                key={id}
                className={`arch-node-group ${isNew ? 'arch-node-pop' : ''}`}
                onClick={(e) => handleNodeClick(id, e)}
                style={{ cursor: 'pointer' }}
                tabIndex={0}
                role="button"
                aria-label={`${isVi ? node.vi : node.en} - ${node.sub}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNodeClick(id, e);
                  }
                }}
              >
                <title>{isVi ? `Nhấp để xem hồ sơ chi tiết: ${node.vi}` : `Click to view component dossier: ${node.en}`}</title>

                {/* Outer Interactive Glow Ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 6}
                  fill="transparent"
                  stroke={node.color}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="arch-node-pulse-ring"
                />

                {/* Node Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={node.hero ? '#FFFBEB' : '#F0F9FF'}
                  stroke={node.color}
                  strokeWidth={node.hero ? 3.2 : 2.4}
                  className="arch-node-circle"
                  style={node.hero
                    ? { filter: `drop-shadow(0 0 14px ${node.color}77)` }
                    : { filter: `drop-shadow(0 2px 8px rgba(14,116,144,0.14))` }}
                />

                {/* Lucide Icon */}
                <foreignObject
                  x={node.x - iconSize / 2}
                  y={node.y - iconSize / 2}
                  width={iconSize}
                  height={iconSize}
                  style={{ overflow: 'visible', pointerEvents: 'none' }}
                >
                  <node.Icon
                    size={iconSize}
                    color={node.color}
                    strokeWidth={node.hero ? 2.1 : 1.9}
                    style={{ display: 'block' }}
                  />
                </foreignObject>

                {/* Node Name */}
                <text
                  x={node.x}
                  y={node.y + r + 20}
                  textAnchor="middle"
                  fontSize={node.hero ? '13' : '12'}
                  fontFamily="'Plus Jakarta Sans', Inter, sans-serif"
                  fontWeight="800"
                  fill="#0C2A3E"
                  letterSpacing="-0.01em"
                  className="arch-node-label"
                >
                  {isVi ? node.vi : node.en}
                </text>

                {/* Node Sub-text */}
                <text
                  x={node.x}
                  y={node.y + r + 35}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                  fill={node.color}
                  opacity="0.9"
                >
                  {node.sub}
                </text>
              </g>
            );
          })}

          {/* ── Click-to-reveal hint at bottom ── */}
          {revealed < MAX && (
            <text
              x={VW / 2}
              y={VH - 16}
              textAnchor="middle"
              fontSize="11.5"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              fill="rgba(14,116,144,0.65)"
              letterSpacing="0.5"
            >
              {isVi
                ? `▶  Bấm khoảng trống để xem tiếp bước: ${LAYERS[revealed + 1]?.vi}`
                : `▶  Click empty space to reveal: ${LAYERS[revealed + 1]?.en}`}
            </text>
          )}
        </svg>
      </div>

      {/* ── Section 2 Styled Node Dossier Modal ── */}
      {selectedNode && (
        <ArchitectureNodeDossierModal
          nodeId={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </section>
  );
}

export default ArchitectureDiagram;
