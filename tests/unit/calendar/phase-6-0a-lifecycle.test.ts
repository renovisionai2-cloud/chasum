import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { groupAppointmentsByBusinessDay } from "@/lib/calendar/planning-geometry";
import { planningAttentionLabel } from "@/lib/calendar/planning-density";
import { buildDirectoryMetricsByCustomer } from "@/lib/crm/directory-metrics";

const root = process.cwd();
const TORONTO = "America/Toronto";

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Phase 6.0A calendar cancel synchronization", () => {
  it("hides cancelled appointments from Week/Month grouping", () => {
    const grouped = groupAppointmentsByBusinessDay(
      [
        {
          id: "a1",
          start_time: "2026-08-05T15:00:00.000Z",
          status: "confirmed",
        },
        {
          id: "a2",
          start_time: "2026-08-05T16:00:00.000Z",
          status: "cancelled",
        },
      ],
      TORONTO,
    );
    const day = grouped.get("2026-08-05") ?? [];
    expect(day.map((a) => a.id)).toEqual(["a1"]);
  });

  it("CalendarClient applies cancelled override and refreshes on view change", () => {
    const src = read("components/calendar/calendar-client.tsx");
    expect(src).toContain("cancelledOverrideIds");
    expect(src).toContain("handleCancel");
    expect(src).toContain('status: "cancelled"');
    expect(src).toContain("cancelAppointment");
    expect(src).toMatch(/function handleViewChange[\s\S]*refresh\(\)/);
    expect(src).toContain("onCancelAppointment");
    expect(src).toContain("onCancel={handleCancel}");
  });

  it("failed cancel removes override (rollback path present)", () => {
    const src = read("components/calendar/calendar-client.tsx");
    expect(src).toMatch(
      /if \(result\.error\)[\s\S]*next\.delete\(appointment\.id\)[\s\S]*refresh\(\)/,
    );
  });

  it("BookingSheet uses shared cancel when provided", () => {
    const src = read("components/booking-sheet/booking-sheet.tsx");
    expect(src).toContain("onCancelAppointment");
    expect(src).toMatch(
      /if \(onCancelAppointment\)[\s\S]*await onCancelAppointment\(\)/,
    );
  });

  it("Day drawer cancel uses calendar onCancel", () => {
    const drawer = read("components/day-view/appointment-drawer.tsx");
    expect(drawer).toContain("onCancel: (appointment");
    expect(drawer).toContain("await onCancel(appointment)");
    expect(drawer).not.toMatch(/cancelAppointment\(/);
  });

  it("Agenda and Timeline still hide cancelled via shared client filters", () => {
    const client = read("components/calendar/calendar-client.tsx");
    expect(client).toContain("AgendaView");
    expect(client).toContain("TimelineView");
    expect(client).toContain("filteredAppointments");
    const extended = read("components/calendar/calendar-views-extended.tsx");
    expect(extended).toMatch(/status !== ["']cancelled["']/);
  });
});

describe("Phase 6.0A collectibility surfaces", () => {
  it("directory outstanding excludes cancelled via collectible helper", () => {
    const metrics = buildDirectoryMetricsByCustomer(
      [
        {
          customer_id: "c1",
          start_time: "2026-08-01T15:00:00.000Z",
          status: "cancelled",
          price_cents: 10000,
          tax_cents: 1300,
          amount_paid_cents: 0,
        },
        {
          customer_id: "c1",
          start_time: "2026-08-10T15:00:00.000Z",
          status: "confirmed",
          price_cents: 5000,
          tax_cents: 0,
          amount_paid_cents: 0,
        },
      ],
      new Date("2026-08-06T12:00:00.000Z"),
    );
    expect(metrics.get("c1")?.outstandingBalanceCents).toBe(5000);
  });

  it("dashboard outstanding uses collectible helpers", () => {
    const src = read("lib/commerce/dashboard.ts");
    expect(src).toContain("appointmentCollectibleMoneyFromStamps");
    expect(src).toContain("collectibleDepositDueNowCents");
    expect(src).toContain("collectibleRemainingBalanceCents");
  });

  it("Reports copy no longer mixes invoices with unpaid booking balances", () => {
    const src = read("components/reports/reports-hub.tsx");
    expect(src).toContain("real open invoices");
    expect(src).not.toContain("open invoices plus unpaid booking balances");
  });

  it("cancel does not auto-void invoices or auto-refund", () => {
    const cancel = read("lib/booking-engine/mutations/cancel.ts");
    expect(cancel).not.toContain("commerce_invoices");
    expect(cancel).not.toContain("processCommerceRefund");
    expect(cancel).not.toContain("amount_paid_cents");
  });

  it("CRM cancel next uses Cancel language, not Delete", () => {
    const profile = read("components/crm/customer-profile.tsx");
    expect(profile).toMatch(/confirmDelete\(\s*`Cancel /);
  });

  it("planning attention suppresses collection for cancelled stale rows", () => {
    expect(
      planningAttentionLabel({
        status: "cancelled",
        paymentStatus: "deposit_required",
      }),
    ).toBeNull();
  });
});
