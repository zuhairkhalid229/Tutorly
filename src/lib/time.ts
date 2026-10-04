// Tutors publish weekly availability in their own timezone ("Mondays 17:00-21:00,
// Asia/Karachi"). Students book in theirs. These helpers turn the weekly pattern
// into real instants without a timezone library.

export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export interface TimeRange {
  start: string; // "HH:MM", 24-hour
  end: string;
}
export type Availability = Partial<Record<Weekday, TimeRange[]>>;
export interface Slot {
  start: Date;
  end: Date;
}

/** Minutes `tz` is ahead of UTC at the given instant. */
export function tzOffsetMinutes(at: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60_000);
}

/** The instant at which a wall clock in `tz` shows the given date and time. */
export function zonedTime(year: number, month: number, day: number, hour: number, minute: number, tz: string): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = tzOffsetMinutes(new Date(guess), tz);
  let t = guess - first * 60_000;
  // Near a DST change the offset at the guess and at the answer can differ.
  const second = tzOffsetMinutes(new Date(t), tz);
  if (second !== first) t = guess - second * 60_000;
  return new Date(t);
}

/** Calendar date of an instant as seen in `tz`. */
export function zonedDate(at: Date, tz: string) {
  const offset = tzOffsetMinutes(at, tz);
  const shifted = new Date(at.getTime() + offset * 60_000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

/**
 * Start times a student can book: inside the tutor's weekly availability,
 * at least `leadMinutes` from now, and not overlapping existing bookings.
 */
export function buildSlots(opts: {
  availability: Availability;
  tutorTimeZone: string;
  durationMinutes: number;
  busy: Slot[];
  now?: Date;
  days?: number;
  stepMinutes?: number;
  leadMinutes?: number;
}): Slot[] {
  const { availability, durationMinutes, busy, now = new Date(), days = 14, stepMinutes = 30, leadMinutes = 120 } = opts;
  const tz = isValidTimeZone(opts.tutorTimeZone) ? opts.tutorTimeZone : "UTC";
  const earliest = now.getTime() + leadMinutes * 60_000;
  const today = zonedDate(now, tz);
  const seen = new Set<number>();
  const slots: Slot[] = [];

  for (let i = 0; i < days; i++) {
    // Noon UTC avoids rolling over to a neighbouring date while we read y/m/d back.
    const day = new Date(Date.UTC(today.year, today.month - 1, today.day + i, 12));
    const weekday = WEEKDAYS[(day.getUTCDay() + 6) % 7];
    for (const range of availability[weekday] ?? []) {
      const from = toMinutes(range.start);
      const to = toMinutes(range.end);
      for (let t = from; t + durationMinutes <= to; t += stepMinutes) {
        const start = zonedTime(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), Math.floor(t / 60), t % 60, tz);
        const end = new Date(start.getTime() + durationMinutes * 60_000);
        if (start.getTime() < earliest || seen.has(start.getTime())) continue;
        if (busy.some((b) => start < b.end && b.start < end)) continue;
        seen.add(start.getTime());
        slots.push({ start, end });
      }
    }
  }
  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** "Mon, Wed, Fri" style summary of the days a tutor teaches. */
export function teachingDays(availability: Availability | null | undefined) {
  return WEEKDAYS.filter((d) => availability?.[d]?.length).map((d) => d.slice(0, 3).replace(/^./, (c) => c.toUpperCase()));
}
