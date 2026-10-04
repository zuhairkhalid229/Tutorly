import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "./http.js";

/** Service-role client. Bypasses RLS, so it only ever runs on the server. */
export function adminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new HttpError(500, "The server is missing its Supabase configuration.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export interface CallerProfile {
  id: string;
  role: "student" | "tutor" | "admin";
  full_name: string;
  subjects: string[];
  is_verified: boolean;
  is_demo: boolean;
}

/** Resolves the signed-in user from the request's Supabase access token. */
export async function requireUser(req: Request, admin: SupabaseClient): Promise<CallerProfile> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Please sign in first.");

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Your session has expired. Please sign in again.");

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, full_name, subjects, is_verified, is_demo")
    .eq("id", data.user.id)
    .single();
  if (profileError || !profile) throw new HttpError(403, "We couldn't find your profile.");
  return profile as CallerProfile;
}

/** Counts a hit against a fixed window and throws 429 once the limit is passed. */
export async function rateLimit(
  admin: SupabaseClient,
  bucket: string,
  limit: number,
  windowSeconds: number,
  message: string,
) {
  const { data, error } = await admin.rpc("hit_rate_limit", {
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  if (!data) throw new HttpError(429, message);
}
