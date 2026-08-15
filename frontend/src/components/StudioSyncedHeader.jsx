import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLang } from '../lang';

const UPPER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER_LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function getRandomLetter(targetChar) {
  if (!targetChar || targetChar === ' ' || targetChar === '\n' || targetChar === '\t') {
    return targetChar || '';
  }
  if (targetChar === targetChar.toUpperCase() && targetChar !== targetChar.toLowerCase()) {
    return UPPER_LETTERS[Math.floor(Math.random() * UPPER_LETTERS.length)];
  }
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

export function StudioSyncedHeader({
  isActive = false,
  badge = null,
  heading = null,
  charDuration = 500,     // 0.5s per character step
  holdDuration = 10000,   // 10s hold for fully resolved text
  scrambleHold = 1500,    // 1.5s hold in fully scrambled state
}) {
  const { t, lang } = useLang();

  const targetBadge = badge || t('studioBadge');
  const targetHeading = heading || t('studioHeading');

  const [displayBadge, setDisplayBadge] = useState(() =>
    createScrambledCharArray(targetBadge).join('')
  );
  const [displayHeading, setDisplayHeading] = useState(() =>
    createScrambledCharArray(targetHeading).join('')
  );

  const loopVersionRef = useRef(0);

  useEffect(() => {
    // If not active (e.g. on landing page), stay completely still in stationary scrambled state
    if (!isActive) {
      loopVersionRef.current++;
      const chars1 = createScrambledCharArray(targetBadge);
      const chars2 = createScrambledCharArray(targetHeading);
      setDisplayBadge(chars1.join(''));
      setDisplayHeading(chars2.join(''));
      return;
    }

    // When isActive === true (scrolled to section 2), start the synchronized loop:
    let isMounted = true;
    let timeoutId = null;
    const currentVersion = ++loopVersionRef.current;

    const sleep = (ms) =>
      new Promise((resolve) => {
        timeoutId = setTimeout(resolve, ms);
      });

    // Initialize both with fresh stationary scrambled letters
    const chars1 = createScrambledCharArray(targetBadge);
    const chars2 = createScrambledCharArray(targetHeading);

    setDisplayBadge(chars1.join(''));
    setDisplayHeading(chars2.join(''));

    const len1 = targetBadge.length;
    const len2 = targetHeading.length;
    const maxLen = Math.max(len1, len2);

    async function runSynchronizedLoop() {
      // Pause slightly when first entering the section
      await sleep(350);

      while (isMounted && loopVersionRef.current === currentVersion) {
        // ── PHASE 1: Giải mã ĐỒNG BỘ 2 DÒNG từ Trái qua Phải (0.5s mỗi chữ cái) ──
        for (let i = 0; i < maxLen; i++) {
          if (!isMounted || loopVersionRef.current !== currentVersion) return;

          const hasChar1 = i < len1 && targetBadge[i] !== ' ';
          const hasChar2 = i < len2 && targetHeading[i] !== ' ';

          if (!hasChar1 && !hasChar2) {
            if (i < len1) chars1[i] = targetBadge[i];
            if (i < len2) chars2[i] = targetHeading[i];
            setDisplayBadge(chars1.join(''));
            setDisplayHeading(chars2.join(''));
            continue;
          }

          // Both lines actively flicker character at position i simultaneously for charDuration (0.5s)
          const startFlicker = performance.now();
          while (performance.now() - startFlicker < charDuration) {
            if (!isMounted || loopVersionRef.current !== currentVersion) return;

            if (i < len1) {
              chars1[i] = targetBadge[i] === ' ' ? ' ' : getRandomLetter(targetBadge[i]);
            }
            if (i < len2) {
              chars2[i] = targetHeading[i] === ' ' ? ' ' : getRandomLetter(targetHeading[i]);
            }

            setDisplayBadge(chars1.join(''));
            setDisplayHeading(chars2.join(''));
            await sleep(45);
          }

          // Lock in real characters for both lines at the exact same millisecond
          if (i < len1) chars1[i] = targetBadge[i];
          if (i < len2) chars2[i] = targetHeading[i];
          setDisplayBadge(chars1.join(''));
          setDisplayHeading(chars2.join(''));
        }

        // Lock 100% resolved for both lines
        setDisplayBadge(targetBadge);
        setDisplayHeading(targetHeading);

        // ── PHASE 2: Cả 2 dòng giữ nguyên cùng lúc trong 10 giây (10s hold) ──
        await sleep(holdDuration);
        if (!isMounted || loopVersionRef.current !== currentVersion) return;

        // ── PHASE 3: Mã hóa quay ngược ĐỒNG BỘ từ Phải qua Trái (0.5s mỗi chữ cái) ──
        for (let i = maxLen - 1; i >= 0; i--) {
          if (!isMounted || loopVersionRef.current !== currentVersion) return;

          const hasChar1 = i < len1 && targetBadge[i] !== ' ';
          const hasChar2 = i < len2 && targetHeading[i] !== ' ';

          if (!hasChar1 && !hasChar2) {
            if (i < len1) chars1[i] = targetBadge[i];
            if (i < len2) chars2[i] = targetHeading[i];
            setDisplayBadge(chars1.join(''));
            setDisplayHeading(chars2.join(''));
            continue;
          }

          const startFlicker = performance.now();
          while (performance.now() - startFlicker < charDuration) {
            if (!isMounted || loopVersionRef.current !== currentVersion) return;

            if (i < len1) {
              chars1[i] = targetBadge[i] === ' ' ? ' ' : getRandomLetter(targetBadge[i]);
            }
            if (i < len2) {
              chars2[i] = targetHeading[i] === ' ' ? ' ' : getRandomLetter(targetHeading[i]);
            }

            setDisplayBadge(chars1.join(''));
            setDisplayHeading(chars2.join(''));
            await sleep(45);
          }

          if (i < len1) {
            chars1[i] = targetBadge[i] === ' ' ? ' ' : getRandomLetter(targetBadge[i]);
          }
          if (i < len2) {
            chars2[i] = targetHeading[i] === ' ' ? ' ' : getRandomLetter(targetHeading[i]);
          }

          setDisplayBadge(chars1.join(''));
          setDisplayHeading(chars2.join(''));
        }

        // ── PHASE 4: Nghỉ ngắn trước khi lặp lại ──
        await sleep(scrambleHold);
      }
    }

    runSynchronizedLoop();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isActive, targetBadge, targetHeading, charDuration, holdDuration, scrambleHold]);

  const handleHoverReScramble = () => {
    if (!isActive) return;
    loopVersionRef.current++;
    const currentVersion = loopVersionRef.current;
    let isMounted = true;
    let timeoutId = null;
    const sleep = (ms) => new Promise((resolve) => (timeoutId = setTimeout(resolve, ms)));

    const chars1 = createScrambledCharArray(targetBadge);
    const chars2 = createScrambledCharArray(targetHeading);
    setDisplayBadge(chars1.join(''));
    setDisplayHeading(chars2.join(''));

    const len1 = targetBadge.length;
    const len2 = targetHeading.length;
    const maxLen = Math.max(len1, len2);

    (async () => {
      for (let i = 0; i < maxLen; i++) {
        if (!isMounted || loopVersionRef.current !== currentVersion) return;
        const hasChar1 = i < len1 && targetBadge[i] !== ' ';
        const hasChar2 = i < len2 && targetHeading[i] !== ' ';

        if (!hasChar1 && !hasChar2) {
          if (i < len1) chars1[i] = targetBadge[i];
          if (i < len2) chars2[i] = targetHeading[i];
          setDisplayBadge(chars1.join(''));
          setDisplayHeading(chars2.join(''));
          continue;
        }

        const startFlicker = performance.now();
        while (performance.now() - startFlicker < charDuration) {
          if (!isMounted || loopVersionRef.current !== currentVersion) return;
          if (i < len1) chars1[i] = targetBadge[i] === ' ' ? ' ' : getRandomLetter(targetBadge[i]);
          if (i < len2) chars2[i] = targetHeading[i] === ' ' ? ' ' : getRandomLetter(targetHeading[i]);
          setDisplayBadge(chars1.join(''));
          setDisplayHeading(chars2.join(''));
          await sleep(45);
        }

        if (i < len1) chars1[i] = targetBadge[i];
        if (i < len2) chars2[i] = targetHeading[i];
        setDisplayBadge(chars1.join(''));
        setDisplayHeading(chars2.join(''));
      }
      setDisplayBadge(targetBadge);
      setDisplayHeading(targetHeading);
    })();
  };

  return (
    <div
      className="studio-title-block"
      onMouseEnter={handleHoverReScramble}
      title={lang === 'vi' ? 'Rê chuột để chạy lại hiệu ứng giải mã đồng bộ' : 'Hover to restart synchronized decode'}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      <div className="studio-badge">
        <Sparkles size={13} />
        <span className="studio-badge-scramble" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {displayBadge}
        </span>
      </div>
      <h2 className="studio-main-heading">
        <span className="studio-heading-scramble" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {displayHeading}
        </span>
      </h2>
    </div>
  );
}

export default StudioSyncedHeader;
