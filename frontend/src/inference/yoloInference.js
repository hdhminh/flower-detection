/**
 * ONNX Runtime Web Inference Engine for YOLOv11 Flower Detection.
 * Executes client-side inside the browser using ONNX Runtime Web 1.18.0.
 */
import { preprocessImage } from './preprocessing';
import { postprocessYOLO, FLOWER_CLASSES } from './postprocessing';

// Asynchronously wait for global ort object from CDN to prevent race conditions on cold start
async function waitForOrt(maxWaitMs = 10000) {
  const start = performance.now();
  while (typeof window !== 'undefined' && !window.ort) {
    if (performance.now() - start > maxWaitMs) break;
    await new Promise((r) => setTimeout(r, 80));
  }
  if (typeof window !== 'undefined' && window.ort) return window.ort;
  throw new Error('onnxruntime-web is not loaded yet. Please check your internet connection.');
}

async function fetchModelBuffer(path) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to fetch model at ${path}: HTTP ${res.status}`);
  }
  return await res.arrayBuffer();
}

export class FlowerDetector {
  constructor(modelPath = '/models/flower_yolo11s.onnx') {
    this.modelPath = modelPath;
    this.session = null;
    this.isLoaded = false;
    this.isLoading = false;
    this.loadPromise = null;
    this.backendName = 'WASM (CPU SIMD)';
    this.lastInferenceTime = 0;
    this.errorMessage = null;
  }

  async loadModel(onProgress) {
    if (this.isLoaded && this.session) return this.session;
    if (this.isLoading && this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.errorMessage = null;
    if (onProgress) onProgress(10, 'Initializing ONNX Runtime Web...');

    this.loadPromise = (async () => {
      try {
        const ort = await waitForOrt();
        
        // Configure WASM paths matching 1.18.0 CDN
        ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.simd = true;

        if (onProgress) onProgress(30, 'Fetching YOLOv11 model weights...');
        console.log('[FlowerDetector] Loading model buffer for:', this.modelPath);

        let buffer;
        try {
          buffer = await fetchModelBuffer(this.modelPath);
        } catch (fetchErr) {
          console.warn('[FlowerDetector] Failed to fetch primary model, trying fallback nano:', fetchErr);
          this.modelPath = '/models/flower_yolo11n.onnx';
          buffer = await fetchModelBuffer(this.modelPath);
        }

        if (onProgress) onProgress(60, 'Creating ONNX session...');
        
        try {
          this.session = await ort.InferenceSession.create(buffer, {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all'
          });
        } catch (sErr) {
          console.warn('[FlowerDetector] Failed to create session with primary buffer, attempting nano buffer:', sErr);
          this.modelPath = '/models/flower_yolo11n.onnx';
          const nanoBuffer = await fetchModelBuffer(this.modelPath);
          this.session = await ort.InferenceSession.create(nanoBuffer, {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all'
          });
        }

        this.backendName = 'WASM (CPU SIMD)';
        console.log('[FlowerDetector] Session created successfully. Warming up...');
        if (onProgress) onProgress(80, 'Model loaded. Performing warmup...');

        await this.warmup();

        this.isLoaded = true;
        this.isLoading = false;
        console.log('[FlowerDetector] Model ready and active!');
        if (onProgress) onProgress(100, 'Model ready!');
        return this.session;
      } catch (err) {
        this.isLoading = false;
        this.isLoaded = false;
        this.errorMessage = err.message || String(err);
        console.error('[FlowerDetector] Failed to load ONNX model:', err);
        throw err;
      }
    })();

    return this.loadPromise;
  }

  async warmup() {
    if (!this.session) return;
    try {
      const ort = window.ort || (await waitForOrt());
      const dummyData = new Float32Array(1 * 3 * 640 * 640);
      const dummyTensor = new ort.Tensor('float32', dummyData, [1, 3, 640, 640]);
      const inputName = this.session.inputNames[0] || 'images';
      await this.session.run({ [inputName]: dummyTensor });
      console.log('[FlowerDetector] Warmup complete.');
    } catch (wErr) {
      console.warn('[FlowerDetector] Warmup warning:', wErr);
    }
  }

  async detect(imageSource, confThreshold = 0.05, iouThreshold = 0.45) {
    if (!this.session) {
      await this.loadModel();
    }

    if (!this.session) {
      throw new Error('ONNX Inference session could not be established');
    }

    const ort = window.ort || (await waitForOrt());
    const startTime = performance.now();
    const { tensor, scaleInfo } = preprocessImage(imageSource, 640);

    // Convert preprocessed float32 data to ORT Tensor
    const inputTensor = new ort.Tensor('float32', tensor.data, tensor.dims);
    const inputName = this.session.inputNames[0] || 'images';
    const outputMap = await this.session.run({ [inputName]: inputTensor });

    const outputName = this.session.outputNames[0] || Object.keys(outputMap)[0];
    const outputTensor = outputMap[outputName];

    const detections = postprocessYOLO(outputTensor, scaleInfo, confThreshold, iouThreshold);
    const duration = performance.now() - startTime;
    this.lastInferenceTime = duration;

    return {
      detections,
      durationMs: Math.round(duration),
      fps: Math.round(1000 / Math.max(duration, 1)),
      backend: this.backendName
    };
  }

  async init(onProgress) {
    return this.loadModel(onProgress);
  }
}

export const defaultDetector = new FlowerDetector('/models/flower_yolo11s.onnx');
