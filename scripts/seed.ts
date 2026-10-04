// Loads the demo data into a Supabase project and, optionally, creates your admin.
//
//   npm run seed
//
// Reads SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY from
// .env.local. Set ADMIN_EMAIL and ADMIN_PASSWORD there too to get an admin login.
// Safe to run again: it resets the demo data instead of duplicating it.
import { existsSync } from "node:fs";
import { DEMO_PASSWORD, DEMO_STUDENT_EMAIL, DEMO_TUTOR_EMAIL, resetDemo } from "../api/_lib/demo.js";
import { adminClient } from "../api/_lib/supabase.js";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const admin = adminClient();

const result = await resetDemo(admin);
console.log(`Demo data ready: ${result.accounts} accounts, ${result.bookings} bookings.`);

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (ADMIN_EMAIL) {
  const { data: list, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  let user = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if (!user) {
    if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD is required to create the admin account.");
    const created = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD, email_confirm: true, user_metadata: { name: "Admin" },
    });
    if (created.error) throw created.error;
    user = created.data.user;
  }
  const { error: roleError } = await admin.from("profiles").update({ role: "admin" }).eq("id", user.id);
  if (roleError) throw roleError;
  console.log(`Admin ready: ${ADMIN_EMAIL}`);
}

console.log(`\nTry it:\n  student  ${DEMO_STUDENT_EMAIL} / ${DEMO_PASSWORD}\n  tutor    ${DEMO_TUTOR_EMAIL} / ${DEMO_PASSWORD}`);
