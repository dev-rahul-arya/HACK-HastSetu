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
      type scale, buttons, cards, nav; numbered learning-path cards.
- [ ] **Stage 2 — Learn.** Tracker `adapter.js` done. TODO: `mockTracker.js`
      (idle SVG hand + `captureAttempt` + `onRecognition` + `referencePose`),
      `realTracker.js` stub, `TrackerMount.jsx`, `SignTile.jsx`, real `Learn.jsx`
      (units grid) + `Lesson.jsx` (split layout + capture flow).
- [ ] **Stage 3 — Feedback engine.** ScoreDial, JointHeatmap, rule tips, Gemini
      coach tip, ghost-overlay slot.
- [ ] **Stage 4 — Practice.** Review queue (SRS), free drill, speed round.
- [ ] **Stage 5 — Converse.** Scenarios, turn loop, Gemini partner + scripted
      fallback, speech toggle.
- [ ] **Stage 6 — Progress.** Dashboard, mastery grid, SVG trend chart, badges.
- [ ] **Stage 7 — Settings + a11y polish.** Voice/sim toggles, reset, focus
      states, reduced motion, keyboard capture.
