import React, { useEffect, useRef } from 'react';
import { useLang } from '../lang';

export function DetectionOverlay({ detections = [], width, height }) {
  const canvasRef = useRef(null);
  const { lang } = useLang();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!detections || detections.length === 0) return;

    detections.forEach((det) => {
      const { x1, y1, x2, y2, color, confidence, classNameEn, classNameVi, srcWidth, srcHeight } = det;
      
      let drawX1 = x1;
      let drawY1 = y1;
      let drawX2 = x2;
      let drawY2 = y2;

      if (srcWidth && srcHeight) {
        const renderScale = Math.min(width / srcWidth, height / srcHeight);
        const renderW = srcWidth * renderScale;
        const renderH = srcHeight * renderScale;
        const offsetX = (width - renderW) / 2;
        const offsetY = (height - renderH) / 2;

        drawX1 = offsetX + x1 * renderScale;
        drawY1 = offsetY + y1 * renderScale;
        drawX2 = offsetX + x2 * renderScale;
        drawY2 = offsetY + y2 * renderScale;
      }

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
      const labelText = `${name.toUpperCase()} · ${conf}%`;
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
      }}
    />
  );
}
