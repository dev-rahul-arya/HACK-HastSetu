// Default per-user state + demo seed (PRD §9).

export const DATA_VERSION = "v1";

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAY = 24 * 60 * 60 * 1000;

export function defaultSettings() {
  // LLM key + model now come from .env (VITE_*), not per-user settings.
  return {
    voiceOn: false, // accessibility: default OFF, captions always on
    simulationOn: true, // mock tracker enabled by default
  };
}

export function defaultState() {
  return {
    xp: 0,
    streak: { count: 0, lastDay: null },
    badges: [],
    signs: {}, // id -> { best, attempts, box, nextDue, history:[{t,score}] }
    scenarios: {}, // id -> { completed, bestAvg }
    speedBest: 0,
    settings: defaultSettings(),
  };
}

// A "lived-in" account so judges see a populated dashboard instantly:
// Unit 1 (A–M) roughly half done, 3-day streak.
export function demoSeed() {
  const now = Date.now();
  const today = new Date();
  const mkSign = (best, attempts, box, dueInDays, extra = []) => ({
    best,
    attempts,
    box,
    nextDue: now + dueInDays * DAY,
    history: [...extra, { t: now - DAY, score: best }],
  });

  return {
    ...defaultState(),
    xp: 340,
    streak: { count: 3, lastDay: dayKey(today) },
    badges: ["first_sign"],
    signs: {
      a: mkSign(92, 4, 4, 4, [{ t: now - 3 * DAY, score: 71 }]),
      b: mkSign(88, 3, 3, 2),
      c: mkSign(76, 2, 2, 1),
      d: mkSign(81, 2, 3, 2),
      e: mkSign(69, 2, 1, 0), // due today — a trouble sign
      f: mkSign(73, 1, 2, 1),
      g: mkSign(58, 1, 1, 0), // due today, weak
    },
    scenarios: {},
    speedBest: 0,
    settings: defaultSettings(),
  };
}

export function seedFor(seedName) {
  if (seedName === "demo") return demoSeed();
  return defaultState();
}
