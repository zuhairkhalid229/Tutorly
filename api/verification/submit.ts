import { TEST_TIME_LIMIT_MINUTES } from "../../shared/subjects.js";
import { HttpError, json, readJson, route } from "../_lib/http.js";
import { adminClient, requireUser } from "../_lib/supabase.js";
import { grade, type StoredQuestion } from "../_lib/verification.js";

// POST /api/verification/submit  { attemptId, answers: { q1: "B", ... } }
// Grades on the server against the stored key. Only a pass here can add a
// subject to a tutor's profile; the browser has no way to do it.
export const POST = route(async (req) => {
  const admin = adminClient();
  const me = await requireUser(req, admin);

  const { attemptId, answers } = await readJson<{ attemptId?: unknown; answers?: unknown }>(req);
  if (typeof attemptId !== "string" || !/^[0-9a-f-]{36}$/i.test(attemptId)) {
    throw new HttpError(400, "Missing test id.");
  }
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    throw new HttpError(400, "Missing answers.");
  }

  const { data: attempt, error } = await admin
    .from("verification_attempts")
    .select("id, subject, questions, created_at, submitted_at")
    .eq("id", attemptId)
    .eq("tutor_id", me.id)
    .maybeSingle();
  if (error) throw error;
  if (!attempt) throw new HttpError(404, "We couldn't find that test.");
  if (attempt.submitted_at) throw new HttpError(409, "This test was already submitted.");

  // Two minutes of grace for slow networks.
  const ageMs = Date.now() - new Date(attempt.created_at).getTime();
  if (ageMs > (TEST_TIME_LIMIT_MINUTES + 2) * 60_000) {
    throw new HttpError(410, `The ${TEST_TIME_LIMIT_MINUTES}-minute time limit has passed. Start a new test.`);
  }

  const result = grade(attempt.questions as StoredQuestion[], answers as Record<string, unknown>);

  // `submitted_at is null` makes a double submit a no-op instead of a second grading.
  const { data: updated, error: updateError } = await admin
    .from("verification_attempts")
    .update({ answers, score: result.score, passed: result.passed, submitted_at: new Date().toISOString() })
    .eq("id", attempt.id)
    .is("submitted_at", null)
    .select("id");
  if (updateError) throw updateError;
  if (!updated?.length) throw new HttpError(409, "This test was already submitted.");

  let subjects = me.subjects;
  if (result.passed && !subjects.includes(attempt.subject)) {
    subjects = [...subjects, attempt.subject];
    const { error: profileError } = await admin
      .from("profiles")
      .update({ subjects, is_verified: true })
      .eq("id", me.id);
    if (profileError) throw profileError;
  }

  return json({ subject: attempt.subject, ...result, subjects });
});
