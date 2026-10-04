import { format, formatDistanceToNowStrict, isToday, isTomorrow } from "date-fns";

export const money = (n: number | null | undefined) =>
  n == null ? "–" : `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;

export const initials = (name: string | null | undefined) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/** "Today, 17:00", "Tomorrow, 09:30", "Thu 8 Oct, 14:00" in the viewer's timezone. */
export function lessonTime(iso: string) {
  const d = new Date(iso);
  const time = format(d, "HH:mm");
  if (isToday(d)) return `Today, ${time}`;
  if (isTomorrow(d)) return `Tomorrow, ${time}`;
  return format(d, "EEE d MMM, HH:mm");
}

export const lessonRange = (start: string, end: string) => `${lessonTime(start)}–${format(new Date(end), "HH:mm")}`;

export const ago = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

export const durationMinutes = (start: string, end: string) =>
  Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
