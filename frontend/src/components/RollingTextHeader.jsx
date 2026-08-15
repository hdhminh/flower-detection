import React, { useEffect, useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import './RollingTextHeader.css';

export function RollingTextHeader({
  isActive = false,
  badge = 'FLORA NEURAL ARCHITECTURE',
  heading = 'Flora System Architecture',
  rollDuration = 140, // ms per letter roll (ultra fast & snappy)
  letterGap = 20,     // ms pause between consecutive letters
  holdDuration = 7000, // ms hold after all letters finish rolling
}) {
  // Array of boolean flags indicating if each character has rolled
  const [badgeRollProgress, setBadgeRollProgress] = useState(0);
  const [headingRollProgress, setHeadingRollProgress] = useState(0);
  const isLoopingRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      setBadgeRollProgress(0);
      setHeadingRollProgress(0);
      isLoopingRef.current = false;
      return;
    }

    let isMounted = true;
    isLoopingRef.current = true;

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const runSequentialRoll = async () => {
      while (isMounted && isLoopingRef.current) {
        // Reset both to 0
        setBadgeRollProgress(0);
        setHeadingRollProgress(0);
        await sleep(300);

        const badgeLen = badge.length;
        const headingLen = heading.length;
        const maxLen = Math.max(badgeLen, headingLen);

        // Roll letter by letter strictly: letter i rolls, finishes, then letter i+1 rolls
        for (let i = 0; i <= maxLen; i++) {
          if (!isMounted || !isLoopingRef.current) break;

          if (i <= badgeLen) setBadgeRollProgress(i);
          if (i <= headingLen) setHeadingRollProgress(i);

          // Wait for current letter to complete its roll + letter gap
          await sleep(rollDuration + letterGap);
        }

        // Hold full resolved text
        await sleep(holdDuration);
      }
    };

    runSequentialRoll();

    return () => {
      isMounted = false;
      isLoopingRef.current = false;
    };
  }, [isActive, badge, heading, rollDuration, letterGap, holdDuration]);

  const renderSequentialRollingText = (text, progress, prefix = 'roll') => {
    const words = text.split(' ');
    let globalIndex = 0;

    return words.map((word, wordIdx) => {
      return (
        <span key={`${prefix}-w-${wordIdx}`} className="seq-word-group">
          {word.split('').map((char, charIdx) => {
            const myIndex = globalIndex;
            globalIndex++;
            const isRolled = myIndex < progress;
            const isCurrentlyRolling = myIndex === progress - 1;

            return (
              <span
                key={`${prefix}-${wordIdx}-${charIdx}`}
                className="seq-char-slot"
              >
                <span
                  className={`seq-char-track ${
                    isRolled ? 'is-rolled' : ''
                  } ${isCurrentlyRolling ? 'is-active-rolling' : ''}`}
                  style={{
                    transitionDuration: `${rollDuration}ms`,
                  }}
                >
                  <span className="seq-char-face front">{char}</span>
                  <span className="seq-char-face rolled">{char}</span>
                </span>
              </span>
            );
          })}
          {wordIdx < words.length - 1 && (
            <span className="seq-char-space">&nbsp;</span>
          )}
        </span>
      );
    });
  };

  return (
    <div className="seq-rolling-header-container">
      <div className="studio-badge">
        <Sparkles size={13} />
        <span className="seq-badge-text">
          {renderSequentialRollingText(badge, badgeRollProgress, 'b')}
        </span>
      </div>
      <h2 className="studio-main-heading seq-heading-text">
        {renderSequentialRollingText(heading, headingRollProgress, 'h')}
      </h2>
    </div>
  );
}

export default RollingTextHeader;
