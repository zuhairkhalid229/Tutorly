// Runs the real migration against Postgres (PGlite, in-process) with Supabase's
// roles and auth.uid() stubbed in, then checks the security rules from the
// point of view of each kind of user.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { beforeAll, describe, expect, it } from "vitest";

const SUPABASE_SHIM = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}'
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to public;
`;

type Role = "anon" | "authenticated" | "service_role";
let db: PGlite;

async function as<T = Record<string, unknown>>(
  who: { role: Role; id?: string },
  sql: string,
  params: unknown[] = [],
) {
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [who.id ?? ""]);
  await db.exec(`set role ${who.role}`);
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.exec("reset role");
  }
}

async function signUp(email: string, meta: Record<string, unknown>) {
  const { rows } = await db.query<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
    [email, JSON.stringify(meta)],
  );
  return rows[0].id;
}

const user = (id: string) => ({ role: "authenticated" as const, id });
const anon = { role: "anon" as const };
const inHours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

let tutor: string, unverifiedTutor: string, student: string, otherStudent: string, admin: string, demoTutor: string;

beforeAll(async () => {
  db = new PGlite({ extensions: { btree_gist } });
  await db.exec(SUPABASE_SHIM);
  const dir = join(__dirname, "../../supabase/migrations");
  for (const file of readdirSync(dir).sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }

  tutor = await signUp("t@x.com", { role: "tutor", name: "Ayesha Khan", bio: "Maths teacher" });
  unverifiedTutor = await signUp("u@x.com", { role: "tutor", name: "New Tutor" });
  student = await signUp("s@x.com", { role: "student", name: "Bilal Ahmed" });
  otherStudent = await signUp("o@x.com", { role: "student", name: "Other Student" });
  admin = await signUp("a@x.com", { role: "admin", name: "Wannabe Admin" });
  demoTutor = await signUp("d@x.com", { role: "tutor", name: "Demo Tutor" });

  // What the server does after a passed test, and what an operator does for admins.
  await db.query(
    `update public.profiles set is_verified = true, subjects = '{Mathematics,Physics}', hourly_rate = 30 where id = $1`,
    [tutor],
  );
  await db.query(
    `update public.profiles set is_verified = true, subjects = '{English}', hourly_rate = 20, is_demo = true where id = $1`,
    [demoTutor],
  );
  await db.query(`update public.profiles set role = 'admin' where id = $1`, [admin]);
  await db.query(`update public.profiles set role = 'student' where id = $1`, [admin]);
  await db.query(`update public.profiles set role = 'admin' where id = $1`, [admin]);
});

describe("sign-up", () => {
  it("creates a profile with the requested role and bio", async () => {
    const [p] = await as<{ role: string; full_name: string; about: string }>(
      user(tutor), `select role, full_name, about from public.profiles where id = $1`, [tutor]);
    expect(p).toEqual({ role: "tutor", full_name: "Ayesha Khan", about: "Maths teacher" });
  });

  it("never grants admin from sign-up metadata", async () => {
    const id = await signUp("sneaky@x.com", { role: "admin" });
    const { rows } = await db.query<{ role: string }>(`select role from public.profiles where id = $1`, [id]);
    expect(rows[0].role).toBe("student");
  });
});

describe("profiles", () => {
  it("shows only verified tutors to visitors", async () => {
    const rows = await as<{ id: string }>(anon, `select id from public.profiles`);
    expect(rows.map((r) => r.id).sort()).toEqual([tutor, demoTutor].sort());
  });

  it("hides other students from a signed-in student", async () => {
    const rows = await as(user(student), `select id from public.profiles where id = $1`, [otherStudent]);
    expect(rows).toHaveLength(0);
  });

  it("lets users edit their bio", async () => {
    await as(user(student), `update public.profiles set about = 'Hi' where id = $1`, [student]);
    const { rows } = await db.query<{ about: string }>(`select about from public.profiles where id = $1`, [student]);
    expect(rows[0].about).toBe("Hi");
  });

  it.each([
    ["role", `role = 'admin'`],
    ["is_verified", `is_verified = true`],
    ["subjects", `subjects = '{Chemistry}'`],
    ["rating", `rating = 5`],
  ])("blocks users from setting their own %s", async (_col, set) => {
    await expect(
      as(user(unverifiedTutor), `update public.profiles set ${set} where id = $1`, [unverifiedTutor]),
    ).rejects.toThrow(/permission denied/);
  });

  it("can't edit someone else's profile", async () => {
    await as(user(student), `update public.profiles set about = 'hacked' where id = $1`, [tutor]);
    const { rows } = await db.query<{ about: string }>(`select about from public.profiles where id = $1`, [tutor]);
    expect(rows[0].about).toBe("Maths teacher");
  });

  it("stops the shared demo tutor from being renamed, but allows schedule edits", async () => {
    await expect(
      as(user(demoTutor), `update public.profiles set full_name = 'rude' where id = $1`, [demoTutor]),
    ).rejects.toThrow(/Demo accounts/);
    await as(user(demoTutor), `update public.profiles set hourly_rate = 25 where id = $1`, [demoTutor]);
  });
});

describe("bookings", () => {
  let bookingId: string;

  it("can't be inserted directly", async () => {
    await expect(
      as(user(student), `insert into public.bookings (student_id, tutor_id, subject, start_time, end_time, price)
        values ($1, $2, 'Mathematics', $3, $4, 0)`, [student, tutor, inHours(24), inHours(25)]),
    ).rejects.toThrow(/permission denied/);
  });

  it("are created through request_booking with a server-computed price", async () => {
    const [b] = await as<{ id: string; price: string; status: string }>(
      user(student), `select * from public.request_booking($1, 'Mathematics', $2, $3, 'Integration')`,
      [tutor, inHours(24), inHours(25.5)]);
    expect(b.status).toBe("pending");
    expect(Number(b.price)).toBe(45); // 1.5h × $30
    bookingId = b.id;
  });

  it("rejects an overlapping slot", async () => {
    await expect(
      as(user(otherStudent), `select * from public.request_booking($1, 'Physics', $2, $3)`,
        [tutor, inHours(25), inHours(26)]),
    ).rejects.toThrow(/just booked/);
  });

  it("rejects subjects the tutor isn't verified for, unverified tutors, and tutors booking", async () => {
    await expect(as(user(student), `select * from public.request_booking($1, 'Chemistry', $2, $3)`,
      [tutor, inHours(48), inHours(49)])).rejects.toThrow(/not verified to teach/);
    await expect(as(user(student), `select * from public.request_booking($1, 'Mathematics', $2, $3)`,
      [unverifiedTutor, inHours(48), inHours(49)])).rejects.toThrow(/not taking bookings/);
    await expect(as(user(demoTutor), `select * from public.request_booking($1, 'Mathematics', $2, $3)`,
      [tutor, inHours(48), inHours(49)])).rejects.toThrow(/Only students/);
  });

  it("rejects lessons in the past or too short", async () => {
    await expect(as(user(student), `select * from public.request_booking($1, 'Mathematics', $2, $3)`,
      [tutor, inHours(-2), inHours(-1)])).rejects.toThrow(/at least an hour ahead/);
    await expect(as(user(student), `select * from public.request_booking($1, 'Mathematics', $2, $3)`,
      [tutor, inHours(50), inHours(50.2)])).rejects.toThrow(/between 30 minutes/);
  });

  it("are visible only to the two participants", async () => {
    expect(await as(user(otherStudent), `select id from public.bookings`)).toHaveLength(0);
    expect(await as(user(tutor), `select id from public.bookings`)).toHaveLength(1);
  });

  it("expose busy times without saying who booked", async () => {
    const rows = await as(anon, `select * from public.get_tutor_busy_slots($1, now(), now() + interval '7 days')`, [tutor]);
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0]).sort()).toEqual(["end_time", "start_time"]);
  });

  it("only the tutor confirms", async () => {
    await expect(as(user(student), `select * from public.update_booking_status($1, 'confirmed')`, [bookingId]))
      .rejects.toThrow(/can't be changed/);
    const [b] = await as<{ status: string }>(user(tutor),
      `select * from public.update_booking_status($1, 'confirmed')`, [bookingId]);
    expect(b.status).toBe("confirmed");
  });

  it("can't be completed before the lesson starts", async () => {
    await expect(as(user(tutor), `select * from public.update_booking_status($1, 'completed')`, [bookingId]))
      .rejects.toThrow(/once it has started/);
  });

  it("then gets a review that updates the tutor's rating", async () => {
    await expect(as(user(student), `select * from public.submit_review($1, 5, 'Great')`, [bookingId]))
      .rejects.toThrow(/once your tutor marks it completed/);

    // Fast-forward: the lesson happened.
    await db.query(`update public.bookings set start_time = now() - interval '2 hours',
      end_time = now() - interval '1 hour' where id = $1`, [bookingId]);
    await as(user(tutor), `select * from public.update_booking_status($1, 'completed')`, [bookingId]);

    await expect(as(user(otherStudent), `select * from public.submit_review($1, 1, 'bad')`, [bookingId]))
      .rejects.toThrow(/your own lessons/);
    const [r] = await as<{ reviewer_name: string }>(user(student),
      `select * from public.submit_review($1, 4, 'Very clear')`, [bookingId]);
    expect(r.reviewer_name).toBe("Bilal A.");
    await expect(as(user(student), `select * from public.submit_review($1, 5, 'again')`, [bookingId]))
      .rejects.toThrow(/already reviewed/);

    const [t] = await as<{ rating: string; review_count: number }>(anon,
      `select rating, review_count from public.profiles where id = $1`, [tutor]);
    expect(Number(t.rating)).toBe(4);
    expect(t.review_count).toBe(1);
  });

  it("lets the tutor see the student once they have a booking", async () => {
    expect(await as(user(tutor), `select id from public.profiles where id = $1`, [student])).toHaveLength(1);
  });
});

describe("messages", () => {
  it("students can message verified tutors", async () => {
    await as(user(otherStudent), `insert into public.messages (sender_id, receiver_id, content) values ($1, $2, 'Hi')`,
      [otherStudent, demoTutor]);
  });

  it("can't be sent as someone else", async () => {
    await expect(as(user(otherStudent), `insert into public.messages (sender_id, receiver_id, content) values ($1, $2, 'x')`,
      [tutor, demoTutor])).rejects.toThrow(/row-level security/);
  });

  it("tutors can't cold-message students, but can reply", async () => {
    await expect(as(user(tutor), `insert into public.messages (sender_id, receiver_id, content) values ($1, $2, 'Buy lessons')`,
      [tutor, otherStudent])).rejects.toThrow(/row-level security/);
    await as(user(demoTutor), `insert into public.messages (sender_id, receiver_id, content) values ($1, $2, 'Hello!')`,
      [demoTutor, otherStudent]);
  });

  it("list conversations with unread counts", async () => {
    const [c] = await as<{ other_id: string; full_name: string; unread_count: string; last_message: string }>(
      user(otherStudent), `select * from public.get_conversations()`);
    expect(c.other_id).toBe(demoTutor);
    expect(c.full_name).toBe("Demo Tutor");
    expect(c.last_message).toBe("Hello!");
    expect(Number(c.unread_count)).toBe(1);
  });

  it("only the receiver can mark read, and nothing else can be edited", async () => {
    await as(user(demoTutor), `update public.messages set is_read = true where receiver_id = $1`, [otherStudent]);
    const before = await db.query<{ n: number }>(`select count(*)::int n from public.messages where is_read`);
    expect(before.rows[0].n).toBe(0);
    await as(user(otherStudent), `update public.messages set is_read = true where receiver_id = $1`, [otherStudent]);
    const after = await db.query<{ n: number }>(`select count(*)::int n from public.messages where is_read`);
    expect(after.rows[0].n).toBe(1);
    await expect(as(user(otherStudent), `update public.messages set content = 'edited'`))
      .rejects.toThrow(/permission denied/);
  });

  it("are invisible to third parties", async () => {
    expect(await as(user(student), `select id from public.messages`)).toHaveLength(0);
  });
});

describe("AI verification attempts", () => {
  it("never expose the answer key to the tutor", async () => {
    await db.query(`insert into public.verification_attempts (tutor_id, subject, questions, score, passed, submitted_at)
      values ($1, 'Physics', '[{"correct":"B"}]', 80, true, now())`, [unverifiedTutor]);
    await expect(as(user(unverifiedTutor), `select questions from public.verification_attempts`))
      .rejects.toThrow(/permission denied/);
    const rows = await as<{ score: number }>(user(unverifiedTutor), `select score from public.verification_attempts`);
    expect(rows).toEqual([{ score: 80 }]);
    expect(await as(user(student), `select id from public.verification_attempts`)).toHaveLength(0);
  });

  it("rate limiting is server-only", async () => {
    await expect(as(user(student), `select public.hit_rate_limit('x', 1, 60)`)).rejects.toThrow(/permission denied/);
    const [a] = await as<{ ok: boolean }>({ role: "service_role" }, `select public.hit_rate_limit('k', 1, 60) ok`);
    const [b] = await as<{ ok: boolean }>({ role: "service_role" }, `select public.hit_rate_limit('k', 1, 60) ok`);
    expect([a.ok, b.ok]).toEqual([true, false]);
  });
});

describe("contact messages and admin", () => {
  it("visitors can write but not read contact messages", async () => {
    await as(anon, `insert into public.contact_messages (name, email, message) values ('Sam', 'sam@x.com', 'Hello')`);
    await expect(as(anon, `select * from public.contact_messages`)).rejects.toThrow(/permission denied/);
    expect(await as(user(student), `select id from public.contact_messages`)).toHaveLength(0);
    expect(await as(user(admin), `select id from public.contact_messages`)).toHaveLength(1);
  });

  it("admin stats are admin-only", async () => {
    await expect(as(user(student), `select public.admin_stats()`)).rejects.toThrow(/Admins only/);
    const [{ admin_stats }] = await as<{ admin_stats: Record<string, number> }>(user(admin), `select public.admin_stats()`);
    expect(admin_stats.verified_tutors).toBe(2);
    expect(admin_stats.open_contact_messages).toBe(1);
  });

  it("admins can revoke a tutor's verification", async () => {
    await expect(as(user(student), `select public.admin_set_tutor_verified($1, false)`, [demoTutor]))
      .rejects.toThrow(/Admins only/);
    await as(user(admin), `select public.admin_set_tutor_verified($1, false)`, [demoTutor]);
    expect(await as(anon, `select id from public.profiles where id = $1`, [demoTutor])).toHaveLength(0);
  });
});
