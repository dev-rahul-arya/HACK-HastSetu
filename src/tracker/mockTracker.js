// Mock tracker (PRD §7.3). Implements the TrackerInterface without a camera:
// renders an idle schematic hand skeleton into mountEl and returns plausible,
// improving AttemptResults so every feature is demoable end-to-end today.

import { NODES, CONNECTIONS, JOINT_NAMES, ERRORCODE_JOINTS } from "./handModel.js";
import { getSign } from "../data/signs.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function buildSkeleton() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 200 250");
  svg.setAttribute("class", "mock-skeleton");
  svg.setAttribute("aria-hidden", "true");

  const gLines = document.createElementNS(SVG_NS, "g");
  gLines.setAttribute("class", "ms-lines");
  CONNECTIONS.forEach(([a, b]) => {
    const ln = document.createElementNS(SVG_NS, "line");
    ln.setAttribute("x1", NODES[a][0]);
    ln.setAttribute("y1", NODES[a][1]);
    ln.setAttribute("x2", NODES[b][0]);
    ln.setAttribute("y2", NODES[b][1]);
    gLines.appendChild(ln);
  });
  svg.appendChild(gLines);

  const gNodes = document.createElementNS(SVG_NS, "g");
  gNodes.setAttribute("class", "ms-nodes");
  NODES.forEach(([x, y], i) => {
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y);
    c.setAttribute("r", i === 8 ? 5 : 3.4);
    c.setAttribute("class", i === 8 ? "ms-node ms-node--active" : "ms-node");
    c.style.setProperty("--i", i);
    gNodes.appendChild(c);
  });
  svg.appendChild(gNodes);
  return svg;
}

const mockTracker = {
  _mountEl: null,
  _started: false,
  _attempts: new Map(), // signId -> count
  _recognitionCbs: new Set(),

  get kind() {
    return "mock";
  },

  async init(mountEl) {
    this._mountEl = mountEl;
  },

  async start() {
    if (this._started || !this._mountEl) return;
    this._mountEl.replaceChildren(buildSkeleton());
    this._started = true;
  },

  async stop() {
    // MUST be safe to call twice.
    if (this._mountEl) this._mountEl.replaceChildren();
    this._started = false;
  },

  async captureAttempt(signId, durationMs = 3000) {
    const sign = getSign(signId);
    const n = this._attempts.get(signId) || 0;
    this._attempts.set(signId, n + 1);

    await new Promise((r) => setTimeout(r, durationMs));

    // Score improves with practice on this sign.
    let score;
    if (n === 0) score = rand(45, 70);
    else score = rand(62, 82) + n * 4 + rand(-8, 8);
    score = Math.round(clamp(score, 40, 98));

    // 1–2 error codes valid for this sign.
    const codeKeys = sign ? Object.keys(sign.tips || {}) : [];
    const nCodes = score >= 85 ? 1 : 2;
    const errorCodes = shuffle(codeKeys).slice(0, Math.min(nCodes, codeKeys.length));

    // Joint errors correlate with the chosen codes; second hand for two-handed.
    const jointErrors = {};
    const names = [...JOINT_NAMES];
    if (sign?.twoHanded) names.push(...JOINT_NAMES.map((j) => `r_${j}`));
    names.forEach((j) => {
      jointErrors[j] = Number((((100 - score) / 100) * rand(0.1, 0.4)).toFixed(2));
    });
    errorCodes.forEach((code) => {
      (ERRORCODE_JOINTS[code] || []).forEach((j) => {
        if (j in jointErrors) jointErrors[j] = Number(rand(0.55, 0.9).toFixed(2));
      });
    });

    return { signId, score, jointErrors, errorCodes, durationMs, landmarks: null };
  },

  onRecognition(cb) {
    this._recognitionCbs.add(cb);
    return () => this._recognitionCbs.delete(cb);
  },

  // For convo demos: emit the expected sign as a stable detection after a beat.
  emitRecognition(signId, confidence = rand(0.82, 0.95)) {
    this._recognitionCbs.forEach((cb) => cb({ signId, confidence }));
  },

  referencePose() {
    // A target skeleton for the ghost overlay (Stage 3).
    return { points: NODES };
  },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default mockTracker;
