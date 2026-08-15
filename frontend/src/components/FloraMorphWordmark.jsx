import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as flubber from 'flubber';
import './FloraMorphWordmark.css';

// ── Compound Single SVG Path Data ──────────────────────────────────────────
const CHARS = [
  {
    id: 'char-1',
    letterFrom: 'F',
    letterTo: 'C',
    offsetX: 0,
    pathFrom:
      'M 0 0 L 76 0 L 76 26 L 27 26 L 27 54 L 68 54 L 68 80 L 27 80 L 27 135 L 0 135 Z',
    pathTo:
      'M 80 18 L 80 44 C 68 30 52 26 38 26 C 22 26 12 36 12 68 C 12 100 22 110 38 110 C 52 110 68 106 80 92 L 80 118 C 68 130 50 136 34 136 C 10 136 -14 116 -14 68 C -14 20 10 0 34 0 C 50 0 68 6 80 18 Z',
  },
  {
    id: 'char-2',
    letterFrom: 'L',
    letterTo: 'O',
    offsetX: 100,
    pathFrom:
      'M 0 0 L 27 0 L 27 109 L 80 109 L 80 135 L 0 135 Z',
    pathTo:
      'M 42 0 C 72 0 94 28 94 68 C 94 108 72 136 42 136 C 12 136 -10 108 -10 68 C -10 28 12 0 42 0 Z M 42 26 C 26 26 17 44 17 68 C 17 92 26 110 42 110 C 58 110 67 92 67 68 C 67 44 58 26 42 26 Z',
  },
  {
    id: 'char-3',
    letterFrom: 'O',
    letterTo: 'D',
    offsetX: 215,
    pathFrom:
      'M 46 0 C 78 0 102 28 102 68 C 102 108 78 136 46 136 C 14 136 -10 108 -10 68 C -10 28 14 0 46 0 Z M 46 26 C 28 26 17 44 17 68 C 17 92 28 110 46 110 C 64 110 75 92 75 68 C 75 44 64 26 46 26 Z',
    pathTo:
      'M 0 0 L 46 0 C 78 0 98 26 98 68 C 98 110 78 136 46 136 L 0 136 Z M 26 26 L 26 110 L 44 110 C 62 110 71 94 71 68 C 71 42 62 26 44 26 Z',
  },
  {
    id: 'char-4',
    letterFrom: 'R',
    letterTo: 'E',
    offsetX: 335,
    pathFrom:
      'M 0 0 L 52 0 C 76 0 90 14 90 38 C 90 56 80 68 64 72 L 95 135 L 64 135 L 36 78 L 27 78 L 27 135 L 0 135 Z M 27 24 L 27 56 L 50 56 C 60 56 65 50 65 40 C 65 30 60 24 50 24 Z',
    pathTo:
      'M 0 0 L 78 0 L 78 26 L 27 26 L 27 54 L 72 54 L 72 80 L 27 80 L 27 109 L 80 109 L 80 135 L 0 135 Z',
  },
  {
    id: 'char-5',
    letterFrom: 'A',
    letterTo: 'SPARK',
    offsetX: 440,
    // Perfectly centered symmetric A with straight counter-hole triangle
    pathFrom:
      'M 40 0 L 60 0 L 100 135 L 72 135 L 59 95 L 41 95 L 28 135 L 0 135 Z M 50 34 L 36 74 L 64 74 Z',
    // Elevated star spark and tall pedestal triangle with clear 8px separation
    pathTo:
      'M 50 0 C 50 26 60 35 86 35 C 60 35 50 44 50 70 C 50 44 40 35 14 35 C 40 35 50 26 50 0 Z M 0 135 L 100 135 L 50 78 Z',
  },
];

export function FloraMorphWordmark({ onClick }) {
  const containerRef = useRef(null);
  const pathRefs = useRef([]);
  const tagRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    // Precompute flubber interpolators for smooth performance
    const morphers = CHARS.map((c) => {
      try {
        const fwd = flubber.interpolate(c.pathFrom, c.pathTo, { maxSegmentLength: 2 });
        const bwd = flubber.interpolate(c.pathTo, c.pathFrom, { maxSegmentLength: 2 });
        return { fwd, bwd };
      } catch (err) {
        console.warn('Flubber compile failed for char:', c.id, err);
        return null;
      }
    });

    const setPath = (i, t, dir) => {
      const m = morphers[i];
      if (!m) return;
      const el = pathRefs.current[i];
      if (!el) return;
      const fn = dir === 'fwd' ? m.fwd : m.bwd;
      el.setAttribute('d', fn(t));
    };

    // Initialize all paths to FLORA state
    CHARS.forEach((_, i) => setPath(i, 0, 'fwd'));

    const STAGGER = 0.12;
    const MORPH_DUR = 0.75;
    const HOLD_DUR = 5.0;

    function buildCycle() {
      const tl = gsap.timeline({
        onComplete() {
          CHARS.forEach((_, i) => setPath(i, 1, 'bwd'));
          gsap.delayedCall(0.5, buildCycle);
        },
      });

      // ── Phase 1: Hold FLORA for 5s (Stationary Yellow dot visible) ──
      tl.to({}, { duration: HOLD_DUR });

      // ── Phase 2: Morph FLORA → CODE CATALYST (Left to Right) ─────
      // Fade out yellow dot in-place without displacement
      if (dotRef.current) {
        tl.to(
          dotRef.current,
          {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out',
          },
          HOLD_DUR,
        );
      }

      CHARS.forEach((_, i) => {
        const obj = { t: 0 };
        tl.to(
          obj,
          {
            t: 1,
            duration: MORPH_DUR,
            ease: 'power2.inOut',
            onUpdate() {
              setPath(i, obj.t, 'fwd');
            },
            onComplete() {
              setPath(i, 1, 'fwd');
            },
          },
          HOLD_DUR + i * STAGGER,
        );
      });

      // Fade in "CATALYST" subtitle tag
      if (tagRef.current) {
        tl.to(
          tagRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
          },
          `-=${MORPH_DUR}`,
        );
      }

      // ── Phase 3: Hold CODE CATALYST for 5s ───────────────────────
      tl.to({}, { duration: HOLD_DUR });

      // ── Phase 4: Morph CODE CATALYST → FLORA (Right to Left) ─────
      const p4Start = tl.duration();

      // Fade out "CATALYST" subtitle tag
      if (tagRef.current) {
        tl.to(
          tagRef.current,
          {
            opacity: 0,
            y: 8,
            duration: 0.4,
            ease: 'power2.in',
          },
          p4Start,
        );
      }

      [...CHARS].reverse().forEach((_, ri) => {
        const i = CHARS.length - 1 - ri;
        const obj = { t: 0 };
        tl.to(
          obj,
          {
            t: 1,
            duration: MORPH_DUR,
            ease: 'power2.inOut',
            onUpdate() {
              setPath(i, obj.t, 'bwd');
            },
            onComplete() {
              setPath(i, 1, 'bwd');
            },
          },
          p4Start + ri * STAGGER,
        );
      });

      // Fade in yellow dot in-place as soon as FLORA is reformed
      if (dotRef.current) {
        tl.to(
          dotRef.current,
          {
            opacity: 1,
            duration: 0.35,
            ease: 'power2.in',
          },
          p4Start + CHARS.length * STAGGER - 0.05,
        );
      }

      return tl;
    }

    const tl = buildCycle();

    return () => {
      tl.kill();
      gsap.killTweensOf({});
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flora-gsap-morph-wrapper"
      onClick={onClick}
      title="Click to launch vision studio"
    >
      <svg
        viewBox="0 0 588 155"
        className="flora-gsap-morph-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="vectorWordmarkShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0, 0, 0, 0.65)" />
          </filter>
        </defs>

        <g filter="url(#vectorWordmarkShadow)">
          {CHARS.map((item, i) => (
            <g key={item.id} transform={`translate(${item.offsetX}, 0)`}>
              <path
                ref={(el) => (pathRefs.current[i] = el)}
                d={item.pathFrom}
                fill="#FFFFFF"
                fillRule="evenodd"
                className="morph-path-element"
              />
            </g>
          ))}

          {/* Stationary Golden Dot at the end of FLORA (FLORA.) */}
          <circle
            ref={dotRef}
            cx="566"
            cy="122"
            r="11"
            fill="#FCD34D"
            style={{ opacity: 1, transition: 'none' }}
          />
        </g>
      </svg>

      {/* Catalyst Subtitle Tag */}
      <div className="wordmark-catalyst-subtitle" ref={tagRef}>
        <span>CATALYST</span>
      </div>
    </div>
  );
}
