import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** False until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. The UI shows a setup notice. */
export const isSupabaseConfigured = Boolean(url && anonKey);

// The anon key is public by design. Row-level security in the database decides
// what each user can read and write.
export const supabase = createClient<Database>(
  url || "https://not-configured.supabase.co",
  anonKey || "not-configured",
  { auth: { persistSession: true, autoRefreshToken: true } },
);

/** Turns a Supabase/Postgres error into a sentence a user can read. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  const message = typeof error === "object" && error && "message" in error ? String(error.message) : String(error);
  if (/Failed to fetch|NetworkError/i.test(message)) return "We couldn't reach the server. Check your connection and try again.";
  if (/JWT expired/i.test(message)) return "Your session expired. Please sign in again.";
  return message || fallback;
}
