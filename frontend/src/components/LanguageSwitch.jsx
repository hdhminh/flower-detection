import React from 'react';
import { useLang } from '../lang';
import './LanguageSwitch.css';

export function LanguageSwitch() {
  const { lang, setLang } = useLang();

  return (
    <div
      className="lang-switch-toggle"
      role="group"
      aria-label="Language selection"
    >
      {/* Sliding active highlight background */}
      <div
        className={`lang-slider-pill ${lang === 'vi' ? 'pos-vi' : 'pos-en'}`}
      />

      <button
        type="button"
        className={`lang-btn ${lang === 'en' ? 'active-lang' : ''}`}
        onClick={() => setLang('en')}
        aria-label="English"
      >
        <span>EN</span>
      </button>

      <button
        type="button"
        className={`lang-btn ${lang === 'vi' ? 'active-lang' : ''}`}
        onClick={() => setLang('vi')}
        aria-label="Tiếng Việt"
      >
        <span>VI</span>
      </button>
    </div>
  );
}
