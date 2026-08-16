import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isUnchangedExistingSchedule } from "@/lib/booking-engine/schedule-hold";
import {
  bucketCustomerAppointments,
  lastCompletedVisitAt,
} from "@/lib/crm/appointment-buckets";
import { buildCustomerReport } from "@/lib/reports/compute";
import { formatMoneyDollars } from "@/lib/commerce/money";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Phase 6.1D zero-balance customer collection", () => {
  it("rejects unallocated Record payment without appointment or invoice", () => {
    const action = read("lib/actions/commerce.ts");
    expect(action).toContain("!appointmentId && !invoiceId");
    expect(action).toContain("There is no outstanding balance to collect");
  });

  it("Billing panel does not render a generic Record payment form", () => {
    const panel = read("components/commerce/customer-commerce-panel.tsx");
    expect(panel).not.toContain('payPending ? "Saving…" : "Record payment"');
    expect(panel).toContain("Paid in full — no outstanding appointment balance");
  });
});

describe("Phase 6.1D past Booked lifecycle", () => {
  const now = new Date("2026-08-15T16:00:00.000Z");
  const pastBooked = {
    id: "ana",
    start_time: "2026-08-15T00:30:00.000Z",
    end_time: "2026-08-15T00:50:00.000Z",
    status: "confirmed" as const,
  };

  it("keeps past Booked visits visible as needs attention, not completed", () => {
    const buckets = bucketCustomerAppointments([pastBooked], now);
    expect(buckets.upcoming).toHaveLength(0);
    expect(buckets.completed).toHaveLength(0);
    expect(buckets.needsAttention.map((a) => a.id)).toEqual(["ana"]);
    expect(lastCompletedVisitAt([pastBooked])).toBeNull();
  });

  it("Last visit requires completed status", () => {
    expect(
      lastCompletedVisitAt([
        pastBooked,
        {
          id: "done",
          start_time: "2026-07-01T15:00:00.000Z",
          status: "completed",
        },
      ]),
    ).toBe("2026-07-01T15:00:00.000Z");
  });
});

describe("Phase 6.1D existing appointment schedule hold", () => {
  const existing = {
    start_time: "2026-08-15T00:30:00.000Z",
    end_time: "2026-08-15T00:50:00.000Z",
    staff_id: "staff-1",
    location_id: "loc-1",
  };

  it("treats the same slot as unchanged so availability is not re-required", () => {
    expect(
      isUnchangedExistingSchedule(existing, {
        requestedStart: existing.start_time,
        staffId: "staff-1",
        locationId: "loc-1",
        durationMinutes: 20,
      }),
    ).toBe(true);
  });

  it("requires validation when the time changes", () => {
    expect(
      isUnchangedExistingSchedule(existing, {
        requestedStart: "2026-08-16T00:30:00.000Z",
        staffId: "staff-1",
        locationId: "loc-1",
        durationMinutes: 20,
      }),
    ).toBe(false);
  });

  it("updateBooking skips validateBooking when the schedule is held", () => {
    const src = read("lib/booking-engine/mutations/update.ts");
    expect(src).toContain("isUnchangedExistingSchedule");
    expect(src).toContain("if (!holdSchedule)");
    expect(src).toContain("validateBooking");
  });
});

describe("Phase 6.1D staff notification presentation", () => {
  it("does not pair Not applicable with Resend when no log exists", () => {
    const src = read("lib/notifications/booking-delivery.ts");
    expect(src).toContain("No staff notification was recorded");
    expect(src).toContain('status: log ? mapLogStatus(log.status) : "skipped"');
    const ui = read(
      "components/booking-sheet/booking-communications-section.tsx",
    );
    expect(ui).toContain('item.status !== "not_applicable"');
  });
});

describe("Phase 6.1D avg collected per customer", () => {
  it("averages per-customer payment totals, not per-transaction size", () => {
    const report = buildCustomerReport(
      [
        {
          id: "cust-1",
          name: "Ana",
          created_at: "2025-01-01T00:00:00.000Z",
        },
      ],
      [],
      [
        {
          amount_cents: 5000,
          status: "paid",
          occurred_at: "2026-08-15T00:00:00.000Z",
          customer_id: "cust-1",
        },
        {
          amount_cents: 19860,
          status: "paid",
          occurred_at: "2026-08-15T01:00:00.000Z",
          customer_id: "cust-1",
        },
      ],
      new Date("2026-08-15T16:00:00.000Z"),
      { timezone: "America/Toronto" },
    );
    expect(report.lifetimeValueAvg).toBe(248.6);
    expect(formatMoneyDollars(report.lifetimeValueAvg, "cad")).toContain(
      "248.60",
    );
    expect(report.topCustomers[0]?.value).toBe(248.6);
    const hub = read("components/reports/reports-hub.tsx");
    expect(hub).toContain("Avg collected per customer");
    expect(hub).not.toContain("Avg recorded payments");
  });
});
