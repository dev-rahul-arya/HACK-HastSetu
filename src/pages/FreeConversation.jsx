// Free talk (open-ended converse). No scene graph: the learner picks any sign,
// makes it, and the AI keeps a friendly conversation going on any topic. Gemini
// drives replies when a key is set; otherwise scripted fallback lines keep it
// alive. Same capture flow and accessibility as scenario conversations.

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import { useAwardToasts } from "../components/Toast.jsx";
import { SIGNS, getSign } from "../data/signs.js";
import { chat, isConfigured } from "../ai/llm.js";
import { freeConverseMessages, FREE_FALLBACKS } from "../ai/prompts.js";
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
    /* speech unsupported */
  }
}

const GREETING = "Hi! I'm happy to chat about anything. Pick a word below and sign it to begin.";

export default function FreeConversation() {
  const navigate = useNavigate();
  const { recordAttempt } = useStore();
  const award = useAwardToasts();

  const trackerRef = useRef(null);
  const transcriptRef = useRef(null);
  const voiceRef = useRef(false);

  const [messages, setMessages] = useState(() => [{ id: ++msgId, role: "ai", text: GREETING }]);
  const [topic, setTopic] = useState("");
  const [selectedId, setSelectedId] = useState("hello");
  const [status, setStatus] = useState("user"); // user | ai
  const [phase, setPhase] = useState("loading");
  const [voiceOn, setVoiceOn] = useState(false);

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

  const respond = useCallback((lastAttempt) => {
    setStatus("ai");
    const settle = (text) => {
      if (voiceRef.current) speak(text);
      setStatus("user");
    };

    if (isConfigured()) {
      const thinkingId = pushMessage({ role: "ai", thinking: true });
      const history = messages.filter((m) => !m.thinking).map((m) => ({ role: m.role, text: m.text }));
      const fallback = FREE_FALLBACKS[Math.floor(Math.random() * FREE_FALLBACKS.length)];
      chat(freeConverseMessages(topic, history, lastAttempt), { timeoutMs: 6000 })
        .then((text) => {
          const line = text?.trim() || fallback;
          replaceMessage(thinkingId, { thinking: false, text: line });
          settle(line);
        })
        .catch(() => {
          replaceMessage(thinkingId, { thinking: false, text: fallback });
          settle(fallback);
        });
    } else {
      const line = FREE_FALLBACKS[Math.floor(Math.random() * FREE_FALLBACKS.length)];
      pushMessage({ role: "ai", text: line });
      settle(line);
    }
  }, [messages, topic, pushMessage, replaceMessage]);

  const onResult = useCallback((r) => {
    const sign = getSign(selectedId);
    award(recordAttempt({ signId: sign.id, score: r.score }));
    pushMessage({ role: "user", text: `You signed ${sign.label.toUpperCase()} · ${r.score}%` });
    respond({ label: sign.label, score: r.score });
  }, [selectedId, recordAttempt, award, pushMessage, respond]);

  const doCapture = useCallback(() => trackerRef.current?.capture(), []);

  const toggleVoice = () => {
    setVoiceOn((v) => {
      const next = !v;
      voiceRef.current = next;
      if (!next) window.speechSynthesis?.cancel();
      return next;
    });
  };

  const selected = getSign(selectedId);
  const busy = phase === "countdown" || phase === "capturing";

  return (
    <main className="page conv">
      <div className="conv__bar">
        <button className="btn btn--quiet btn--sm" onClick={() => navigate("/converse")}>
          ← Scenarios
        </button>
        <div className="lesson__title">
          <span className="eyebrow">Free talk</span>
          <h1>Chat with AI</h1>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={toggleVoice} aria-pressed={voiceOn}>
          {voiceOn ? "AI voice: on" : "AI voice: off"}
        </button>
      </div>

      <div className="field free-topic">
        <label htmlFor="topic">Topic (optional)</label>
        <input id="topic" className="input" placeholder="e.g. food, family, your day"
          value={topic} onChange={(e) => setTopic(e.target.value)} />
      </div>

      <div className="conv__grid">
        <section className="conv__thread card" ref={transcriptRef} aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className={`bubble bubble--${m.role}`}>
              {m.thinking ? <span className="bubble__typing"><i /><i /><i /></span> : m.text}
            </div>
          ))}
        </section>

        <section className="conv__cam">
          <div className="field">
            <label htmlFor="signpick">Word to sign</label>
            <select id="signpick" className="input" value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}>
              {SIGNS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="conv__turn">
            <span className="eyebrow">
              {status === "ai" ? "…they're responding" : "Sign this word"}
            </span>
            <div className="conv__turn-sign mono">{selected.label}</div>
          </div>

          <TrackerMount ref={trackerRef} sign={selected}
            onResult={onResult} onPhaseChange={setPhase} />

          <button className="btn btn--primary btn--lg" onClick={doCapture}
            disabled={status !== "user" || busy || phase === "unavailable"}>
            <PlayIcon size={20} /> Sign it
          </button>
        </section>
      </div>
    </main>
  );
}
