# HastSetu (हस्तसेतु) — Indian Sign Language Learning Web App

"Hand bridge." Learn Indian Sign Language with live, per-joint feedback on your
hands: guided lessons, camera-scored practice, and AI conversations set in
everyday Indian scenarios. Built with **Vite + React (JS)**.

See `PRD.md` for the full product spec.

## Run it

```bash
npm install          # deps include react + react-router-dom
npm run dev          # start the dev server
npm run build        # production build
npm run lint         # eslint
```

Log in with **demo / demo123** (pre-seeded, "lived-in" account) or click
**Continue as demo**. Also: `aarav / hello123`, `meera / signs123`.

## LLM config (optional)

AI coaching tips and the conversation partner use **Google Gemini**. Copy
`.env.example` → `.env` and set your key:

```
VITE_GEMINI_API_KEY=...
VITE_GEMINI_MODEL=gemini-2.5-flash
```

The whole app runs fine **without** a key — tips fall back to rule-based text
and conversations use scripted lines. (Demo build calls the API from the
browser; production would proxy this server-side.)

## Design language — "Landmark"

The recurring visual identity is the **MediaPipe hand-landmark skeleton** (dots +
connecting lines) — the thing the tracker actually sees. Deep indigo ink on warm
paper; **marigold is the single "active node" highlight** (streaks, XP, badges).
Display: Bricolage Grotesque; body: Public Sans; data/eyebrows: JetBrains Mono.

## Architecture

- `src/store/` — Context+useReducer store, per-user `localStorage`
  (`hastsetu.v1.<username>`), and pure gameplay logic (`progress.js`: SRS boxes,
  XP, streaks, badges, unlock rules).
- `src/auth/` — dummy client-side auth + session guard.
- `src/tracker/` — `adapter.js` is the one interface the real OpenCV/MediaPipe
  module implements (attach `window.ISLTracker` or export from `realTracker.js`);
  `mockTracker.js` simulates it so everything is demoable today.
- `src/ai/llm.js` — Gemini client (reads `.env`), silent fallback.
- `src/data/` — sign catalog + scenarios.
- `src/components/`, `src/pages/`, `src/styles/`.

## Build progress

_(Tracking here instead of an external task list.)_

- [x] **Stage 1 — Foundation.** React scaffold replaced; design tokens +
      base/components/app CSS; store (Context+useReducer, SRS/XP/streak/badges);
      dummy auth + demo seed; HashRouter + auth guard; navbar; Login; Home.
- [x] **Design overhaul — "Landmark".** Hand-constellation signature
      (`HandConstellation.jsx`) in the hero + login backdrop; reworked palette,
      type scale, buttons, cards; numbered learning-path cards.
- [x] **IA + chrome rework.** Public **Landing** page (`/`) split from the
      authenticated **Dashboard** (`/dashboard`); app shell is now a desktop
      **sidebar** + mobile **bottom nav** (`AppLayout.jsx`); all emoji replaced
      with an SVG icon set (`icons.jsx`).
- [x] **Stage 2 — Learn.** Shared `handModel.js` (21 landmarks, connections,
      joint names); `mockTracker.js` (idle skeleton + improving scores +
      correlated `jointErrors`/`errorCodes` + `referencePose`); `realTracker.js`
      stub; `TrackerMount.jsx` (simulation pill, 3-2-1 countdown, progress ring,
      flash, designed "unavailable" + camera-denied states); `SignTile.jsx`;
      `Learn.jsx` (units grid, unlock states) and `Lesson.jsx` (split layout,
      capture flow, Space-to-capture, compact result + rule tips). Full feedback
      UI (dial/heatmap/LLM) is Stage 3.
- [x] **Stage 3 — Feedback engine.** `ScoreDial` (animated count-up, band
      label, reduced-motion aware); `JointHeatmap` (schematic hand, two hands for
      two-handed signs, joints tinted by error + labelled legend); `TipCard`
      (rule tips + one Gemini coaching sentence, `prompts.js`, silent fallback);
      ghost-overlay toggle + target skeleton in `TrackerMount`. Lesson now shows
      the full feedback panel.
- [x] **Stage 4 — Practice.** Tabbed `Practice.jsx`: **review queue** (SRS
      due-today session → summary with avg accuracy, XP, weakest sign + review
      bonus), **free drill** (pick a unit → endless shuffled signs with full
      feedback), **speed round** (30s sprint, back-to-back captures, ≥80 combo
      multiplier, personal best). `TrackerMount.capture()` now takes options
      (signId, durationMs, skipCountdown) and returns the result.
- [ ] **Stage 5 — Converse.** Scenarios, turn loop, Gemini partner + scripted
      fallback, speech toggle.
- [ ] **Stage 6 — Progress.** Dashboard, mastery grid, SVG trend chart, badges.
- [ ] **Stage 7 — Settings + a11y polish.** Voice/sim toggles, reset, focus
      states, reduced motion, keyboard capture.
