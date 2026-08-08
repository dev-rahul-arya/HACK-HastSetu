// Prompt builders for the LLM (PRD §8). Kept separate from the client so the
// personas and phrasing are easy to tweak.

/** Two worst joints from an AttemptResult, as readable names. */
export function worstJoints(result, n = 2) {
  return Object.entries(result.jointErrors || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k.replace(/^r_/, "second-hand ").replace(/_/g, " "));
}

/**
 * Coach tip messages: one warm, specific sentence (≤ 25 words) about how to fix
 * the sign. The model gets the sign's own formation notes so advice stays true
 * to ISL.
 */
export function coachMessages(sign, result) {
  const system =
    "You are a warm, encouraging Indian Sign Language coach. " +
    "Given a learner's attempt at one sign, reply with EXACTLY ONE sentence of " +
    "at most 25 words: specific, kind, and actionable. Name the fix, not the " +
    "score. No greetings, no emojis, no lists.";

  const brief = {
    sign: sign.label,
    twoHanded: sign.twoHanded,
    howToForm: sign.steps,
    commonMistakes: sign.mistakes,
    attempt: {
      score: result.score,
      errorCodes: result.errorCodes,
      worstJoints: worstJoints(result),
    },
  };

  return [
    { role: "system", content: system },
    {
      role: "user",
      content:
        "Coach this attempt. Respond with one sentence only.\n" +
        JSON.stringify(brief),
    },
  ];
}

/**
 * Conversation partner messages (used in Stage 5). Scenario brief + beat list +
 * running history; the model plays the other person and reacts to sign quality.
 */
export function converseMessages(scenario, beat, history, lastAttempt) {
  const system =
    `You are role-playing a person in this scenario: "${scenario.title}". ` +
    `${scenario.brief || ""} ` +
    "Respond in 1–2 short, simple English sentences. React naturally to the " +
    "learner's most recent sign and its quality (praise a clean one, gently " +
    "re-prompt a weak one). Never break character, never mention scores or JSON.";

  const context = {
    expectedSigns: beat?.expect || [],
    lastAttempt: lastAttempt
      ? { sign: lastAttempt.label, score: lastAttempt.score }
      : null,
  };

  return [
    { role: "system", content: system },
    ...history.map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.text,
    })),
    { role: "user", content: `[context] ${JSON.stringify(context)}` },
  ];
}
