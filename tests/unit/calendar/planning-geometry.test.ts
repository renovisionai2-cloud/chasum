import { describe, expect, it } from "vitest";
import { calendarDateInTimezone } from "@/lib/business/datetime";
import {
  addCivilDays,
  businessMonthGridCivilDates,
  businessWeekCivilDates,
  civilDateToAnchor,
  groupAppointmentsByBusinessDay,
  isBusinessToday,
  shiftBusinessCivilDate,
  shiftBusinessMonth,
  weekdayIndexFromCivil,
} from "@/lib/calendar/planning-geometry";
import {
  MONTH_VISIBLE_LIMIT,
  WEEK_VISIBLE_LIMIT,
  planningOverflow,
  truthfulAppointmentCountLabel,
} from "@/lib/calendar/planning-density";

const TORONTO = "America/Toronto";

describe("Week/Month planning geometry — business timezone", () => {
  it("builds Sunday–Saturday week bounds in business TZ", () => {
    const wed = new Date("2026-08-05T16:00:00.000Z");
    const days = businessWeekCivilDates(wed, TORONTO);
    expect(days).toEqual([
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
      "2026-08-06",
      "2026-08-07",
      "2026-08-08",
    ]);
    expect(weekdayIndexFromCivil(days[0]!)).toBe(0);
    expect(weekdayIndexFromCivil(days[6]!)).toBe(6);
  });

  it("keeps seven civil days across Toronto spring DST", () => {
    // 2026-03-08 02:00 America/Toronto springs forward.
    const sunday = new Date("2026-03-08T16:00:00.000Z");
    const days = businessWeekCivilDates(sunday, TORONTO);
    expect(days).toHaveLength(7);
    expect(new Set(days).size).toBe(7);
    expect(days[0]).toBe("2026-03-08");
    expect(days[6]).toBe("2026-03-14");
  });

  it("treats Today as the business civil date, independent of selected date", () => {
    const now = new Date("2026-08-05T16:00:00.000Z");
    expect(isBusinessToday("2026-08-05", TORONTO, now)).toBe(true);
    expect(isBusinessToday("2026-08-04", TORONTO, now)).toBe(false);
    const selected = "2026-08-12";
    expect(selected === calendarDateInTimezone(now, TORONTO)).toBe(false);
  });

  it("groups a midnight-edge appointment onto the business civil day", () => {
    // 2026-08-05 23:30 America/Toronto = 2026-08-06 03:30Z
    const grouped = groupAppointmentsByBusinessDay(
      [
        {
          start_time: "2026-08-06T03:30:00.000Z",
          status: "confirmed",
        },
        {
          start_time: "2026-08-06T03:30:00.000Z",
          status: "cancelled",
        },
      ],
      TORONTO,
    );
    expect(grouped.get("2026-08-05")).toHaveLength(1);
    expect(grouped.get("2026-08-06")).toBeUndefined();
  });

  it("places August 2026 weekday cells with outside-month padding", () => {
    const mid = new Date("2026-08-15T16:00:00.000Z");
    const grid = businessMonthGridCivilDates(mid, TORONTO);
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-07-26");
    expect(grid[6]).toBe("2026-08-01");
    expect(grid[41]).toBe("2026-09-05");
    expect(grid.includes("2026-08-11")).toBe(true);
  });

  it("shifts week/month navigation on civil dates, not browser-local addWeeks", () => {
    const wed = civilDateToAnchor("2026-08-05", TORONTO);
    const nextWeek = shiftBusinessCivilDate(wed, TORONTO, 7);
    expect(calendarDateInTimezone(nextWeek, TORONTO)).toBe("2026-08-12");
    const nextMonth = shiftBusinessMonth(wed, TORONTO, 1);
    expect(calendarDateInTimezone(nextMonth, TORONTO)).toBe("2026-09-05");
  });

  it("addCivilDays is DST-safe", () => {
    expect(addCivilDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addCivilDays("2026-03-08", 1)).toBe("2026-03-09");
  });
});

describe("Week/Month planning density", () => {
  it("keeps unassigned appointments visible when grouping", () => {
    const grouped = groupAppointmentsByBusinessDay(
      [
        {
          start_time: "2026-08-05T15:00:00.000Z",
          status: "confirmed",
          staff_id: null,
        },
      ],
      TORONTO,
    );
    expect(grouped.get("2026-08-05")).toHaveLength(1);
  });

  it("reports truthful overflow without inventing capacity", () => {
    const week = planningOverflow(9, WEEK_VISIBLE_LIMIT);
    expect(week.visible).toBe(4);
    expect(week.overflow).toBe(5);
    expect(week.label).toBe("+5 more");
    const month = planningOverflow(8, MONTH_VISIBLE_LIMIT);
    expect(month.overflow).toBe(6);
    expect(truthfulAppointmentCountLabel(3)).toBe("3 appointments");
    expect(truthfulAppointmentCountLabel(1)).toBe("1 appointment");
    expect(truthfulAppointmentCountLabel(0)).toBe("No appointments");
  });
});
