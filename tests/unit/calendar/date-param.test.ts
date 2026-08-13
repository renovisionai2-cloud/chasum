import { describe, expect, it } from "vitest";
import {
  formatCalendarDateParam,
  parseCalendarDateParam,
} from "@/lib/calendar/date-param";
import { getCalendarViewRange } from "@/lib/calendar/view-range";

describe("parseCalendarDateParam", () => {
  it("parses YYYY-MM-DD without UTC day drift on local noon", () => {
    const d = parseCalendarDateParam("2026-08-08");
    expect(Number.isFinite(d.getTime())).toBe(true);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(8);
  });

  it("parses full ISO timestamps from calendar navigation", () => {
    const iso = "2026-08-08T04:00:00.000Z";
    const d = parseCalendarDateParam(iso);
    expect(Number.isFinite(d.getTime())).toBe(true);
    expect(d.toISOString()).toBe(iso);
  });

  it("does not produce Invalid Date when ISO already has a time", () => {
    // Regression: `${iso}T12:00:00` was Invalid Date and crashed the page.
    const iso = "2026-08-03T16:00:00.000Z";
    const d = parseCalendarDateParam(iso);
    expect(Number.isFinite(d.getTime())).toBe(true);
    expect(() => d.toISOString()).not.toThrow();
  });

  it("falls back for garbage input", () => {
    const fallback = new Date("2026-01-15T12:00:00.000Z");
    const d = parseCalendarDateParam("not-a-date", fallback);
    expect(d.toISOString()).toBe(fallback.toISOString());
  });
});

describe("formatCalendarDateParam", () => {
  it("emits YYYY-MM-DD for URL round-trips", () => {
    const d = new Date(2026, 7, 8, 12, 0, 0);
    expect(formatCalendarDateParam(d)).toBe("2026-08-08");
  });

  it("LOCK: civil anchor is not Month fetch-window start", () => {
    const anchor = parseCalendarDateParam("2026-08-12");
    const month = getCalendarViewRange("month", anchor, {
      timezone: "America/Toronto",
      currency: "cad",
    });
    const civil = formatCalendarDateParam(anchor, "America/Toronto");
    const windowStart = formatCalendarDateParam(month.start, "America/Toronto");
    expect(civil).toBe("2026-08-12");
    expect(windowStart).not.toBe(civil);
    expect(windowStart.startsWith("2026-07-")).toBe(true);
  });
});
