import { describe, expect, it } from "vitest";
import {
  calendarDateInTimezone,
  getAppointmentPositionInTimezone,
  getCurrentTimePositionInTimezone,
  isSameBusinessCalendarDay,
  minutesOfDayInTimezone,
  wallTimeOnBusinessDay,
  formatTimeInTimezone,
  initialScrollMinutes,
  assignOverlapLayout,
} from "@/lib/calendar/day-geometry";
import { formatCalendarDateParam } from "@/lib/calendar/date-param";
import { appointmentStatusTone } from "@/lib/calendar/appointment-status-ui";
import { dayOfWeekInTimezone } from "@/lib/business/datetime";

const TORONTO = "America/Toronto";

describe("day geometry — business timezone", () => {
  it("positions appointments using business wall clock, not browser local", () => {
    // 2026-08-05 10:00–11:00 America/Toronto = 14:00–15:00Z (EDT)
    const start = "2026-08-05T14:00:00.000Z";
    const end = "2026-08-05T15:00:00.000Z";
    const pos = getAppointmentPositionInTimezone(start, end, TORONTO);
    // Grid starts 7:00 → 10:00 is 3h into 14h window → 3/14 ≈ 21.43%
    expect(pos.top).toBeCloseTo((3 / 14) * 100, 5);
    expect(pos.height).toBeCloseTo((1 / 14) * 100, 5);
  });

  it("current-time indicator only for Today in business TZ", () => {
    const todayAnchor = new Date("2026-08-05T16:00:00.000Z"); // Wed afternoon Toronto
    const now = new Date("2026-08-05T18:30:00.000Z"); // 14:30 Toronto
    const otherDay = new Date("2026-08-06T16:00:00.000Z");

    expect(
      getCurrentTimePositionInTimezone(todayAnchor, TORONTO, now),
    ).not.toBeNull();
    expect(
      getCurrentTimePositionInTimezone(otherDay, TORONTO, now),
    ).toBeNull();
  });

  it("returns null when now is outside visible grid hours", () => {
    const day = new Date("2026-08-05T16:00:00.000Z");
    // 05:00 Toronto = 09:00Z EDT
    const early = new Date("2026-08-05T09:00:00.000Z");
    expect(
      getCurrentTimePositionInTimezone(day, TORONTO, early),
    ).toBeNull();
  });

  it("wallTimeOnBusinessDay builds UTC from business civil clock", () => {
    const day = new Date("2026-08-05T16:00:00.000Z");
    const slot = wallTimeOnBusinessDay(day, 9, 30, TORONTO);
    expect(calendarDateInTimezone(slot, TORONTO)).toBe("2026-08-05");
    expect(minutesOfDayInTimezone(slot, TORONTO)).toBe(9 * 60 + 30);
  });

  it("isSameBusinessCalendarDay compares civil dates in zone", () => {
    const late = new Date("2026-08-06T03:30:00.000Z"); // still Aug 5 Toronto
    const day = new Date("2026-08-05T16:00:00.000Z");
    expect(isSameBusinessCalendarDay(late, day, TORONTO)).toBe(true);
    expect(isSameBusinessCalendarDay(late, day, "UTC")).toBe(false);
  });

  it("formatCalendarDateParam uses business TZ when provided", () => {
    const rangeStart = new Date("2026-08-05T04:00:00.000Z"); // midnight EDT
    expect(formatCalendarDateParam(rangeStart, TORONTO)).toBe("2026-08-05");
  });

  it("formats times in business timezone", () => {
    const label = formatTimeInTimezone("2026-08-05T14:00:00.000Z", TORONTO);
    expect(label).toMatch(/10:00/);
  });

  it("initial scroll prefers now on Today, else open or 9am", () => {
    const day = new Date("2026-08-05T16:00:00.000Z");
    const now = new Date("2026-08-05T18:30:00.000Z"); // 14:30 Toronto
    expect(initialScrollMinutes(day, TORONTO, { now })).toBe(14 * 60 + 30);

    const other = new Date("2026-08-06T16:00:00.000Z");
    expect(
      initialScrollMinutes(other, TORONTO, { now, openMinutes: 8 * 60 }),
    ).toBe(8 * 60);
    expect(initialScrollMinutes(other, TORONTO, { now })).toBe(9 * 60);
  });

  it("dayOfWeekInTimezone uses business civil weekday", () => {
    // Wed Aug 5 Toronto
    expect(dayOfWeekInTimezone("2026-08-05T16:00:00.000Z", TORONTO)).toBe(3);
  });
});

describe("overlap layout", () => {
  it("packs overlapping appointments into deterministic columns", () => {
    const layout = assignOverlapLayout([
      {
        id: "a",
        start_time: "2026-08-05T14:00:00.000Z",
        end_time: "2026-08-05T15:00:00.000Z",
      },
      {
        id: "b",
        start_time: "2026-08-05T14:30:00.000Z",
        end_time: "2026-08-05T15:30:00.000Z",
      },
      {
        id: "c",
        start_time: "2026-08-05T16:00:00.000Z",
        end_time: "2026-08-05T17:00:00.000Z",
      },
    ]);
    expect(layout.get("a")?.columns).toBe(2);
    expect(layout.get("b")?.columns).toBe(2);
    expect(layout.get("a")?.column).not.toBe(layout.get("b")?.column);
    expect(layout.get("c")?.columns).toBe(1);
  });
});

describe("appointment status UI", () => {
  it("maps real statuses only", () => {
    expect(appointmentStatusTone("confirmed").label).toBe("Booked");
    expect(appointmentStatusTone("in_progress").attention).toBe("action");
    expect(appointmentStatusTone("no_show").attention).toBe("risk");
    expect(appointmentStatusTone("completed").attention).toBe("done");
  });
});
