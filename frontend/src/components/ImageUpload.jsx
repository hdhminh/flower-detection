import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Sliders, Eye, RefreshCw } from 'lucide-react';
import { defaultDetector } from '../inference/yoloInference';
import { DetectionOverlay } from './DetectionOverlay';
import { useLang } from '../lang';
import confetti from 'canvas-confetti';

// 100% Authentic Real Botanical Photographs
const REAL_SAMPLE_FLOWERS = [
  {
    id: 'rose',
    name: 'Rose',
    symbol: '🌹',
    src: '/images/flowers/rose.jpg'
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    symbol: '🌻',
    src: '/images/flowers/sunflower.jpg'
  },
  {
    id: 'chrysanthemum',
    name: 'Chrysanthemum',
    symbol: '🌼',
    src: '/images/flowers/chrysanthemum.jpg'
  },
  {
    id: 'hydrangea',
    name: 'Hydrangea',
    symbol: '🌸',
    src: '/images/flowers/hydrangea.jpg'
  },
  {
    id: 'carnation',
    name: 'Carnation',
    symbol: '🌺',
    src: '/images/flowers/carnation.jpg'
  }
];

export function ImageUpload({ onOpenFlowerDetail }) {
  const { lang, t } = useLang();
  const [imageSrc, setImageSrc] = useState(REAL_SAMPLE_FLOWERS[0].src);
  const [detections, setDetections] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [confThreshold, setConfThreshold] = useState(0.20);
  const [inferenceStats, setInferenceStats] = useState(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 640, height: 640 });

  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  const runInferenceOnImage = async (imgEl, threshold = confThreshold) => {
    setIsDetecting(true);
    try {
      if (!defaultDetector.isLoaded) {
        await defaultDetector.loadModel();
      }

      const result = await defaultDetector.detect(imgEl, threshold);
      setDetections(result.detections || []);
      setInferenceStats({
        durationMs: result.durationMs,
        backend: result.backend
      });

      if (result.detections && result.detections.length > 0) {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.75 }
        });
      }
    } catch (err) {
      console.error('Image inference error:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
      setDetections([]);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
      setDetections([]);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectRealSample = (sample) => {
    setImageSrc(sample.src);
    setDetections([]);
  };

  const handleImageLoaded = (e) => {
    const img = e.target;
    setImgDimensions({
      width: img.clientWidth,
      height: img.clientHeight
    });
    runInferenceOnImage(img, confThreshold);
  };

  const handleThresholdChange = (val) => {
    setConfThreshold(val);
    if (imgRef.current && imageSrc) {
      runInferenceOnImage(imgRef.current, val);
    }
  };

  return (
    <section id="upload" className="upload-detection-section">
      <div className="section-header">
        <div className="section-title-group">
          <h2>{t('secUploadTitle')}</h2>
          <p>{t('secUploadDesc')}</p>
        </div>
      </div>

      {/* Real Flower Quick Sample Picker Strip */}
      <div className="sample-strip-card glass-panel">
        <span className="sample-label">{t('samplePhotos')}</span>
        <div className="sample-chips">
          {REAL_SAMPLE_FLOWERS.map((sample) => (
            <button
              key={sample.id}
              className={`sample-chip ${imageSrc === sample.src ? 'active-sample' : ''}`}
              onClick={() => handleSelectRealSample(sample)}
            >
              <img src={sample.src} alt={sample.name} className="sample-thumb" />
              <span>{sample.symbol} {sample.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Upload / Detection Studio */}
      <div className="upload-main-grid">
        <div className="upload-card glass-panel">
          {imageSrc ? (
            <div className="image-preview-container">
              <div className="image-wrapper">
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Flower Preview"
                  className="preview-img"
                  onLoad={handleImageLoaded}
                />
                <DetectionOverlay
                  detections={detections}
                  width={imgDimensions.width}
                  height={imgDimensions.height}
                />
              </div>

              {/* Upload Controls Bar */}
              <div className="preview-controls-bar">
                <button
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <RefreshCw size={16} />
                  <span>Choose Another Photo</span>
                </button>

                <div className="confidence-control">
                  <Sliders size={16} />
                  <label>{t('confThreshold')}: <strong>{Math.round(confThreshold * 100)}%</strong></label>
                  <input
                    type="range"
                    min="0.10"
                    max="0.90"
                    step="0.05"
                    value={confThreshold}
                    onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              className="dropzone-area"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={64} className="dropzone-icon" />
              <h3>{t('dropzoneText')}</h3>
              <p>Supports high-resolution JPG, PNG, and WEBP photographs</p>
              <button className="btn btn-primary btn-lg mt-3">
                <ImageIcon size={18} />
                <span>Upload Photograph</span>
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        {/* Inference Results Panel */}
        <div className="results-card glass-panel">
          <div className="results-header">
            <Sparkles size={20} className="text-accent" />
            <h3>AI Detection Breakdown</h3>
            {inferenceStats && (
              <span className="timing-badge">{inferenceStats.durationMs}ms • {inferenceStats.backend}</span>
            )}
          </div>

          {isDetecting ? (
            <div className="detecting-spinner">
              <div className="spinner"></div>
              <p>{t('detecting')}</p>
            </div>
          ) : detections.length > 0 ? (
            <div className="detections-list">
              <p className="detection-summary">
                {t('detectedCount').replace('{count}', detections.length)}
              </p>
              {detections.map((det, idx) => (
                <div key={idx} className="detection-result-pill" style={{ borderLeftColor: det.color }}>
                  <div className="pill-left">
                    <span className="det-symbol">{det.symbol || '🌸'}</span>
                    <div className="det-names">
                      <h4>{lang === 'vi' ? det.classNameVi : det.classNameEn}</h4>
                      <div className="progress-bar-wrap">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.round(det.confidence * 100)}%`,
                            backgroundColor: det.color
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pill-right">
                    <span className="conf-value">{Math.round(det.confidence * 100)}%</span>
                    <button
                      className="btn btn-xs btn-accent"
                      onClick={() => onOpenFlowerDetail(det.flowerId || det.classNameEn)}
                    >
                      <Eye size={12} />
                      <span>{t('viewDetails')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : imageSrc ? (
            <div className="no-detections-box">
              <p>{t('noFlowerDetected')}</p>
            </div>
          ) : (
            <div className="empty-results-prompt">
              <ImageIcon size={40} />
              <p>Upload a flower photo or click one of the authentic real flower photos above to view instant detections.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
