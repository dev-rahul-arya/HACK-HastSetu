// TipCard (PRD §4.5) — rule-based tips from the sign JSON, plus one warm LLM
// coaching sentence (Gemini). If there's no API key or the call fails/times out,
// we silently show only the rule tips — never an error toast for coaching.

import { useEffect, useState } from "react";
import { chat, isConfigured } from "../ai/llm.js";
import { coachMessages } from "../ai/prompts.js";
import { SparkIcon } from "./icons.jsx";

// Lesson mounts this fresh per attempt (key={attempts}), so initial state is
// correct without resetting inside the effect.
export default function TipCard({ sign, result }) {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(isConfigured());

  const ruleTips = (result.errorCodes || [])
    .map((c) => sign.tips?.[c])
    .filter(Boolean)
    .slice(0, 2);

  useEffect(() => {
    if (!isConfigured()) return;
    let cancelled = false;
    chat(coachMessages(sign, result), { timeoutMs: 4000, temperature: 0.6 })
      .then((text) => {
        if (!cancelled) setCoach(text.trim());
      })
      .catch(() => {
        if (!cancelled) setCoach(null); // silent fallback
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sign, result]);

  if (ruleTips.length === 0 && !loading && !coach) return null;

  return (
    <div className="tips card">
      <span className="eyebrow">Coaching</span>

      {ruleTips.length > 0 && (
        <ul className="tips__rules">
          {ruleTips.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      )}

      {loading && (
        <div className="tips__coach tips__coach--loading" aria-hidden="true">
          <SparkIcon size={16} />
          <span className="tips__shimmer" />
        </div>
      )}

      {!loading && coach && (
        <p className="tips__coach">
          <SparkIcon size={16} />
          <span>{coach}</span>
        </p>
      )}
    </div>
  );
}
