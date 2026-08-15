import React, { useEffect, useRef, useState, useCallback } from 'react';

const UPPER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER_LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function getRandomLetter(targetChar) {
  if (targetChar === ' ' || targetChar === '\n' || targetChar === '\t') {
    return targetChar;
  }
  // Uppercase letter
  if (targetChar === targetChar.toUpperCase() && targetChar !== targetChar.toLowerCase()) {
    return UPPER_LETTERS[Math.floor(Math.random() * UPPER_LETTERS.length)];
  }
  // Lowercase letter
  if (targetChar === targetChar.toLowerCase() && targetChar !== targetChar.toUpperCase()) {
    return LOWER_LETTERS[Math.floor(Math.random() * LOWER_LETTERS.length)];
  }
  return ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)];
}

function createScrambledCharArray(target) {
  if (!target) return [];
  const res = [];
  for (let i = 0; i < target.length; i++) {
    const c = target[i];
    if (c === ' ' || c === '\n' || c === '\t') {
      res.push(c);
    } else {
      res.push(getRandomLetter(c));
    }
  }
  return res;
}

export function ScrambleText({
  text = '',
  as: Component = 'span',
  className = '',
  charDuration = 500,     // 0.5s per individual character
  holdDuration = 10000,   // Keep decoded text for 10 seconds before re-encoding
  scrambleHold = 1500,    // Pause in fully scrambled state before next decode cycle
  hoverToScramble = true,
  style = {},
  children,
}) {
  const targetText = text || (typeof children === 'string' ? children : '');

  // Current display characters array
  const [displayText, setDisplayText] = useState(() =>
    createScrambledCharArray(targetText).join('')
  );

  const loopVersionRef = useRef(0);

  useEffect(() => {
    if (!targetText) return;

    const len = targetText.length;
    let isMounted = true;
    let timeoutId = null;

    const currentVersion = ++loopVersionRef.current;

    // Helper sleep
    const sleep = (ms) =>
      new Promise((resolve) => {
        timeoutId = setTimeout(resolve, ms);
      });

    // Initialize with a stationary scrambled string
    const currentChars = createScrambledCharArray(targetText);
    setDisplayText(currentChars.join(''));

    async function runContinuousLoop() {
      // Small initial pause before first letter decode
      await sleep(400);

      while (isMounted && loopVersionRef.current === currentVersion) {
        // ── PHASE 1: Giải mã TỪNG CHỮ CÁI từ Trái qua Phải (0.5s mỗi chữ cái) ──
        for (let i = 0; i < len; i++) {
          if (!isMounted || loopVersionRef.current !== currentVersion) return;

          const targetChar = targetText[i];
          if (targetChar === ' ' || targetChar === '\n' || targetChar === '\t') {
            currentChars[i] = targetChar;
            setDisplayText(currentChars.join(''));
            continue;
          }

          // Flicker ONLY this specific character position for charDuration (0.5s)
          const startFlicker = performance.now();
          while (performance.now() - startFlicker < charDuration) {
            if (!isMounted || loopVersionRef.current !== currentVersion) return;
            currentChars[i] = getRandomLetter(targetChar);
            setDisplayText(currentChars.join(''));
            await sleep(45);
          }

          // Lock in the real character (with Vietnamese diacritics intact)
          currentChars[i] = targetChar;
          setDisplayText(currentChars.join(''));
        }

        // Ensure 100% resolved
        setDisplayText(targetText);

        // ── PHASE 2: Giữ chữ đã giải mã hoàn chỉnh trong 10 giây (10s hold) ──
        await sleep(holdDuration);
        if (!isMounted || loopVersionRef.current !== currentVersion) return;

        // ── PHASE 3: Mã hóa quay ngược TỪNG CHỮ CÁI từ Phải qua Trái (0.5s mỗi chữ cái) ──
        for (let i = len - 1; i >= 0; i--) {
          if (!isMounted || loopVersionRef.current !== currentVersion) return;

          const targetChar = targetText[i];
          if (targetChar === ' ' || targetChar === '\n' || targetChar === '\t') {
            currentChars[i] = targetChar;
            setDisplayText(currentChars.join(''));
            continue;
          }

          // Flicker ONLY this character for charDuration (0.5s)
          const startFlicker = performance.now();
          while (performance.now() - startFlicker < charDuration) {
            if (!isMounted || loopVersionRef.current !== currentVersion) return;
            currentChars[i] = getRandomLetter(targetChar);
            setDisplayText(currentChars.join(''));
            await sleep(45);
          }

          // Lock in a random scrambled letter
          currentChars[i] = getRandomLetter(targetChar);
          setDisplayText(currentChars.join(''));
        }

        // ── PHASE 4: Nghỉ ngắn ở trạng thái mã hóa trước khi lặp lại ──
        await sleep(scrambleHold);
      }
    }

    runContinuousLoop();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [targetText, charDuration, holdDuration, scrambleHold]);

  const handleMouseEnter = () => {
    if (!hoverToScramble) return;
    // Re-trigger from first letter on hover
    loopVersionRef.current++;
    const newVersion = loopVersionRef.current;
    let isMounted = true;
    let timeoutId = null;
    const sleep = (ms) => new Promise((resolve) => (timeoutId = setTimeout(resolve, ms)));

    const currentChars = createScrambledCharArray(targetText);
    setDisplayText(currentChars.join(''));

    (async () => {
      for (let i = 0; i < targetText.length; i++) {
        if (!isMounted || loopVersionRef.current !== newVersion) return;
        const targetChar = targetText[i];
        if (targetChar === ' ' || targetChar === '\n' || targetChar === '\t') {
          currentChars[i] = targetChar;
          setDisplayText(currentChars.join(''));
          continue;
        }
        const startFlicker = performance.now();
        while (performance.now() - startFlicker < charDuration) {
          if (!isMounted || loopVersionRef.current !== newVersion) return;
          currentChars[i] = getRandomLetter(targetChar);
          setDisplayText(currentChars.join(''));
          await sleep(45);
        }
        currentChars[i] = targetChar;
        setDisplayText(currentChars.join(''));
      }
    })();
  };

  return (
    <Component
      className={`scramble-text-root ${className}`}
      onMouseEnter={handleMouseEnter}
      style={{
        ...style,
        cursor: hoverToScramble ? 'pointer' : undefined,
        userSelect: 'none',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {displayText || targetText}
    </Component>
  );
}

export default ScrambleText;
