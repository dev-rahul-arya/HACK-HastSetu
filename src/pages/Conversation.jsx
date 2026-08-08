// Conversation screen (PRD §4.4). Chat transcript (left) + TrackerMount (right).
// Turn loop: AI line → "your turn: sign X" → capture → your bubble ("You signed
// THANK YOU · 84%") → AI reacts (Gemini, or scripted fallback) and advances the
// scene graph. Speech is opt-in; captions are always on.

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import { useAwardToasts } from "../components/Toast.jsx";
import { getScenario } from "../data/scenarios.js";
import { getSign } from "../data/signs.js";
import { scoreBand } from "../store/progress.js";
import { chat, isConfigured } from "../ai/llm.js";
import { converseMessages } from "../ai/prompts.js";
import TrackerMount from "../components/TrackerMount.jsx";
import { PlayIcon } from "../components/icons.jsx";

let msgId = 0;

function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* speech unsupported — captions still show */
  }
}

export default function Conversation() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const scenario = getScenario(scenarioId);
  const { recordAttempt, completeScenario } = useStore();
  const award = useAwardToasts();

  const trackerRef = useRef(null);
  const transcriptRef = useRef(null);
  const allScoresRef = useRef([]);
  const beatAttemptsRef = useRef([]);
  const voiceRef = useRef(false);

  const [messages, setMessages] = useState(() =>
    scenario ? [{ id: ++msgId, role: "ai", text: scenario.beats[0].ai }] : [],
  );
  const [beatIndex, setBeatIndex] = useState(0);
  const [expectIdx, setExpectIdx] = useState(0);
  const [status, setStatus] = useState("user"); // user | ai | done
  const [phase, setPhase] = useState("loading");
  const [voiceOn, setVoiceOn] = useState(false);
  const [recap, setRecap] = useState(null); // { avg, count } — set at finish

  // Auto-scroll transcript to the newest message.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const pushMessage = useCallback((msg) => {
    const id = ++msgId;
    setMessages((m) => [...m, { id, ...msg }]);
    return id;
  }, []);

  const replaceMessage = useCallback((id, patch) => {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  const finish = useCallback(() => {
    const scores = allScoresRef.current;
    const avg = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const summary = completeScenario(scenario.id, avg);
    award(summary);
    setRecap({ avg, count: scores.length });
    setStatus("done");
  }, [completeScenario, scenario, award]);

  const advanceAI = useCallback((nextIndex, lastAttempt) => {
    const beat = scenario.beats[nextIndex];
    const scripted = beat.ai;
    setStatus("ai");

    const settle = (text) => {
      if (voiceRef.current) speak(text);
      setBeatIndex(nextIndex);
      setExpectIdx(0);
      beatAttemptsRef.current = [];
      setStatus("user");
    };

    if (isConfigured()) {
      const thinkingId = pushMessage({ role: "ai", thinking: true });
      const history = messages
        .filter((m) => !m.thinking)
        .map((m) => ({ role: m.role, text: m.text }));
      chat(converseMessages(scenario, beat, history, lastAttempt), { timeoutMs: 6000 })
        .then((text) => {
          const line = text?.trim() || scripted;
          replaceMessage(thinkingId, { thinking: false, text: line });
          settle(line);
        })
        .catch(() => {
          replaceMessage(thinkingId, { thinking: false, text: scripted });
          settle(scripted);
        });
    } else {
      pushMessage({ role: "ai", text: scripted });
      settle(scripted);
    }
  }, [scenario, messages, pushMessage, replaceMessage]);

  const onResult = useCallback((r) => {
    const beat = scenario.beats[beatIndex];
    const sign = getSign(beat.expect[expectIdx]);
    award(recordAttempt({ signId: sign.id, score: r.score }));
    allScoresRef.current = [...allScoresRef.current, r.score];
    beatAttemptsRef.current = [...beatAttemptsRef.current, { label: sign.label, score: r.score }];

    if (expectIdx + 1 < beat.expect.length) {
      setExpectIdx((n) => n + 1);
      return;
    }

    // Beat complete → your bubble, then the AI reacts / advances.
    const atts = beatAttemptsRef.current;
    const avg = Math.round(atts.reduce((a, b) => a + b.score, 0) / atts.length);
    const labels = atts.map((a) => a.label.toUpperCase()).join(", ");
    pushMessage({ role: "user", text: `You signed ${labels} · ${avg}%` });

    const nextIndex = beatIndex + 1;
    if (nextIndex >= scenario.beats.length) finish();
    else advanceAI(nextIndex, { label: sign.label, score: r.score });
  }, [scenario, beatIndex, expectIdx, recordAttempt, award, pushMessage, advanceAI, finish]);

  const doCapture = useCallback(() => trackerRef.current?.capture(), []);

  const toggleVoice = () => {
    setVoiceOn((v) => {
      const next = !v;
      voiceRef.current = next;
      if (!next) window.speechSynthesis?.cancel();
      return next;
    });
  };

  const replay = () => {
    allScoresRef.current = [];
    beatAttemptsRef.current = [];
    setMessages([{ id: ++msgId, role: "ai", text: scenario.beats[0].ai }]);
    setBeatIndex(0);
    setExpectIdx(0);
    setStatus("user");
  };

  if (!scenario) {
    return (
      <main className="page">
        <div className="empty">
          <p>That scenario doesn't exist.</p>
          <button className="btn btn--primary" onClick={() => navigate("/converse")}>
            Back to scenarios
          </button>
        </div>
      </main>
    );
  }

  const beat = scenario.beats[beatIndex];
  const expectedSign = status === "user" ? getSign(beat.expect[expectIdx]) : null;
  const busy = phase === "countdown" || phase === "capturing";
  const doneBand = recap ? scoreBand(recap.avg) : null;

  return (
    <main className="page conv">
      <div className="conv__bar">
        <button className="btn btn--quiet btn--sm" onClick={() => navigate("/converse")}>
          ← Scenarios
        </button>
        <div className="lesson__title">
          <span className="eyebrow">Scenario</span>
          <h1>{scenario.title}</h1>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={toggleVoice} aria-pressed={voiceOn}>
          {voiceOn ? "AI voice: on" : "AI voice: off"}
        </button>
      </div>

      <div className="conv__grid">
        <section className="conv__thread card" ref={transcriptRef} aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className={`bubble bubble--${m.role}`}>
              {m.thinking ? (
                <span className="bubble__typing"><i /><i /><i /></span>
              ) : (
                m.text
              )}
            </div>
          ))}
        </section>

        <section className="conv__cam">
          {status === "done" ? (
            <div className="summary card card--pad">
              <span className="eyebrow">Scenario complete</span>
              <div className="summary__stats">
                <div className="summary__stat">
                  <span className={`summary__big mono dial__band--${doneBand.tone}`}>{recap.avg}%</span>
                  <span className="summary__lbl">Avg score</span>
                </div>
                <div className="summary__stat">
                  <span className="summary__big mono">{recap.count}</span>
                  <span className="summary__lbl">Signs used</span>
                </div>
                <div className="summary__stat">
                  <span className="summary__big mono">+50</span>
                  <span className="summary__lbl">XP</span>
                </div>
              </div>
              <div className="summary__actions">
                <button className="btn btn--ghost" onClick={replay}>Replay</button>
                <Link to="/converse" className="btn btn--primary">Next scenario</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="conv__turn">
                {status === "ai" ? (
                  <span className="eyebrow">…they're responding</span>
                ) : (
                  <>
                    <span className="eyebrow">Your turn — sign this</span>
                    <div className="conv__turn-sign mono">{expectedSign?.label}</div>
                    {beat.expect.length > 1 && (
                      <span className="pill">{expectIdx + 1} of {beat.expect.length}</span>
                    )}
                  </>
                )}
              </div>

              <TrackerMount ref={trackerRef} sign={expectedSign || getSign(beat.expect[0])}
                onResult={onResult} onPhaseChange={setPhase} />

              <button className="btn btn--primary btn--lg" onClick={doCapture}
                disabled={status !== "user" || busy || phase === "unavailable"}>
                <PlayIcon size={20} /> Sign it
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
