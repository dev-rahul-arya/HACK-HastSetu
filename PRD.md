# PRD — "HastSetu" (हस्तसेतु): Indian Sign Language Learning Web App

**Version:** 1.0 (Hackathon build)
**Target builder:** AI coding agent (Claude Opus) + team
**Stack constraint:** Vite + vanilla JavaScript (no React/Vue/Svelte). Plain HTML/CSS/JS modules.
**Status of hand tracker:** Built separately (OpenCV/MediaPipe pipeline), NOT in this repo yet. Frontend must ship with a clean integration slot + mock. See §7 — this is a hard requirement.

---

## 1. Overview

HastSetu ("hand bridge") teaches Indian Sign Language (ISL) to two audiences: hearing people who want to communicate with deaf friends/family/colleagues, and deaf/hard-of-hearing users building fluency. The app teaches the ISL alphabet through guided lessons, drills users in a practice mode with camera-based scoring and per-joint tips, and lets users apply skills in an AI-powered conversation mode with realistic Indian scenarios.

The camera → hand-landmark → scoring pipeline is an external module the team has already built. This PRD defines the entire product around it, with a strict adapter contract so the tracker can be dropped in later with zero refactoring.

### 1.1 Goals
1. A polished, demo-ready webapp in hackathon timeframe: judge can go Home → Learn a letter → Practice it → have a short signed conversation in under 4 minutes.
2. Every screen works today with a **mock tracker** (simulated landmarks/scores) so the app is fully navigable before the real tracker is linked.
3. Clean, minimal, confident UI — polished, not trendy, not dated. No template-looking dashboard slop.
4. Real social-impact framing: ISL specifics (two-handed signs, Indian scenarios, emergency signs), not an ASL clone.

### 1.2 Non-goals (hackathon scope)
- No backend/auth server. Auth is **dummy client-side login** (hardcoded credentials, session + all data in `localStorage`) — see §4.0.
- No full ISL vocabulary — alphabet (A–Z) + digits (0–9) + ~20 phrase signs + emergency pack only.
- No mobile app; responsive web only (desktop-first, usable ≥ 360px).
- No real-time multiplayer (listed as "future" in pitch).
- Tracker internals are out of scope for this repo — frontend consumes its interface only.

---

## 2. Users & core journeys

| Persona | Need | Journey |
|---|---|---|
| **Aarav, 24, hearing** — new deaf colleague | Learn basics fast, low embarrassment | Onboard → Alphabet path → daily 5-min practice → scenario convo "First day at office" |
| **Meera, 16, deaf student** | Practice fingerspelling speed + literacy | Speed drills → reverse mode (sign → text) → streaks |
| **Judge, 5 minutes** | See the magic quickly | Home → "Try a sign now" instant demo → Practice with live feedback → Convo mode |

**Judge-path requirement:** From landing, one click reaches a working sign attempt (with mock tracker if real one absent). No signup walls, no empty states that dead-end.

---

## 3. Feature scope (final list)

**P0 (must ship):**
1. Learn — alphabet + digits curriculum with lesson player
2. Practice — drill mode with live scoring, per-joint feedback, ghost overlay slot
3. Convo — AI scenario conversations (mixed-mode: AI text/speech ↔ user signs)
4. Feedback engine — score, tips, LLM natural-language coaching
5. Tracker adapter + mock tracker + reserved camera mount (§7)
6. Progress dashboard + streaks/XP + SRS-lite review queue
7. Emergency signs quick module

**P1 (if time):**
8. Fingerspelling speed trainer (spell whole words against clock)
9. Reverse mode (sign → recognized text) — UI shell wired to the same adapter
10. Certificate export (canvas → PNG download) after finishing alphabet

**P2 (pitch as roadmap, don't build):** multiplayer race, regional dialect packs, avatar that signs back, offline PWA.

---

## 4. Detailed feature specs

### 4.0 Auth (dummy, client-side) (`#/login`)
No backend — this exists so the app has a real login flow, per-user progress, and a personalized feel.

- **Dummy credentials** hardcoded in `src/auth/users.js`:
  - `demo / demo123` (pre-seeded with partial progress — Unit 1 half done, 3-day streak — so judges see a "lived-in" dashboard instantly)
  - `aarav / hello123` (fresh account)
  - `meera / signs123` (fresh account)
- **Login screen:** centered card — wordmark, username + password fields, "Log in" primary button, inline error on wrong credentials ("That username or password doesn't match — try demo / demo123"), and a prominent **"Continue as demo"** one-click button (logs into `demo` instantly). This keeps the judge path frictionless: still one click from landing to content.
- **Session:** `hastsetu.session = {username, loggedInAt}` in localStorage. All routes except `#/login` are guarded — no session → redirect to `#/login`; after login, return to the originally requested route.
- **Per-user data:** all user state (§9) is namespaced per user: `hastsetu.v1.<username>`. Switching accounts switches progress cleanly; nothing bleeds between users.
- **Navbar:** avatar chip (initial letter in an indigo circle) + username; click → small menu with "Log out" (clears session only, never progress) and "Settings".
- **Honesty note in UI:** small caption on the login card — "Demo build: credentials are local to this device." Never present this as real security.
- Passwords compared in plain JS; no hashing needed (explicit non-goal — it's a demo).

### 4.1 Home / Landing (`#/`)
- Hero: app name + one-line promise ("Learn Indian Sign Language with live feedback on your hands"), primary CTA **"Start learning"**, secondary **"Try a sign now"** (jumps straight into Practice with letter "A", no setup).
- Below hero: three cards — Learn / Practice / Converse — each with a one-line description and progress chip if user has history.
- Streak flame + today's "Sign of the day" tile (random unlearned sign; clicking opens its lesson).
- If returning user: "Continue where you left off" strip pinned above cards.

### 4.2 Learn (`#/learn`, `#/learn/:unitId/:signId`)
**Curriculum structure (data-driven, JSON — see §9):**
- Unit 1: Alphabet A–M
- Unit 2: Alphabet N–Z
- Unit 3: Digits 0–9
- Unit 4: Everyday phrases (~20: hello, thank you, sorry, water, food, help, family terms…)
- Unit 5: Emergency pack (help, pain, doctor, police, danger, call) — also surfaced as standalone quick module from Home.

**Unit page:** grid of sign tiles; states: locked / available / learned (score ≥ 70 once) / mastered (≥ 90 twice). Sequential unlock inside a unit; units 1–3 unlocked from start, 4 unlocks after Unit 1, 5 always unlocked (emergency signs must never be gated).

**Lesson player (the core screen) — split layout:**
- **Left panel — Reference:** looping demo of the sign. Asset strategy: `signs/{id}/demo.mp4` if present, else `demo.webp` animation, else a large static illustration `demo.svg`, else a styled letter glyph placeholder. The player must render gracefully at every fallback level because real assets will be added incrementally.
- Under the demo: "How to form it" — 2–4 step written breakdown (from sign JSON), a "two-handed" badge where applicable (call this out — ISL uses many two-handed signs, unlike ASL fingerspelling), and a common-mistakes list.
- **Right panel — Your camera:** the **TrackerMount** slot (§7). When tracker absent → designed placeholder (see §7.4), when mock → simulated skeleton + scores, when real → live feed.
- Bottom bar: attempt counter, best score, "Mark for review", Prev / Next sign.
- Flow: user watches → clicks **"Try it"** → 3-2-1 countdown → capture window (default 3 s, from sign JSON) → score + feedback (§4.5) → "Try again" / "Next".

### 4.3 Practice (`#/practice`)
Three sub-modes, tabbed:
1. **Review queue (SRS-lite):** signs due today. Scheduling: each sign has `box` 1–5; correct attempt (≥ 70) promotes a box, failed demotes to 1. Intervals: box 1 = same day, 2 = 1 day, 3 = 2 days, 4 = 4 days, 5 = 7 days. Store `nextDue` timestamps. Queue view shows count due ("6 signs to review") and runs them as a session with a summary screen (accuracy, XP earned, weakest sign).
2. **Free drill:** pick any learned unit → random signs, endless, immediate feedback.
3. **Speed round (P1):** 30-second timer, fingerspell as many prompted letters as possible; combo multiplier for consecutive ≥ 80 scores; personal best stored.

### 4.4 Convo mode (`#/converse`, `#/converse/:scenarioId`)
- **Scenario picker:** cards for 4 launch scenarios — *Ordering chai*, *Asking directions*, *At the doctor*, *First day at office*. Each shows required signs; if user hasn't learned them, show "Warm up first" chip linking to those lessons (soft warning, never blocks).
- **Conversation screen:** chat-style transcript on the left (AI messages as text bubbles + optional browser `speechSynthesis` playback toggle), TrackerMount on the right.
- **Turn loop:** AI sends a message → UI shows "Your turn: sign *__*" with 1–3 expected signs → user signs each (same capture flow as lessons) → recognized/scored result appears as the user's chat bubble ("You signed: THANK YOU · 84%") → AI responds contextually via LLM (§8) and advances the script.
- Scenarios are semi-scripted: a JSON scene graph defines beats and expected signs; the LLM generates the AI's natural-language lines and reacts to score quality (praises a clean sign, gently re-prompts a failed one, offers the tip from the feedback engine). This keeps demos reliable while feeling alive.
- End of scenario: recap card — signs used, average score, XP, "Replay" / "Next scenario".
- **Mixed-mode toggle:** "AI speaks aloud" on/off (accessibility: default OFF, captions always on).

### 4.5 Feedback engine (shared by Learn / Practice / Convo)
Consumes `AttemptResult` from the tracker adapter (§7.2) and renders:
- **Score dial:** 0–100 with band labels — <50 "Keep adjusting", 50–69 "Almost", 70–89 "Good sign", 90+ "Crisp". Animated count-up, color from design tokens.
- **Per-joint heatmap:** schematic hand SVG (two hands when the sign is two-handed); each joint dot tinted by its error magnitude from `jointErrors`. This is a signature demo moment — must look great.
- **Rule-based tips:** map top-2 worst joints/params to canned tips from the sign's JSON (`tips` keyed by error code, e.g. `thumb_extended`, `wrist_rotation`).
- **LLM coaching (AI tip):** send compact error summary to the LLM (§8) → one warm, specific coaching sentence ("Tuck your thumb across the palm — it's drifting outward, which turns A into a loose fist."). Show with a small spark icon; if the LLM call fails or no API key, silently show only rule-based tips (never an error toast for this).
- **Ghost overlay (slot):** a toggle on the camera panel that asks the adapter for `referencePose(signId)` and, if provided, renders a semi-transparent target skeleton over the feed. If adapter returns null → toggle hidden. Frontend builds the toggle + overlay canvas now; data comes with the real tracker.

### 4.6 Progress dashboard (`#/progress`)
- Top row: streak (days), total XP, signs learned / mastered counts, average accuracy (7-day).
- Alphabet mastery grid: 26 + 10 tiles tinted by best score — an at-a-glance heat view.
- Accuracy trend: simple 14-day line chart. **No chart library** — hand-drawn SVG polyline (this is easy in vanilla JS and keeps bundle tiny).
- "Trouble signs" list (lowest rolling accuracy) with one-click "Drill these".
- P1: "Download certificate" button when Units 1+2 fully learned — renders a canvas certificate (name from a prompt, date, mastery %) → PNG.

### 4.7 Gamification (light-touch, not casino)
- XP: attempt ≥ 70 = 10 XP, ≥ 90 = 15, review-queue completion bonus 20, scenario completion 50.
- Streak: any scored attempt counts for the day; streak shown on Home + Progress.
- Badges (8 total, simple SVGs): First Sign, A–M, N–Z, Numbers, 7-Day Streak, First Conversation, Emergency Ready, Speed Demon (P1). Toast on unlock; gallery on Progress page.
- Tone: quiet and encouraging. No confetti storms; a single subtle success animation on mastery is enough.

---

## 5. Information architecture & routing

Hash-based router (no server config needed), vanilla implementation:

```
#/login                 Login (only unguarded route)
#/                      Home
#/learn                 Units overview
#/learn/:unit/:sign     Lesson player
#/practice              Practice tabs (review | drill | speed)
#/converse              Scenario picker
#/converse/:scenario    Conversation screen
#/progress              Dashboard
#/settings              Settings (LLM key, camera prefs, voice toggle, reset data)
```

Router guard: every route except `#/login` requires a session (§4.0); unauthenticated navigation redirects to login and returns to the intended route afterward.

Persistent top nav: wordmark (→ Home), Learn, Practice, Converse, Progress, streak chip, user avatar chip (§4.0), settings gear. Active route underlined. Nav collapses to icon row < 720px.

---

## 6. Architecture & repo structure

```
isl-app/
├─ index.html
├─ vite.config.js
├─ public/
│  └─ signs/                  # per-sign media (added incrementally)
│     └─ a/ demo.svg …
├─ src/
│  ├─ main.js                 # boot: router, store hydrate, tracker select
│  ├─ router.js               # hash router: route table → page modules
│  ├─ store.js                # state + localStorage persistence (see §9)
│  ├─ auth/
│  │  ├─ auth.js              # session get/set, login(), logout(), route guard
│  │  └─ users.js             # dummy credential list + demo-account seed data
│  ├─ pages/
│  │  ├─ login.js  home.js  learn.js  lesson.js  practice.js
│  │  ├─ converse.js  conversation.js  progress.js  settings.js
│  ├─ components/             # plain functions returning DOM nodes
│  │  ├─ trackerMount.js      # ★ the reserved camera slot (§7)
│  │  ├─ scoreDial.js  jointHeatmap.js  tipCard.js
│  │  ├─ signTile.js  navbar.js  toast.js  modal.js  chart.js
│  ├─ tracker/
│  │  ├─ adapter.js           # ★ interface + registry (§7.2)
│  │  ├─ mockTracker.js       # simulated implementation (§7.3)
│  │  └─ realTracker.js       # EMPTY STUB with TODO — team links OpenCV build here
│  ├─ ai/
│  │  ├─ llm.js               # LLM client abstraction (§8)
│  │  └─ prompts.js
│  ├─ data/
│  │  ├─ signs.js             # sign catalog (JSON-as-module)
│  │  └─ scenarios.js
│  └─ styles/
│     ├─ tokens.css  base.css  components.css
```

Rules for the builder:
- ES modules only, no bundler-unfriendly globals except the deliberate `window.ISLTracker` hook (§7.2).
- Components are functions `(props) => HTMLElement`; pages export `render(container, params)` and optional `destroy()` (used to stop camera/timers on route change — important).
- No frameworks, no jQuery, no chart libs, no CSS frameworks. Allowed deps: none required; keep `package.json` deps empty besides Vite.

---

## 7. ★ Hand-tracker integration contract (the empty slot)

The OpenCV tracking module exists but is **not in this repo**. The frontend must be built so the team links it later by implementing one interface — nothing else changes.

### 7.1 Principle
All camera/scoring UI talks to a `Tracker` interface, never to OpenCV/MediaPipe directly. At boot, `main.js` resolves the tracker:

```js
// main.js (boot order)
const tracker =
  window.ISLTracker            // real module attaches itself here when linked
  ?? (await import('./tracker/realTracker.js')).default   // returns null today
  ?? (await import('./tracker/mockTracker.js')).default;  // always works
```

A visible "Simulation mode" pill appears on TrackerMount whenever the mock is active, so demos are honest and the team instantly sees which mode is live.

### 7.2 The interface (`tracker/adapter.js`) — exact contract

```js
/**
 * Tracker interface — the real OpenCV module must implement this shape.
 * Attach as `window.ISLTracker = { ...impl }` OR export default from realTracker.js.
 */
export const TrackerInterface = {
  /** One-time setup. mountEl: the <div> inside TrackerMount reserved for
   *  the video/canvas. Tracker owns everything inside it. */
  async init(mountEl, opts /* {width, height} */) {},

  /** Begin camera + landmark stream. */
  async start() {},

  /** Stop camera, release resources. MUST be safe to call twice. */
  async stop() {},

  /** Score one attempt at a sign.
   *  Resolves after `durationMs` capture window with an AttemptResult. */
  async captureAttempt(signId, durationMs) {},

  /** Continuous recognition for reverse mode / convo (P1).
   *  cb({signId, confidence}) fires on each stable detection. Returns unsubscribe fn. */
  onRecognition(cb) { return () => {}; },

  /** Reference skeleton for ghost overlay, or null if unavailable. */
  referencePose(signId) { return null; },

  /** 'real' | 'mock' — drives the Simulation pill. */
  get kind() { return 'real'; },
};

/** AttemptResult shape (the only data contract the UI consumes):
 * {
 *   signId: 'a',
 *   score: 0..100,
 *   jointErrors: { wrist:0.1, thumb_tip:0.7, index_mcp:0.2, ... }, // 0=perfect, 1=worst; 21 MediaPipe joint names, optional second hand as 'r_*'
 *   errorCodes: ['thumb_extended','wrist_rotation'],               // maps to sign JSON tips
 *   durationMs: 3000,
 *   landmarks: null | Array                                        // optional raw frames; UI never requires it
 * }
 */
```

### 7.3 Mock tracker (`mockTracker.js`) — must feel real
- Renders into mountEl: a dark panel with an animated schematic hand skeleton (SVG, gently idling) — NOT a webcam. Label: "Simulation mode".
- `captureAttempt`: waits `durationMs` with a progress ring, then returns a plausible result: score drawn from a distribution that improves with the user's attempt count for that sign (first try 45–70, later tries 65–95), 1–2 random `errorCodes` valid for that sign, matching `jointErrors`.
- `onRecognition`: in convo mode, emits the expected sign with confidence 0.8–0.95 after 2–3 s (so scenario demos always flow).
- Purpose: every feature is demoable and testable end-to-end today.

### 7.4 TrackerMount component (the reserved space)
- Fixed aspect 4:3 panel, rounded, with states:
  - **`unavailable`** (realTracker stub null AND mock disabled via settings): calm empty state — hand outline icon, "Camera module connects here", small "Enable simulation" button. This is the literal "keep that space empty" requirement — designed, not blank.
  - **`idle` / `countdown` / `capturing` / `result`** driven by the capture flow.
- Overlays owned by frontend (stacked canvases above tracker's area): countdown numerals, capture progress ring, ghost-overlay canvas, success flash. Tracker only ever touches its inner mount div.
- Handles permissions: if real tracker's `start()` rejects (camera denied) → inline explainer with retry, and an "Use simulation instead" fallback link.

---

## 8. AI / LLM integration

- `ai/llm.js` exposes `async chat(messages, {json=false})`. Provider: Anthropic Messages API by default (model configurable, default `claude-sonnet-4-6`), endpoint + API key entered in **Settings** and stored in localStorage. Show a one-line note in Settings: "For the hackathon demo we call the API from the browser; production would proxy this server-side."
- Two uses:
  1. **Coach tip** (§4.5): system prompt = ISL coach persona + the sign's formation notes; user msg = `{signId, score, errorCodes, worstJoints}`; ask for exactly one sentence, ≤ 25 words, specific and warm. 4-s timeout → fall back silently to rule-based tip.
  2. **Convo partner** (§4.4): system prompt = scenario brief + beat list + "respond in 1–2 short sentences, simple English, react to the user's sign quality, never break character"; conversation history passed each turn. If no key configured, convo mode runs on scripted fallback lines baked into the scenario JSON (must still demo well offline).
- Never block UI on LLM latency: optimistic UI, skeleton shimmer on the AI bubble, tips arrive when ready.

---

## 9. Data models (localStorage)

Keys: `hastsetu.session` (current login, §4.0) and `hastsetu.v1.<username>` (per-user state below). The store loads the namespace for the active session on login and swaps it on account change.

```js
// signs.js entry
{ id:'a', label:'A', unit:1, twoHanded:false, captureMs:3000,
  steps:['Curl fingers into the palm','Thumb rests along the side','Palm faces out'],
  mistakes:['Thumb sticking out','Loose fist'],
  tips:{ thumb_extended:'Tuck your thumb against your fingers.', wrist_rotation:'Keep your palm facing the camera.' },
  media:{ video:null, anim:null, illo:'/signs/a/demo.svg' } }

// scenarios.js entry
{ id:'chai', title:'Ordering chai', signs:['hello','one','tea','thankyou'],
  beats:[ {ai:'fallback line…', expect:['hello']}, … ] }

// user state (persisted)
{ xp, streak:{count,lastDay}, badges:[…],
  signs:{ a:{best, attempts, box, nextDue, history:[{t,score}] }, … },
  scenarios:{ chai:{completed,bestAvg} },
  settings:{ llmKey, model, voiceOn, simulationOn } }
```

Store module: tiny pub/sub (`get`, `set(path,val)`, `subscribe(fn)`), debounced persistence, `resetAll()` in Settings.

---

## 10. Design system — "quietly confident"

Direction: clean, minimal, warm-neutral. Not glassmorphism/neon-gradient "modern", not bootstrap-2014 "old". Precision in spacing and type carries the polish. One signature: the split lesson layout with the schematic-hand motif (heatmap + mock skeleton) as the app's recurring visual identity.

**Tokens (`tokens.css`):**
- Color — grounded in Indian craft dyes, used sparingly:
  - `--bg: #FBFBF9` (paper), `--surface: #FFFFFF`, `--ink: #1F2430` (soft near-black), `--ink-2: #5B6472`
  - `--accent: #2E4B9B` (indigo — primary actions, active states, links)
  - `--warm: #E8A13D` (marigold — streaks, XP, badges ONLY; never buttons)
  - `--good: #2F8F5B`, `--warn: #C8722C`, `--bad: #C24343` (score bands)
  - `--line: #E7E6E1` borders; shadows barely-there (`0 1px 3px rgb(31 36 48 / .06)`)
- Type: display **"Bricolage Grotesque"** (headings, score numerals — characterful but professional), body **"Public Sans"** (UI text), mono **"JetBrains Mono"** (sign glyphs, scores, timers). Google Fonts, 2 weights each max. Scale: 13/15/17/22/28/40, line-height 1.5 body.
- Spacing: 4-px grid; radius: 10px cards, 8px controls, full for pills; max content width 1080px centered.
- Motion: 150–200ms ease-out on hover/press; one 400ms count-up on the score dial; `prefers-reduced-motion` respected everywhere (hard requirement).

**Component notes:** buttons (solid indigo primary / ghost secondary), focus rings visible (`2px` accent outline offset 2px) on ALL interactives, empty states always include next action, toasts bottom-center auto-dismiss 3s. Keyboard: full app navigable by tab; capture flow triggerable by `Space`.

**Accessibility floor (non-negotiable — this is an accessibility product):** WCAG AA contrast, captions for any audio, no information conveyed by color alone (score bands get labels), all media has alt/aria, `aria-live="polite"` on score results.

---

## 11. Non-functional requirements
- First load < 200KB JS (achievable: zero deps); Lighthouse a11y ≥ 95.
- Everything except LLM calls works offline after first load.
- Route change must `destroy()` previous page (stop camera, clear timers) — no leaked webcam.
- Graceful degradation ladder everywhere: real tracker → mock → designed empty state; LLM → scripted lines; video asset → animation → illustration → glyph.

## 12. Build order (for the agent) & acceptance
1. Scaffold + tokens + router + auth (login, guard, demo seed) + navbar + store → 2. Sign data + Learn/lesson player with mock tracker end-to-end → 3. Feedback engine (dial, heatmap, tips) → 4. Practice (review queue, drill) → 5. Convo (scripted fallback first, then LLM) → 6. Progress + gamification → 7. Settings + polish pass (focus states, reduced motion, empty states) → 8. P1 items.

**Acceptance checklist:**
- [ ] App runs `npm i && npm run dev` with zero extra deps; no console errors.
- [ ] Full judge path works with NO real tracker and NO API key; "Continue as demo" reaches a sign attempt in ≤ 2 clicks.
- [ ] Wrong credentials show inline error; guarded routes redirect to login; logout preserves progress; `demo` and `aarav` accounts hold fully separate progress.
- [ ] Deleting the mock (settings toggle) shows the designed "Camera module connects here" state — the reserved slot.
- [ ] Implementing `window.ISLTracker` per §7.2 lights up real mode with no frontend edits.
- [ ] Refresh persists all progress; reset works.
- [ ] Keyboard-only run-through of a full lesson succeeds.

## 13. Open questions (answer before/while building)
1. Real tracker output: confirm it can emit `jointErrors` + `errorCodes` per §7.2, or should the adapter derive codes from raw landmarks? (Adapter mapping layer is acceptable.)
2. Sign media: who records demo clips, and for how many signs by demo day? (Fallback ladder covers gaps.)
3. LLM: browser-side key OK for demo, or is a tiny proxy available?
4. App name "HastSetu" — placeholder; swap freely (it's a single token + wordmark).
