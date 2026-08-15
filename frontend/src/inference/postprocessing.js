/**
 * Post-processing: parses YOLOv11 raw output tensors, computes IoU, performs NMS,
 * and scales bounding boxes back to original source image/video coordinates.
 */

export const FLOWER_CLASSES = [
  { id: 'chrysanthemum', name_vi: 'Hoa cúc', name_en: 'Chrysanthemum', symbol: '🌼', color: '#FAB005' },
  { id: 'rose', name_vi: 'Hoa hồng', name_en: 'Rose', symbol: '🌹', color: '#FF4D6D' },
  { id: 'hydrangea', name_vi: 'Cẩm tú cầu', name_en: 'Hydrangea', symbol: '🌸', color: '#4DABF7' },
  { id: 'lavender', name_vi: 'Oải hương', name_en: 'Lavender', symbol: '💜', color: '#9775FA' },
  { id: 'sunflower', name_vi: 'Hướng dương', name_en: 'Sunflower', symbol: '🌻', color: '#FFA94D' }
];

export function computeIoU(boxA, boxB) {
  const xA = Math.max(boxA.x1, boxB.x1);
  const yA = Math.max(boxA.y1, boxB.y1);
  const xB = Math.min(boxA.x2, boxB.x2);
  const yB = Math.min(boxA.y2, boxB.y2);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const boxAArea = (boxA.x2 - boxA.x1) * (boxA.y2 - boxA.y1);
  const boxBArea = (boxB.x2 - boxB.x1) * (boxB.y2 - boxB.y1);
  const unionArea = boxAArea + boxBArea - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

export function nonMaxSuppression(boxes, iouThreshold = 0.45, maxDetections = 20) {
  // Sort boxes by confidence descending
  const sorted = [...boxes].sort((a, b) => b.confidence - a.confidence);
  const selected = [];

  for (const box of sorted) {
    if (selected.length >= maxDetections) break;
    let keep = true;
    for (const chosen of selected) {
      if (computeIoU(box, chosen) > iouThreshold) {
        keep = false;
        break;
      }
    }
    if (keep) {
      selected.push(box);
    }
  }

  return selected;
}

export function postprocessYOLO(outputTensor, scaleInfo, confThreshold = 0.35, iouThreshold = 0.45) {
  const { data, dims } = outputTensor;
  // dims: [1, channels, anchors] e.g. [1, 84, 8400] or [1, 9, 8400]
  const channels = dims[1];
  const numAnchors = dims[2];
  const numClasses = channels - 4;

  const rawBoxes = [];
  const { scale, padX, padY, srcWidth, srcHeight } = scaleInfo;

  for (let a = 0; a < numAnchors; a++) {
    // Find best class score for anchor `a`
    let maxScore = 0;
    let maxClassId = 0;

    for (let c = 0; c < numClasses; c++) {
      const score = data[(4 + c) * numAnchors + a];
      if (score > maxScore) {
        maxScore = score;
        maxClassId = c;
      }
    }

    if (maxScore >= confThreshold) {
      // Coordinates in letterbox space (640x640)
      const cx = data[0 * numAnchors + a];
      const cy = data[1 * numAnchors + a];
      const w = data[2 * numAnchors + a];
      const h = data[3 * numAnchors + a];

      const lx1 = cx - w / 2;
      const ly1 = cy - h / 2;
      const lx2 = cx + w / 2;
      const ly2 = cy + h / 2;

      // Transform from letterbox back to original image space
      const origX1 = Math.max(0, Math.min(srcWidth, (lx1 - padX) / scale));
      const origY1 = Math.max(0, Math.min(srcHeight, (ly1 - padY) / scale));
      const origX2 = Math.max(0, Math.min(srcWidth, (lx2 - padX) / scale));
      const origY2 = Math.max(0, Math.min(srcHeight, (ly2 - padY) / scale));

      const flowerClass = FLOWER_CLASSES[maxClassId % FLOWER_CLASSES.length];

      rawBoxes.push({
        classId: maxClassId % FLOWER_CLASSES.length,
        classNameVi: flowerClass.name_vi,
        classNameEn: flowerClass.name_en,
        flowerId: flowerClass.id,
        symbol: flowerClass.symbol,
        color: flowerClass.color,
        confidence: maxScore,
        bbox: [origX1, origY1, origX2, origY2],
        x1: origX1,
        y1: origY1,
        x2: origX2,
        y2: origY2,
        srcWidth,
        srcHeight,
        width: origX2 - origX1,
        height: origY2 - origY1
      });
    }
  }

  // Apply NMS
  return nonMaxSuppression(rawBoxes, iouThreshold);
}
