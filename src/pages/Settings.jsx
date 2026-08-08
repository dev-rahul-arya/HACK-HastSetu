// Settings (PRD §5). Camera/simulation preference, AI voice default, LLM status
// (configured via .env now), account, and reset data. No secrets are entered
// here — the Gemini key lives in .env.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import { isConfigured, llmModel } from "../ai/llm.js";
import Modal from "../components/Modal.jsx";
import { CheckIcon } from "../components/icons.jsx";

function Toggle({ id, checked, onChange, label, desc }) {
  return (
    <div className="set-row">
      <div className="set-row__text">
        <label htmlFor={id} className="set-row__label">{label}</label>
        <p className="set-row__desc">{desc}</p>
      </div>
      <button id={id} type="button" role="switch" aria-checked={checked}
        className={"switch" + (checked ? " is-on" : "")}
        onClick={() => onChange(!checked)}>
        <span className="switch__dot" />
      </button>
    </div>
  );
}

export default function Settings() {
  const { session, displayName, state, updateSettings, resetAll, logout } = useStore();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);
  const s = state.settings;

  return (
    <main className="page">
      <div className="dash-head">
        <span className="eyebrow">Preferences</span>
        <h1>Settings</h1>
      </div>

      <section className="card card--pad set-section">
        <h2 className="set-section__title">Practice</h2>
        <Toggle id="sim" checked={s.simulationOn}
          onChange={(v) => updateSettings({ simulationOn: v })}
          label="Simulation mode"
          desc="Stand in a simulated hand for the camera so you can practise without hardware. Turn off to see the reserved camera slot." />
      </section>

      <section className="card card--pad set-section">
        <h2 className="set-section__title">Accessibility</h2>
        <Toggle id="voice" checked={s.voiceOn}
          onChange={(v) => updateSettings({ voiceOn: v })}
          label="Speak AI replies aloud"
          desc="Read conversation replies with your browser's voice. Captions are always shown regardless." />
      </section>

      <section className="card card--pad set-section">
        <h2 className="set-section__title">AI features</h2>
        <div className="set-row">
          <div className="set-row__text">
            <span className="set-row__label">Coaching &amp; conversations</span>
            <p className="set-row__desc">
              Powered by Google Gemini. The key is read from <code>.env</code>{" "}
              (<code>VITE_GEMINI_API_KEY</code>). For this demo the API is called
              from the browser; production would proxy it server-side.
            </p>
          </div>
          {isConfigured() ? (
            <span className="pill pill--good"><CheckIcon size={14} /> {llmModel()}</span>
          ) : (
            <span className="pill">Not configured</span>
          )}
        </div>
        {!isConfigured() && (
          <p className="set-note">
            Everything still works without a key — tips fall back to written
            guidance and conversations use scripted lines.
          </p>
        )}
      </section>

      <section className="card card--pad set-section">
        <h2 className="set-section__title">Account</h2>
        <div className="set-row">
          <div className="set-row__text">
            <span className="set-row__label">Signed in as {displayName}</span>
            <p className="set-row__desc mono">@{session.username}</p>
          </div>
          <button className="btn btn--ghost btn--sm"
            onClick={() => { logout(); navigate("/"); }}>
            Log out
          </button>
        </div>
      </section>

      <section className="card card--pad set-section set-section--danger">
        <h2 className="set-section__title">Data</h2>
        <div className="set-row">
          <div className="set-row__text">
            <span className="set-row__label">Reset progress</span>
            <p className="set-row__desc">
              Clear this account's XP, streak, learned signs and badges on this
              device. This can't be undone.
            </p>
          </div>
          <button className="btn btn--ghost btn--sm set-danger"
            onClick={() => setConfirmReset(true)}>
            Reset data
          </button>
        </div>
      </section>

      {confirmReset && (
        <Modal title="Reset all progress?" onClose={() => setConfirmReset(false)}
          actions={
            <>
              <button className="btn btn--ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button className="btn btn--primary set-danger-btn"
                onClick={() => { resetAll(); setConfirmReset(false); navigate("/dashboard"); }}>
                Reset everything
              </button>
            </>
          }>
          <p>
            This wipes {displayName}'s XP, streak, learned signs, review schedule
            and badges on this device. Other accounts are unaffected.
          </p>
        </Modal>
      )}
    </main>
  );
}
