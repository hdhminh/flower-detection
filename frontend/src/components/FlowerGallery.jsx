import React, { useState, useEffect } from 'react';
import { Sparkles, Eye, Palette } from 'lucide-react';
import { fetchFlowerList, LOCAL_FLOWERS_DB } from '../api';
import { useLang } from '../lang';

export function FlowerGallery({ onOpenFlowerDetail }) {
  const { lang, t } = useLang();
  const [flowers, setFlowers] = useState(LOCAL_FLOWERS_DB);
  const [filterQuery, setFilterQuery] = useState('');
  const [flippedCardId, setFlippedCardId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const list = await fetchFlowerList();
        if (list && list.length > 0) {
          setFlowers(list);
        }
      } catch (err) {
        console.warn('Using local flowers list:', err);
      }
    }
    load();
  }, []);

  const filteredFlowers = flowers.filter((f) => {
    const q = filterQuery.toLowerCase();
    return (
      f.name_en.toLowerCase().includes(q) ||
      f.scientific_name.toLowerCase().includes(q) ||
      (f.name_vi && f.name_vi.toLowerCase().includes(q))
    );
  });

  const toggleFlip = (id) => {
    setFlippedCardId(prev => (prev === id ? null : id));
  };

  return (
    <section id="gallery" className="flower-gallery-section">
      <div className="section-header">
        <div className="section-title-group">
          <h2>{t('secGalleryTitle')}</h2>
          <p>{t('secGalleryDesc')}</p>
        </div>

        {/* Search filter */}
        <div className="search-filter-wrapper">
          <input
            type="text"
            placeholder="Search by flower name..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* 5 Real Photo 3D Flip Cards Grid */}
      <div className="flower-cards-3d-grid">
        {filteredFlowers.map((flower) => {
          const isFlipped = flippedCardId === flower.id;

          return (
            <div
              key={flower.id}
              className={`flower-card-3d-wrapper ${isFlipped ? 'flipped' : ''}`}
              onClick={() => toggleFlip(flower.id)}
            >
              <div className="card-3d-inner">
                {/* FRONT FACE */}
                <div className="card-face card-front glass-card">
                  {/* Real Photo Thumbnail */}
                  <div className="card-photo-wrapper">
                    <img src={flower.image || `/images/flowers/${flower.id}.jpg`} alt={flower.name_en} className="card-photo-img" />
                    <span className="card-emoji-badge">{flower.symbol || '🌸'}</span>
                  </div>

                  <div className="card-content-front">
                    <h3>{lang === 'vi' ? flower.name_vi : flower.name_en}</h3>
                    <p className="card-latin"><em>{flower.scientific_name}</em></p>

                    {/* Color Swatches */}
                    {flower.color_palette && (
                      <div className="palette-strip">
                        <Palette size={14} className="palette-icon" />
                        <div className="swatches-row">
                          {flower.color_palette.map((c, i) => (
                            <span
                              key={i}
                              className="color-dot"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="card-meaning-snippet">
                      {flower.meaning}
                    </p>
                  </div>

                  <div className="card-action-bar">
                    <span className="flip-hint">Click to flip 3D ↺</span>
                    <button
                      className="btn btn-sm btn-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFlowerDetail(flower.id);
                      }}
                    >
                      <Sparkles size={14} />
                      <span>{t('btnAskAI')}</span>
                    </button>
                  </div>
                </div>

                {/* BACK FACE */}
                <div className="card-face card-back glass-card">
                  <div className="back-header">
                    <h4>{flower.symbol} {lang === 'vi' ? flower.name_vi : flower.name_en}</h4>
                    <span className="badge-tag">Morphology</span>
                  </div>

                  <div className="back-details-list">
                    <div className="detail-row">
                      <strong>Decorative Traits:</strong>
                      <p>{flower.decorative_tips}</p>
                    </div>
                    <div className="detail-row">
                      <strong>Season:</strong>
                      <p>{flower.season}</p>
                    </div>
                    <div className="detail-row">
                      <strong>Care:</strong>
                      <p>{flower.care}</p>
                    </div>
                  </div>

                  <div className="card-action-bar">
                    <button
                      className="btn btn-sm btn-primary w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFlowerDetail(flower.id);
                      }}
                    >
                      <Eye size={14} />
                      <span>{t('viewDetails')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
