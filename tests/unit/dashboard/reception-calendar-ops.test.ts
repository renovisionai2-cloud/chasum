import { describe, expect, it } from "vitest";
import {
  calendarBoardFiltersAreActive,
  countDailyStatuses,
  filterAppointmentsForBoard,
  paymentReadinessFromStatus,
  paymentReadinessLabel,
  sortAppointmentsChronologically,
  sortStaffForBoardFilter,
} from "@/lib/dashboard/appointment-ops";
import {
  ASSIGN_LATER_COMING_SOON_LABEL,
  OPTIONAL_STAFF_PERSISTENCE_ENABLED,
  UNASSIGNED_ASSIGN_LATER_LABEL,
} from "@/lib/booking/optional-staff";
import {
  businessDayBounds,
  countAppointmentsToday,
} from "@/lib/dashboard/appointments-today";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const TORONTO = { timezone: "America/Toronto", currency: "CAD" };

describe("Reception appointment ops", () => {
  it("counts daily statuses with cancelled/no-show excluded from scheduled", () => {
    const counts = countDailyStatuses([
      { status: "confirmed", staff_id: "s1", payment_status: "fully_paid" },
      { status: "arrived", staff_id: null, payment_status: "deposit_paid" },
      { status: "cancelled", staff_id: "s1", payment_status: "unpaid" },
      { status: "no_show", staff_id: "s1", payment_status: "unpaid" },
      { status: "in_progress", staff_id: "s1", payment_status: "unpaid" },
      { status: "completed", staff_id: "s1", payment_status: "partially_paid" },
    ]);
    expect(counts.scheduled).toBe(4);
    expect(counts.checkedIn).toBe(1);
    expect(counts.inProgress).toBe(1);
    expect(counts.completed).toBe(1);
    expect(counts.cancelled).toBe(1);
    expect(counts.noShow).toBe(1);
    expect(counts.unassigned).toBe(1);
    expect(counts.paymentAttention).toBe(3);
  });

  it("maps payment_status to readiness labels", () => {
    expect(paymentReadinessLabel(paymentReadinessFromStatus("fully_paid"))).toBe(
      "Paid",
    );
    expect(
      paymentReadinessLabel(paymentReadinessFromStatus("deposit_paid")),
    ).toBe("Balance due");
    expect(
      paymentReadinessLabel(paymentReadinessFromStatus("deposit_required")),
    ).toBe("Payment due");
    expect(paymentReadinessLabel(paymentReadinessFromStatus("refunded"))).toBe(
      "Refunded",
    );
  });

  it("filters calendar board by employee and status", () => {
    const rows = [
      { id: "1", staff_id: "s1", status: "confirmed" },
      { id: "2", staff_id: null, status: "confirmed" },
      { id: "3", staff_id: "s1", status: "cancelled" },
      { id: "4", staff_id: "s2", status: "no_show" },
    ];
    expect(
      filterAppointmentsForBoard(rows, {
        staffId: "unassigned",
        status: "all",
      }).map((r) => r.id),
    ).toEqual(["2"]);
    expect(
      filterAppointmentsForBoard(rows, {
        staffId: "all",
        status: "active",
      }).map((r) => r.id),
    ).toEqual(["1", "2"]);
    expect(
      filterAppointmentsForBoard(rows, {
        staffId: "s1",
        status: "cancelled",
      }).map((r) => r.id),
    ).toEqual(["3"]);
    expect(
      calendarBoardFiltersAreActive({ staffId: "all", status: "all" }),
    ).toBe(false);
    expect(
      calendarBoardFiltersAreActive({ staffId: "s1", status: "all" }),
    ).toBe(true);
  });

  it("sorts chronologically", () => {
    const sorted = sortAppointmentsChronologically([
      { start_time: "2026-08-06T18:00:00.000Z", id: "b" },
      { start_time: "2026-08-06T14:00:00.000Z", id: "a" },
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("keeps appointments-today aligned for Reception samples", () => {
    const now = new Date("2026-08-05T16:00:00.000Z");
    const { dayStart } = businessDayBounds(now, TORONTO);
    const rows = [
      {
        start_time: new Date(dayStart.getTime() + 3600_000).toISOString(),
        status: "confirmed",
      },
      {
        start_time: new Date(dayStart.getTime() + 7200_000).toISOString(),
        status: "no_show",
      },
    ];
    expect(countAppointmentsToday(rows, now, TORONTO)).toBe(1);
  });

  it("documents unassigned create as gated by default", () => {
    expect(OPTIONAL_STAFF_PERSISTENCE_ENABLED).toBe(false);
    expect(ASSIGN_LATER_COMING_SOON_LABEL).toMatch(/coming soon/i);
    expect(UNASSIGNED_ASSIGN_LATER_LABEL).toMatch(/assign later/i);
  });

  it("orders employee filter: named A–Z then Unassigned last in options contract", () => {
    const ordered = sortStaffForBoardFilter([
      { id: "2", name: "Zoe" },
      { id: "1", name: "Alex" },
    ]);
    expect(ordered.map((s) => s.name)).toEqual(["Alex", "Zoe"]);
    // Filter option contract: all → named alpha → unassigned (asserted in component order)
    const rows = [
      { id: "u", staff_id: null, status: "confirmed" },
      { id: "a", staff_id: "1", status: "confirmed" },
    ];
    expect(
      filterAppointmentsForBoard(rows, {
        staffId: "unassigned",
        status: "all",
      }).map((r) => r.id),
    ).toEqual(["u"]);
  });

  it("does not expose fake Reception slot or revenue metrics in morning brief UI", () => {
    const briefUi = readFileSync(
      join(process.cwd(), "components/day-view/morning-brief.tsx"),
      "utf8",
    );
    expect(briefUi).not.toMatch(/availableSlots/);
    expect(briefUi).not.toMatch(/todayRevenue/);
    expect(briefUi).not.toMatch(/\bRevenue\b/);
    expect(briefUi).toMatch(/Availability slot totals are not shown/);

    const filtersUi = readFileSync(
      join(process.cwd(), "components/calendar/calendar-filters.tsx"),
      "utf8",
    );
    expect(filtersUi).toMatch(
      /All employees[\s\S]*sortStaffForBoardFilter[\s\S]*value="unassigned"/,
    );
  });

  it("resources empty-state and locations architecture docs exist", () => {
    const arch = readFileSync(
      join(process.cwd(), "docs/WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md"),
      "utf8",
    );
    expect(arch).toMatch(/Business\s*\n\s*→ Location/i);
    expect(arch).toMatch(/REQUIRED BEFORE PUBLIC LAUNCH/);
    expect(arch).toMatch(/Chapter 9/);

    const resourcesUi = readFileSync(
      join(
        process.cwd(),
        "components/calendar/calendar-views-extended.tsx",
      ),
      "utf8",
    );
    expect(resourcesUi).toMatch(/Resources are not active yet/);
    expect(resourcesUi).toMatch(/View business locations/);
    expect(resourcesUi).not.toMatch(/Add Resource/);
  });
});
