import { describe, expect, it } from "vitest";
import { buildSlots, teachingDays, tzOffsetMinutes, zonedTime } from "../../src/lib/time";

describe("zonedTime", () => {
  it("converts a Karachi wall-clock time (UTC+5, no DST)", () => {
    expect(zonedTime(2026, 10, 6, 17, 0, "Asia/Karachi").toISOString()).toBe("2026-10-06T12:00:00.000Z");
  });

  it("respects daylight saving in New York", () => {
    expect(zonedTime(2026, 7, 1, 9, 0, "America/New_York").toISOString()).toBe("2026-07-01T13:00:00.000Z");
    expect(zonedTime(2026, 12, 1, 9, 0, "America/New_York").toISOString()).toBe("2026-12-01T14:00:00.000Z");
  });

  it("handles the day London's clocks go back", () => {
    // 25 Oct 2026: BST ends at 02:00. 12:00 that day is GMT.
    expect(zonedTime(2026, 10, 25, 12, 0, "Europe/London").toISOString()).toBe("2026-10-25T12:00:00.000Z");
    expect(tzOffsetMinutes(new Date("2026-10-24T12:00:00Z"), "Europe/London")).toBe(60);
  });
});

describe("buildSlots", () => {
  // Monday 5 Oct 2026, 08:00 UTC = 13:00 in Karachi.
  const now = new Date("2026-10-05T08:00:00Z");
  const availability = { monday: [{ start: "17:00", end: "19:00" }], wednesday: [{ start: "10:00", end: "11:00" }] };

  it("fills the tutor's windows in 30-minute steps, in their timezone", () => {
    const slots = buildSlots({ availability, tutorTimeZone: "Asia/Karachi", durationMinutes: 60, busy: [], now, days: 3 });
    expect(slots.map((s) => s.start.toISOString())).toEqual([
      "2026-10-05T12:00:00.000Z", // Mon 17:00 PKT
      "2026-10-05T12:30:00.000Z",
      "2026-10-05T13:00:00.000Z", // Mon 18:00, ends exactly at 19:00
      "2026-10-07T05:00:00.000Z", // Wed 10:00 PKT
    ]);
  });

  it("skips slots that clash with existing bookings", () => {
    const busy = [{ start: new Date("2026-10-05T12:30:00Z"), end: new Date("2026-10-05T13:30:00Z") }];
    const slots = buildSlots({ availability, tutorTimeZone: "Asia/Karachi", durationMinutes: 60, busy, now, days: 1 });
    expect(slots).toEqual([]);
  });

  it("keeps a lead time before the first bookable slot", () => {
    const late = new Date("2026-10-05T11:00:00Z"); // 16:00 PKT; 17:00 is only an hour away
    const slots = buildSlots({ availability, tutorTimeZone: "Asia/Karachi", durationMinutes: 60, busy: [], now: late, days: 1 });
    expect(slots.map((s) => s.start.toISOString())).toEqual(["2026-10-05T13:00:00.000Z"]);
  });

  it("falls back to UTC for a broken timezone", () => {
    const slots = buildSlots({ availability, tutorTimeZone: "Not/AZone", durationMinutes: 120, busy: [], now, days: 1 });
    expect(slots.map((s) => s.start.toISOString())).toEqual(["2026-10-05T17:00:00.000Z"]);
  });
});

describe("teachingDays", () => {
  it("lists days in week order", () => {
    expect(teachingDays({ friday: [{ start: "1", end: "2" }], monday: [{ start: "1", end: "2" }], sunday: [] })).toEqual(["Mon", "Fri"]);
  });
});
