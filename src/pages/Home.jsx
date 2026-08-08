// Home / Landing (PRD §4.1). Hero shows the hand-landmark constellation — the
// thesis "feedback on your hands", shown literally. Below: the learning path
// (Learn → Practice → Converse is a real sequence), sign-of-the-day, streak.

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import { SIGNS } from "../data/signs.js";
import { isLearned, learnedCount } from "../store/progress.js";
import HandConstellation from "../components/HandConstellation.jsx";

const PATH = [
  { n: "01", to: "/learn", title: "Learn", desc: "Guided lessons for the alphabet, digits, everyday phrases and emergencies." },
  { n: "02", to: "/practice", title: "Practice", desc: "Drill signs with live scoring and per-joint feedback until they're crisp." },
  { n: "03", to: "/converse", title: "Converse", desc: "Put it to use in realistic Indian scenarios, from ordering chai to the doctor." },
];

function Arrow() {
  return (
    <svg className="path-card__arrow" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function Home() {
  const { state, displayName } = useStore();
  const learned = learnedCount(state);
  const returning = learned > 0 || state.xp > 0;

  const sotd = useMemo(() => {
    const unlearned = SIGNS.filter((s) => !isLearned(state.signs[s.id]));
    const pool = unlearned.length ? unlearned : SIGNS;
    const daySeed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
    return pool[daySeed % pool.length];
  }, [state.signs]);

  const lastSign = useMemo(() => {
    let best = null;
    Object.entries(state.signs).forEach(([id, s]) => {
      const t = s.history?.[s.history.length - 1]?.t || 0;
      if (!best || t > best.t) best = { id, t };
    });
    return best ? SIGNS.find((s) => s.id === best.id) : null;
  }, [state.signs]);

  return (
    <main className="page">
      <section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">हस्तसेतु · the hand bridge</span>
          <h1 className="hero__title">
            Read the language <em>in your hands.</em>
          </h1>
          <p className="hero__sub">
            Learn Indian Sign Language with live, per-joint feedback — guided
            lessons, camera-scored practice, and AI conversations set in everyday
            Indian life.
          </p>
          <div className="hero__cta">
            <Link to="/learn" className="btn btn--primary btn--lg">Start learning</Link>
            <Link to="/practice/drill?sign=a" className="btn btn--ghost btn--lg">
              Try a sign now
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <HandConstellation activeNode={8} />
          <span className="hero-panel__tag">
            <span className="hero-panel__dot" aria-hidden="true" />
            21 LANDMARKS · LIVE
          </span>
        </div>
      </section>

      {returning && lastSign && (
        <div className="continue-strip">
          <div>
            <span className="eyebrow">Welcome back, {displayName}</span>
            <strong>Pick up where you left off — {lastSign.label}</strong>
          </div>
          <Link to={`/learn/${lastSign.unit}/${lastSign.id}`} className="btn btn--primary btn--sm">
            Resume
          </Link>
        </div>
      )}

      <div className="section-head">
        <h2>The path</h2>
        {learned > 0 && <span className="pill pill--accent">{learned} signs learned</span>}
      </div>
      <div className="path-grid">
        {PATH.map((c) => (
          <Link key={c.to} to={c.to} className="card card-link path-card">
            <span className="path-card__num">{c.n}</span>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <div className="path-card__foot">
              <span className="eyebrow">Open</span>
              <Arrow />
            </div>
          </Link>
        ))}
      </div>

      <div className="section-head">
        <h2>Today</h2>
      </div>
      <div className="side-grid">
        <div className="card side-tile">
          <span className="glyph-badge" aria-hidden="true">{sotd.label[0]}</span>
          <div className="side-tile__body">
            <span className="eyebrow">Sign of the day</span>
            <h3>{sotd.label}</h3>
            <Link to={`/learn/${sotd.unit}/${sotd.id}`} className="btn btn--ghost btn--sm">
              Open lesson
            </Link>
          </div>
        </div>

        <div className="card side-tile">
          <span className="glyph-badge glyph-badge--warm" aria-hidden="true">🔥</span>
          <div className="side-tile__body">
            <span className="eyebrow">Streak</span>
            <h3>
              <span className="mono">{state.streak.count}</span>{" "}
              day{state.streak.count === 1 ? "" : "s"}
            </h3>
            <p>Any scored attempt keeps it alive.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
