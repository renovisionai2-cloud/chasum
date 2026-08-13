import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { groupAppointmentsByBusinessDay } from "@/lib/calendar/planning-geometry";
import { getCalendarViewRange } from "@/lib/calendar/view-range";
import { formatCalendarDateParam } from "@/lib/calendar/date-param";

const root = process.cwd();
const TORONTO = "America/Toronto";

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Phase 6.0B calendar mutation convergence", () => {
  it("URL writers use civil anchor date, not Month grid range.start", () => {
    const src = read("components/calendar/calendar-client.tsx");
    expect(src).toContain("navigateCalendar");
    expect(src).toContain("appointmentOverrides");
    expect(src).toContain("convergeAfterMutation");
    expect(src).toMatch(
      /function navigateCalendar[\s\S]*formatCalendarDateParam\(nextDate/,
    );
    expect(src).not.toMatch(
      /handleViewChange[\s\S]*formatCalendarDateParam\(range\.start/,
    );
    expect(src).not.toMatch(
      /handleDateChange[\s\S]*formatCalendarDateParam\(range\.start/,
    );
  });

  it("calendar page seeds initialDate from civil anchor, not range.start", () => {
    const src = read("app/(dashboard)/dashboard/calendar/page.tsx");
    expect(src).toContain("initialDate={date.toISOString()}");
    expect(src).not.toContain("initialDate={range.start.toISOString()}");
  });

  it("Month grid padding start is prior-month Sunday while civil anchor stays in-month", () => {
    const anchor = new Date("2026-08-12T12:00:00");
    const locale = { timezone: TORONTO, currency: "cad" };
    const month = getCalendarViewRange("month", anchor, locale);
    const week = getCalendarViewRange("week", anchor, locale);
    const day = getCalendarViewRange("day", anchor, locale);

    expect(formatCalendarDateParam(anchor, TORONTO)).toBe("2026-08-12");
    // Month fetch window starts before August 1 (grid padding).
    expect(month.start.getTime()).toBeLessThan(
      new Date("2026-08-01T12:00:00").getTime(),
    );
    expect(formatCalendarDateParam(week.start, TORONTO)).toMatch(/^2026-08-/);
    expect(formatCalendarDateParam(day.start, TORONTO)).toBe("2026-08-12");
  });

  it("create/update/cancel overlay + BookingSheet onSuccess meta are wired", () => {
    const calendar = read("components/calendar/calendar-client.tsx");
    const sheet = read("components/booking-sheet/booking-sheet.tsx");
    expect(calendar).toContain("upsertAppointmentOverride");
    expect(calendar).toContain("convergeAfterMutation(meta?.appointmentId)");
    expect(sheet).toContain("appointmentId?: string | null");
    expect(sheet).toMatch(/onSuccess\(\{\s*appointmentId:/);
  });

  it("create → Day/Week/Month grouping includes active appointment", () => {
    const rows = [
      {
        id: "new-1",
        start_time: "2026-08-16T15:00:00.000Z",
        status: "confirmed",
      },
    ];
    const grouped = groupAppointmentsByBusinessDay(rows, TORONTO);
    const dayKey = [...grouped.keys()][0];
    expect(dayKey).toMatch(/^2026-08-/);
    expect(grouped.get(dayKey)?.map((a) => a.id)).toEqual(["new-1"]);
  });

  it("update date → old civil day empty, new civil day visible", () => {
    const moved = [
      {
        id: "a1",
        start_time: "2026-08-20T15:00:00.000Z",
        status: "confirmed",
      },
    ];
    const grouped = groupAppointmentsByBusinessDay(moved, TORONTO);
    const keys = [...grouped.keys()];
    expect(keys.some((k) => k.startsWith("2026-08-16"))).toBe(false);
    expect(keys.some((k) => k.startsWith("2026-08-2"))).toBe(true);
  });

  it("cancel still excluded from active planning groups", () => {
    const grouped = groupAppointmentsByBusinessDay(
      [
        {
          id: "live",
          start_time: "2026-08-12T15:00:00.000Z",
          status: "confirmed",
        },
        {
          id: "gone",
          start_time: "2026-08-12T16:00:00.000Z",
          status: "cancelled",
        },
      ],
      TORONTO,
    );
    expect((grouped.get("2026-08-12") ?? []).map((a) => a.id)).toEqual([
      "live",
    ]);
  });

  it("DST spring-forward business-day grouping preserved", () => {
    // 2026-03-08 is DST start in America/Toronto.
    const grouped = groupAppointmentsByBusinessDay(
      [
        {
          id: "dst",
          start_time: "2026-03-08T17:00:00.000Z",
          status: "confirmed",
        },
      ],
      TORONTO,
    );
    expect([...grouped.keys()][0]).toBe("2026-03-08");
  });

  it("date + view navigation refreshes server range", () => {
    const src = read("components/calendar/calendar-client.tsx");
    expect(src).toMatch(/function navigateCalendar[\s\S]*refresh\(\)/);
    expect(src).toMatch(/function inspectDay[\s\S]*refresh\(\)/);
  });
});
