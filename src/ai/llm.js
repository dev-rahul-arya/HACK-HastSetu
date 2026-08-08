// LLM client abstraction (PRD §8) — Google Gemini API.
//
// Config comes from .env (VITE_*). If no key is present, `isConfigured()` is
// false and callers must fall back silently (rule-based tips / scripted convo
// lines). Never block the UI on this and never surface an error toast for a
// failed coaching call.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
const BASE_URL =
  import.meta.env.VITE_GEMINI_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta";

export function isConfigured() {
  return Boolean(API_KEY);
}

export function llmModel() {
  return MODEL;
}

/**
 * chat(messages, opts) -> Promise<string>
 *
 * messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>
 * opts: { json?: boolean, timeoutMs?: number, temperature?: number }
 *
 * Throws on network/HTTP error or timeout — callers decide how to fall back.
 */
export async function chat(messages, opts = {}) {
  if (!isConfigured()) {
    throw new Error("LLM not configured (no VITE_GEMINI_API_KEY).");
  }

  const { json = false, timeoutMs = 8000, temperature = 0.7 } = opts;

  // Split out system messages -> Gemini `system_instruction`.
  const systemText = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n")
    .trim();

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body = {
    contents,
    generationConfig: {
      temperature,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (systemText) {
    body.system_instruction = { parts: [{ text: systemText }] };
  }

  const url = `${BASE_URL}/models/${encodeURIComponent(
    MODEL,
  )}:generateContent`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Gemini HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("")
        .trim() || "";
    if (!text) throw new Error("Gemini returned an empty response.");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/** Convenience: parse a JSON object from an LLM reply, tolerant of code fences. */
export function parseJson(text) {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
}
