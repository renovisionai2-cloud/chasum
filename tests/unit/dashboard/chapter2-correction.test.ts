import {
  countAppointmentsToday,
  filterAppointmentsToday,
  businessDayBounds,
} from "@/lib/dashboard/appointments-today";
import {
  endOfBusinessDay,
  startOfBusinessDay,
} from "@/lib/business/datetime";
import { isActiveBooking } from "@/lib/commerce/recognize";
import { planAllowsApiIntegrations } from "@/lib/billing/plan-features";
import { buildAttentionItems } from "@/lib/dashboard/command-centre";
import { describe, expect, it } from "vitest";

const TORONTO = { timezone: "America/Toronto", currency: "CAD" };

describe("APPOINTMENTS TODAY shared definition", () => {
  it("excludes cancelled and no_show; includes unassigned pending", () => {
    // Midday Toronto on a fixed instant
    const now = new Date("2026-08-05T16:00:00.000Z"); // 12:00 EDT
    const { dayStart, dayEnd } = businessDayBounds(now, TORONTO);

    const rows = [
      {
        start_time: new Date(dayStart.getTime() + 3600_000).toISOString(),
        status: "confirmed",
      },
      {
        start_time: new Date(dayStart.getTime() + 7200_000).toISOString(),
        status: "pending",
      },
      {
        start_time: new Date(dayStart.getTime() + 10_800_000).toISOString(),
        status: "no_show",
      },
      {
        start_time: new Date(dayStart.getTime() + 14_400_000).toISOString(),
        status: "cancelled",
      },
      {
        // yesterday
        start_time: new Date(dayStart.getTime() - 3600_000).toISOString(),
        status: "confirmed",
      },
    ];

    const filtered = filterAppointmentsToday(rows, now, TORONTO);
    expect(filtered).toHaveLength(2);
    expect(countAppointmentsToday(rows, now, TORONTO)).toBe(2);
    expect(isActiveBooking("no_show")).toBe(false);
    expect(isActiveBooking("cancelled")).toBe(false);
    expect(isActiveBooking("pending")).toBe(true);
    expect(dayEnd.getTime()).toBeGreaterThan(dayStart.getTime());
  });

  it("uses business timezone boundaries not UTC midnight alone", () => {
    // 2026-08-06 02:00 UTC = still Aug 5 evening in Toronto
    const now = new Date("2026-08-06T02:00:00.000Z");
    const start = startOfBusinessDay(now, TORONTO);
    const end = endOfBusinessDay(now, TORONTO);
    // Business day is Aug 5 in Toronto
    expect(start.toISOString()).toContain("2026-08-05");
    expect(end.toISOString()).toContain("2026-08-06");
  });
});

describe("Command Centre attention clarity", () => {
  it("does not imply confirmed customer follow-up for cancellations", () => {
    const items = buildAttentionItems({
      setupComplete: true,
      failedCommunicationsToday: 0,
      outstandingDepositsCount: 0,
      outstandingInvoicesCount: 0,
      unassignedTodayCount: 0,
      pendingConfirmations: 0,
      cancelledTodayCount: 4,
      commerceSchemaReady: true,
    });
    expect(items[0]?.why).toMatch(/rebooking|available/i);
    expect(items[0]?.why).not.toMatch(/need a follow-up/i);
  });
});

describe("Developer entitlement", () => {
  it("hides Developer from Free / Professional without Private Alpha", () => {
    expect(planAllowsApiIntegrations({ subscription_plan_key: "starter" })).toBe(
      false,
    );
    expect(
      planAllowsApiIntegrations({ subscription_plan_key: "professional" }),
    ).toBe(false);
  });

  it("allows Business, Enterprise, and Private Alpha", () => {
    expect(
      planAllowsApiIntegrations({ subscription_plan_key: "business" }),
    ).toBe(true);
    expect(
      planAllowsApiIntegrations({ subscription_plan_key: "enterprise" }),
    ).toBe(true);
    expect(
      planAllowsApiIntegrations({
        subscription_plan_key: "starter",
        private_alpha_enabled: true,
      }),
    ).toBe(true);
  });
});
