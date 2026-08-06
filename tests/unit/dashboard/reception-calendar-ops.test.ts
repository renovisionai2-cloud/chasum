import { describe, expect, it } from "vitest";
import {
  calendarBoardFiltersAreActive,
  countDailyStatuses,
  filterAppointmentsForBoard,
  paymentReadinessFromStatus,
  paymentReadinessLabel,
  sortAppointmentsChronologically,
} from "@/lib/dashboard/appointment-ops";
import {
  businessDayBounds,
  countAppointmentsToday,
} from "@/lib/dashboard/appointments-today";
import { OPTIONAL_STAFF_PERSISTENCE_ENABLED } from "@/lib/booking/optional-staff";

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
  });
});
