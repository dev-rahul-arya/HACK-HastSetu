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
import { CONNECTIONS } from "../tracker/handModel.js";
import HandConstellation from "./HandConstellation.jsx";
import { CameraIcon } from "./icons.jsx";

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

// Ghost overlay: a semi-transparent target skeleton drawn over the feed from
// the tracker's referencePose. Rendered only when a pose is available.
function GhostOverlay({ points }) {
  return (
    <svg className="tm__ghost" viewBox="0 0 200 250" aria-hidden="true">
      <g className="tm__ghost-lines">
        {CONNECTIONS.map(([a, b], i) => (
          <line key={i} x1={points[a][0]} y1={points[a][1]}
            x2={points[b][0]} y2={points[b][1]} />
        ))}
      </g>
      <g className="tm__ghost-nodes">
        {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} />)}
      </g>
    </svg>
  );
}

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
  const phaseRef = useRef("loading"); // synchronous mirror of phase for capture()
  const [phase, setPhase] = useState("loading");
  const [countdown, setCountdown] = useState(3);
  const [kind, setKind] = useState("mock");
  const [ghostOn, setGhostOn] = useState(false);
  const [ghostPose, setGhostPose] = useState(null);

  const setPhaseSafe = useCallback(
    (p) => {
      if (!aliveRef.current) return;
      phaseRef.current = p;
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

  const capture = useCallback(async (opts = {}) => {
    const tracker = trackerRef.current;
    if (!tracker || phaseRef.current !== "idle") return null;
    // Speed rounds pass an explicit signId (the prompt changes faster than the
    // ref updates); lessons rely on the sign prop.
    const targetId = opts.signId || sign?.id;
    if (!targetId) return null;
    const { durationMs = sign?.captureMs || 3000, skipCountdown = false } = opts;

    if (!skipCountdown) {
      // 3 · 2 · 1 countdown
      setPhaseSafe("countdown");
      for (let n = 3; n >= 1; n--) {
        setCountdown(n);
        await new Promise((r) => setTimeout(r, 650));
        if (!aliveRef.current) return null;
      }
    }

    setPhaseSafe("capturing");
    let result;
    try {
      result = await tracker.captureAttempt(targetId, durationMs);
    } catch {
      if (aliveRef.current) setPhaseSafe("idle");
      return null;
    }
    if (!aliveRef.current) return null;

    setPhaseSafe("result");
    onResult?.(result);
    // Speed rounds fire back-to-back: return to idle immediately so the next
    // capture can start; lessons linger on a success flash.
    if (skipCountdown) setPhaseSafe("idle");
    else setTimeout(() => aliveRef.current && setPhaseSafe("idle"), 700);
    return result;
  }, [sign, onResult, setPhaseSafe]);

  useImperativeHandle(
    ref,
    () => ({ capture, get phase() { return phaseRef.current; } }),
    [capture],
  );

  // Ask the tracker for a target pose for the ghost overlay; hide the toggle if
  // none is available (PRD §4.5).
  useEffect(() => {
    const t = trackerRef.current;
    setGhostPose(t?.referencePose && sign ? t.referencePose(sign.id) : null);
  }, [sign, phase]);

  const trackerActive = !["loading", "unavailable", "denied"].includes(phase);
  const showGhostToggle = ghostPose && trackerActive;

  return (
    <div className="tm" data-phase={phase}>
      <div className="tm__mount" ref={mountRef} />

      {ghostOn && ghostPose && trackerActive && (
        <GhostOverlay points={ghostPose.points} />
      )}

      {kind === "mock" && phase !== "unavailable" && phase !== "denied" && (
        <span className="pill pill--sim tm__pill">Simulation mode</span>
      )}

      {showGhostToggle && (
        <button type="button"
          className={"tm__ghost-toggle" + (ghostOn ? " is-on" : "")}
          aria-pressed={ghostOn}
          onClick={() => setGhostOn((v) => !v)}>
          Ghost {ghostOn ? "on" : "off"}
        </button>
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
