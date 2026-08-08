// Public landing / marketing page (unguarded). Distinct from the authenticated
// Dashboard. Leads with the hand-constellation thesis, the three-step path, and
// what makes this ISL-specific (two-handed signs, Indian scenarios, emergencies).

import { Link } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import HandConstellation from "../components/HandConstellation.jsx";
import {
  LearnIcon, PracticeIcon, ConverseIcon, CameraIcon, ArrowRightIcon,
} from "../components/icons.jsx";

const PATH = [
  { n: "01", Icon: LearnIcon, title: "Learn", desc: "Guided lessons for the alphabet, digits, everyday phrases and emergency signs." },
  { n: "02", Icon: PracticeIcon, title: "Practice", desc: "Drill each sign with live scoring and per-joint feedback until it's crisp." },
  { n: "03", Icon: ConverseIcon, title: "Converse", desc: "Use your signs in realistic Indian scenarios — from ordering chai to the doctor." },
];

const FEATURES = [
  { title: "Feedback on every joint", desc: "Camera tracking scores your handshape and shows exactly which joints to fix — not just right or wrong." },
  { title: "Built for ISL, not ASL", desc: "Two-handed signs, Indian scenarios, and an emergency pack that's never locked behind progress." },
  { title: "No wall, no setup", desc: "Start signing in one click with the built-in simulator. Works offline after first load." },
];

export default function Landing() {
  const { authed } = useStore();
  const startTo = authed ? "/dashboard" : "/login";

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav__inner">
          <Link to="/" className="side__brand">
            <span className="nav__mark" aria-hidden="true">हस</span>
            <span className="side__word">HastSetu</span>
          </Link>
          <div className="landing-nav__actions">
            {authed ? (
              <Link to="/dashboard" className="btn btn--primary btn--sm">Go to app</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--quiet btn--sm">Log in</Link>
                <Link to="/login" className="btn btn--primary btn--sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="landing-main">
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
              <Link to={startTo} className="btn btn--primary btn--lg">Start learning</Link>
              <a href="#how" className="btn btn--ghost btn--lg">See how it works</a>
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

        <section id="how" className="landing-section">
          <div className="section-head"><h2>How it works</h2></div>
          <div className="path-grid">
            {PATH.map(({ n, Icon, title, desc }) => (
              <div key={n} className="card path-card">
                <span className="path-card__num">{n}</span>
                <span className="path-card__icon"><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <div className="section-head"><h2>Why HastSetu</h2></div>
          <div className="grid grid-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card card--pad feature">
                <span className="feature__node" aria-hidden="true" />
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <div className="cta-band__glow" aria-hidden="true" />
          <div className="cta-band__inner">
            <CameraIcon size={30} />
            <h2>One click from here to your first sign.</h2>
            <p>No signup wall. The simulator lets you try it before a camera is ever connected.</p>
            <Link to={startTo} className="btn btn--onindigo btn--lg">
              Start learning <ArrowRightIcon size={20} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-foot">
        <span>HastSetu · हस्तसेतु</span>
        <span className="landing-foot__note">A hackathon build. Credentials are local to your device.</span>
      </footer>
    </div>
  );
}
