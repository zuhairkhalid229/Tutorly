import { resetDemo } from "../_lib/demo.js";
import { HttpError, json, route } from "../_lib/http.js";
import { adminClient } from "../_lib/supabase.js";

// Runs daily from vercel.json. Vercel sends `Authorization: Bearer $CRON_SECRET`.
export const GET = route(async (req) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    throw new HttpError(401, "Unauthorized");
  }
  const result = await resetDemo(adminClient());
  return json({ ok: true, ...result, at: new Date().toISOString() });
});
