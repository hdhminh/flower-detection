import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Top Bar
    brandTag: "Code Catalyst",
    clockCity: "HCM",

    // Hero Section
    heroDesc: "Every petal has a name. Point your camera at any flower and discover its species, origin and meaning, identified instantly by on-device AI.",
    btnLaunchStudio: "Launch Vision Studio",

    // Studio Header
    studioBadge: "FLOWER VISION STUDIO",
    studioHeading: "Flora Flower Vision",

    // Studio Mode Switcher
    tabLiveCamera: "Camera",
    tabPhoto: "Upload",

    // Camera Section
    btnStartCamera: "Turn On Camera",
    btnStopCamera: "Turn Off Camera",
    cameraInstruction: "Point camera at a flower to identify.",
    turnOnCamera: "Turn On Camera",

    // Photo Upload Section
    dropzoneTitle: "Upload Photo",
    dropzoneSubtitle: "or drag & drop here",
    quickSamples: "Quick Samples:",
    btnIdentifyAgain: "Choose another photo",
    btnAnalyzeAgain: "Re-analyze",

    // HUD Panel
    hudTitle: "Detection Results",
    modelReady: "Model Ready",
    modelLoading: "Loading model...",
    modelRetry: "Retry Load",
    runningInference: "Running YOLOv11s...",
    speciesDetected: "{count} species detected",
    awaitingDetection: "Awaiting detection",
    emptyCamOff: "Start your camera to begin.",
    emptyCamOn: "Point camera at a flower.",
    emptyPhotoNoUpload: "Upload a photo to identify species.",
    emptyPhotoNoMatch: "No species found above threshold.",
    btnInfo: "Info",

    // Dossier Modal
    dossierKicker: "TAXONOMIC DOSSIER",
    dossierOverview: "Overview",
    dossierSymbolism: "Symbolism",
    dossierDecorativeUse: "Decorative Use",
    dossierSeason: "Season",
    dossierHabitat: "Habitat",
    dossierCare: "Care",
    dossierDidYouKnow: "Did You Know",
    btnClose: "Close",

    // Architecture Diagram Section
    archBadge: "FLORA NEURAL ARCHITECTURE",
    archHeading: "Flora System Architecture",
    archSubheading: "Click any component to inspect its data flow, relationships, and source code",
    inspectorTitle: "Component Inspector",
    clickToInspect: "Click any component node above to inspect its real-time data contract",
    inputFrom: "Input From",
    outputTo: "Output To",
    linkedFiles: "Linked Source Files",
    techSpecs: "Technical Specs",
    roleLabel: "Core Function",
    resetView: "Reset Focus",

    // Navigation & Tooltips
    navLanding: "Landing",
    navStudio: "Vision Studio",
    navArch: "Architecture",
    backToLanding: "Back to Landing Page",
  },
  vi: {
    // Top Bar
    brandTag: "Code Catalyst",
    clockCity: "HCM",

    // Hero Section
    heroDesc: "Mỗi cánh hoa đều có một cái tên. Hướng camera vào bất kỳ loài hoa nào để khám phá tên loài, nguồn gốc và ý nghĩa qua AI xử lý trực tiếp.",
    btnLaunchStudio: "Mở Studio Nhận Diện",

    // Studio Header
    studioBadge: "STUDIO NHẬN DIỆN LOÀI HOA",
    studioHeading: "Nhận Diện Hoa Flora",

    // Studio Mode Switcher
    tabLiveCamera: "Camera",
    tabPhoto: "Tải ảnh",

    // Camera Section
    btnStartCamera: "Bật Camera",
    btnStopCamera: "Tắt Camera",
    cameraInstruction: "Hướng camera vào hoa để nhận diện.",
    turnOnCamera: "Bật Camera",

    // Photo Upload Section
    dropzoneTitle: "Tải ảnh lên",
    dropzoneSubtitle: "hoặc kéo thả vào đây",
    quickSamples: "Ảnh Mẫu Thử Nhanh:",
    btnIdentifyAgain: "Chọn ảnh khác",
    btnAnalyzeAgain: "Phân tích lại",

    // HUD Panel
    hudTitle: "Kết Quả Nhận Diện",
    modelReady: "Mô Hình Sẵn Sàng",
    modelLoading: "Đang tải mô hình...",
    modelRetry: "Thử Tải Lại",
    runningInference: "Đang chạy YOLOv11s...",
    speciesDetected: "Phát hiện {count} loài hoa",
    awaitingDetection: "Đang chờ nhận diện",
    emptyCamOff: "Bật camera để bắt đầu.",
    emptyCamOn: "Hướng camera vào hoa.",
    emptyPhotoNoUpload: "Tải ảnh lên để nhận diện loài hoa.",
    emptyPhotoNoMatch: "Không tìm thấy loài hoa nào vượt ngưỡng tin cậy.",
    btnInfo: "Chi tiết",

    // Dossier Modal
    dossierKicker: "HỒ SƠ THỰC VẬT HỌC",
    dossierOverview: "Tổng quan",
    dossierSymbolism: "Ý nghĩa & Biểu tượng",
    dossierDecorativeUse: "Ứng dụng trang trí",
    dossierSeason: "Mùa hoa nở",
    dossierHabitat: "Môi trường & Nguồn gốc",
    dossierCare: "Hướng dẫn chăm sóc",
    dossierDidYouKnow: "Có thể bạn chưa biết",
    btnClose: "Đóng",

    // Architecture Diagram Section
    archBadge: "KIẾN TRÚC FLORA",
    archHeading: "Kiến Trúc Flora",
    archSubheading: "Bấm vào từng khối thành phần để kiểm tra luồng dữ liệu, quan hệ kết nối và mã nguồn thực tế",
    inspectorTitle: "Chi Tiết Thành Phần",
    clickToInspect: "Nhấp vào một khối thành phần phía trên để xem luồng dữ liệu thực tế",
    inputFrom: "Dữ liệu nhận từ",
    outputTo: "Truyền dữ liệu đến",
    linkedFiles: "Mã nguồn liên kết",
    techSpecs: "Thông số kỹ thuật",
    roleLabel: "Chức năng chính",
    resetView: "Bỏ chọn",

    // Navigation & Tooltips
    navLanding: "Trang chủ",
    navStudio: "Studio Nhận Diện",
    navArch: "Kiến Trúc",
    backToLanding: "Quay về Trang chủ",
  }
};

const LangContext = createContext();

export function LangProvider({ children }) {
  // Default to English, load from localStorage if available
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('flora_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('flora_lang', lang);
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'vi' : 'en'));
  };

  const t = (key, params = {}) => {
    let str = translations[lang]?.[key] || translations['en']?.[key] || key;
    Object.keys(params).forEach((paramKey) => {
      str = str.replace(`{${paramKey}}`, params[paramKey]);
    });
    return str;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
}
