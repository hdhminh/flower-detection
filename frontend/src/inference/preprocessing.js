/**
 * Preprocessing utilities for YOLO ONNX browser inference.
 * Resizes and normalizes HTMLImageElement / HTMLVideoElement / HTMLCanvasElement
 * into a float32 tensor of shape [1, 3, 640, 640] with letterboxing.
 * Uses zero-allocation memory recycling to avoid Garbage Collection (GC) pauses.
 */

// Singleton reusable offscreen canvas and context
let cachedCanvas = null;
let cachedCtx = null;
// Singleton reusable Float32Array buffer (3 * 640 * 640 = 1,228,800 floats)
let cachedFloat32Data = null;

function getCanvas(targetSize) {
  if (!cachedCanvas || cachedCanvas.width !== targetSize || cachedCanvas.height !== targetSize) {
    if (typeof OffscreenCanvas !== 'undefined') {
      cachedCanvas = new OffscreenCanvas(targetSize, targetSize);
    } else {
      cachedCanvas = document.createElement('canvas');
      cachedCanvas.width = targetSize;
      cachedCanvas.height = targetSize;
    }
    cachedCtx = cachedCanvas.getContext('2d', { willReadFrequently: true });
  }
  return { canvas: cachedCanvas, ctx: cachedCtx };
}

function getBuffer(targetSize) {
  const requiredLen = 3 * targetSize * targetSize;
  if (!cachedFloat32Data || cachedFloat32Data.length !== requiredLen) {
    cachedFloat32Data = new Float32Array(requiredLen);
  }
  return cachedFloat32Data;
}

export function preprocessImage(imageSource, targetSize = 640) {
  const { ctx } = getCanvas(targetSize);
  const float32Data = getBuffer(targetSize);

  const srcWidth = imageSource.videoWidth || imageSource.naturalWidth || imageSource.width;
  const srcHeight = imageSource.videoHeight || imageSource.naturalHeight || imageSource.height;

  if (!srcWidth || !srcHeight) {
    throw new Error('Invalid image or video source dimensions');
  }

  // Calculate letterbox scale and padding
  const scale = Math.min(targetSize / srcWidth, targetSize / srcHeight);
  const scaledWidth = Math.round(srcWidth * scale);
  const scaledHeight = Math.round(srcHeight * scale);
  const padX = (targetSize - scaledWidth) / 2;
  const padY = (targetSize - scaledHeight) / 2;

  // Fill neutral gray background for letterboxing (standard YOLO gray: 114/255 = #727272)
  ctx.fillStyle = '#727272';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Draw scaled image centered
  ctx.drawImage(imageSource, padX, padY, scaledWidth, scaledHeight);

  const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
  const { data } = imageData;

  // CHW format: [1, 3, 640, 640] normalized [0, 1]
  const area = targetSize * targetSize;

  for (let i = 0; i < area; i++) {
    const i4 = i * 4;
    // R channel
    float32Data[i] = data[i4] / 255.0;
    // G channel
    float32Data[area + i] = data[i4 + 1] / 255.0;
    // B channel
    float32Data[area * 2 + i] = data[i4 + 2] / 255.0;
  }

  return {
    tensor: {
      data: float32Data,
      dims: [1, 3, targetSize, targetSize],
      type: 'float32'
    },
    scaleInfo: {
      scale,
      padX,
      padY,
      srcWidth,
      srcHeight,
      targetSize
    }
  };
}
