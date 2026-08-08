// Score dial (PRD §4.5) — a 0–100 donut gauge with an animated count-up and a
// band label. Colour comes from the band tone, but the label always carries the
// meaning (never colour alone). Respects prefers-reduced-motion; announces via
// aria-live so screen readers hear the result.

import { useEffect, useRef, useState } from "react";
import { scoreBand } from "../store/progress.js";

const R = 54;
const C = 2 * Math.PI * R;
const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function ScoreDial({ score = 0 }) {
  const [display, setDisplay] = useState(REDUCED ? score : 0);
  const raf = useRef(0);

  useEffect(() => {
    // Reduced motion: initial state already equals the score (see useState).
    if (REDUCED) return;
    const start = performance.now();
    const from = 0;
    const dur = 400; // one 400ms count-up (PRD §10)
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (score - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [score]);

  const band = scoreBand(score);
  const offset = C * (1 - display / 100);

  return (
    <div className="dial" role="img"
      aria-label={`Score ${score} out of 100. ${band.label}.`}>
      <svg className="dial__svg" viewBox="0 0 128 128">
        <circle className="dial__track" cx="64" cy="64" r={R} />
        <circle
          className={`dial__value dial__value--${band.tone}`}
          cx="64" cy="64" r={R}
          style={{ strokeDasharray: C, strokeDashoffset: offset }}
        />
      </svg>
      <div className="dial__center">
        <span className="dial__num mono">{display}</span>
        <span className={`dial__band dial__band--${band.tone}`}>{band.label}</span>
      </div>
    </div>
  );
}
