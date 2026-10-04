import { HttpError } from "./http.js";

// Gemini's structured output: we pass a JSON schema and get JSON back, so there
// is no "find the first { in the text" parsing.
type SchemaType = "OBJECT" | "ARRAY" | "STRING" | "INTEGER" | "NUMBER" | "BOOLEAN";
export interface Schema {
  type: SchemaType;
  description?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  enum?: string[];
  nullable?: boolean;
  minItems?: number;
  maxItems?: number;
}

// Google retires model versions (2.5 Flash closed to new keys in 2026), so default
// to the rolling aliases and fall back to the lighter model when the main one is
// overloaded or gone. Override either with env vars.
export const DEFAULT_MODEL = "gemini-flash-latest";
export const DEFAULT_FALLBACK_MODEL = "gemini-flash-lite-latest";

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One model, one try. Returns the response, or a reason we should move on. */
async function call(model: string, key: string, body: string, timeoutMs: number) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) return { res };
    const detail = (await res.text()).slice(0, 300);
    console.warn(`Gemini ${model} returned ${res.status}: ${detail}`);
    return { status: res.status };
  } catch {
    console.warn(`Gemini ${model} timed out`);
    return { status: 504 };
  }
}

export async function generateJson<T>(opts: {
  system: string;
  prompt: string;
  schema: Schema;
  temperature?: number;
}): Promise<{ data: T; model: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new HttpError(503, "AI features aren't switched on for this deployment yet.");
  const models = [...new Set([process.env.GEMINI_MODEL || DEFAULT_MODEL, process.env.GEMINI_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL])];
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: opts.schema,
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: 8192,
    },
  });

  // Main model twice (with a short backoff), then the fallback twice.
  let lastStatus = 0;
  let res: Response | undefined;
  let model = models[0];
  outer: for (const m of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await call(m, key, body, 40_000);
      if (result.res) {
        res = result.res;
        model = m;
        break outer;
      }
      lastStatus = result.status;
      if (!RETRYABLE.has(result.status)) break; // e.g. 404 retired model: go straight to the fallback
      if (attempt === 0) await sleep(800 + Math.random() * 700);
    }
  }

  if (!res) {
    if (lastStatus === 429 || lastStatus === 503) {
      throw new HttpError(503, "The AI service is busy right now. Please try again in a minute.");
    }
    if (lastStatus === 504) throw new HttpError(504, "The AI service took too long to answer. Please try again.");
    throw new HttpError(502, "The AI service returned an error. Please try again.");
  }

  const payload = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) {
    console.error("Gemini returned no text", JSON.stringify(payload).slice(0, 500));
    throw new HttpError(502, "The AI service returned an empty answer. Please try again.");
  }
  try {
    return { data: JSON.parse(text) as T, model };
  } catch {
    console.error("Gemini returned invalid JSON", text.slice(0, 500));
    throw new HttpError(502, "The AI service returned something we couldn't read. Please try again.");
  }
}
