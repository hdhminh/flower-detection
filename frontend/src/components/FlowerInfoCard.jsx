import React, { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, Calendar, MapPin, HeartHandshake, Lightbulb, Bot, Send } from 'lucide-react';
import { explainFlowerWithLLM, fetchFlowerDetail } from '../api';
import { useLang } from '../lang';

export function FlowerInfoCard({ flowerIdOrName, onClose }) {
  const { lang } = useLang();
  const [flowerData, setFlowerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customQuestion, setCustomQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiCustomResponse, setAiCustomResponse] = useState(null);

  useEffect(() => {
    async function loadInfo() {
      if (!flowerIdOrName) return;
      setIsLoading(true);
      try {
        const detail = await fetchFlowerDetail(flowerIdOrName);
        const aiInfo = await explainFlowerWithLLM(flowerIdOrName, lang);
        setFlowerData({ ...detail, ...aiInfo });
      } catch (err) {
        console.error('Error fetching flower info:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInfo();
  }, [flowerIdOrName, lang]);

  const handleAskCustom = async (e) => {
    e.preventDefault();
    if (!customQuestion.trim() || isAsking) return;

    setIsAsking(true);
    try {
      const response = await explainFlowerWithLLM(
        flowerIdOrName,
        lang,
        `User inquiry: "${customQuestion}". Provide an authoritative botanical and decorative assessment.`
      );
      setAiCustomResponse(response.ai_analysis || response.meaning);
    } catch (err) {
      console.error('LLM question error:', err);
    } finally {
      setIsAsking(false);
    }
  };

  if (!flowerIdOrName) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content studio-dossier-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dossier-header">
          <div className="dossier-taxa">
            <span className="taxa-label">Botanical Dossier</span>
            <h2>{lang === 'vi' ? flowerData?.name_vi : flowerData?.name_en}</h2>
            <p className="taxa-latin"><em>{flowerData?.scientific_name}</em></p>
          </div>
          <button className="btn-close-dossier" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="dossier-body">
          {isLoading ? (
            <div className="dossier-loading">
              <div className="studio-spinner"></div>
              <p>Retrieving botanical intelligence & taxonomy...</p>
            </div>
          ) : (
            <>
              {/* Photo & Color Strip */}
              <div className="dossier-media-row">
                <img
                  src={flowerData?.image || `/images/flowers/${flowerData?.id}.jpg`}
                  alt={flowerData?.name_en}
                  className="dossier-photo"
                />
                <div className="dossier-summary-box">
                  <h4>AI Morphological Assessment</h4>
                  <p className="ai-quote">
                    {aiCustomResponse || flowerData?.ai_analysis || flowerData?.meaning}
                  </p>
                  {flowerData?.color_palette && (
                    <div className="swatch-strip">
                      <span className="swatch-title">Pigment Profile:</span>
                      <div className="swatches">
                        {flowerData.color_palette.map((c, i) => (
                          <span key={i} className="swatch-pill" style={{ backgroundColor: c }} title={c} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Grid */}
              <div className="dossier-grid">
                <div className="dossier-item">
                  <div className="item-title">
                    <BookOpen size={14} />
                    <span>Symbolism & Significance</span>
                  </div>
                  <p>{flowerData?.meaning}</p>
                </div>

                <div className="dossier-item highlight-item">
                  <div className="item-title">
                    <Sparkles size={14} />
                    <span>Decorative Variation Clues</span>
                  </div>
                  <p>{flowerData?.decorative_tips}</p>
                </div>

                <div className="dossier-item">
                  <div className="item-title">
                    <Calendar size={14} />
                    <span>Flourishing Period</span>
                  </div>
                  <p>{flowerData?.season}</p>
                </div>

                <div className="dossier-item">
                  <div className="item-title">
                    <MapPin size={14} />
                    <span>Native Habitat</span>
                  </div>
                  <p>{flowerData?.distribution}</p>
                </div>

                <div className="dossier-item full-col">
                  <div className="item-title">
                    <HeartHandshake size={14} />
                    <span>Horticultural Care</span>
                  </div>
                  <p>{flowerData?.care}</p>
                </div>
              </div>

              {/* Facts */}
              {flowerData?.fun_facts && (
                <div className="dossier-facts">
                  <div className="facts-header">
                    <Lightbulb size={14} />
                    <span>Botanical Notes & History</span>
                  </div>
                  <ul>
                    {flowerData.fun_facts.map((fact, idx) => (
                      <li key={idx}>— {fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ask Botanical AI */}
              <div className="dossier-consult-box">
                <form onSubmit={handleAskCustom} className="consult-form">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Consult AI regarding floral arrangement, soil pH, or cultural symbolism..."
                    className="consult-input"
                  />
                  <button type="submit" className="btn-consult" disabled={isAsking || !customQuestion.trim()}>
                    {isAsking ? 'Querying...' : 'Ask AI'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="dossier-footer">
          <button className="btn-dossier-dismiss" onClick={onClose}>
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
