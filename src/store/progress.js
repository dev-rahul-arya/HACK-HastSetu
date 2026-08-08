// Pure gameplay logic: attempts, SRS-lite scheduling, XP, streaks, badges,
// and unlock/status helpers (PRD §4.2, §4.3, §4.7). No React, no I/O — takes a
// state object and returns a new one plus a summary of what changed.

import { dayKey } from "./defaults.js";
import { SIGNS, signsInUnit, unitById } from "../data/signs.js";

const DAY = 24 * 60 * 60 * 1000;

// SRS boxes 1–5 → interval before next due.
export const BOX_INTERVAL_DAYS = { 1: 0, 2: 1, 3: 2, 4: 4, 5: 7 };

export const LEARNED_THRESHOLD = 70;
export const MASTERED_THRESHOLD = 90;

export const BADGES = {
  first_sign: { label: "First Sign", desc: "Scored your first attempt." },
  unit_am: { label: "A–M", desc: "Learned every letter A through M." },
  unit_nz: { label: "N–Z", desc: "Learned every letter N through Z." },
  numbers: { label: "Numbers", desc: "Learned digits 0 through 9." },
  streak7: { label: "7-Day Streak", desc: "Practised 7 days in a row." },
  first_convo: { label: "First Conversation", desc: "Finished a scenario." },
  emergency_ready: { label: "Emergency Ready", desc: "Learned every emergency sign." },
  speed_demon: { label: "Speed Demon", desc: "Nailed a fast speed round." },
};

function clone(state) {
  return JSON.parse(JSON.stringify(state));
}

// Score band labels + tone (PRD §4.5). Never rely on colour alone — the label
// carries the meaning.
export function scoreBand(score) {
  if (score >= 90) return { label: "Crisp", tone: "good" };
  if (score >= 70) return { label: "Good sign", tone: "good" };
  if (score >= 50) return { label: "Almost", tone: "warn" };
  return { label: "Keep adjusting", tone: "bad" };
}

export function xpForScore(score) {
  if (score >= MASTERED_THRESHOLD) return 15;
  if (score >= LEARNED_THRESHOLD) return 10;
  return 0;
}

export function isLearned(signState) {
  return Boolean(signState && signState.best >= LEARNED_THRESHOLD);
}

export function isMastered(signState) {
  if (!signState || !signState.history) return false;
  const crisp = signState.history.filter(
    (h) => h.score >= MASTERED_THRESHOLD,
  ).length;
  return crisp >= 2;
}

/** Status of a sign for the Learn grid: locked | available | learned | mastered. */
export function signStatus(state, sign) {
  const ss = state.signs[sign.id];
  if (isMastered(ss)) return "mastered";
  if (isLearned(ss)) return "learned";
  return isSignUnlocked(state, sign) ? "available" : "locked";
}

export function isUnitComplete(state, unitId) {
  const list = signsInUnit(unitId);
  return list.length > 0 && list.every((s) => isLearned(state.signs[s.id]));
}

export function isUnitUnlocked(state, unitId) {
  const unit = unitById(unitId);
  if (!unit) return false;
  if (unit.always) return true;
  if (unit.requires) return isUnitComplete(state, unit.requires);
  return true;
}

/** Sequential unlock inside a unit; emergency unit never gates. */
export function isSignUnlocked(state, sign) {
  if (!isUnitUnlocked(state, sign.unit)) return false;
  const unit = unitById(sign.unit);
  if (unit?.emergency) return true;
  const list = signsInUnit(sign.unit);
  const idx = list.findIndex((s) => s.id === sign.id);
  if (idx <= 0) return true;
  return isLearned(state.signs[list[idx - 1].id]);
}

function updateStreak(state) {
  const today = dayKey();
  const last = state.streak.lastDay;
  if (last === today) return;
  const yesterday = dayKey(new Date(Date.now() - DAY));
  state.streak.count = last === yesterday ? state.streak.count + 1 : 1;
  state.streak.lastDay = today;
}

function checkBadges(state) {
  const earned = new Set(state.badges);
  const added = [];
  const grant = (id, cond) => {
    if (cond && !earned.has(id)) {
      earned.add(id);
      added.push(id);
    }
  };

  const anyAttempt = Object.values(state.signs).some((s) => s.attempts > 0);
  grant("first_sign", anyAttempt);
  grant("unit_am", isUnitComplete(state, 1));
  grant("unit_nz", isUnitComplete(state, 2));
  grant("numbers", isUnitComplete(state, 3));
  grant("emergency_ready", isUnitComplete(state, 5));
  grant("streak7", state.streak.count >= 7);
  grant("first_convo", Object.values(state.scenarios).some((s) => s.completed));
  grant("speed_demon", (state.speedBest || 0) >= 12);

  state.badges = [...earned];
  return added;
}

/**
 * Record one scored attempt. Returns { state, xp, newBadges, pass, mastered }.
 */
export function recordAttempt(state, { signId, score }) {
  const next = clone(state);
  const prev = next.signs[signId] || {
    best: 0,
    attempts: 0,
    box: 1,
    nextDue: 0,
    history: [],
  };
  const s = { ...prev };
  s.attempts += 1;
  s.best = Math.max(s.best || 0, score);
  s.history = [...(s.history || []), { t: Date.now(), score }].slice(-40);

  const pass = score >= LEARNED_THRESHOLD;
  s.box = pass ? Math.min(5, (s.box || 1) + 1) : 1;
  s.nextDue = Date.now() + BOX_INTERVAL_DAYS[s.box] * DAY;
  next.signs[signId] = s;

  const xp = xpForScore(score);
  next.xp += xp;

  updateStreak(next);
  const newBadges = checkBadges(next);

  return { state: next, xp, newBadges, pass, mastered: isMastered(s) };
}

export function completeScenario(state, scenarioId, avgScore) {
  const next = clone(state);
  const prev = next.scenarios[scenarioId] || { completed: false, bestAvg: 0 };
  next.scenarios[scenarioId] = {
    completed: true,
    bestAvg: Math.max(prev.bestAvg || 0, Math.round(avgScore)),
  };
  next.xp += 50; // scenario completion (PRD §4.7)
  updateStreak(next);
  const newBadges = checkBadges(next);
  return { state: next, xp: 50, newBadges };
}

export function grantReviewBonus(state) {
  const next = clone(state);
  next.xp += 20; // review-queue completion bonus
  const newBadges = checkBadges(next);
  return { state: next, xp: 20, newBadges };
}

export function setSpeedBest(state, count) {
  const next = clone(state);
  next.speedBest = Math.max(next.speedBest || 0, count);
  const newBadges = checkBadges(next);
  return { state: next, newBadges };
}

/** Signs due for review today (SRS queue). */
export function dueSigns(state, now = Date.now()) {
  return SIGNS.filter((sign) => {
    const ss = state.signs[sign.id];
    return ss && ss.attempts > 0 && (ss.nextDue || 0) <= now;
  });
}

/** Lowest rolling accuracy among practised signs (trouble signs). */
export function troubleSigns(state, limit = 5) {
  return SIGNS.map((sign) => {
    const ss = state.signs[sign.id];
    if (!ss || !ss.history?.length) return null;
    const recent = ss.history.slice(-5);
    const avg = recent.reduce((a, h) => a + h.score, 0) / recent.length;
    return { sign, avg: Math.round(avg) };
  })
    .filter(Boolean)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, limit);
}

export function learnedCount(state) {
  return Object.values(state.signs).filter(isLearned).length;
}

export function masteredCount(state) {
  return Object.values(state.signs).filter(isMastered).length;
}

/** Average accuracy over the last N days across all attempts. */
export function recentAccuracy(state, days = 7) {
  const cutoff = Date.now() - days * DAY;
  const scores = [];
  Object.values(state.signs).forEach((s) =>
    (s.history || []).forEach((h) => {
      if (h.t >= cutoff) scores.push(h.score);
    }),
  );
  if (!scores.length) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
