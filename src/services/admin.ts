import { supabase } from "@/lib/supabase";
import type { AdminStats, ContactMessage, Profile, VerificationAttempt } from "@/types/database";

export async function getAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc("admin_stats");
  if (error) throw error;
  return data as AdminStats;
}

export async function listAllTutors(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "tutor")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function recentAttempts(): Promise<(VerificationAttempt & { tutor: Pick<Profile, "full_name"> | null })[]> {
  const { data, error } = await supabase
    .from("verification_attempts")
    .select("id, tutor_id, subject, score, passed, model, created_at, submitted_at")
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(15);
  if (error) throw error;
  const attempts = (data ?? []) as VerificationAttempt[];
  const ids = [...new Set(attempts.map((a) => a.tutor_id))];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] as Pick<Profile, "id" | "full_name">[] };
  const names = new Map((people ?? []).map((p) => [p.id, p]));
  return attempts.map((a) => ({ ...a, tutor: names.get(a.tutor_id) ?? null }));
}

export async function setTutorVerified(tutorId: string, verified: boolean) {
  const { error } = await supabase.rpc("admin_set_tutor_verified", { p_tutor_id: tutorId, p_verified: verified });
  if (error) throw error;
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function markContactHandled(id: string, handled: boolean) {
  const { error } = await supabase.from("contact_messages").update({ handled }).eq("id", id);
  if (error) throw error;
}

export async function sendContactMessage(input: { name: string; email: string; topic: string; message: string }) {
  const { error } = await supabase.from("contact_messages").insert(input);
  if (error) throw error;
}
