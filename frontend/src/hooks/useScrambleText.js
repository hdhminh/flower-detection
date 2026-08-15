import { useEffect, useRef } from 'react';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&';

/**
 * useScrambleText – attaches a character-scramble animation to a DOM element.
 * @param {string}  targetText   – the final revealed text
 * @param {number}  intervalMs   – how often (ms) to re-trigger the effect (default 20 000)
 * @param {number}  durationMs   – how long one scramble run lasts (default 4 000)
 * @param {number}  startDelayMs – initial delay before first scramble (default 800)
 */
export function useScrambleText(
  targetText,
  intervalMs  = 20_000,
  durationMs  = 4_000,
  startDelayMs = 800,
) {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    let rafId = null;

    const scramble = () => {
      if (rafId) cancelAnimationFrame(rafId);

      const totalChars = targetText.length;
      const start      = performance.now();

      const step = (now) => {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / durationMs, 1);
        const revealed = Math.floor(progress * totalChars);

        el.textContent = targetText
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' '; // keep spaces intact
            if (i < revealed) return char; // already revealed
            // random scramble character
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join('');

        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          el.textContent = targetText; // ensure final state is clean
          rafId = null;
        }
      };

      rafId = requestAnimationFrame(step);
    };

    // First run after initial delay
    const firstTimer = setTimeout(scramble, startDelayMs);

    // Recurring every intervalMs
    const recurringTimer = setInterval(scramble, intervalMs);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(recurringTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [targetText, intervalMs, durationMs, startDelayMs]);

  return elRef;
}
