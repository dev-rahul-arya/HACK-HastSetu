// Practice (PRD §4.3) — three tabbed modes:
//   review  — SRS-lite queue of signs due today, run as a session + summary
//   drill   — pick a unit, endless random signs with immediate feedback
//   speed   — 30-second fingerspelling sprint with a combo multiplier
// All three reuse the TrackerMount capture flow.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import { useAwardToasts } from "../components/Toast.jsx";
import { SIGNS, getSign, signsInUnit, UNITS } from "../data/signs.js";
import {
  dueSigns, isLearned, isUnitUnlocked, scoreBand,
} from "../store/progress.js";
import TrackerMount from "../components/TrackerMount.jsx";
import ScoreDial from "../components/ScoreDial.jsx";
import JointHeatmap from "../components/JointHeatmap.jsx";
import TipCard from "../components/TipCard.jsx";
import { PlayIcon, ArrowRightIcon, FlameIcon } from "../components/icons.jsx";

const TABS = [
  { id: "review", label: "Review queue" },
  { id: "drill", label: "Free drill" },
  { id: "speed", label: "Speed round" },
];

function randomOf(arr, exclude) {
  const pool = arr.length > 1 && exclude ? arr.filter((s) => s.id !== exclude.id) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* -------- shared attempt stage (review + drill) -------- */
function AttemptStage({ sign, prompt, onScored, onNext, nextLabel = "Next sign" }) {
  const ref = useRef(null);
  const [phase, setPhase] = useState("loading");
  const [result, setResult] = useState(null);

  const [lastId, setLastId] = useState(sign.id);
  if (sign.id !== lastId) {
    setLastId(sign.id);
    setResult(null);
  }

  const onResult = useCallback((r) => {
    setResult(r);
    onScored?.(r);
  }, [onScored]);

  const doCapture = useCallback(() => ref.current?.capture(), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" && phase === "idle" && e.target === document.body) {
        e.preventDefault();
        doCapture();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, doCapture]);

  const busy = phase === "countdown" || phase === "capturing";

  return (
    <div className="stage">
      <div className="stage__prompt">
        <span className="eyebrow">{prompt}</span>
        <div className="stage__glyph mono" aria-hidden="true">{sign.label}</div>
        {sign.twoHanded && <span className="pill pill--accent">Two-handed</span>}
      </div>

      <div className="stage__cam">
        <TrackerMount ref={ref} sign={sign} onResult={onResult} onPhaseChange={setPhase} />
        <div className="lesson__actions">
          {!result ? (
            <button className="btn btn--primary btn--lg" onClick={doCapture}
              disabled={busy || phase === "unavailable"}>
              <PlayIcon size={20} /> Sign it
            </button>
          ) : (
            <button className="btn btn--primary btn--lg" onClick={onNext}>
              {nextLabel} <ArrowRightIcon size={18} />
            </button>
          )}
          {!result && <span className="lesson__hint">or press <kbd>Space</kbd></span>}
        </div>
      </div>

      {result && (
        <div className="feedback" aria-live="polite">
          <div className="feedback__top card">
            <ScoreDial score={result.score} />
            <JointHeatmap jointErrors={result.jointErrors} twoHanded={sign.twoHanded} />
          </div>
          <TipCard sign={sign} result={result} />
        </div>
      )}
    </div>
  );
}

/* -------- review queue (SRS) -------- */
function ReviewQueue() {
  const { state, recordAttempt, grantReviewBonus } = useStore();
  const award = useAwardToasts();
  const [queue, setQueue] = useState(() => dueSigns(state));
  const [i, setI] = useState(0);
  const [scored, setScored] = useState([]);
  const [xp, setXp] = useState(0);
  const [done, setDone] = useState(false);

  const onScored = useCallback((r) => {
    const summary = recordAttempt({ signId: r.signId, score: r.score });
    award(summary);
    setScored((a) => [...a, { id: r.signId, score: r.score }]);
    setXp((x) => x + (summary.xp || 0));
  }, [recordAttempt, award]);

  const onNext = useCallback(() => {
    if (i + 1 >= queue.length) {
      const b = grantReviewBonus();
      award(b);
      setXp((x) => x + (b.xp || 0));
      setDone(true);
    } else {
      setI((n) => n + 1);
    }
  }, [i, queue.length, grantReviewBonus, award]);

  const replay = () => {
    setQueue(dueSigns(state));
    setI(0); setScored([]); setXp(0); setDone(false);
  };

  if (queue.length === 0) {
    return (
      <div className="empty card card--pad">
        <h3>You're all caught up</h3>
        <p>No signs are due for review right now. Try a free drill to keep sharp.</p>
        <Link to="/practice/drill" className="btn btn--primary">Free drill</Link>
      </div>
    );
  }

  if (done) {
    const avg = scored.length
      ? Math.round(scored.reduce((a, s) => a + s.score, 0) / scored.length) : 0;
    const weakest = scored.reduce((w, s) => (!w || s.score < w.score ? s : w), null);
    const weakSign = weakest && getSign(weakest.id);
    const band = scoreBand(avg);
    return (
      <div className="summary card card--pad">
        <span className="eyebrow">Review complete</span>
        <div className="summary__stats">
          <div className="summary__stat">
            <span className={`summary__big mono dial__band--${band.tone}`}>{avg}%</span>
            <span className="summary__lbl">Average</span>
          </div>
          <div className="summary__stat">
            <span className="summary__big mono">{scored.length}</span>
            <span className="summary__lbl">Signs</span>
          </div>
          <div className="summary__stat">
            <span className="summary__big mono">+{xp}</span>
            <span className="summary__lbl">XP earned</span>
          </div>
        </div>
        {weakSign && (
          <p className="summary__weak">
            Weakest this round: <strong>{weakSign.label}</strong> ({weakest.score}%).{" "}
            <Link to={`/learn/${weakSign.unit}/${weakSign.id}`}>Open its lesson →</Link>
          </p>
        )}
        <div className="summary__actions">
          <button className="btn btn--ghost" onClick={replay}>Review again</button>
          <Link to="/practice/drill" className="btn btn--primary">Free drill</Link>
        </div>
      </div>
    );
  }

  const current = queue[i];
  return (
    <>
      <div className="run-progress">
        <span className="mono">{i + 1} / {queue.length}</span>
        <div className="run-bar"><span style={{ width: `${(i / queue.length) * 100}%` }} /></div>
      </div>
      <AttemptStage key={current.id} sign={current} prompt="Sign due for review"
        onScored={onScored} onNext={onNext}
        nextLabel={i + 1 >= queue.length ? "Finish" : "Next sign"} />
    </>
  );
}

/* -------- free drill -------- */
function FreeDrill({ initialSignId }) {
  const { state, recordAttempt } = useStore();
  const award = useAwardToasts();
  const initial = initialSignId ? getSign(initialSignId) : null;
  const [unit, setUnit] = useState(initial ? initial.unit : null);
  const [current, setCurrent] = useState(initial || null);

  const pool = useMemo(() => {
    if (!unit) return [];
    const all = signsInUnit(unit);
    const learned = all.filter((s) => isLearned(state.signs[s.id]));
    return learned.length ? learned : all;
  }, [unit, state.signs]);

  const onScored = useCallback((r) => {
    award(recordAttempt({ signId: r.signId, score: r.score }));
  }, [recordAttempt, award]);

  const onNext = useCallback(() => setCurrent((c) => randomOf(pool, c)), [pool]);

  if (!unit || !current) {
    const options = UNITS.filter((u) => isUnitUnlocked(state, u.id));
    return (
      <div>
        <p className="drill-intro">Pick a unit to drill. We'll shuffle its signs endlessly.</p>
        <div className="grid grid-auto">
          {options.map((u) => {
            const all = signsInUnit(u.id);
            const learned = all.filter((s) => isLearned(state.signs[s.id])).length;
            return (
              <button key={u.id} className="card card-link drill-pick"
                onClick={() => {
                  setUnit(u.id);
                  const p = all.filter((s) => isLearned(state.signs[s.id]));
                  setCurrent(randomOf(p.length ? p : all));
                }}>
                <span className="unit__num mono">Unit {u.id}</span>
                <strong>{u.title}</strong>
                <span className="mono drill-pick__meta">{learned}/{all.length} learned</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="run-progress">
        <span className="eyebrow">Drilling Unit {unit}</span>
        <button className="btn btn--quiet btn--sm"
          onClick={() => { setUnit(null); setCurrent(null); }}>
          Change unit
        </button>
      </div>
      <AttemptStage key={current.id} sign={current} prompt="Make this sign"
        onScored={onScored} onNext={onNext} nextLabel="Next sign" />
    </>
  );
}

/* -------- speed round -------- */
function SpeedRound() {
  const { state, setSpeedBest } = useStore();
  const letters = useMemo(() => SIGNS.filter((s) => s.unit === 1 || s.unit === 2), []);
  const ref = useRef(null);
  const runningRef = useRef(false);
  const countRef = useRef(0);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);

  const [status, setStatus] = useState("ready"); // ready | running | done
  const [timeLeft, setTimeLeft] = useState(30);
  const [current, setCurrent] = useState(letters[0]);
  const [count, setCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  const finish = useCallback(() => {
    runningRef.current = false;
    setStatus("done");
    setSpeedBest(countRef.current);
  }, [setSpeedBest]);

  const runLoop = useCallback(async () => {
    while (runningRef.current) {
      const s = randomOf(letters, current);
      setCurrent(s);
      const res = await ref.current?.capture({ signId: s.id, durationMs: 1200, skipCountdown: true });
      if (!res || !runningRef.current) break;
      if (res.score >= 70) {
        countRef.current += 1;
        setCount(countRef.current);
      }
      if (res.score >= 80) {
        comboRef.current += 1;
        bestComboRef.current = Math.max(bestComboRef.current, comboRef.current);
        setBestCombo(bestComboRef.current);
      } else {
        comboRef.current = 0;
      }
      setCombo(comboRef.current);
    }
  }, [letters, current]);

  const start = useCallback(() => {
    countRef.current = 0; comboRef.current = 0; bestComboRef.current = 0;
    setCount(0); setCombo(0); setBestCombo(0); setTimeLeft(30);
    runningRef.current = true;
    setStatus("running");
    runLoop();
  }, [runLoop]);

  // Countdown timer.
  useEffect(() => {
    if (status !== "running") return;
    const t = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          finish();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [status, finish]);

  useEffect(() => () => { runningRef.current = false; }, []);

  if (status === "ready") {
    return (
      <div className="speed-intro card card--pad">
        <h3>Speed round</h3>
        <p>Fingerspell as many prompted letters as you can in 30 seconds.
          Consecutive scores of 80+ build a combo. Personal best: <strong className="mono">{state.speedBest || 0}</strong>.</p>
        <button className="btn btn--primary btn--lg" onClick={start}>
          <PlayIcon size={20} /> Start
        </button>
      </div>
    );
  }

  if (status === "done") {
    const isBest = count >= (state.speedBest || 0);
    return (
      <div className="summary card card--pad">
        <span className="eyebrow">Time!</span>
        <div className="summary__stats">
          <div className="summary__stat">
            <span className="summary__big mono">{count}</span>
            <span className="summary__lbl">Signs landed</span>
          </div>
          <div className="summary__stat">
            <span className="summary__big mono">{bestCombo}</span>
            <span className="summary__lbl">Best combo</span>
          </div>
          <div className="summary__stat">
            <span className="summary__big mono">{state.speedBest || 0}</span>
            <span className="summary__lbl">Personal best</span>
          </div>
        </div>
        {isBest && count > 0 && <p className="summary__weak">New personal best! 🎉</p>}
        <div className="summary__actions">
          <button className="btn btn--primary" onClick={start}>Play again</button>
        </div>
      </div>
    );
  }

  // running
  return (
    <div className="speed">
      <div className="speed__hud">
        <div className="speed__time">
          <span className="mono">{timeLeft}</span><small>s</small>
        </div>
        <div className="speed__scores">
          <span><span className="mono">{count}</span> landed</span>
          {combo >= 2 && <span className="pill pill--warm"><FlameIcon size={14} /> {combo}× combo</span>}
        </div>
      </div>
      <div className="speed__prompt">
        <span className="eyebrow">Sign this letter</span>
        <div className="speed__glyph mono" aria-live="polite">{current.label}</div>
      </div>
      <div className="speed__cam">
        <TrackerMount ref={ref} sign={current} />
      </div>
    </div>
  );
}

export default function Practice() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const active = TABS.some((t) => t.id === tab) ? tab : "review";

  return (
    <main className="page">
      <div className="dash-head">
        <span className="eyebrow">Sharpen up</span>
        <h1>Practice</h1>
      </div>

      <div className="tabs" role="tablist" aria-label="Practice modes">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={active === t.id}
            className={"tab" + (active === t.id ? " is-active" : "")}
            onClick={() => navigate(`/practice/${t.id}`)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="tabpanel">
        {active === "review" && <ReviewQueue />}
        {active === "drill" && <FreeDrill initialSignId={params.get("sign")} />}
        {active === "speed" && <SpeedRound />}
      </div>
    </main>
  );
}
