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

export const DEFAULT_MODEL = "gemini-2.5-flash";

export async function generateJson<T>(opts: {
  system: string;
  prompt: string;
  schema: Schema;
  temperature?: number;
}): Promise<{ data: T; model: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new HttpError(503, "AI features aren't switched on for this deployment yet.");
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: opts.schema,
          temperature: opts.temperature ?? 0.4,
          maxOutputTokens: 8192,
        },
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new HttpError(504, "The AI service took too long to answer. Please try again.");
  }

  if (res.status === 429) {
    throw new HttpError(503, "The AI service is busy right now. Please try again in a minute.");
  }
  if (!res.ok) {
    console.error("Gemini error", res.status, (await res.text()).slice(0, 500));
    throw new HttpError(502, "The AI service returned an error. Please try again.");
  }

  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) {
    console.error("Gemini returned no text", JSON.stringify(body).slice(0, 500));
    throw new HttpError(502, "The AI service returned an empty answer. Please try again.");
  }
  try {
    return { data: JSON.parse(text) as T, model };
  } catch {
    console.error("Gemini returned invalid JSON", text.slice(0, 500));
    throw new HttpError(502, "The AI service returned something we couldn't read. Please try again.");
  }
}
