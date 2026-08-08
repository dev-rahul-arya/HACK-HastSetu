// Learn — units overview (PRD §4.2). Each unit is a grid of sign tiles with
// locked / available / learned / mastered states. Units 1–3 and the emergency
// pack are always open; Unit 4 unlocks after Unit 1.

import { useStore } from "../store/StoreContext.jsx";
import { UNITS, signsInUnit } from "../data/signs.js";
import {
  signStatus, isUnitUnlocked, isUnitComplete, isLearned,
} from "../store/progress.js";
import SignTile from "../components/SignTile.jsx";
import { LockIcon } from "../components/icons.jsx";

export default function Learn() {
  const { state } = useStore();

  return (
    <main className="page">
      <div className="dash-head">
        <span className="eyebrow">Curriculum</span>
        <h1>Learn to sign</h1>
        <p style={{ marginTop: 8, maxWidth: "52ch" }}>
          Work through the alphabet, digits and everyday phrases. The emergency
          pack is always open — those signs are never gated.
        </p>
      </div>

      {UNITS.map((unit) => {
        const signs = signsInUnit(unit.id);
        const unlocked = isUnitUnlocked(state, unit.id);
        const done = signs.filter((s) => isLearned(state.signs[s.id])).length;
        const complete = isUnitComplete(state, unit.id);

        return (
          <section key={unit.id} className="unit">
            <div className="unit__head">
              <div className="unit__title">
                <span className="unit__num mono">Unit {unit.id}</span>
                <h2>{unit.title}</h2>
                {unit.emergency && <span className="pill pill--warm">Always open</span>}
                {complete && <span className="pill pill--good">Complete</span>}
              </div>
              <div className="unit__meta">
                {unlocked ? (
                  <span className="mono">{done}/{signs.length}</span>
                ) : (
                  <span className="unit__locked">
                    <LockIcon size={16} /> Finish Unit {unit.requires} to open
                  </span>
                )}
              </div>
            </div>

            {unlocked ? (
              <div className="grid grid-auto tile-grid">
                {signs.map((sign) => (
                  <SignTile
                    key={sign.id}
                    sign={sign}
                    status={signStatus(state, sign)}
                    best={state.signs[sign.id]?.best || 0}
                  />
                ))}
              </div>
            ) : (
              <div className="unit__lockcard">
                <LockIcon size={22} />
                <p>Complete Unit {unit.requires} to unlock these signs.</p>
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
