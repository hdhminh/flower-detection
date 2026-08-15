import React, { useState, useCallback } from 'react';
import {
  Camera, Upload, ScanLine, Brain,
  Package, SlidersHorizontal, Monitor, Server, Leaf, RotateCcw
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
  preproc: { Icon:ScanLine,          en:'Preprocessor',    vi:'Tiền Xử Lý',      sub:'640×640 · Float32',      layer:1, x:350,  y:CY,     color:'#0D9488' },
  onnx:    { Icon:Brain,             en:'YOLOv11s WASM',   vi:'YOLOv11s WASM',   sub:'On-Device · Zero Cloud', layer:2, x:625,  y:CY,     color:'#F59E0B', hero:true },
  decode:  { Icon:Package,           en:'Box Decoder',     vi:'Giải Mã Hộp',     sub:'Coord Mapping',          layer:3, x:900,  y:CY-125, color:'#8B5CF6' },
  nms:     { Icon:SlidersHorizontal, en:'NMS Filter',      vi:'Lọc NMS',         sub:'IoU ≤ 0.45',             layer:3, x:900,  y:CY+125, color:'#8B5CF6' },
  hud:     { Icon:Monitor,           en:'HUD Canvas',      vi:'Canvas HUD',      sub:'60 FPS · Real-time',     layer:4, x:1145, y:CY,     color:'#06B6D4' },
  api:     { Icon:Server,            en:'FastAPI Server',  vi:'FastAPI Server',  sub:'REST · Python',          layer:5, x:1335, y:CY-125, color:'#10B981' },
  db:      { Icon:Leaf,              en:'Botanical DB',    vi:'CSDL Thực Vật',   sub:'Taxonomic Store',        layer:5, x:1335, y:CY+125, color:'#059669' },
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

function nodeR(id) { return NODES[id].hero ? RH : R; }

// ─── Bezier Path: Horizontal tangent at start and end for true alignment ──
function arrowPath(fromId, toId) {
  const f = NODES[fromId];
  const t = NODES[toId];
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

export function ArchitectureDiagram({ isActive = false }) {
  const { lang, t } = useLang();
  const isVi = lang === 'vi';
  const [revealed, setRevealed]   = useState(0);
  const [animLayer, setAnimLayer] = useState(0);

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
  }, []);

  return (
    <section className="arch-section" id="architecture">
      <div className="arch-grid-bg" />

      {/* ── Header — 3D Rolling Text Header (Character by character) ── */}
      <div className="arch-header">
        <RollingTextHeader
          isActive={isActive}
          badge={t('archBadge')}
          heading={t('archHeading')}
        />

        {/* Reset button — Always visible on the right */}
        <button
          className="arch-reset-pill"
          onClick={handleReset}
          title={isVi ? 'Đặt lại về bước đầu tiên' : 'Reset to initial step'}
        >
          <RotateCcw size={14} strokeWidth={2.4} />
          <span>{isVi ? 'Xem lại' : 'Reset'}</span>
        </button>
      </div>

      {/* ── SVG Diagram ── */}
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

          {/* ── 6 Column Vertical Boundary Cards (No text overflow) ── */}
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

                {/* Column header badge (sized to prevent text overflow) */}
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

          {/* ── Arrows (Smooth flow draw, perfectly straight horizontal landing) ── */}
          {ARROWS.map(({ from, to, reveal }) => {
            if (revealed < reveal) return null;
            const toNode = NODES[to];
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

          {/* ── Nodes ── */}
          {Object.entries(NODES).map(([id, node]) => {
            if (node.layer > revealed) return null;
            const r = node.hero ? RH : R;
            const isNew = node.layer === animLayer;
            const iconSize = node.hero ? 36 : 28;

            return (
              <g key={id} className={isNew ? 'arch-node-pop' : ''}>
                {/* Node Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={node.hero ? '#FFFBEB' : '#F0F9FF'}
                  stroke={node.color}
                  strokeWidth={node.hero ? 3.2 : 2.4}
                  style={node.hero
                    ? { filter: `drop-shadow(0 0 14px ${node.color}77)` }
                    : { filter: `drop-shadow(0 2px 8px rgba(14,116,144,0.12))` }}
                />

                {/* Lucide Icon */}
                <foreignObject
                  x={node.x - iconSize / 2}
                  y={node.y - iconSize / 2}
                  width={iconSize}
                  height={iconSize}
                  style={{ overflow: 'visible' }}
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
                ? `▶  Bấm để xem tiếp bước: ${LAYERS[revealed + 1]?.vi}`
                : `▶  Click anywhere to reveal: ${LAYERS[revealed + 1]?.en}`}
            </text>
          )}
        </svg>
      </div>
    </section>
  );
}

export default ArchitectureDiagram;
