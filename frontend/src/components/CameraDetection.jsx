import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Pause, Play, Eye, Sliders, Zap } from 'lucide-react';
import { defaultDetector } from '../inference/yoloInference';
import { DetectionOverlay } from './DetectionOverlay';
import { useLang } from '../lang';

export function CameraDetection({ onOpenFlowerDetail }) {
  const { lang, t } = useLang();
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [detections, setDetections] = useState([]);
  const [confThreshold, setConfThreshold] = useState(0.35);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [backendType, setBackendType] = useState('WASM');
  // Display dimensions of the video-viewport container (canvas overlay size)
  const [containerDims, setContainerDims] = useState({ width: 640, height: 480 });
  // Native resolution of the video stream (for coordinate mapping)
  const [nativeVideoDims, setNativeVideoDims] = useState({ width: 640, height: 480 });
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [devices, setDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState('');

  const animFrameId = useRef(null);
  const isInferencing = useRef(false);
  const lastInferenceTimestamp = useRef(0);
  const resizeObserverRef = useRef(null);

  useEffect(() => {
    async function getDevices() {
      try {
        const devList = await navigator.mediaDevices?.enumerateDevices();
        if (devList) {
          const videoDevs = devList.filter(d => d.kind === 'videoinput');
          setDevices(videoDevs);
          if (videoDevs.length > 0) {
            setCurrentDeviceId(videoDevs[0].deviceId);
          }
        }
      } catch (err) {
        console.warn('Error fetching media devices:', err);
      }
    }
    getDevices();
  }, []);

  useEffect(() => {
    async function load() {
      if (!defaultDetector.isLoaded) {
        setIsModelLoading(true);
        try {
          await defaultDetector.loadModel((pct) => setModelProgress(pct));
          setBackendType(defaultDetector.backendName);
        } catch (err) {
          console.error('Failed to load ONNX model:', err);
        } finally {
          setIsModelLoading(false);
        }
      } else {
        setBackendType(defaultDetector.backendName);
      }
    }
    load();
  }, []);

  const startCamera = async (deviceId = currentDeviceId) => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        setIsPaused(false);
      }
    } catch (err) {
      console.error('Webcam access error:', err);
      alert('Unable to access camera. Please grant webcam permissions in your browser.');
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
    }
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    setIsStreaming(false);
    setDetections([]);
    setFps(0);
    setLatency(0);
  }, []);

  const switchCamera = () => {
    if (devices.length < 2) return;
    const currIdx = devices.findIndex(d => d.deviceId === currentDeviceId);
    const nextIdx = (currIdx + 1) % devices.length;
    const nextDevId = devices[nextIdx].deviceId;
    setCurrentDeviceId(nextDevId);
    if (isStreaming) {
      startCamera(nextDevId);
    }
  };

  const runDetectionLoop = useCallback(() => {
    const loop = async () => {
      const now = performance.now();
      const video = videoRef.current;

      if (
        video &&
        video.readyState >= 2 &&
        !isPaused &&
        !isInferencing.current &&
        now - lastInferenceTimestamp.current >= 90
      ) {
        isInferencing.current = true;
        lastInferenceTimestamp.current = now;

        try {
          if (video.videoWidth && video.videoHeight) {
            // Track native video resolution for coord mapping
            setNativeVideoDims({ width: video.videoWidth, height: video.videoHeight });
          }

          const result = await defaultDetector.detect(video, confThreshold);
          setDetections((prev) => {
            const now = Date.now();
            const current = (result.detections || []).map(d => ({ ...d, ttl: now + 1000 }));
            const merged = [...current];
            for (const p of prev) {
              if (p.ttl > now && !current.some(c => c.classId === p.classId)) {
                merged.push(p);
              }
            }
            return merged;
          });
          setFps(result.fps || 0);
          setLatency(result.durationMs || 0);
          setBackendType(result.backend || 'WASM');
        } catch (err) {
          console.warn('Realtime detection frame error:', err);
        } finally {
          isInferencing.current = false;
        }
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
  }, [isPaused, confThreshold]);

  // Sync canvas size with container whenever it resizes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerDims({ width: Math.round(width), height: Math.round(height) });
      }
    });
    ro.observe(container);
    resizeObserverRef.current = ro;
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (isStreaming && !isPaused) {
      runDetectionLoop();
    } else if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
    }
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isStreaming, isPaused, runDetectionLoop]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <section id="camera" className="camera-detection-section">
      <div className="section-header">
        <div className="section-title-group">
          <h2>{t('secCameraTitle')}</h2>
          <p>{t('secCameraDesc')}</p>
        </div>

        {/* Realtime stats badge */}
        <div className="stats-strip">
          <div className="stat-badge">
            <Zap size={14} className="icon-zap" />
            <span>{fps} FPS</span>
          </div>
          <div className="stat-badge">
            <span className="stat-num">{latency}ms</span>
          </div>
          <div className="stat-badge hardware">
            <span>{backendType}</span>
          </div>
        </div>
      </div>

      <div className="camera-card glass-panel">
        <div className="video-viewport" ref={containerRef}>
          {isStreaming ? (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="webcam-video"
                onLoadedMetadata={(e) => {
                  // Set container display size
                  setContainerDims({
                    width: e.target.clientWidth,
                    height: e.target.clientHeight
                  });
                  // Set native video resolution
                  setNativeVideoDims({
                    width: e.target.videoWidth,
                    height: e.target.videoHeight
                  });
                }}
              />
              <DetectionOverlay
                detections={detections}
                width={containerDims.width}
                height={containerDims.height}
                srcWidth={nativeVideoDims.width}
                srcHeight={nativeVideoDims.height}
              />
            </>
          ) : (
            <div className="no-camera-placeholder">
              <div className="placeholder-icon">
                <Camera size={56} />
              </div>
              <p className="placeholder-text">{t('noCameraMsg')}</p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => startCamera()}
                disabled={isModelLoading}
              >
                <Camera size={20} />
                <span>{isModelLoading ? `Loading Model (${modelProgress}%)...` : t('btnStartWebcam')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Camera Control Bar */}
        <div className="camera-controls-bar">
          <div className="btn-group">
            {isStreaming ? (
              <>
                <button className="btn btn-danger" onClick={stopCamera}>
                  <span>{t('btnStopWebcam')}</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setIsPaused(!isPaused)}>
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                  <span>{isPaused ? t('btnResume') : t('btnPause')}</span>
                </button>
                {devices.length > 1 && (
                  <button className="btn btn-outline" onClick={switchCamera} title={t('btnSwitchCamera')}>
                    <RefreshCw size={16} />
                    <span>{t('btnSwitchCamera')}</span>
                  </button>
                )}
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => startCamera()} disabled={isModelLoading}>
                <Camera size={18} />
                <span>{t('btnStartWebcam')}</span>
              </button>
            )}
          </div>

          {/* Confidence Slider */}
          <div className="confidence-control">
            <Sliders size={16} />
            <label>{t('confThreshold')}: <strong>{Math.round(confThreshold * 100)}%</strong></label>
            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.05"
              value={confThreshold}
              onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Live Detections Feed */}
      {detections.length > 0 && (
        <div className="live-detections-feed">
          <h3>
            <span>🌸</span>
            <span>{t('detectedCount').replace('{count}', detections.length)}:</span>
          </h3>
          <div className="detected-cards-grid">
            {detections.map((det, i) => (
              <div key={i} className="detected-item-card" style={{ borderColor: det.color }}>
                <div className="item-icon" style={{ backgroundColor: `${det.color}22` }}>
                  <span style={{ fontSize: '28px' }}>{det.symbol || '🌸'}</span>
                </div>
                <div className="item-info">
                  <h4>{lang === 'vi' ? det.classNameVi : det.classNameEn}</h4>
                  <div className="confidence-pill" style={{ backgroundColor: det.color }}>
                    {Math.round(det.confidence * 100)}% Match
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-accent"
                  onClick={() => onOpenFlowerDetail(det.flowerId || det.classNameEn)}
                >
                  <Eye size={14} />
                  <span>{t('viewDetails')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
