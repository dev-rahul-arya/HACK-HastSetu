// Converse — scenario picker (PRD §4.4). Each card shows its required signs; if
// you haven't learned them yet, a soft "Warm up first" chip links to the lesson
// (never blocks entry).

import { Link } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import { SCENARIOS } from "../data/scenarios.js";
import { getSign } from "../data/signs.js";
import { isLearned } from "../store/progress.js";
import { ArrowRightIcon, CheckIcon, PlusIcon } from "../components/icons.jsx";

export default function Converse() {
  const { state } = useStore();

  return (
    <main className="page">
      <div className="dash-head">
        <span className="eyebrow">Apply your signs</span>
        <h1>Converse</h1>
        <p style={{ marginTop: 8, maxWidth: "54ch" }}>
          Hold a short signed conversation in an everyday Indian scene. The other
          person is played by AI and reacts to how you sign.
        </p>
      </div>

      <div className="grid grid-3">
        <Link to="/converse/free" className="card card-link conv-card conv-card--free">
          <span className="conv-free__plus" aria-hidden="true"><PlusIcon size={26} /></span>
          <h3>Free talk</h3>
          <p>Open-ended chat with the AI on any topic — sign any word you like.</p>
          <span className="pill pill--accent">Start talking</span>
        </Link>

        {SCENARIOS.map((sc) => {
          const done = state.scenarios[sc.id]?.completed;
          const unlearned = sc.signs.filter((id) => !isLearned(state.signs[id]));
          const warmUp = unlearned[0] ? getSign(unlearned[0]) : null;

          return (
            <div key={sc.id} className="card conv-card">
              <div className="conv-card__head">
                <h3>{sc.title}</h3>
                {done && <span className="pill pill--good"><CheckIcon size={14} /> Done</span>}
              </div>
              <p>{sc.blurb}</p>

              <div className="conv-card__signs">
                {sc.signs.map((id) => {
                  const learned = isLearned(state.signs[id]);
                  return (
                    <span key={id}
                      className={"conv-sign" + (learned ? " is-learned" : "")}>
                      {getSign(id)?.label || id}
                    </span>
                  );
                })}
              </div>

              <div className="conv-card__foot">
                {warmUp ? (
                  <Link to={`/learn/${warmUp.unit}/${warmUp.id}`} className="pill pill--warm">
                    Warm up first
                  </Link>
                ) : (
                  <span className="pill pill--accent">Ready</span>
                )}
                <Link to={`/converse/${sc.id}`} className="btn btn--primary btn--sm">
                  Start <ArrowRightIcon size={16} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
