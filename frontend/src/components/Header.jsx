import React from 'react';
import { Camera, Image as ImageIcon, Layers, Activity, Cpu } from 'lucide-react';
import { useLang } from '../lang';

export function Header({ isModelReady, backendStatus }) {
  const { t } = useLang();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand */}
        <div className="brand-logo" onClick={() => scrollTo('hero')}>
          <div className="brand-mark">FLORA</div>
          <div className="brand-divider"></div>
          <div className="brand-meta">
            <span className="brand-title">YOLOv11s Vision</span>
            <span className="brand-subtitle">On-Device Botanical AI</span>
          </div>
        </div>

        {/* In-Page Jump Navigation */}
        <nav className="header-nav">
          <button className="nav-link" onClick={() => scrollTo('camera')}>
            <Camera size={15} />
            <span>Live Camera</span>
          </button>
          <button className="nav-link" onClick={() => scrollTo('upload')}>
            <ImageIcon size={15} />
            <span>Photo Studio</span>
          </button>
          <button className="nav-link" onClick={() => scrollTo('gallery')}>
            <Layers size={15} />
            <span>Species Archive</span>
          </button>
        </nav>

        {/* System Telemetry & Model Status */}
        <div className="header-actions">
          <div className={`engine-badge ${isModelReady ? 'ready' : 'loading'}`}>
            <Cpu size={14} />
            <span>{isModelReady ? 'WebGPU ONNX Active' : 'Loading Model...'}</span>
          </div>

          <div className="system-pill" title={backendStatus ? 'Backend API Connected' : 'Local Inference Mode'}>
            <Activity size={14} className={backendStatus ? 'active' : 'idle'} />
            <span>{backendStatus ? 'API Online' : 'Local Mode'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
