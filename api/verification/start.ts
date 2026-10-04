import { randomUUID } from "node:crypto";
import { isSubject, PASS_MARK, TEST_TIME_LIMIT_MINUTES } from "../../shared/subjects.js";
import { generateJson } from "../_lib/gemini.js";
import { clientIp, HttpError, json, readJson, route } from "../_lib/http.js";
import { adminClient, rateLimit, requireUser } from "../_lib/supabase.js";
import {
  answerCheckPrompt,
  answerCheckSchema,
  answerCheckSystemPrompt,
  finalizeQuestions,
  generationPrompt,
  generationSchema,
  generationSystemPrompt,
  keepAgreed,
  MIN_USABLE_QUESTIONS,
  toPublic,
  validQuestions,
} from "../_lib/verification.js";

// POST /api/verification/start  { subject }
// Generates a fresh test, checks its answer key, stores it, and returns the
// questions without answers.
export const POST = route(async (req) => {
  const admin = adminClient();
  const me = await requireUser(req, admin);
  if (me.role !== "tutor") throw new HttpError(403, "Only tutors take verification tests.");

  const { subject } = await readJson<{ subject?: unknown }>(req);
  if (!isSubject(subject)) throw new HttpError(400, "Pick a subject from the list.");
  if (me.subjects.includes(subject)) throw new HttpError(409, `You're already verified to teach ${subject}.`);

  // Keyed by user and IP so visitors sharing the demo tutor don't use up each other's tries.
  await rateLimit(admin, `verify:${me.id}:${clientIp(req)}`, 5, 86_400,
    "You've started 5 tests today. Take a break and try again tomorrow.");
  await rateLimit(admin, "verify:global", 300, 86_400,
    "Tutorly has reached today's limit for AI tests. Please try again tomorrow.");

  const generated = await generateJson({
    system: generationSystemPrompt,
    prompt: generationPrompt(subject, randomUUID().slice(0, 8)),
    schema: generationSchema,
    temperature: 0.9,
  });
  const candidates = validQuestions(generated.data);
  if (candidates.length < MIN_USABLE_QUESTIONS) {
    console.warn(`Only ${candidates.length} valid questions generated for ${subject}`);
    throw new HttpError(502, "We couldn't build a reliable test this time. Please try again.");
  }

  // A second, blind pass answers every question. Questions where it disagrees
  // with the key are probably ambiguous or wrong, so they're dropped instead
  // of failing a tutor over the model's mistake.
  const check = await generateJson({
    system: answerCheckSystemPrompt,
    prompt: answerCheckPrompt(subject, candidates),
    schema: answerCheckSchema,
    temperature: 0,
  });
  const agreed = keepAgreed(candidates, check.data);
  console.info(`verification ${subject}: ${candidates.length} generated, ${agreed.length} agreed`);
  if (agreed.length < MIN_USABLE_QUESTIONS) {
    throw new HttpError(502, "We couldn't build a reliable test this time. Please try again.");
  }

  const questions = finalizeQuestions(agreed);
  const { data: attempt, error } = await admin
    .from("verification_attempts")
    .insert({ tutor_id: me.id, subject, questions, model: generated.model })
    .select("id, created_at")
    .single();
  if (error) throw error;

  return json({
    attemptId: attempt.id,
    subject,
    questions: toPublic(questions),
    startedAt: attempt.created_at,
    timeLimitMinutes: TEST_TIME_LIMIT_MINUTES,
    passMark: PASS_MARK,
  });
});
