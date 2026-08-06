import { describe, expect, it } from "vitest";
import {
  calendarDateInTimezone,
  endOfBusinessDay,
  endOfBusinessMonth,
  endOfBusinessWeek,
  startOfBusinessDay,
  startOfBusinessMonth,
  startOfBusinessWeek,
} from "@/lib/business/datetime";
import { getCalendarViewRange } from "@/lib/calendar/view-range";

const TORONTO = { timezone: "America/Toronto", currency: "CAD" };

describe("business calendar view ranges", () => {
  it("uses business-TZ day bounds for day views", () => {
    const mid = new Date("2026-08-05T16:00:00.000Z");
    const range = getCalendarViewRange("day", mid, TORONTO);
    expect(range.start.toISOString()).toBe(
      startOfBusinessDay(mid, TORONTO).toISOString(),
    );
    expect(range.end.toISOString()).toBe(
      endOfBusinessDay(mid, TORONTO).toISOString(),
    );
  });

  it("uses business-TZ week bounds for week and agenda", () => {
    const mid = new Date("2026-08-05T16:00:00.000Z"); // Wed in Toronto
    const week = getCalendarViewRange("week", mid, TORONTO);
    const agenda = getCalendarViewRange("agenda", mid, TORONTO);
    expect(week.start.toISOString()).toBe(
      startOfBusinessWeek(mid, TORONTO).toISOString(),
    );
    expect(week.end.toISOString()).toBe(
      endOfBusinessWeek(mid, TORONTO).toISOString(),
    );
    expect(agenda.start.toISOString()).toBe(week.start.toISOString());
    expect(agenda.end.toISOString()).toBe(week.end.toISOString());
    // Sunday start → Saturday end in America/Toronto
    expect(calendarDateInTimezone(week.start, TORONTO.timezone)).toBe(
      "2026-08-02",
    );
    expect(calendarDateInTimezone(week.end, TORONTO.timezone)).toBe(
      "2026-08-08",
    );
  });

  it("uses business-TZ month bounds for month view", () => {
    const mid = new Date("2026-08-15T16:00:00.000Z");
    const range = getCalendarViewRange("month", mid, TORONTO);
    expect(range.start.toISOString()).toBe(
      startOfBusinessMonth(mid, TORONTO).toISOString(),
    );
    expect(range.end.toISOString()).toBe(
      endOfBusinessMonth(mid, TORONTO).toISOString(),
    );
    expect(calendarDateInTimezone(range.start, TORONTO.timezone)).toBe(
      "2026-08-01",
    );
    expect(calendarDateInTimezone(range.end, TORONTO.timezone)).toBe(
      "2026-08-31",
    );
  });

  it("keeps a near-midnight appointment inside the business day", () => {
    // 2026-08-05 23:30 America/Toronto = 2026-08-06 03:30Z (EDT)
    const lateLocal = new Date("2026-08-06T03:30:00.000Z");
    const day = getCalendarViewRange("day", lateLocal, TORONTO);
    expect(lateLocal.getTime()).toBeGreaterThanOrEqual(day.start.getTime());
    expect(lateLocal.getTime()).toBeLessThanOrEqual(day.end.getTime());
    expect(calendarDateInTimezone(lateLocal, TORONTO.timezone)).toBe(
      "2026-08-05",
    );
  });
});
