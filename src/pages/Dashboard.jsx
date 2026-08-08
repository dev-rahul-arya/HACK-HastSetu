// Dashboard — the authenticated home (PRD §4.1, re-scoped as an app home rather
// than a marketing hero). Greeting, resume strip, quick stats, quick actions,
// and the sign of the day.

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import { SIGNS } from "../data/signs.js";
import {
  isLearned, learnedCount, masteredCount, recentAccuracy,
} from "../store/progress.js";
import {
  LearnIcon, PracticeIcon, ConverseIcon, SparkIcon, FlameIcon,
  CheckIcon, ProgressIcon, ArrowRightIcon,
} from "../components/icons.jsx";

const ACTIONS = [
  { to: "/learn", Icon: LearnIcon, title: "Learn", desc: "Lessons & new signs" },
  { to: "/practice", Icon: PracticeIcon, title: "Practice", desc: "Drill for accuracy" },
  { to: "/converse", Icon: ConverseIcon, title: "Converse", desc: "Real scenarios" },
];

export default function Dashboard() {
  const { state, displayName } = useStore();
  const learned = learnedCount(state);
  const mastered = masteredCount(state);
  const accuracy = recentAccuracy(state, 7);
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

  const stats = [
    { Icon: SparkIcon, label: "Total XP", value: state.xp },
    { Icon: FlameIcon, label: "Day streak", value: state.streak.count },
    { Icon: CheckIcon, label: "Signs learned", value: learned, sub: `${mastered} mastered` },
    { Icon: ProgressIcon, label: "Accuracy · 7d", value: accuracy == null ? "—" : `${accuracy}%` },
  ];

  return (
    <main className="page">
      <div className="dash-head">
        <div>
          <span className="eyebrow">Your practice</span>
          <h1>Namaste, {displayName}.</h1>
        </div>
      </div>

      {returning && lastSign && (
        <div className="continue-strip">
          <div>
            <span className="eyebrow">Continue where you left off</span>
            <strong>{lastSign.label}</strong>
          </div>
          <Link to={`/learn/${lastSign.unit}/${lastSign.id}`} className="btn btn--primary btn--sm">
            Resume <ArrowRightIcon size={18} />
          </Link>
        </div>
      )}

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

      <div className="section-head"><h2>Jump in</h2></div>
      <div className="path-grid">
        {ACTIONS.map(({ to, Icon, title, desc }) => (
          <Link key={to} to={to} className="card card-link action">
            <span className="action__icon"><Icon size={24} /></span>
            <div className="action__body">
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
            <ArrowRightIcon size={20} className="action__arrow" />
          </Link>
        ))}
      </div>

      <div className="section-head"><h2>Today</h2></div>
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
          <span className="glyph-badge glyph-badge--warm" aria-hidden="true">
            <FlameIcon size={30} />
          </span>
          <div className="side-tile__body">
            <span className="eyebrow">Streak</span>
            <h3><span className="mono">{state.streak.count}</span>{" "}
              day{state.streak.count === 1 ? "" : "s"}</h3>
            <p>Any scored attempt keeps it alive.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
