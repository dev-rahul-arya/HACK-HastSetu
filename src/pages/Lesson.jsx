// Lesson player (PRD §4.2) — the core screen. Split layout: reference (left) +
// your camera / TrackerMount (right). Watch → Try it → 3-2-1 → capture → the
// full feedback engine: score dial, per-joint heatmap, and coaching tips.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import { useAwardToasts } from "../components/Toast.jsx";
import { getSign, signsInUnit } from "../data/signs.js";
import TrackerMount from "../components/TrackerMount.jsx";
import ScoreDial from "../components/ScoreDial.jsx";
import JointHeatmap from "../components/JointHeatmap.jsx";
import TipCard from "../components/TipCard.jsx";
import { PlayIcon, CheckIcon, ArrowRightIcon } from "../components/icons.jsx";

// Parent passes key={sign.id} so state resets naturally per sign.
function ReferenceMedia({ sign }) {
  const [imgOk, setImgOk] = useState(Boolean(sign.media?.illo));

  if (sign.media?.video) {
    return (
      <video className="ref-media" src={sign.media.video} autoPlay loop muted playsInline
        aria-label={`Demonstration of the sign for ${sign.label}`} />
    );
  }
  if (sign.media?.anim) {
    return <img className="ref-media" src={sign.media.anim} alt={`Sign for ${sign.label}`} />;
  }
  if (imgOk) {
    return (
      <img className="ref-media" src={sign.media.illo} alt={`Sign for ${sign.label}`}
        onError={() => setImgOk(false)} />
    );
  }
  // Final fallback: a styled glyph placeholder.
  return (
    <div className="ref-glyph" role="img" aria-label={`Sign for ${sign.label}`}>
      <span>{sign.label}</span>
    </div>
  );
}

export default function Lesson() {
  const { unitId, signId } = useParams();
  const navigate = useNavigate();
  const { state, recordAttempt, markForReview } = useStore();
  const award = useAwardToasts();

  const sign = getSign(signId);
  const trackerRef = useRef(null);
  const [phase, setPhase] = useState("loading");
  const [result, setResult] = useState(null);

  // Reset the transient result when the sign changes (render-phase reset — the
  // React-recommended alternative to a setState-in-effect).
  const [lastSign, setLastSign] = useState(signId);
  if (signId !== lastSign) {
    setLastSign(signId);
    setResult(null);
  }

  const siblings = useMemo(() => (sign ? signsInUnit(sign.unit) : []), [sign]);
  const idx = siblings.findIndex((s) => s.id === signId);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const onResult = useCallback(
    (attempt) => {
      setResult(attempt);
      const summary = recordAttempt({ signId: attempt.signId, score: attempt.score });
      award(summary);
    },
    [recordAttempt, award],
  );

  const doCapture = useCallback(() => trackerRef.current?.capture(), []);

  // Space triggers the capture flow (PRD §10 keyboard).
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" && phase === "idle" && e.target === document.body) {
        e.preventDefault();
        doCapture();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, doCapture]);

  if (!sign) {
    return (
      <main className="page">
        <div className="empty">
          <p>That sign doesn't exist.</p>
          <button className="btn btn--primary" onClick={() => navigate("/learn")}>
            Back to Learn
          </button>
        </div>
      </main>
    );
  }

  const ss = state.signs[sign.id] || { attempts: 0, best: 0 };
  const busy = phase === "countdown" || phase === "capturing";

  return (
    <main className="page lesson">
      <div className="lesson__bar">
        <button className="btn btn--quiet btn--sm" onClick={() => navigate("/learn")}>
          ← Learn
        </button>
        <div className="lesson__title">
          <span className="eyebrow">Unit {unitId}</span>
          <h1>{sign.label}</h1>
        </div>
        {sign.twoHanded && <span className="pill pill--accent">Two-handed sign</span>}
      </div>

      <div className="lesson__grid">
        {/* Left — reference */}
        <section className="lesson__ref card">
          <ReferenceMedia key={sign.id} sign={sign} />
          <div className="lesson__ref-body">
            <h3>How to form it</h3>
            <ol className="steps">
              {sign.steps.map((s, i) => (
                <li key={i}><span className="steps__n mono">{i + 1}</span>{s}</li>
              ))}
            </ol>
            {sign.mistakes?.length > 0 && (
              <>
                <h3>Common mistakes</h3>
                <ul className="mistakes">
                  {sign.mistakes.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </>
            )}
          </div>
        </section>

        {/* Right — your camera + result */}
        <section className="lesson__cam">
          <TrackerMount ref={trackerRef} sign={sign} onResult={onResult}
            onPhaseChange={setPhase} />

          <div className="lesson__actions">
            <button className="btn btn--primary btn--lg" onClick={doCapture} disabled={busy || phase === "unavailable"}>
              <PlayIcon size={20} /> {result ? "Try again" : "Try it"}
            </button>
            <span className="lesson__hint">or press <kbd>Space</kbd></span>
          </div>

          {result && (
            <div className="feedback" aria-live="polite">
              <div className="feedback__top card">
                <ScoreDial key={ss.attempts} score={result.score} />
                <JointHeatmap jointErrors={result.jointErrors} twoHanded={sign.twoHanded} />
              </div>
              <TipCard key={ss.attempts} sign={sign} result={result} />
            </div>
          )}
        </section>
      </div>

      {/* Bottom bar */}
      <div className="lesson__foot card">
        <div className="lesson__stats">
          <span><span className="mono">{ss.attempts || 0}</span> attempts</span>
          <span>Best <span className="mono">{ss.best || 0}</span></span>
        </div>
        <div className="lesson__nav">
          <button className="btn btn--ghost btn--sm" onClick={() => markForReview(sign.id)}>
            <CheckIcon size={16} /> Mark for review
          </button>
          <button className="btn btn--ghost btn--sm" disabled={!prev}
            onClick={() => prev && navigate(`/learn/${sign.unit}/${prev.id}`)}>
            Prev
          </button>
          <button className="btn btn--primary btn--sm" disabled={!next}
            onClick={() => next && navigate(`/learn/${sign.unit}/${next.id}`)}>
            Next <ArrowRightIcon size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}
