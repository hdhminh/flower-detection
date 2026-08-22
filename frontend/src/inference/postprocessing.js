/**
 * Standard YOLO Post-Processing Pipeline.
 * Follows industry-standard Class-Wise Non-Maximum Suppression (NMS).
 * Parses YOLO26 / YOLOv11 NMS-free output: `[1, 300, 6]` = `[x1, y1, x2, y2, score, class_id]`.
 */

export const FLOWER_CLASSES = [
  { id: 'chrysanthemum', name_vi: 'Hoa cúc', name_en: 'Chrysanthemum', symbol: '🌼', color: '#FAB005' },
  { id: 'rose', name_vi: 'Hoa hồng', name_en: 'Rose', symbol: '🌹', color: '#FF4D6D' },
  { id: 'hydrangea', name_vi: 'Cẩm tú cầu', name_en: 'Hydrangea', symbol: '🌸', color: '#4DABF7' },
  { id: 'carnation', name_vi: 'Hoa cẩm chướng', name_en: 'Carnation', symbol: '🏵️', color: '#F06595' },
  { id: 'sunflower', name_vi: 'Hướng dương', name_en: 'Sunflower', symbol: '🌻', color: '#FFA94D' },
  { id: 'other_flower', name_vi: 'Hoa khác', name_en: 'Other Flower', symbol: '🌺', color: '#ADB5BD' }
];

/**
 * Calculates Intersection over Union (IoU) between two bounding boxes
 */
function computeIoU(b1, b2) {
  const xA = Math.max(b1.x1, b2.x1);
  const yA = Math.max(b1.y1, b2.y1);
  const xB = Math.min(b1.x2, b2.x2);
  const yB = Math.min(b1.y2, b2.y2);

  const interWidth = Math.max(0, xB - xA);
  const interHeight = Math.max(0, yB - yA);
  const interArea = interWidth * interHeight;

  const area1 = (b1.x2 - b1.x1) * (b1.y2 - b1.y1);
  const area2 = (b2.x2 - b2.x1) * (b2.y2 - b2.y1);
  const unionArea = area1 + area2 - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

/**
 * Standard Class-Wise NMS
 */
export function postprocessYOLO(outputTensor, scaleInfo, confThreshold = 0.35, iouThreshold = 0.45) {
  const { data, dims } = outputTensor;
  // dims: [1, 300, 6] for YOLO26 NMS-free
  const numDetections = dims[1]; // 300
  
  const rawBoxes = [];
  const { scale, padX, padY, srcWidth, srcHeight } = scaleInfo;

  // 1. Extract candidates above confidence threshold
  for (let i = 0; i < numDetections; i++) {
    const offset = i * 6;
    const score = data[offset + 4];
    const classIdRaw = Math.round(data[offset + 5]);

    // Apply strict threshold for background class (other_flower)
    const effectiveThreshold = (classIdRaw === 5) ? Math.max(confThreshold, 0.60) : confThreshold;

    if (score >= effectiveThreshold) {
      const lx1 = data[offset + 0];
      const ly1 = data[offset + 1];
      const lx2 = data[offset + 2];
      const ly2 = data[offset + 3];

      // Transform from letterbox back to original image space
      const origX1 = Math.max(0, Math.min(srcWidth, (lx1 - padX) / scale));
      const origY1 = Math.max(0, Math.min(srcHeight, (ly1 - padY) / scale));
      const origX2 = Math.max(0, Math.min(srcWidth, (lx2 - padX) / scale));
      const origY2 = Math.max(0, Math.min(srcHeight, (ly2 - padY) / scale));

      const boxW = origX2 - origX1;
      const boxH = origY2 - origY1;

      // Skip degenerate boxes (< 15x15 px)
      if (boxW < 15 || boxH < 15) continue;

      const finalClassId = classIdRaw % FLOWER_CLASSES.length;
      const flowerClass = FLOWER_CLASSES[finalClassId];
      const isUncertain = score < 0.55;

      rawBoxes.push({
        classId: finalClassId,
        classNameVi: flowerClass.name_vi,
        classNameEn: flowerClass.name_en,
        flowerId: flowerClass.id,
        symbol: flowerClass.symbol,
        color: flowerClass.color,
        confidence: score,
        isUncertain,
        bbox: [origX1, origY1, origX2, origY2],
        x1: origX1,
        y1: origY1,
        x2: origX2,
        y2: origY2,
        srcWidth,
        srcHeight,
        width: boxW,
        height: boxH
      });
    }
  }

  // 2. Sort by confidence descending
  rawBoxes.sort((a, b) => b.confidence - a.confidence);

  // 3. Standard Non-Maximum Suppression (NMS)
  const nmsBoxes = [];
  for (const candidate of rawBoxes) {
    const isOverlapping = nmsBoxes.some(selected => computeIoU(candidate, selected) > iouThreshold);
    if (!isOverlapping) {
      nmsBoxes.push(candidate);
    }
  }

  return nmsBoxes;
}
