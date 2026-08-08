// TrackerMount (PRD §7.4) — the reserved camera slot. A fixed 4:3 panel that
// hands its inner div to whichever tracker is active (real or mock) and owns all
// overlays: the simulation pill, 3-2-1 countdown, capture progress ring, a
// success flash, plus the designed "unavailable" and camera-denied states.
//
// Imperative API (via ref): capture() runs the countdown → capture window →
// resolves onResult(attemptResult). Parent renders the score/feedback itself.

import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
} from "react";
import { useStore } from "../store/StoreContext.jsx";
import { resolveTracker } from "../tracker/adapter.js";
import HandConstellation from "./HandConstellation.jsx";
import { CameraIcon } from "./icons.jsx";

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

function ProgressRing({ durationMs }) {
  return (
    <svg className="tm__ring" viewBox="0 0 120 120" aria-hidden="true">
      <circle className="tm__ring-track" cx="60" cy="60" r={RING_R} />
      <circle
        className="tm__ring-value"
        cx="60" cy="60" r={RING_R}
        style={{
          strokeDasharray: RING_C,
          strokeDashoffset: RING_C,
          animationDuration: `${durationMs}ms`,
        }}
      />
    </svg>
  );
}

function TrackerMount({ sign, onResult, onPhaseChange }, ref) {
  const { state, updateSettings } = useStore();
  const simulationOn = state?.settings?.simulationOn ?? true;

  const mountRef = useRef(null);
  const trackerRef = useRef(null);
  const aliveRef = useRef(true);
  const [phase, setPhase] = useState("loading");
  const [countdown, setCountdown] = useState(3);
  const [kind, setKind] = useState("mock");

  const setPhaseSafe = useCallback(
    (p) => {
      if (!aliveRef.current) return;
      setPhase(p);
      onPhaseChange?.(p);
    },
    [onPhaseChange],
  );

  // Resolve + initialise the tracker; re-run when the sim setting changes.
  useEffect(() => {
    aliveRef.current = true;
    let cancelled = false;

    (async () => {
      const tracker = await resolveTracker();
      if (cancelled) return;
      trackerRef.current = tracker;
      setKind(tracker.kind);

      // Mock disabled via settings → the designed empty state.
      if (tracker.kind === "mock" && !simulationOn) {
        setPhaseSafe("unavailable");
        return;
      }
      try {
        await tracker.init(mountRef.current, { width: 640, height: 480 });
        await tracker.start();
        if (!cancelled) setPhaseSafe("idle");
      } catch {
        if (!cancelled) setPhaseSafe("denied");
      }
    })();

    return () => {
      cancelled = true;
      aliveRef.current = false;
      trackerRef.current?.stop?.();
    };
  }, [simulationOn, setPhaseSafe]);

  const capture = useCallback(async () => {
    const tracker = trackerRef.current;
    if (!tracker || phase !== "idle" || !sign) return;

    // 3 · 2 · 1 countdown
    setPhaseSafe("countdown");
    for (let n = 3; n >= 1; n--) {
      setCountdown(n);
      await new Promise((r) => setTimeout(r, 650));
      if (!aliveRef.current) return;
    }

    setPhaseSafe("capturing");
    let result;
    try {
      result = await tracker.captureAttempt(sign.id, sign.captureMs || 3000);
    } catch {
      if (aliveRef.current) setPhaseSafe("idle");
      return;
    }
    if (!aliveRef.current) return;

    setPhaseSafe("result");
    onResult?.(result);
    setTimeout(() => aliveRef.current && setPhaseSafe("idle"), 700);
  }, [phase, sign, onResult, setPhaseSafe]);

  useImperativeHandle(ref, () => ({ capture, phase }), [capture, phase]);

  return (
    <div className="tm" data-phase={phase}>
      <div className="tm__mount" ref={mountRef} />

      {kind === "mock" && phase !== "unavailable" && phase !== "denied" && (
        <span className="pill pill--sim tm__pill">Simulation mode</span>
      )}

      {phase === "countdown" && (
        <div className="tm__overlay tm__count" aria-live="assertive">
          {countdown}
        </div>
      )}

      {phase === "capturing" && (
        <div className="tm__overlay">
          <ProgressRing durationMs={sign?.captureMs || 3000} />
          <span className="tm__capturing-label mono">Reading…</span>
        </div>
      )}

      {phase === "result" && <div className="tm__flash" aria-hidden="true" />}

      {phase === "unavailable" && (
        <div className="tm__overlay tm__empty">
          <HandConstellation animate={false} className="tm__empty-hand" />
          <p className="tm__empty-title">Camera module connects here</p>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => updateSettings({ simulationOn: true })}
          >
            Enable simulation
          </button>
        </div>
      )}

      {phase === "denied" && (
        <div className="tm__overlay tm__empty">
          <CameraIcon size={34} />
          <p className="tm__empty-title">Camera access was blocked</p>
          <p className="tm__empty-sub">
            Allow the camera and retry, or practise with the simulator.
          </p>
          <div className="tm__empty-actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => updateSettings({ simulationOn: true })}
            >
              Use simulation instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default forwardRef(TrackerMount);
