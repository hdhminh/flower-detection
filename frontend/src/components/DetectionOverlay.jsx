import React, { useEffect, useRef } from 'react';
import { useLang } from '../lang';

export function DetectionOverlay({ detections = [], width, height, srcWidth, srcHeight }) {
  const canvasRef = useRef(null);
  const { lang } = useLang();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!detections || detections.length === 0) return;

    detections.forEach((det) => {
      const { x1, y1, x2, y2, color, confidence, classNameEn, classNameVi } = det;

      // Native video dims (e.g. 1280×720) → canvas display dims (e.g. 600×338)
      // Video uses object-fit: cover, so we need cover-aware coord mapping.
      const sw = srcWidth || det.srcWidth || width;
      const sh = srcHeight || det.srcHeight || height;

      // Cover scale: the larger scale fills the container without black bars
      const coverScale = Math.max(width / sw, height / sh);
      // The rendered video is centered in the container, some edges are cropped
      const cropX = (sw * coverScale - width) / 2;   // pixels cropped from each side
      const cropY = (sh * coverScale - height) / 2;  // pixels cropped from top/bottom

      // Map from native coords to canvas coords:
      // canvas_x = native_x * coverScale - cropX
      const drawX1 = x1 * coverScale - cropX;
      const drawY1 = y1 * coverScale - cropY;
      const drawX2 = x2 * coverScale - cropX;
      const drawY2 = y2 * coverScale - cropY;

      const boxW = drawX2 - drawX1;
      const boxH = drawY2 - drawY1;
      const name = lang === 'vi' ? classNameVi : classNameEn;
      const conf = Math.round(confidence * 100);

      // Subtle fill
      ctx.fillStyle = `${color || '#00E5FF'}18`;
      ctx.fillRect(drawX1, drawY1, boxW, boxH);

      // Precision hairline border
      ctx.lineWidth = 2;
      ctx.strokeStyle = color || '#00E5FF';
      ctx.strokeRect(drawX1, drawY1, boxW, boxH);

      // Corner target brackets
      const bracketLen = Math.min(16, boxW / 3, boxH / 3);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(drawX1, drawY1 + bracketLen);
      ctx.lineTo(drawX1, drawY1);
      ctx.lineTo(drawX1 + bracketLen, drawY1);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(drawX2 - bracketLen, drawY1);
      ctx.lineTo(drawX2, drawY1);
      ctx.lineTo(drawX2, drawY1 + bracketLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(drawX1, drawY2 - bracketLen);
      ctx.lineTo(drawX1, drawY2);
      ctx.lineTo(drawX1 + bracketLen, drawY2);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(drawX2 - bracketLen, drawY2);
      ctx.lineTo(drawX2, drawY2);
      ctx.lineTo(drawX2, drawY2 - bracketLen);
      ctx.stroke();

      // Minimalist Label Tag
      const labelText = `${name.toUpperCase()} ${conf}%`;
      ctx.font = '700 12px "JetBrains Mono", Menlo, Consolas, monospace';
      const textMetrics = ctx.measureText(labelText);
      const tagW = textMetrics.width + 16;
      const tagH = 24;
      const tagY = Math.max(0, drawY1 - tagH - 4);

      ctx.fillStyle = 'rgba(13, 17, 23, 0.94)';
      ctx.fillRect(drawX1, tagY, tagW, tagH);

      ctx.lineWidth = 1;
      ctx.strokeStyle = color || '#00E5FF';
      ctx.strokeRect(drawX1, tagY, tagW, tagH);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(labelText, drawX1 + 8, tagY + 16);
    });
  }, [detections, width, height, lang]);

  return (
    <canvas
      ref={canvasRef}
      className="detection-overlay-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}
