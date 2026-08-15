import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
gsap.registerPlugin(Observer);
import {
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Eye,
  Zap,
  BookOpen,
  Calendar,
  MapPin,
  HeartHandshake,
  Lightbulb,
  Activity,
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  Keyboard,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { defaultDetector } from './inference/yoloInference';
import { DetectionOverlay } from './components/DetectionOverlay';
import { FloraMorphWordmark } from './components/FloraMorphWordmark';
import { LanguageSwitch } from './components/LanguageSwitch';
import { StudioSyncedHeader } from './components/StudioSyncedHeader';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { useLang } from './lang';
import { explainFlowerWithLLM, fetchFlowerDetail, LOCAL_FLOWERS_DB } from './api';
import './App.css';

const BACKGROUND_VIDEOS = [
  { id: 0, src: '/videos/video-1.mp4', startAt: 1.0,  endBefore: 1.0 },
  { id: 1, src: '/videos/video-2.mp4', startAt: 0,    endBefore: 0.5 },
  { id: 2, src: '/videos/video-3.mp4', startAt: 0,    endBefore: 0.5 },
];

export function App() {
  const { lang, t } = useLang();

  // currentVideo = fully visible; nextVideo = fading IN on top; null = not transitioning
  const [currentVideo, setCurrentVideo] = useState(0);
  const [nextVideo, setNextVideo] = useState(null);
  const [clockTime, setClockTime] = useState('');

  // Studio / Camera Section State
  const [studioMode, setStudioMode] = useState('camera');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoDimensions, setPhotoDimensions] = useState({ width: 800, height: 600 });
  const [detections, setDetections] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedFlowerForModal, setSelectedFlowerForModal] = useState(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [shortcutToast, setShortcutToast] = useState(null);
  const shortcutToastTimerRef = useRef(null);
  const [isModelReady, setIsModelReady] = useState(false);

  // Toast system for displaying results
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Webcam State
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraFps, setCameraFps] = useState(0);
  const [cameraLatency, setCameraLatency] = useState(0);
  const [cameraDetections, setCameraDetections] = useState([]);
  const [camDimensions, setCamDimensions] = useState({ width: 1280, height: 720 });

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewImgRef = useRef(null);
  const animFrameId = useRef(null);
  const isInferencingRef = useRef(false);
  const lastInferenceTimeRef = useRef(0);
  const toastTimersRef = useRef({});

  const video0Ref = useRef(null);
  const video1Ref = useRef(null);
  const video2Ref = useRef(null);
  const currentVideoRef = useRef(0); // tracks which video is currently shown
  const switchingRef    = useRef(false); // prevents double-trigger during crossfade

  // On mount: wait for DOM, then explicitly play only video-0
  useEffect(() => {
    const playFirst = () => {
      const v0 = video0Ref.current;
      if (v0) {
        v0.currentTime = BACKGROUND_VIDEOS[0].startAt;
        v0.play().catch(err => {
          console.warn('[Video 0] Autoplay prevented:', err);
        });
      }
    };
    const tId = setTimeout(playFirst, 50);
    return () => clearTimeout(tId);
  }, []);

  // Model loading state
  const [modelStatus, setModelStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [modelError, setModelError] = useState(null);

  const initModel = useCallback(async () => {
    try {
      setModelStatus('loading');
      setModelError(null);
      await defaultDetector.init();
      setModelStatus('ready');
      setIsModelReady(true);
    } catch (err) {
      console.error('Failed to init YOLOv11s model:', err);
      setModelStatus('error');
      setModelError(err.message || 'Model loading error');
      setIsModelReady(false);
    }
  }, []);

  useEffect(() => {
    initModel();
  }, [initModel]);

  // Clean, instantaneous crossfade sequence:
  const triggerSwitch = useCallback((completedIdx) => {
    if (switchingRef.current) return;
    switchingRef.current = true;

    const nextIdx = (completedIdx + 1) % BACKGROUND_VIDEOS.length;
    const refs = [video0Ref, video1Ref, video2Ref];
    const nextEl = refs[nextIdx].current;

    if (nextEl) {
      nextEl.currentTime = BACKGROUND_VIDEOS[nextIdx].startAt;
      nextEl.play().catch(e => console.warn('[Video Play]', e));
    }

    setNextVideo(nextIdx);

    setTimeout(() => {
      currentVideoRef.current = nextIdx;
      setCurrentVideo(nextIdx);
      setNextVideo(null);
      switchingRef.current = false;
    }, 500);
  }, []);

  const handleVideoEnded = useCallback((idx) => {
    if (switchingRef.current) return;
    if (idx !== currentVideoRef.current) return;
    triggerSwitch(idx);
  }, [triggerSwitch]);

  const handleTimeUpdate = useCallback((idx) => {
    if (switchingRef.current) return;
    if (idx !== currentVideoRef.current) return;
    const refs = [video0Ref, video1Ref, video2Ref];
    const el = refs[idx].current;
    const cfg = BACKGROUND_VIDEOS[idx];
    if (!el || !el.duration || cfg.endBefore === 0) return;
    if (el.currentTime >= el.duration - cfg.endBefore) {
      triggerSwitch(idx);
    }
  }, [triggerSwitch]);

  // 24h Clock timer
  useEffect(() => {
    const updateTime = () => {
      setClockTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Launch confetti celebration when confidence is high
  const launchConfetti = useCallback(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#FFE066', '#FF6B6B', '#74C0FC', '#B197FC', '#69DB7C'],
      disableForReducedMotion: true,
      zIndex: 9999,
    });
  }, []);

  // Photo inference runner
  const runPhotoInference = useCallback(async (imageElement) => {
    if (!imageElement || !imageElement.complete) return;
    setIsDetecting(true);
    try {
      const res = await defaultDetector.detect(imageElement, 0.15);
      const dets = res.detections || [];
      setDetections(dets);

      if (dets.length > 0) {
        if (dets[0].confidence > 0.8) {
          launchConfetti();
        }
      }
    } catch (err) {
      console.error('Detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  }, [launchConfetti]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setSelectedPhoto(url);
    setDetections([]);
    setToasts([]);

    const img = new Image();
    img.onload = () => {
      setPhotoDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  };

  const handleImageLoad = () => {
    if (previewImgRef.current) {
      setPhotoDimensions({
        width: previewImgRef.current.naturalWidth,
        height: previewImgRef.current.naturalHeight,
      });
      runPhotoInference(previewImgRef.current);
    }
  };

  const handleClearPhoto = () => {
    setSelectedPhoto(null);
    setDetections([]);
    setToasts([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Start webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCamDimensions({
            width: videoRef.current.videoWidth || 1280,
            height: videoRef.current.videoHeight || 720,
          });
          setIsStreaming(true);
        };
      }
    } catch (err) {
      console.error('Camera access denied or failed:', err);
      alert(lang === 'vi' ? 'Không thể truy cập camera. Vui lòng cấp quyền camera trong trình duyệt.' : 'Cannot access camera. Please allow camera permissions in your browser.');
    }
  };

  // Stop webcam
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setCameraDetections([]);
    setCameraFps(0);
    setCameraLatency(0);
    setToasts([]);
  }, [lang]);

  // Camera real-time loop — results go to HUD panel only, no toasts
  useEffect(() => {
    if (!isStreaming || studioMode !== 'camera') {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      return;
    }
    const loop = async () => {
      const now = performance.now();
      const video = videoRef.current;
      if (video && video.readyState >= 2 && !isInferencingRef.current && now - lastInferenceTimeRef.current >= 300) {
        isInferencingRef.current = true;
        lastInferenceTimeRef.current = now;
        try {
          if (video.videoWidth) setCamDimensions({ width: video.clientWidth, height: video.clientHeight });
          const res = await defaultDetector.detect(video, 0.15);
          const dets = res.detections || [];
          setCameraDetections(dets);
          setCameraFps(res.fps || 0);
          setCameraLatency(res.durationMs || 0);
        } catch (err) {
          console.warn('Realtime detection frame:', err);
        } finally {
          isInferencingRef.current = false;
        }
      }
      animFrameId.current = requestAnimationFrame(loop);
    };
    animFrameId.current = requestAnimationFrame(loop);
    return () => { if (animFrameId.current) cancelAnimationFrame(animFrameId.current); };
  }, [isStreaming, studioMode]);

  // ── GSAP Full-Screen Swipe Slider ───────────────────────────────────────
  const slideTrackRef = useRef(null);
  const studioScrollRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0); // 0 = hero, 1 = studio, 2 = architecture
  const currentSlideRef = useRef(0);
  const isSlidingRef = useRef(false);

  const goToSlide = useCallback((index) => {
    if (isSlidingRef.current) return;
    if (index < 0 || index > 2) return;
    if (index === currentSlideRef.current) return;

    isSlidingRef.current = true;
    currentSlideRef.current = index;
    setActiveSlide(index);

    // Exact -100vh translation per slide (0vh, -100vh, -200vh)
    gsap.to(slideTrackRef.current, {
      y: `${-index * 100}vh`,
      duration: 0.85,
      ease: 'power3.inOut',
      onComplete: () => {
        isSlidingRef.current = false;
      },
    });
  }, []);

  const triggerShortcutToast = useCallback((msg, keyBadge) => {
    if (shortcutToastTimerRef.current) clearTimeout(shortcutToastTimerRef.current);
    setShortcutToast({ text: msg, keyBadge });
    shortcutToastTimerRef.current = setTimeout(() => {
      setShortcutToast(null);
    }, 1800);
  }, []);

  const modalOpenRef = useRef(false);
  const dossierOpenRef = useRef(false);
  const shortcutsOpenRef = useRef(false);
  const isStreamingRef = useRef(false);
  const studioModeRef = useRef('camera');

  useEffect(() => {
    dossierOpenRef.current = !!selectedFlowerForModal;
    shortcutsOpenRef.current = showShortcutsModal;
    modalOpenRef.current = !!selectedFlowerForModal || showShortcutsModal;
  }, [selectedFlowerForModal, showShortcutsModal]);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
    studioModeRef.current = studioMode;
  }, [isStreaming, studioMode]);

  // GSAP Observer: wheel + touch swipe + keyboard shortcuts
  useEffect(() => {
    const obs = Observer.create({
      target: window,
      type: 'wheel,touch,pointer',
      tolerance: 40,
      onDown: (self) => {
        if (modalOpenRef.current) return;
        if (self.event?.target?.closest?.('.modal-backdrop-blur')) return;

        // Swipe / Scroll Down
        if (currentSlideRef.current === 0) {
          goToSlide(1);
        } else if (currentSlideRef.current === 1) {
          goToSlide(2);
        }
      },
      onUp: (self) => {
        if (modalOpenRef.current) return;
        if (self.event?.target?.closest?.('.modal-backdrop-blur')) return;

        // Swipe / Scroll Up
        if (currentSlideRef.current === 2) {
          goToSlide(1);
        } else if (currentSlideRef.current === 1) {
          const st = studioScrollRef.current?.scrollTop || 0;
          if (st <= 10) {
            goToSlide(0);
          }
        }
      },
      preventDefault: false,
    });

    const onKey = (e) => {
      // Ignore if user is typing inside an input/textarea
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) {
        return;
      }

      // Escape key handles closing modals first
      if (e.key === 'Escape') {
        if (dossierOpenRef.current) {
          setSelectedFlowerForModal(null);
          return;
        }
        if (shortcutsOpenRef.current) {
          setShowShortcutsModal(false);
          return;
        }
      }

      // Help Modal Toggle ('?' or Shift+'/')
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }

      // If a modal is open, don't trigger background navigation
      if (modalOpenRef.current) return;

      const keyLower = e.key.toLowerCase();

      // Section Navigation Shortcuts
      if (e.key === '1' || keyLower === 'h') {
        e.preventDefault();
        goToSlide(0);
        triggerShortcutToast(t('navLanding'), '1');
      } else if (e.key === '2' || keyLower === 's') {
        e.preventDefault();
        goToSlide(1);
        triggerShortcutToast(t('navStudio'), '2');
      } else if (e.key === '3' || keyLower === 'a') {
        e.preventDefault();
        goToSlide(2);
        triggerShortcutToast(t('navArch'), '3');
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown' || keyLower === 'j') {
        if (currentSlideRef.current < 2) {
          e.preventDefault();
          goToSlide(currentSlideRef.current + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || keyLower === 'k') {
        if (currentSlideRef.current > 0) {
          e.preventDefault();
          goToSlide(currentSlideRef.current - 1);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(2);
      }

      // Studio Mode Shortcuts (Camera vs Upload vs Toggle Camera)
      else if (keyLower === 'c') {
        e.preventDefault();
        if (currentSlideRef.current !== 1) goToSlide(1);
        setStudioMode('camera');
        triggerShortcutToast(t('tabLiveCamera'), 'C');
      } else if (keyLower === 'u' || keyLower === 'p') {
        e.preventDefault();
        if (currentSlideRef.current !== 1) goToSlide(1);
        setStudioMode('photo');
        stopCamera();
        triggerShortcutToast(t('tabPhoto'), 'U');
      } else if (e.key === ' ' || e.code === 'Space') {
        if (currentSlideRef.current === 1 && studioModeRef.current === 'camera') {
          e.preventDefault();
          if (isStreamingRef.current) {
            stopCamera();
            triggerShortcutToast(t('btnStopCamera'), 'Space');
          } else {
            startCamera();
            triggerShortcutToast(t('btnStartCamera'), 'Space');
          }
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      obs.kill();
      window.removeEventListener('keydown', onKey);
    };
  }, [goToSlide, stopCamera, triggerShortcutToast, t]);

  const scrollToStudio = () => goToSlide(1);
  const scrollToHero = () => goToSlide(0);

  return (
    <div className="flora-app-root font-figtree">
      {/* GSAP Swipe Viewport & Track */}
      <div className="slide-viewport">
        <div className="slide-track" ref={slideTrackRef}>

          {/* ====================================================================== */}
          {/* SECTION 1: FULL-SCREEN HERO — CRYSTAL CLEAR VIDEO, NO OVERLAYS         */}
          {/* ====================================================================== */}
          <section id="hero" className="slide-panel hero-fullscreen-container">
        {/* Pure Video Background — Zero Filter, Zero Overlay */}
        <div className="hero-video-stage" aria-hidden="true">
          {BACKGROUND_VIDEOS.map((vid, idx) => {
            const isCurrent = idx === currentVideo;
            const isNext    = idx === nextVideo;
            let cls = 'hero-bg-video';
            if (isNext)         cls += ' video-entering';
            else if (isCurrent) cls += ' video-current';
            else                cls += ' video-hidden';
            return (
              <video
                key={vid.id}
                ref={idx === 0 ? video0Ref : idx === 1 ? video1Ref : video2Ref}
                src={vid.src}
                muted
                playsInline
                preload="auto"
                onEnded={() => handleVideoEnded(idx)}
                onTimeUpdate={vid.endBefore > 0 ? () => handleTimeUpdate(idx) : undefined}
                className={cls}
              />
            );
          })}
        </div>

        {/* Slim Top Bar */}
        <header className="hero-top-bar">
          <div className="brand-badge-wrap">
            <span className="brand-logo-txt">FLORA</span>
            <span className="brand-tech-tag">Code Catalyst</span>
          </div>
          <div className="hero-top-right">
            <div className="live-clock-pill">
              <span className="clock-city-tag">{t('clockCity')}</span>
              <span className="clock-num">{clockTime || '00:00:00'}</span>
            </div>
            {/* Bilingual Switch Toggle replacing Launch Studio button */}
            <LanguageSwitch />
          </div>
        </header>

        {/* Bottom Content — Title LEFT, CTA RIGHT */}
        <div className="hero-bottom-stage">
          <div className="hero-title-row">
            {/* Left: Giant GSAP Morph Wordmark */}
            <div className="hero-giant-name-box">
              <FloraMorphWordmark onClick={scrollToStudio} />
            </div>

            {/* Right: description + CTA button */}
            <div className="hero-description-box">
              <p className="hero-standfirst-txt">
                {t('heroDesc')}
              </p>
              <button className="btn-hero-fill-up" onClick={scrollToStudio}>
                <span>{t('btnLaunchStudio')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* SECTION 2: VISION STUDIO                                               */}
      {/* ====================================================================== */}
      <section id="studio" ref={studioScrollRef} className="slide-panel studio-fullscreen-container">
        <div className="studio-inner-shell">

          {/* Studio Header (Synchronized Dual Line Scramble) */}
          <div className="studio-top-header">
            <StudioSyncedHeader isActive={activeSlide === 1} charDuration={500} holdDuration={10000} />

            {/* Mode Switcher */}
            <div className="studio-header-actions">
              <div className="studio-mode-switcher" role="tablist">
                <div className={`mode-tab-glider glider-${studioMode}`} aria-hidden="true" />
                <button
                  role="tab"
                  aria-selected={studioMode === 'camera'}
                  className={`mode-tab-btn ${studioMode === 'camera' ? 'active-tab' : ''}`}
                  onClick={() => { setStudioMode('camera'); }}
                >
                  <Camera size={15} />
                  <span>{t('tabLiveCamera')}</span>
                </button>
                <button
                  role="tab"
                  aria-selected={studioMode === 'photo'}
                  className={`mode-tab-btn ${studioMode === 'photo' ? 'active-tab' : ''}`}
                  onClick={() => { setStudioMode('photo'); stopCamera(); }}
                >
                  <ImageIcon size={15} />
                  <span>{t('tabPhoto')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="studio-fullwidth-grid">

            {/* === VIEWPORT === */}
            <div className="studio-viewport-col">
              <div className="studio-viewfinder-frame">

                {/* Submerged Logo Watermark centered inside the Viewfinder */}
                {((studioMode === 'camera' && !isStreaming) || (studioMode === 'photo' && !selectedPhoto)) && (
                  <div className="viewfinder-watermark-bg" aria-hidden="true">
                    <img src="/logo-watermark.png" alt="" className="viewfinder-watermark-img" />
                  </div>
                )}

                {/* Camera Mode Pane */}
                <div className={`viewfinder-mode-pane pane-camera ${studioMode === 'camera' ? 'pane-active' : 'pane-inactive'}`}>
                  {/* Webcam video */}
                  <video
                    ref={videoRef}
                    playsInline muted autoPlay
                    className={`viewfinder-media ${isStreaming ? 'vf-show' : 'vf-hide'}`}
                  />

                  {/* Camera overlay */}
                  {isStreaming && (
                    <DetectionOverlay detections={cameraDetections} width={camDimensions.width} height={camDimensions.height} />
                  )}

                  {/* Camera inactive */}
                  {!isStreaming && (
                    <div className="camera-standby-state" onClick={startCamera} role="button" tabIndex={0} title={t('btnStartCamera')}>
                      <div className="camera-icon-ring">
                        <Camera size={36} strokeWidth={1.75} />
                      </div>
                      <h3>{t('turnOnCamera')}</h3>
                      <p className="camera-standby-desc">{t('cameraInstruction')}</p>
                    </div>
                  )}

                  {/* Stop Camera overlay inside viewfinder */}
                  {isStreaming && (
                    <div className="viewfinder-streaming-bar">
                      <div className="live-fps-badge">
                        <span className="fps-dot"></span>
                        <span>{cameraFps} fps · {cameraLatency}ms</span>
                      </div>
                      <button className="btn-stop-camera" onClick={stopCamera}>{t('btnStopCamera')}</button>
                    </div>
                  )}
                </div>

                {/* Photo / Upload Mode Pane */}
                <div className={`viewfinder-mode-pane pane-photo ${studioMode === 'photo' ? 'pane-active' : 'pane-inactive'}`}>
                  {/* Hidden file input */}
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />

                  {/* Photo: upload dropzone */}
                  {!selectedPhoto && (
                    <div className="photo-empty-dropzone" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
                      <div className="upload-dropzone-inner">
                        <div className="upload-icon-ring">
                          <UploadCloud size={36} strokeWidth={1.75} />
                        </div>
                        <h3>{t('dropzoneTitle')}</h3>
                        <p className="upload-standby-desc">{t('dropzoneSubtitle')}</p>
                      </div>
                    </div>
                  )}

                  {/* Photo: loaded */}
                  {selectedPhoto && (
                    <>
                      {isDetecting && (
                        <div className="photo-scanning-overlay">
                          <Loader2 size={28} className="spin-loader" />
                          <span>{t('runningInference')}</span>
                        </div>
                      )}
                      <img
                        ref={previewImgRef}
                        src={selectedPhoto}
                        alt="Botanical subject"
                        className="viewfinder-media"
                        onLoad={handleImageLoad}
                      />
                      <div className="viewfinder-streaming-bar">
                        <button className="btn-photo-change" onClick={() => fileInputRef.current?.click()}>
                          <UploadCloud size={14} />
                          <span>{t('btnIdentifyAgain')}</span>
                        </button>
                        <button className="btn-photo-clear" onClick={handleClearPhoto}>
                          {lang === 'vi' ? 'Xóa' : 'Clear'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>{/* end studio-viewfinder-frame */}
            </div>{/* end studio-viewport-col */}

            {/* === INFO PANEL === */}
            <div className="studio-hud-col">
              <div className="hud-header-bar">
                <div className="hud-title-group">
                  <Zap size={15} />
                  <span>{t('hudTitle')}</span>
                </div>
                {modelStatus === 'ready' && (
                  <span className="model-ready-dot">
                    <span className="dot-pulse"></span>
                    <span>{t('modelReady')}</span>
                  </span>
                )}
                {modelStatus === 'loading' && (
                  <span className="model-loading-dot">
                    <span className="dot-loading"></span>
                    <span>{t('modelLoading')}</span>
                  </span>
                )}
                {modelStatus === 'error' && (
                  <button className="model-error-badge" onClick={initModel} title={modelError || 'Click to retry'}>
                    <span className="dot-error"></span>
                    <span>{t('modelRetry')}</span>
                  </button>
                )}
              </div>

              <div className="hud-body-content">
                {isDetecting ? (
                  <div className="hud-loading-state">
                    <div className="pastel-spinner"></div>
                    <p>{t('runningInference')}</p>
                  </div>
                ) : (studioMode === 'photo' ? detections : cameraDetections).length > 0 ? (
                  <div className="hud-targets-list">
                    <span className="targets-counter">
                      {t('speciesDetected', { count: (studioMode === 'photo' ? detections : cameraDetections).length })}
                    </span>
                    {(studioMode === 'photo' ? detections : cameraDetections).map((det, idx) => (
                      <div key={idx} className="target-result-card" style={{ borderLeftColor: det.color }}>
                        <div className="target-meta-info">
                          <h4>{lang === 'vi' ? (det.classNameVi || det.classNameEn) : det.classNameEn}</h4>
                          <div className="confidence-track">
                            <div className="confidence-fill" style={{ width: `${Math.round(det.confidence * 100)}%`, background: det.color }} />
                          </div>
                        </div>
                        <div className="target-action-col">
                          <span className="pct-num">{Math.round(det.confidence * 100)}%</span>
                          <button className="btn-open-dossier" onClick={() => setSelectedFlowerForModal(det.flowerId || det.classNameEn)}>
                            <Eye size={13} />
                            <span>{t('btnInfo')}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="hud-empty-state">
                    <CheckCircle2 size={34} />
                    <p>{t('awaitingDetection')}</p>
                    <span>
                      {studioMode === 'camera' && !isStreaming && t('emptyCamOff')}
                      {studioMode === 'camera' && isStreaming && t('emptyCamOn')}
                      {studioMode === 'photo' && !selectedPhoto && t('emptyPhotoNoUpload')}
                      {studioMode === 'photo' && selectedPhoto && t('emptyPhotoNoMatch')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

          {/* ====================================================================== */}
          {/* SECTION 3: SYSTEM ARCHITECTURE DIAGRAM                                 */}
          {/* ====================================================================== */}
          <section id="architecture" className="slide-panel">
            <ArchitectureDiagram isActive={activeSlide === 2} />
          </section>

        </div>{/* end .slide-track */}
      </div>{/* end .slide-viewport */}

      {/* Navigation Dots on Right Edge (Exactly 3 Dots for 3 Sections) */}
      <nav className={`slide-nav-dots ${activeSlide >= 1 ? 'theme-blue' : 'theme-yellow'}`} aria-label="Section navigation">
        <button
          className={`slide-dot ${activeSlide === 0 ? 'active' : ''}`}
          onClick={() => goToSlide(0)}
          aria-label={t('navLanding')}
          title={`${t('navLanding')} [1]`}
        />
        <button
          className={`slide-dot ${activeSlide === 1 ? 'active' : ''}`}
          onClick={() => goToSlide(1)}
          aria-label={t('navStudio')}
          title={`${t('navStudio')} [2]`}
        />
        <button
          className={`slide-dot ${activeSlide === 2 ? 'active' : ''}`}
          onClick={() => goToSlide(2)}
          aria-label={t('navArch')}
          title={`${t('navArch')} [3]`}
        />
      </nav>

      {/* Floating Shortcut Action Toast */}
      {shortcutToast && (
        <div className="shortcut-action-toast" role="status" aria-live="polite">
          <kbd className="toast-kbd-badge">{shortcutToast.keyBadge}</kbd>
          <span className="toast-txt">{shortcutToast.text}</span>
        </div>
      )}

      {/* Floating Action Buttons Stack (Bottom Right) */}
      <div className="floating-nav-actions">
        {/* Floating Step-Up Button */}
        <button
          className={`floating-back-to-top ${activeSlide > 0 ? 'visible-btn' : 'hidden-btn'}`}
          onClick={() => goToSlide(Math.max(0, activeSlide - 1))}
          aria-label={t('backToLanding')}
          title={t('backToLanding')}
        >
          <ArrowUp size={20} strokeWidth={2.4} />
        </button>

        {/* Floating Step-Down Button — ONLY visible on Section 2 (activeSlide === 1) */}
        <button
          className={`floating-step-down ${activeSlide === 1 ? 'visible-btn' : 'hidden-btn'}`}
          onClick={() => goToSlide(2)}
          aria-label={t('navArch')}
          title={`${t('navArch')} [3]`}
        >
          <ArrowDown size={20} strokeWidth={2.4} />
        </button>
      </div>

      {/* Taxonomic Dossier Modal */}
      {selectedFlowerForModal && (
        <BotanicalDossierModal
          flowerId={selectedFlowerForModal}
          onClose={() => setSelectedFlowerForModal(null)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
}

// Modal displaying clean, interactive keyboard shortcuts
function KeyboardShortcutsModal({ onClose }) {
  const { t } = useLang();

  const shortcutGroups = [
    {
      title: t('shortcutsTitle'),
      items: [
        { keys: ['1', 'H'], label: t('hkHero') },
        { keys: ['2', 'S'], label: t('hkStudio') },
        { keys: ['3', 'A'], label: t('hkArch') },
        { keys: ['↓', '↑', 'J', 'K'], label: t('hkPrevNext') },
        { keys: ['C'], label: t('hkCam') },
        { keys: ['U', 'P'], label: t('hkUpload') },
        { keys: ['Space'], label: t('hkToggleCam') },
        { keys: ['?'], label: t('hkHelp') },
        { keys: ['Esc'], label: t('hkClose') },
      ]
    }
  ];

  return (
    <div
      className="modal-backdrop-blur"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="modal-shortcuts-card" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <div className="shortcuts-title-wrap">
            <div className="shortcuts-icon-ring">
              <Keyboard size={20} />
            </div>
            <div>
              <h2>{t('shortcutsTitle')}</h2>
              <p className="shortcuts-sub">{t('shortcutsSub')}</p>
            </div>
          </div>
          <button className="dossier-close-button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="shortcuts-grid">
          {shortcutGroups[0].items.map((item, idx) => (
            <div key={idx} className="shortcut-item-row">
              <span className="shortcut-label">{item.label}</span>
              <div className="shortcut-keys-group">
                {item.keys.map((k, i) => (
                  <kbd key={i} className="hk-kbd-tag">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <button className="btn-close-dossier" onClick={onClose}>
            {t('btnClose')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Dossier modal — reads directly from LOCAL_FLOWERS_DB (full bilingual support)
function BotanicalDossierModal({ flowerId, onClose }) {
  const { lang, t } = useLang();
  const isVi = lang === 'vi';

  const data = LOCAL_FLOWERS_DB.find(
    f => f.id === flowerId?.toLowerCase() || f.name_en?.toLowerCase() === flowerId?.toLowerCase() || f.name_vi?.toLowerCase() === flowerId?.toLowerCase()
  ) || LOCAL_FLOWERS_DB[0];

  const flowerName = isVi ? (data.name_vi || data.name_en) : data.name_en;
  const meaningText = isVi ? (data.meaning_vi || data.meaning) : data.meaning;
  const decoText = isVi ? (data.decorative_tips_vi || data.decorative_tips) : data.decorative_tips;
  const seasonText = isVi ? (data.season_vi || data.season) : data.season;
  const distText = isVi ? (data.distribution_vi || data.distribution) : data.distribution;
  const careText = isVi ? (data.care_vi || data.care) : data.care;
  const funFactsList = isVi ? (data.fun_facts_vi || data.fun_facts) : data.fun_facts;

  return (
    <div
      className="modal-backdrop-blur"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="modal-dossier-card" onClick={(e) => e.stopPropagation()}>
        <div className="dossier-header">
          <div>
            <span className="dossier-kicker-tag">{t('dossierKicker')}</span>
            <h2>{flowerName}</h2>
            <span className="dossier-scientific-name"><em>{data.scientific_name}</em></span>
          </div>
          <button className="dossier-close-button" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="dossier-body-scroll">
          <div className="dossier-preview-split">
            <img src={data.image || `/images/flowers/${data.id}.jpg`} alt={flowerName} className="dossier-photo-frame" />
            <div className="dossier-ai-card">
              <h4>{t('dossierOverview')}</h4>
              <p>{meaningText}</p>
            </div>
          </div>
          <div className="dossier-facts-grid">
            <div className="fact-item-card">
              <div className="fact-lbl"><BookOpen size={12} /><span>{t('dossierSymbolism')}</span></div>
              <p>{meaningText}</p>
            </div>
            <div className="fact-item-card highlight-gold">
              <div className="fact-lbl"><Activity size={12} /><span>{t('dossierDecorativeUse')}</span></div>
              <p>{decoText}</p>
            </div>
            <div className="fact-item-card">
              <div className="fact-lbl"><Calendar size={12} /><span>{t('dossierSeason')}</span></div>
              <p>{seasonText}</p>
            </div>
            <div className="fact-item-card">
              <div className="fact-lbl"><MapPin size={12} /><span>{t('dossierHabitat')}</span></div>
              <p>{distText}</p>
            </div>
            <div className="fact-item-card full-span">
              <div className="fact-lbl"><HeartHandshake size={12} /><span>{t('dossierCare')}</span></div>
              <p>{careText}</p>
            </div>
          </div>
          {funFactsList && funFactsList.length > 0 && (
            <div className="dossier-bullets-card">
              <div className="fact-lbl"><Lightbulb size={12} /><span>{t('dossierDidYouKnow')}</span></div>
              <ul>{funFactsList.map((f, i) => <li key={i}>— {f}</li>)}</ul>
            </div>
          )}
        </div>

        <div className="dossier-footer-bar">
          <button className="btn-close-dossier" onClick={onClose}>{t('btnClose')}</button>
        </div>
      </div>
    </div>
  );
}

export default App;
