// Progress dashboard (PRD §4.6). Stats, alphabet/digit mastery heat-grid, a
// hand-drawn 14-day accuracy trend, trouble signs, and the badge gallery.
// P1: certificate export (canvas → PNG) once Units 1 & 2 are learned.

import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import { SIGNS } from "../data/signs.js";
import {
  learnedCount, masteredCount, recentAccuracy, dailyAccuracy,
  troubleSigns, scoreBand, isUnitComplete, BADGES,
} from "../store/progress.js";
import Chart from "../components/Chart.jsx";
import {
  SparkIcon, FlameIcon, CheckIcon, ProgressIcon, MedalIcon, ArrowRightIcon,
} from "../components/icons.jsx";

const LETTERS = SIGNS.filter((s) => s.unit === 1 || s.unit === 2);
const DIGITS = SIGNS.filter((s) => s.unit === 3);

function MasteryCell({ sign, best }) {
  const tone = best > 0 ? scoreBand(best).tone : "empty";
  return (
    <Link to={`/learn/${sign.unit}/${sign.id}`}
      className={`m-cell m-cell--${tone}`}
      aria-label={`${sign.label}${best > 0 ? `, best ${best}` : ", not attempted"}`}>
      <span className="mono">{sign.label}</span>
    </Link>
  );
}

function certificate(name, masteryPct) {
  const c = document.createElement("canvas");
  c.width = 1200; c.height = 848;
  const g = c.getContext("2d");
  g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, 1200, 848);
  g.strokeStyle = "#2f3aa3"; g.lineWidth = 6;
  g.strokeRect(40, 40, 1120, 768);
  g.fillStyle = "#16182b";
  g.textAlign = "center";
  g.font = "700 40px Georgia, serif";
  g.fillText("HastSetu · हस्तसेतु", 600, 180);
  g.font = "600 22px Georgia, serif";
  g.fillStyle = "#4e5270";
  g.fillText("Certificate of Achievement", 600, 232);
  g.font = "700 64px Georgia, serif";
  g.fillStyle = "#16182b";
  g.fillText(name || "Learner", 600, 400);
  g.font = "400 24px Georgia, serif";
  g.fillStyle = "#4e5270";
  g.fillText("has learned the Indian Sign Language alphabet (A–Z)", 600, 470);
  g.fillStyle = "#2f3aa3";
  g.font = "700 30px Georgia, serif";
  g.fillText(`Alphabet mastery: ${masteryPct}%`, 600, 560);
  g.fillStyle = "#8f93ab";
  g.font = "400 20px Georgia, serif";
  g.fillText(new Date().toLocaleDateString(), 600, 700);

  const url = c.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url; a.download = "hastsetu-certificate.png"; a.click();
}

export default function Progress() {
  const { state } = useStore();
  const navigate = useNavigate();
  const learned = learnedCount(state);
  const mastered = masteredCount(state);
  const acc = recentAccuracy(state, 7);
  const trend = dailyAccuracy(state, 14);
  const trouble = troubleSigns(state, 5);
  const earned = new Set(state.badges);

  const stats = [
    { Icon: FlameIcon, label: "Day streak", value: state.streak.count },
    { Icon: SparkIcon, label: "Total XP", value: state.xp },
    { Icon: CheckIcon, label: "Learned", value: learned, sub: `${mastered} mastered` },
    { Icon: ProgressIcon, label: "Accuracy · 7d", value: acc == null ? "—" : `${acc}%` },
  ];

  const alphaDone = isUnitComplete(state, 1) && isUnitComplete(state, 2);
  const alphaBest = LETTERS.reduce((a, s) => a + (state.signs[s.id]?.best || 0), 0);
  const alphaPct = Math.round(alphaBest / (LETTERS.length * 100) * 100);

  return (
    <main className="page">
      <div className="dash-head">
        <span className="eyebrow">Your journey</span>
        <h1>Progress</h1>
      </div>

      <div className="stat-grid">
        {stats.map(({ Icon, label, value, sub }) => (
          <div key={label} className="card stat">
            <span className="stat__icon"><Icon size={20} /></span>
            <div className="stat__value mono">{value}</div>
            <div className="stat__label">{label}</div>
            {sub && <div className="stat__sub">{sub}</div>}
          </div>
        ))}
      </div>

      <div className="prog-grid">
        <section className="card card--pad">
          <div className="section-head" style={{ margin: "0 0 16px" }}>
            <h2 style={{ fontSize: "var(--fs-lg)" }}>Accuracy trend</h2>
            <span className="eyebrow">14 days</span>
          </div>
          <Chart data={trend} />
        </section>

        <section className="card card--pad">
          <div className="section-head" style={{ margin: "0 0 16px" }}>
            <h2 style={{ fontSize: "var(--fs-lg)" }}>Trouble signs</h2>
            {trouble.length > 0 && (
              <Link to="/practice/drill" className="btn btn--ghost btn--sm">Drill these</Link>
            )}
          </div>
          {trouble.length === 0 ? (
            <p className="muted">No weak spots yet — start practising to see them here.</p>
          ) : (
            <ul className="trouble-list">
              {trouble.map(({ sign, avg }) => (
                <li key={sign.id}>
                  <Link to={`/learn/${sign.unit}/${sign.id}`} className="trouble-name">
                    <span className="mono">{sign.label}</span>
                  </Link>
                  <div className="trouble-bar">
                    <span className={`trouble-bar__fill fill--${scoreBand(avg).tone}`}
                      style={{ width: `${avg}%` }} />
                  </div>
                  <span className="mono trouble-pct">{avg}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="section-head"><h2>Mastery</h2></div>
      <div className="card card--pad">
        <span className="eyebrow">Alphabet</span>
        <div className="mastery-grid">
          {LETTERS.map((s) => (
            <MasteryCell key={s.id} sign={s} best={state.signs[s.id]?.best || 0} />
          ))}
        </div>
        <span className="eyebrow" style={{ marginTop: 20, display: "block" }}>Digits</span>
        <div className="mastery-grid">
          {DIGITS.map((s) => (
            <MasteryCell key={s.id} sign={s} best={state.signs[s.id]?.best || 0} />
          ))}
        </div>
        <div className="mastery-legend">
          <span className="heat__key"><i className="heat__swatch heat__swatch--hi" /> &lt;50</span>
          <span className="heat__key"><i className="heat__swatch heat__swatch--mid" /> 50–69</span>
          <span className="heat__key"><i className="heat__swatch heat__swatch--lo" /> 70+</span>
        </div>

        {alphaDone && (
          <button className="btn btn--primary" style={{ marginTop: 20 }}
            onClick={() => certificate(window.prompt("Name for your certificate?") || "", alphaPct)}>
            Download certificate
          </button>
        )}
      </div>

      <div className="section-head"><h2>Badges</h2></div>
      <div className="badge-grid">
        {Object.entries(BADGES).map(([id, b]) => {
          const has = earned.has(id);
          return (
            <div key={id} className={"badge" + (has ? " is-earned" : "")}>
              <span className="badge__medal"><MedalIcon size={24} /></span>
              <div className="badge__body">
                <strong>{b.label}</strong>
                <span>{has ? b.desc : "Locked"}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="prog-cta">
        <button className="btn btn--ghost" onClick={() => navigate("/practice")}>
          Keep practising <ArrowRightIcon size={18} />
        </button>
      </div>
    </main>
  );
}
