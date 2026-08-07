import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  filterStartsToBookingInterval,
  presentStartTimesForBookingUI,
  visibleItemsForPeriod,
  DEFAULT_VISIBLE_STARTS_PER_PERIOD,
} from "@/lib/booking/presentable-start-times";
import { bookingFooterStatus } from "@/components/booking-sheet/booking-workflow";

function isoAt(hour: number, minute: number): string {
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return `2026-08-08T${h}:${m}:00.000Z`;
}

describe("presentable start times", () => {
  it("filters raw 5-minute starts when booking increment is 30", () => {
    const raw = [
      { start: isoAt(15, 0) },
      { start: isoAt(15, 5) },
      { start: isoAt(15, 10) },
      { start: isoAt(15, 15) },
      { start: isoAt(15, 20) },
      { start: isoAt(15, 25) },
      { start: isoAt(15, 30) },
      { start: isoAt(15, 35) },
    ];
    const filtered = filterStartsToBookingInterval(raw, 30, "UTC");
    expect(filtered.map((s) => s.start)).toEqual([
      isoAt(15, 0),
      isoAt(15, 30),
    ]);
  });

  it("keeps 15-minute starts when increment is 15", () => {
    const raw = [
      { start: isoAt(9, 0) },
      { start: isoAt(9, 5) },
      { start: isoAt(9, 15) },
      { start: isoAt(9, 30) },
      { start: isoAt(9, 45) },
    ];
    const presented = presentStartTimesForBookingUI(raw, {
      intervalMinutes: 15,
      timeZone: "UTC",
    });
    expect(presented.slots.map((s) => s.start)).toEqual([
      isoAt(9, 0),
      isoAt(9, 15),
      isoAt(9, 30),
      isoAt(9, 45),
    ]);
    expect(presented.nextAvailable?.start).toBe(isoAt(9, 0));
  });

  it("preserves Morning / Afternoon / Evening grouping", () => {
    // Wall-clock hours via local Date (no Z) so grouping is stable in CI.
    const raw = [
      { start: "2026-08-08T09:00:00" },
      { start: "2026-08-08T13:00:00" },
      { start: "2026-08-08T18:00:00" },
    ];
    const presented = presentStartTimesForBookingUI(raw, {
      intervalMinutes: 30,
    });
    expect(presented.groups.map((g) => g.id)).toEqual([
      "morning",
      "afternoon",
      "evening",
    ]);
  });

  it("collapses dense periods behind More times", () => {
    const raw = Array.from({ length: 36 }, (_, i) => {
      const totalMinutes = 9 * 60 + i * 5;
      return {
        start: `2026-08-08T${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}:00`,
      };
    });
    const presented = presentStartTimesForBookingUI(raw, {
      intervalMinutes: 5,
      denseTotalThreshold: 24,
    });
    expect(presented.slots.length).toBe(36);
    expect(presented.dense).toBe(true);
    const morning = presented.groups.find((g) => g.id === "morning")!;
    const collapsed = visibleItemsForPeriod(morning.items, false, {
      dense: true,
      visiblePerPeriod: DEFAULT_VISIBLE_STARTS_PER_PERIOD,
    });
    expect(collapsed.visible.length).toBe(DEFAULT_VISIBLE_STARTS_PER_PERIOD);
    expect(collapsed.hiddenCount).toBeGreaterThan(0);
    const open = visibleItemsForPeriod(morning.items, true, { dense: true });
    expect(open.hiddenCount).toBe(0);
    expect(open.visible.length).toBe(morning.items.length);
  });

  it("keeps a selected time visible while collapsed", () => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      start: `2026-08-08T09:${String(i * 5).padStart(2, "0")}:00`,
      id: i,
    }));
    const selected = items[10]!;
    const { visible, hiddenCount } = visibleItemsForPeriod(items, false, {
      dense: true,
      visiblePerPeriod: 4,
      forceInclude: (item) => item.start === selected.start,
    });
    expect(visible.some((v) => v.start === selected.start)).toBe(true);
    expect(hiddenCount).toBeGreaterThan(0);
  });
});

describe("Date & Time footer and unified panel contract", () => {
  const root = process.cwd();

  it("footer status for datetime is choose language — not confirm", () => {
    expect(bookingFooterStatus("datetime")).toBe("Choose a date and time");
    expect(bookingFooterStatus("review")).toBe("Ready to book");
  });

  it("does not show Confirm appointment on Date & Time step", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain('activeDecision === "datetime"');
    expect(booking).toContain('activeDecision === "review"');
    // Continue on datetime; Confirm only on review / edit submit path
    const datetimeBlock = booking.slice(
      booking.indexOf('activeDecision === "datetime"'),
      booking.indexOf('activeDecision === "payment"'),
    );
    expect(datetimeBlock).toContain("Continue");
    expect(datetimeBlock).not.toContain("confirmButtonLabel");
  });

  it("keeps Date & Time unified and uses presentable start times", () => {
    const panel = readFileSync(
      join(root, "components/booking-sheet/booking-datetime-panel.tsx"),
      "utf8",
    );
    const selector = readFileSync(
      join(root, "components/scheduling/available-time-selector.tsx"),
      "utf8",
    );
    expect(panel).toContain("DateField");
    expect(panel).toContain("AvailabilitySection");
    expect(selector).toContain("presentStartTimesForBookingUI");
    expect(selector).toContain("More");
    expect(selector).toContain("Next available");
  });

  it("availability response carries booking interval for presentation", () => {
    const actions = readFileSync(
      join(root, "lib/actions/booking-sheet.ts"),
      "utf8",
    );
    expect(actions).toContain("intervalMinutes");
    expect(actions).toContain("timezone");
  });
});
