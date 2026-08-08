// Tracker adapter — interface + resolver (PRD §7.2).
//
// All camera/scoring UI talks to this `Tracker` interface, never to
// OpenCV/MediaPipe directly. The real module is linked later by either:
//   - assigning `window.ISLTracker = { ...impl }`, or
//   - exporting a default from realTracker.js
// Until then the mock is used. No frontend code changes when the real one lands.

/**
 * Tracker interface — the real OpenCV module must implement this shape.
 *
 *   async init(mountEl, opts)          One-time setup; tracker owns mountEl.
 *   async start()                      Begin camera + landmark stream.
 *   async stop()                       Stop camera; safe to call twice.
 *   async captureAttempt(signId, ms)   Resolves with an AttemptResult.
 *   onRecognition(cb) -> unsubscribe   Continuous recognition (reverse/convo).
 *   referencePose(signId) -> pose|null Ghost-overlay skeleton, or null.
 *   get kind() -> 'real' | 'mock'      Drives the Simulation pill.
 *
 * AttemptResult (the only data contract the UI consumes):
 * {
 *   signId, score: 0..100,
 *   jointErrors: { wrist:0.1, thumb_tip:0.7, ... },   // 0=perfect, 1=worst
 *   errorCodes: ['thumb_extended', ...],              // maps to sign JSON tips
 *   durationMs,
 *   landmarks: null | Array                            // optional; never required
 * }
 */
export const TrackerInterface = {
  async init() {},
  async start() {},
  async stop() {},
  async captureAttempt() {},
  onRecognition() {
    return () => {};
  },
  referencePose() {
    return null;
  },
  get kind() {
    return "real";
  },
};

let _tracker = null;
let _resolving = null;

/**
 * Resolve the active tracker singleton (PRD §7.1 boot order):
 *   window.ISLTracker ?? realTracker default ?? mockTracker default
 */
export async function resolveTracker() {
  if (_tracker) return _tracker;
  if (_resolving) return _resolving;

  _resolving = (async () => {
    if (typeof window !== "undefined" && window.ISLTracker) {
      _tracker = window.ISLTracker;
      return _tracker;
    }
    const real = (await import("./realTracker.js")).default;
    if (real) {
      _tracker = real;
      return _tracker;
    }
    _tracker = (await import("./mockTracker.js")).default;
    return _tracker;
  })();

  return _resolving;
}

/** Force re-resolution (e.g. after the real module attaches at runtime). */
export function resetTracker() {
  _tracker = null;
  _resolving = null;
}
