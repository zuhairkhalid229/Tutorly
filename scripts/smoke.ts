// End-to-end smoke test against a real Supabase project and a running app.
//
//   npm run smoke                                  # against npm run dev
//   BASE_URL=https://your-app.vercel.app npm run smoke
//
// Creates a throwaway student, walks through the main flows as visitor,
// student, demo tutor and attacker, then deletes the student and resets the
// demo data. Reads keys from .env.local.
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_PASSWORD, DEMO_TUTOR_EMAIL, resetDemo } from "../api/_lib/demo.js";
import { buildSlots } from "../src/lib/time.js";

for (const file of [".env.local", ".env"]) if (existsSync(file)) process.loadEnvFile(file);
const BASE = process.env.BASE_URL || "http://localhost:8080";
const URL_ = process.env.VITE_SUPABASE_URL!;
const ANON = process.env.VITE_SUPABASE_ANON_KEY!;
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const client = () => createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });

let failures = 0;
async function step(name: string, fn: () => Promise<string | void>) {
  const t = Date.now();
  try {
    const note = await fn();
    console.log(`  ✓ ${name}${note ? ` — ${note}` : ""} (${Date.now() - t} ms)`);
  } catch (err) {
    failures++;
    console.log(`  ✗ ${name}: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
  }
}
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}
async function api<T>(path: string, body: unknown, token?: string): Promise<{ status: number; data: T }> {
  const res = await fetch(`${BASE}/api/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: (await res.json()) as T };
}
const token = async (c: SupabaseClient) => (await c.auth.getSession()).data.session!.access_token;

const visitor = client();
const student = client();
const tutor = client();
const email = `smoke-${randomUUID().slice(0, 8)}@example.com`;
let studentId = "";
let tutorId = "";
let bookingId = "";

console.log(`Smoke test against ${BASE}\n\nVisitor`);
await step("sees verified tutors only", async () => {
  const { data, error } = await visitor.from("profiles").select("id, role");
  if (error) throw error;
  assert(data.length >= 9 && data.every((p) => p.role === "tutor"), `got ${data.length} rows`);
  return `${data.length} tutors`;
});
await step("can send a contact message but not read them", async () => {
  const ins = await visitor.from("contact_messages").insert({ name: "Smoke", email: "smoke@example.com", topic: "general", message: "smoke test" });
  if (ins.error) throw ins.error;
  const read = await visitor.from("contact_messages").select("id");
  assert(read.error || !read.data?.length, "visitor could read contact messages");
});
await step("AI matching", async () => {
  const r = await api<{ mode: string; matches: { tutor: { full_name: string } }[] }>("match", { query: "help with integration by parts for A-level maths" });
  assert(r.status === 200, `status ${r.status} ${JSON.stringify(r.data)}`);
  assert(r.data.matches.length > 0, "no matches");
  return `${r.data.mode}: ${r.data.matches.map((m) => m.tutor.full_name).join(", ")}`;
});

console.log("\nStudent");
await step("signs up and gets a session straight away", async () => {
  const { data, error } = await student.auth.signUp({ email, password: `Smoke-${randomUUID()}`, options: { data: { name: "Smoke Student", role: "student" } } });
  if (error) throw error;
  assert(data.session, "no session: is 'Confirm email' still on?");
  studentId = data.user!.id;
});
await step("profile created with student role", async () => {
  const { data, error } = await student.from("profiles").select("role, full_name").eq("id", studentId).single();
  if (error) throw error;
  assert(data.role === "student" && data.full_name === "Smoke Student", JSON.stringify(data));
});
await step("can't make themselves verified or admin", async () => {
  const a = await student.from("profiles").update({ is_verified: true } as never).eq("id", studentId);
  const b = await student.from("profiles").update({ role: "admin" } as never).eq("id", studentId);
  assert(a.error && b.error, "privileged update was accepted");
  return a.error!.message;
});
await step("books the demo tutor's next free slot", async () => {
  await tutor.auth.signInWithPassword({ email: DEMO_TUTOR_EMAIL, password: DEMO_PASSWORD });
  tutorId = (await tutor.auth.getUser()).data.user!.id;
  const { data: t } = await student.from("profiles").select("availability, timezone, hourly_rate").eq("id", tutorId).single();
  const busy = await student.rpc("get_tutor_busy_slots", { p_tutor_id: tutorId, p_from: new Date().toISOString(), p_to: new Date(Date.now() + 21 * 864e5).toISOString() });
  if (busy.error) throw busy.error;
  const slots = buildSlots({
    availability: t!.availability, tutorTimeZone: t!.timezone, durationMinutes: 90,
    busy: busy.data.map((b: { start_time: string; end_time: string }) => ({ start: new Date(b.start_time), end: new Date(b.end_time) })),
  });
  assert(slots.length, "no free slots");
  const { data, error } = await student.rpc("request_booking", {
    p_tutor_id: tutorId, p_subject: "Computer Science", p_start: slots[0].start.toISOString(), p_end: slots[0].end.toISOString(), p_notes: "smoke",
  });
  if (error) throw error;
  bookingId = data.id;
  assert(Number(data.price) === Number(t!.hourly_rate) * 1.5, `price ${data.price}`);
  // Same slot again must be rejected by the exclusion constraint.
  const again = await student.rpc("request_booking", {
    p_tutor_id: tutorId, p_subject: "Computer Science", p_start: slots[0].start.toISOString(), p_end: slots[0].end.toISOString(),
  });
  assert(again.error && /just booked/.test(again.error.message), "double booking allowed");
  return `${slots[0].start.toISOString()} for $${data.price}`;
});
await step("can't confirm their own booking", async () => {
  const { error } = await student.rpc("update_booking_status", { p_booking_id: bookingId, p_status: "confirmed" });
  assert(error, "student confirmed");
});
await step("lists bookings with both people attached", async () => {
  const { data, error } = await student
    .from("bookings")
    .select("id, student:profiles!bookings_student_id_fkey(full_name), tutor:profiles!bookings_tutor_id_fkey(full_name)")
    .eq("id", bookingId)
    .single();
  if (error) throw error;
  const d = data as unknown as { student: { full_name: string }; tutor: { full_name: string } };
  assert(d.student?.full_name === "Smoke Student" && d.tutor?.full_name === "Omar Farooq", JSON.stringify(data));
});
await step("messages the tutor", async () => {
  const { error } = await student.from("messages").insert({ sender_id: studentId, receiver_id: tutorId, content: "Hi from the smoke test" });
  if (error) throw error;
});

console.log("\nDemo tutor");
await step("sees the request and the student's profile", async () => {
  const { data, error } = await tutor.from("bookings").select("id, status").eq("id", bookingId).single();
  if (error) throw error;
  assert(data.status === "pending", data.status);
  const p = await tutor.from("profiles").select("full_name").eq("id", studentId).single();
  assert(p.data?.full_name === "Smoke Student", "can't see student");
});
await step("confirms it", async () => {
  const { data, error } = await tutor.rpc("update_booking_status", { p_booking_id: bookingId, p_status: "confirmed" });
  if (error) throw error;
  assert(data.status === "confirmed", data.status);
});
await step("sees the conversation with an unread count", async () => {
  const { data, error } = await tutor.rpc("get_conversations");
  if (error) throw error;
  const c = data.find((x: { other_id: string }) => x.other_id === studentId);
  assert(c && Number(c.unread_count) === 1, JSON.stringify(c));
});
await step("can't read the answer key of their tests", async () => {
  const { error } = await tutor.from("verification_attempts").select("questions");
  assert(error, "questions column readable");
});

let attempt: { attemptId: string; questions: { id: string }[] } | null = null;
await step("starts an AI verification test (Physics)", async () => {
  const r = await api<typeof attempt & { error?: string }>("verification/start", { subject: "Physics" }, await token(tutor));
  assert(r.status === 200, `status ${r.status}: ${r.data?.error}`);
  attempt = r.data;
  assert(!JSON.stringify(r.data).match(/"correct"|explanation/), "answer key leaked to client");
  return `${r.data!.questions.length} questions, no answers in payload`;
});
await step("a student can't start a test", async () => {
  const r = await api<{ error: string }>("verification/start", { subject: "Physics" }, await token(student));
  assert(r.status === 403, `status ${r.status}`);
});
await step("passing the test adds the subject", async () => {
  assert(attempt, "no attempt");
  // Read the key with the service role, the way only the server can.
  const { data } = await admin.from("verification_attempts").select("questions").eq("id", attempt.attemptId).single();
  const answers = Object.fromEntries((data!.questions as { id: string; correct: string }[]).map((q) => [q.id, q.correct]));
  const r = await api<{ score: number; passed: boolean; subjects: string[] }>("verification/submit", { attemptId: attempt.attemptId, answers }, await token(tutor));
  assert(r.status === 200 && r.data.passed && r.data.subjects.includes("Physics"), JSON.stringify(r.data));
  const again = await api("verification/submit", { attemptId: attempt.attemptId, answers }, await token(tutor));
  assert(again.status === 409, "double submit accepted");
  return `${r.data.score}%`;
});

console.log("\nCleanup");
await step("delete the throwaway student and reset demo data", async () => {
  const { error } = await admin.auth.admin.deleteUser(studentId);
  if (error) throw error;
  await admin.from("contact_messages").delete().eq("email", "smoke@example.com");
  await resetDemo(admin);
});

console.log(failures ? `\n${failures} step(s) failed` : "\nAll steps passed");
process.exit(failures ? 1 : 0);
