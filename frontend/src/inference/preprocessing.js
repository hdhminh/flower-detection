/**
 * Preprocessing utilities for YOLOv11 ONNX browser inference.
 * Resizes and normalizes HTMLImageElement / HTMLVideoElement / HTMLCanvasElement
 * into a float32 tensor of shape [1, 3, 640, 640] with letterboxing.
 * ORT is loaded via CDN — no npm import needed here.
 */

export function preprocessImage(imageSource, targetSize = 640) {
  // Create an offscreen canvas for letterboxing
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

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

  // Fill neutral gray background for letterboxing
  ctx.fillStyle = '#727272';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Draw scaled image centered
  ctx.drawImage(imageSource, padX, padY, scaledWidth, scaledHeight);

  const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
  const { data } = imageData;

  // CHW format: [1, 3, 640, 640] normalized [0, 1]
  const float32Data = new Float32Array(3 * targetSize * targetSize);
  const area = targetSize * targetSize;

  for (let i = 0; i < area; i++) {
    const r = data[i * 4] / 255.0;
    const g = data[i * 4 + 1] / 255.0;
    const b = data[i * 4 + 2] / 255.0;

    // R channel
    float32Data[i] = r;
    // G channel
    float32Data[area + i] = g;
    // B channel
    float32Data[area * 2 + i] = b;
  }

  // Return raw data + dims — let yoloInference.js create the ORT Tensor
  // so we don't need to import ort here
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
