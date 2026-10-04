import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// Demo data: a set of tutors and students, plus two accounts with a public
// password so visitors can try Tutorly from the login page. resetDemo() puts it
// all back the way it was; the daily cron calls it, which also keeps the
// Supabase free-tier project from pausing for inactivity.

export const DEMO_PASSWORD = "TutorlyDemo!2026";
export const DEMO_STUDENT_EMAIL = "demo.student@example.com";
export const DEMO_TUTOR_EMAIL = "demo.tutor@example.com";

type Slots = { start: string; end: string }[];
type Week = Partial<Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", Slots>>;

interface Account {
  key: string;
  email: string;
  name: string;
  role: "student" | "tutor";
  /** Only demo.student and demo.tutor have the public password. */
  publicLogin?: boolean;
  about?: string;
  education?: string;
  subjects?: string[];
  rate?: number;
  timezone?: string;
  availability?: Week;
}

const weekdays = (start: string, end: string): Week =>
  Object.fromEntries(["monday", "tuesday", "wednesday", "thursday", "friday"].map((d) => [d, [{ start, end }]]));

export const ACCOUNTS: Account[] = [
  {
    key: "demoStudent", email: DEMO_STUDENT_EMAIL, name: "Sana Iqbal", role: "student", publicLogin: true,
    about: "A-level student preparing for maths and chemistry exams.", timezone: "Asia/Karachi",
  },
  {
    key: "demoTutor", email: DEMO_TUTOR_EMAIL, name: "Omar Farooq", role: "tutor", publicLogin: true,
    subjects: ["Computer Science", "Mathematics"], rate: 25, timezone: "Asia/Karachi",
    education: "BS Computer Science",
    about: "Software engineer who tutors programming and discrete maths. I teach Python from the first line of code to data structures, and I like students to build something real in every lesson.",
    availability: { ...weekdays("17:00", "21:00"), saturday: [{ start: "10:00", end: "14:00" }] },
  },
  {
    key: "ayesha", email: "ayesha.khan@demo.tutorly", name: "Ayesha Khan", role: "tutor",
    subjects: ["Mathematics", "Physics"], rate: 30, timezone: "Asia/Karachi", education: "MSc Mathematics",
    about: "Eight years teaching O/A-level and IGCSE maths and physics. I break calculus and mechanics into small steps, and every lesson ends with past-paper practice so you know exactly where you stand.",
    availability: { ...weekdays("16:00", "21:00"), sunday: [{ start: "11:00", end: "15:00" }] },
  },
  {
    key: "daniel", email: "daniel.okafor@demo.tutorly", name: "Daniel Okafor", role: "tutor",
    subjects: ["Chemistry", "Biology"], rate: 28, timezone: "Europe/London", education: "MChem, PGCE",
    about: "Former secondary-school chemistry teacher. Organic mechanisms, equilibrium and moles are my favourite topics to untangle. I use diagrams and lots of worked examples.",
    availability: { ...weekdays("15:00", "19:00"), saturday: [{ start: "09:00", end: "13:00" }] },
  },
  {
    key: "maria", email: "maria.gonzalez@demo.tutorly", name: "María González", role: "tutor",
    subjects: ["Spanish", "English"], rate: 22, timezone: "Europe/Madrid", education: "BA Modern Languages",
    about: "Native Spanish speaker and certified English teacher. Conversation-first lessons for beginners through to DELE and IELTS preparation.",
    availability: { ...weekdays("09:00", "14:00") },
  },
  {
    key: "hira", email: "hira.malik@demo.tutorly", name: "Hira Malik", role: "tutor",
    subjects: ["English", "Literature", "Urdu"], rate: 18, timezone: "Asia/Karachi", education: "MA English Literature",
    about: "I help students write essays that make an argument, not just a summary. Literature from Shakespeare to Faiz, plus Urdu for O-levels.",
    availability: { ...weekdays("14:00", "19:00") },
  },
  {
    key: "james", email: "james.whitfield@demo.tutorly", name: "James Whitfield", role: "tutor",
    subjects: ["History", "Geography"], rate: 26, timezone: "America/New_York", education: "MA History",
    about: "History and geography tutor for AP and IB students. We practise turning sources into arguments and essays that score in the top bands.",
    availability: { ...weekdays("16:00", "20:00") },
  },
  {
    key: "priya", email: "priya.nair@demo.tutorly", name: "Priya Nair", role: "tutor",
    subjects: ["Economics", "Business Studies"], rate: 32, timezone: "Asia/Dubai", education: "MSc Economics",
    about: "Economics and business tutor for A-level, IB and first-year university. Diagrams, data-response questions and real case studies.",
    availability: { ...weekdays("18:00", "22:00"), saturday: [{ start: "10:00", end: "16:00" }] },
  },
  {
    key: "lukas", email: "lukas.becker@demo.tutorly", name: "Lukas Becker", role: "tutor",
    subjects: ["Computer Science", "Mathematics"], rate: 40, timezone: "Europe/Berlin", education: "MSc Computer Science",
    about: "University-level algorithms, data structures and linear algebra. Ideal if you are in your first or second year of a CS degree or preparing for coding interviews.",
    availability: { tuesday: [{ start: "18:00", end: "21:00" }], thursday: [{ start: "18:00", end: "21:00" }], saturday: [{ start: "10:00", end: "15:00" }] },
  },
  {
    key: "fatima", email: "fatima.zahra@demo.tutorly", name: "Fatima Zahra", role: "tutor",
    subjects: ["Biology", "Psychology"], rate: 24, timezone: "Africa/Casablanca", education: "BSc Biomedical Science",
    about: "Biology and psychology for GCSE and A-level. Memory techniques for heavy-content topics, and exam answers that use the mark scheme's language.",
    availability: { ...weekdays("17:00", "21:00") },
  },
  { key: "hamza", email: "hamza.raza@demo.tutorly", name: "Hamza Raza", role: "student" },
  { key: "emily", email: "emily.carter@demo.tutorly", name: "Emily Carter", role: "student" },
  { key: "zainab", email: "zainab.ali@demo.tutorly", name: "Zainab Ali", role: "student" },
  { key: "noah", email: "noah.kim@demo.tutorly", name: "Noah Kim", role: "student" },
  { key: "mehak", email: "mehak.shah@demo.tutorly", name: "Mehak Shah", role: "student" },
];

type Ids = Record<string, string>;

async function listAllUsers(admin: SupabaseClient) {
  const users: { id: string; email?: string }[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

/** Creates any missing demo auth users and returns their ids by key. */
async function ensureUsers(admin: SupabaseClient): Promise<Ids> {
  const existing = new Map((await listAllUsers(admin)).map((u) => [u.email?.toLowerCase(), u.id]));
  const ids: Ids = {};
  for (const a of ACCOUNTS) {
    let id = existing.get(a.email);
    if (!id) {
      const { data, error } = await admin.auth.admin.createUser({
        email: a.email,
        // Background accounts get a random password nobody knows.
        password: a.publicLogin ? DEMO_PASSWORD : randomBytes(24).toString("base64url"),
        email_confirm: true,
        user_metadata: { name: a.name, role: a.role },
      });
      if (error) throw error;
      id = data.user.id;
    } else if (a.publicLogin) {
      // Someone may have changed the shared password. Put it back.
      const { error } = await admin.auth.admin.updateUserById(id, { password: DEMO_PASSWORD });
      if (error) throw error;
    }
    ids[a.key] = id;
  }
  return ids;
}

const HOUR = 3600_000;
/** A time `days` from now at `hour`:00 UTC. */
const at = (days: number, hour: number) => {
  const d = new Date(Date.now() + days * 24 * HOUR);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};
const iso = (d: Date) => d.toISOString();
const plusHours = (d: Date, h: number) => new Date(d.getTime() + h * HOUR);

function must<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

export async function resetDemo(admin: SupabaseClient) {
  const ids = await ensureUsers(admin);
  const all = Object.values(ids);
  const list = `(${all.join(",")})`;

  // 1. Wipe everything that involves a demo account. Reviews go with their bookings.
  must(await admin.from("bookings").delete().or(`student_id.in.${list},tutor_id.in.${list}`));
  must(await admin.from("messages").delete().or(`sender_id.in.${list},receiver_id.in.${list}`));
  must(await admin.from("verification_attempts").delete().in("tutor_id", all));

  // 2. Restore profiles.
  for (const a of ACCOUNTS) {
    must(await admin.from("profiles").update({
      role: a.role,
      full_name: a.name,
      about: a.about ?? null,
      education: a.education ?? null,
      subjects: a.subjects ?? [],
      is_verified: a.role === "tutor",
      hourly_rate: a.rate ?? null,
      availability: a.availability ?? {},
      timezone: a.timezone ?? "UTC",
      profile_image: null,
      is_demo: true,
    }).eq("id", ids[a.key]));
  }

  // 3. Lesson history. Past completed lessons carry the reviews that give tutors their ratings.
  type B = { key: string; student: string; tutor: string; subject: string; start: Date; hours?: number; status: string; notes?: string; rate: number };
  const rate = Object.fromEntries(ACCOUNTS.map((a) => [a.key, a.rate ?? 0]));
  const b = (key: string, student: string, tutor: string, subject: string, start: Date, status: string, notes?: string, hours = 1): B =>
    ({ key, student, tutor, subject, start, hours, status, notes, rate: rate[tutor] });

  const bookings: B[] = [
    // Sana (demo student)
    b("sanaUpcoming", "demoStudent", "ayesha", "Mathematics", at(2, 13), "confirmed", "Integration by parts and the past paper from May."),
    b("sanaPending", "demoStudent", "daniel", "Chemistry", at(4, 16), "pending", "Organic reaction mechanisms, I keep mixing up SN1 and SN2."),
    b("sanaToReview", "demoStudent", "demoTutor", "Computer Science", at(-3, 14), "completed", "Python lists and loops."),
    b("sanaReviewed", "demoStudent", "hira", "English", at(-10, 11), "completed", "Essay structure."),
    // Omar (demo tutor)
    b("omarPending", "hamza", "demoTutor", "Mathematics", at(3, 14), "pending", "Discrete maths: proof by induction."),
    b("omarConfirmed", "zainab", "demoTutor", "Computer Science", at(1, 15), "confirmed", "Recursion and binary search."),
    b("omarPast", "noah", "demoTutor", "Computer Science", at(-6, 13), "completed"),
    // Reviews for the other tutors
    b("r1", "hamza", "ayesha", "Mathematics", at(-20, 12), "completed"),
    b("r2", "emily", "ayesha", "Physics", at(-14, 12), "completed"),
    b("r3", "mehak", "ayesha", "Mathematics", at(-7, 12), "completed"),
    b("r4", "emily", "daniel", "Chemistry", at(-18, 16), "completed"),
    b("r5", "zainab", "daniel", "Biology", at(-9, 16), "completed"),
    b("r6", "noah", "maria", "Spanish", at(-12, 9), "completed"),
    b("r7", "emily", "maria", "English", at(-5, 9), "completed"),
    b("r8", "mehak", "hira", "Literature", at(-16, 10), "completed"),
    b("r9", "noah", "james", "History", at(-11, 20), "completed"),
    b("r10", "zainab", "priya", "Economics", at(-15, 15), "completed"),
    b("r11", "hamza", "priya", "Business Studies", at(-8, 15), "completed"),
    b("r12", "noah", "lukas", "Computer Science", at(-13, 17), "completed"),
    b("r13", "hamza", "lukas", "Mathematics", at(-4, 17), "completed"),
    b("r14", "mehak", "fatima", "Biology", at(-17, 18), "completed"),
    b("r15", "zainab", "fatima", "Psychology", at(-6, 18), "completed"),
  ];

  const inserted = must(await admin.from("bookings").insert(bookings.map((x) => ({
    student_id: ids[x.student],
    tutor_id: ids[x.tutor],
    subject: x.subject,
    start_time: iso(x.start),
    end_time: iso(plusHours(x.start, x.hours ?? 1)),
    status: x.status,
    notes: x.notes ?? null,
    price: x.rate * (x.hours ?? 1),
  }))).select("id"));
  const bookingId = Object.fromEntries(bookings.map((x, i) => [x.key, inserted[i].id]));

  const shortName = (key: string) => {
    const [first, last] = ACCOUNTS.find((a) => a.key === key)!.name.split(" ");
    return last ? `${first} ${last[0]}.` : first;
  };
  const review = (key: string, rating: number, comment: string) => {
    const x = bookings.find((y) => y.key === key)!;
    return { booking_id: bookingId[key], tutor_id: ids[x.tutor], student_id: ids[x.student],
      reviewer_name: shortName(x.student), rating, comment };
  };
  must(await admin.from("reviews").insert([
    review("sanaReviewed", 5, "Hira showed me how to plan an essay in five minutes. My last essay got my best mark this year."),
    review("omarPast", 5, "Explained recursion with a drawing that finally made it click."),
    review("r1", 5, "Super patient. Calculus finally makes sense."),
    review("r2", 4, "Good at mechanics, lessons sometimes ran a few minutes over."),
    review("r3", 5, "The past-paper practice at the end of each lesson is gold."),
    review("r4", 5, "Organic chemistry went from my worst topic to my best."),
    review("r5", 4, "Clear explanations and helpful diagrams."),
    review("r6", 5, "I can finally hold a conversation in Spanish."),
    review("r7", 4, "Useful IELTS speaking practice."),
    review("r8", 5, "Helped me understand Macbeth beyond the summary."),
    review("r9", 4, "Great at source analysis."),
    review("r10", 5, "Data-response questions are now my strongest section."),
    review("r11", 4, "Real case studies made it interesting."),
    review("r12", 5, "Exactly what I needed before my algorithms exam."),
    review("r13", 5, "Linear algebra explained with intuition, not just formulas."),
    review("r14", 5, "Memory techniques that actually work."),
    review("r15", 4, "Good structure for long-answer questions."),
  ]));

  // 4. Conversations.
  const msg = (from: string, to: string, content: string, hoursAgo: number, isRead = true) => ({
    sender_id: ids[from], receiver_id: ids[to], content, is_read: isRead,
    created_at: new Date(Date.now() - hoursAgo * HOUR).toISOString(),
  });
  must(await admin.from("messages").insert([
    msg("demoStudent", "ayesha", "Hi Ayesha! Could we focus on integration by parts in our next lesson?", 30),
    msg("ayesha", "demoStudent", "Of course. Bring the May past paper and we'll go through question 7 together.", 29),
    msg("demoStudent", "ayesha", "Perfect, thank you!", 28),
    msg("demoStudent", "demoTutor", "Thanks for the lesson on lists, the exercises were really useful.", 70),
    msg("demoTutor", "demoStudent", "Glad it helped! Next time we can try dictionaries. Try the practice set I shared first.", 5, false),
    msg("hamza", "demoTutor", "Hi Omar, I sent a booking request for induction proofs. Is Thursday OK for you?", 3, false),
    msg("zainab", "demoTutor", "See you tomorrow! I'll bring my binary search code.", 20),
    msg("demoTutor", "zainab", "Great, see you then.", 19),
  ]));

  return { accounts: all.length, bookings: inserted.length };
}
