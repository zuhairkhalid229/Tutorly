import { callApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Profile, Review } from "@/types/database";

export type TutorSummary = Pick<
  Profile,
  "id" | "full_name" | "profile_image" | "about" | "education" | "subjects" | "rating" | "review_count" | "hourly_rate" | "is_demo"
>;
export type TutorDetail = TutorSummary & Pick<Profile, "availability" | "timezone" | "created_at">;

const SUMMARY = "id, full_name, profile_image, about, education, subjects, rating, review_count, hourly_rate, is_demo";
const DETAIL = `${SUMMARY}, availability, timezone, created_at`;

export async function listTutors(): Promise<TutorSummary[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(SUMMARY)
    .eq("role", "tutor")
    .eq("is_verified", true)
    .order("rating", { ascending: false, nullsFirst: false })
    .order("review_count", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TutorSummary[];
}

export async function getTutor(id: string): Promise<TutorDetail | null> {
  const { data, error } = await supabase.from("profiles").select(DETAIL).eq("id", id).eq("role", "tutor").maybeSingle();
  if (error) throw error;
  return data as TutorDetail | null;
}

export async function getTutorReviews(tutorId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

export async function getBusySlots(tutorId: string, from: Date, to: Date) {
  const { data, error } = await supabase.rpc("get_tutor_busy_slots", {
    p_tutor_id: tutorId,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) throw error;
  return (data ?? []).map((b) => ({ start: new Date(b.start_time), end: new Date(b.end_time) }));
}

export interface MatchResult {
  mode: "ai" | "keyword";
  subject: string | null;
  summary: string | null;
  matches: { reason: string; tutor: TutorSummary }[];
}

export const findTutorMatches = (query: string) => callApi<MatchResult>("match", { query });
