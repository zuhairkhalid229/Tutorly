import { supabase } from "@/lib/supabase";
import type { Booking, BookingStatus, Profile } from "@/types/database";

type Person = Pick<Profile, "id" | "full_name" | "profile_image">;
export type BookingWithPeople = Booking & { student: Person | null; tutor: Person | null; reviewed: boolean };

/** All bookings the signed-in user takes part in, with both people attached. */
export async function myBookings(): Promise<BookingWithPeople[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `*, student:profiles!bookings_student_id_fkey(id, full_name, profile_image),
          tutor:profiles!bookings_tutor_id_fkey(id, full_name, profile_image)`,
    )
    .order("start_time", { ascending: true });
  if (error) throw error;

  const ids = (data ?? []).filter((b) => b.status === "completed").map((b) => b.id);
  const { data: reviews, error: reviewError } = ids.length
    ? await supabase.from("reviews").select("booking_id").in("booking_id", ids)
    : { data: [], error: null };
  if (reviewError) throw reviewError;
  const reviewed = new Set((reviews ?? []).map((r) => r.booking_id));

  return (data ?? []).map((b) => ({ ...(b as unknown as BookingWithPeople), reviewed: reviewed.has(b.id) }));
}

export async function getBooking(id: string): Promise<BookingWithPeople | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `*, student:profiles!bookings_student_id_fkey(id, full_name, profile_image),
          tutor:profiles!bookings_tutor_id_fkey(id, full_name, profile_image)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? ({ ...(data as unknown as BookingWithPeople), reviewed: false }) : null;
}

export async function requestBooking(input: {
  tutorId: string;
  subject: string;
  start: Date;
  end: Date;
  notes?: string;
}) {
  const { data, error } = await supabase.rpc("request_booking", {
    p_tutor_id: input.tutorId,
    p_subject: input.subject,
    p_start: input.start.toISOString(),
    p_end: input.end.toISOString(),
    p_notes: input.notes || null,
  });
  if (error) throw error;
  return data;
}

export async function setBookingStatus(id: string, status: BookingStatus) {
  const { data, error } = await supabase.rpc("update_booking_status", { p_booking_id: id, p_status: status });
  if (error) throw error;
  return data;
}

export async function submitReview(bookingId: string, rating: number, comment: string) {
  const { data, error } = await supabase.rpc("submit_review", {
    p_booking_id: bookingId,
    p_rating: rating,
    p_comment: comment || null,
  });
  if (error) throw error;
  return data;
}

/** Splits bookings into the groups the dashboards show. */
export function groupBookings(bookings: BookingWithPeople[], now = new Date()) {
  const started = (b: Booking) => new Date(b.start_time) <= now;
  const ended = (b: Booking) => new Date(b.end_time) <= now;
  return {
    requests: bookings.filter((b) => b.status === "pending" && !started(b)),
    upcoming: bookings.filter((b) => b.status === "confirmed" && !ended(b)),
    // Confirmed lessons that have finished but nobody marked completed yet.
    awaitingCompletion: bookings.filter((b) => b.status === "confirmed" && ended(b)),
    past: bookings
      .filter((b) => b.status === "completed" || b.status === "cancelled" || b.status === "declined" || (b.status === "pending" && started(b)))
      .sort((a, b) => b.start_time.localeCompare(a.start_time)),
  };
}

/** A lesson room opens 15 minutes before the start and stays open until the end. */
export function isJoinable(b: Booking, now = new Date()) {
  return (
    b.status === "confirmed" &&
    new Date(b.start_time).getTime() - 15 * 60_000 <= now.getTime() &&
    now < new Date(b.end_time)
  );
}
