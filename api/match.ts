import { generateJson } from "./_lib/gemini.js";
import { clientIp, HttpError, json, readJson, route } from "./_lib/http.js";
import {
  cleanMatches,
  keywordMatches,
  matchPrompt,
  matchSchema,
  matchSystemPrompt,
  type Match,
  type TutorRow,
} from "./_lib/matching.js";
import { adminClient, rateLimit } from "./_lib/supabase.js";

const TUTOR_COLUMNS =
  "id, full_name, profile_image, about, education, subjects, rating, review_count, hourly_rate, availability, timezone, is_demo";

// POST /api/match  { query: "I need help with integration for my A-levels" }
// Open to visitors, so it is rate limited per IP and globally.
export const POST = route(async (req) => {
  const { query } = await readJson<{ query?: unknown }>(req);
  const text = typeof query === "string" ? query.trim() : "";
  if (text.length < 8) throw new HttpError(400, "Tell us a bit more about what you need help with.");
  if (text.length > 600) throw new HttpError(400, "Please keep it under 600 characters.");

  const admin = adminClient();
  await rateLimit(admin, `match:${clientIp(req)}`, 20, 3600,
    "You've run a lot of searches. Please wait a few minutes and try again.");

  const { data, error } = await admin
    .from("profiles")
    .select(TUTOR_COLUMNS)
    .eq("role", "tutor")
    .eq("is_verified", true)
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(80);
  if (error) throw error;
  const tutors = (data ?? []) as TutorRow[];
  const byId = new Map(tutors.map((t) => [t.id, t]));

  let mode: "ai" | "keyword" = "ai";
  let subject: string | null = null;
  let summary: string | null = null;
  let matches: Match[] = [];

  const withinBudget = await rateLimit(admin, "match:global", 1000, 86_400, "")
    .then(() => true)
    .catch(() => false);

  if (tutors.length && withinBudget) {
    try {
      const ai = await generateJson<{ subject: string; summary: string; matches: unknown[] }>({
        system: matchSystemPrompt,
        prompt: matchPrompt(text, tutors),
        schema: matchSchema(tutors.map((t) => t.id)),
        temperature: 0.2,
      });
      subject = ai.data.subject === "Unclear" ? null : ai.data.subject;
      summary = typeof ai.data.summary === "string" ? ai.data.summary.slice(0, 120) : null;
      matches = cleanMatches(ai.data, new Set(byId.keys()));
    } catch (err) {
      // The AI being down shouldn't break search. Fall back to keywords.
      console.warn("AI match failed, using keyword fallback:", err instanceof Error ? err.message : err);
      mode = "keyword";
    }
  } else {
    mode = "keyword";
  }

  if (mode === "keyword") {
    const fallback = keywordMatches(text, tutors);
    subject = fallback.subject;
    matches = fallback.matches;
  }

  return json({
    mode,
    subject,
    summary,
    matches: matches.map((m) => {
      const { availability: _a, timezone: _tz, ...tutor } = byId.get(m.tutor_id)!;
      return { reason: m.reason, tutor };
    }),
  });
});
