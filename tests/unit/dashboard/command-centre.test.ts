import { describe, expect, it } from "vitest";
import {
  endOfBusinessDay,
  startOfBusinessDay,
} from "@/lib/business/datetime";
import {
  activeScheduleRows,
  appointmentScopeLabel,
  buildAttentionItems,
  buildDailySummary,
  buildSummerFacts,
  countCancellationsToday,
  isStartInRange,
  moneyScopeCaption,
  presentCommerceMoney,
  receptionHref,
  selectNextAppointment,
  type CommandCentreScheduleRow,
} from "@/lib/dashboard/command-centre";
import type { AppointmentStatus } from "@/lib/types/booking";
import type { SetupStep } from "@/lib/onboarding/setup-progress";

function row(
  overrides: Partial<CommandCentreScheduleRow> & {
    id: string;
    start_time: string;
    status?: AppointmentStatus;
  },
): CommandCentreScheduleRow {
  return {
    customerName: "Ada",
    customerId: "cust-1",
    serviceName: "Cut",
    staffName: "Pat",
    locationName: "Main",
    status: "confirmed",
    ...overrides,
  };
}

const setupStep: SetupStep = {
  id: "profile",
  label: "Name your business",
  description: "Set a real name.",
  href: "/dashboard/business",
  done: false,
};

const moneyReady = presentCommerceMoney({
  schemaReady: true,
  schemaMessage: null,
  collectedTodayCents: 0,
  outstandingInvoicesCents: 0,
  outstandingInvoicesCount: 0,
  outstandingDepositsCents: 0,
  outstandingDepositsCount: 0,
});

describe("Command Centre business-local day boundary", () => {
  it("treats America/Toronto midnight as the start of today, not UTC midnight", () => {
    // 2026-08-25 00:30 EDT = 2026-08-25 04:30 UTC
    const now = new Date("2026-08-25T04:30:00.000Z");
    const locale = { timezone: "America/Toronto", currency: "CAD" };
    const start = startOfBusinessDay(now, locale);
    const end = endOfBusinessDay(now, locale);

    const stillMondayUtc =
      "2026-08-25T03:30:00.000Z"; // 2026-08-24 23:30 EDT — previous local day
    const justAfterLocalMidnight =
      "2026-08-25T04:00:00.000Z"; // 2026-08-25 00:00 EDT
    const lateLocalEvening =
      "2026-08-26T03:30:00.000Z"; // 2026-08-25 23:30 EDT — still today locally

    expect(isStartInRange(stillMondayUtc, start, end)).toBe(false);
    expect(isStartInRange(justAfterLocalMidnight, start, end)).toBe(true);
    expect(isStartInRange(lateLocalEvening, start, end)).toBe(true);
  });
});

describe("Command Centre next appointment", () => {
  const now = new Date("2026-08-25T15:00:00.000Z");

  it("selects the earliest remaining active appointment", () => {
    const next = selectNextAppointment(
      [
        row({ id: "past", start_time: "2026-08-25T14:00:00.000Z" }),
        row({ id: "later", start_time: "2026-08-25T17:00:00.000Z" }),
        row({ id: "soon", start_time: "2026-08-25T16:00:00.000Z" }),
      ],
      now,
    );
    expect(next?.id).toBe("soon");
  });

  it("skips cancelled and no-show rows even if they start later", () => {
    const next = selectNextAppointment(
      [
        row({
          id: "cancelled",
          start_time: "2026-08-25T15:30:00.000Z",
          status: "cancelled",
        }),
        row({
          id: "no-show",
          start_time: "2026-08-25T15:45:00.000Z",
          status: "no_show",
        }),
        row({
          id: "kept",
          start_time: "2026-08-25T16:00:00.000Z",
          status: "pending",
        }),
      ],
      now,
    );
    expect(next?.id).toBe("kept");
  });

  it("returns null when nothing remains today", () => {
    expect(
      selectNextAppointment(
        [row({ id: "done", start_time: "2026-08-25T10:00:00.000Z" })],
        now,
      ),
    ).toBeNull();
  });
});

describe("Command Centre schedule activity", () => {
  it("keeps completed visits on the working schedule and drops cancelled / no-show", () => {
    const rows = activeScheduleRows([
      row({ id: "c", start_time: "2026-08-25T11:00:00.000Z", status: "cancelled" }),
      row({
        id: "done",
        start_time: "2026-08-25T10:00:00.000Z",
        status: "completed",
      }),
      row({ id: "n", start_time: "2026-08-25T12:00:00.000Z", status: "no_show" }),
      row({
        id: "live",
        start_time: "2026-08-25T13:00:00.000Z",
        status: "confirmed",
      }),
    ]);
    expect(rows.map((r) => r.id)).toEqual(["done", "live"]);
  });
});

describe("Command Centre attention", () => {
  it("counts cancellations today without treating no-shows as cancellations", () => {
    expect(
      countCancellationsToday([
        row({ id: "1", start_time: "2026-08-25T11:00:00.000Z", status: "cancelled" }),
        row({ id: "2", start_time: "2026-08-25T12:00:00.000Z", status: "cancelled" }),
        row({ id: "3", start_time: "2026-08-25T13:00:00.000Z", status: "no_show" }),
        row({ id: "4", start_time: "2026-08-25T14:00:00.000Z", status: "confirmed" }),
      ]),
    ).toBe(2);
  });

  it("returns an empty list when nothing operational needs attention", () => {
    expect(
      buildAttentionItems({
        pendingConfirmations: 0,
        cancellationsToday: 0,
        money: moneyReady,
        setupComplete: true,
        nextSetupStep: null,
      }),
    ).toEqual([]);
  });

  it("surfaces cancellations with a Reception destination", () => {
    const items = buildAttentionItems({
      pendingConfirmations: 0,
      cancellationsToday: 3,
      money: moneyReady,
      setupComplete: true,
      nextSetupStep: null,
    });
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("cancelled");
    expect(items[0]?.title).toBe("3 cancellations today");
    expect(items[0]?.href).toContain("/dashboard/calendar");
  });

  it("does not invent outstanding money attention when commerce is unavailable", () => {
    const items = buildAttentionItems({
      pendingConfirmations: 1,
      cancellationsToday: 0,
      money: presentCommerceMoney({
        schemaReady: false,
        schemaMessage: "Payments aren't fully set up yet.",
        collectedTodayCents: 9999,
        outstandingInvoicesCents: 5000,
        outstandingInvoicesCount: 2,
        outstandingDepositsCents: 1200,
        outstandingDepositsCount: 1,
      }),
      setupComplete: true,
      nextSetupStep: null,
    });
    expect(items.map((i) => i.id)).toEqual(["pending"]);
  });
});

describe("Command Centre money presentation", () => {
  it("returns an honest unavailable state without fabricating totals", () => {
    const view = presentCommerceMoney({
      schemaReady: false,
      schemaMessage: "Payments aren't fully set up yet.",
      collectedTodayCents: 4200,
      outstandingInvoicesCents: 800,
      outstandingInvoicesCount: 1,
      outstandingDepositsCents: 200,
      outstandingDepositsCount: 1,
    });
    expect(view).toEqual({
      available: false,
      message: "Payments aren't fully set up yet.",
    });
  });

  it("passes through snapshot fields without combining invoices and deposits", () => {
    const view = presentCommerceMoney({
      schemaReady: true,
      schemaMessage: null,
      collectedTodayCents: 12500,
      outstandingInvoicesCents: 4000,
      outstandingInvoicesCount: 2,
      outstandingDepositsCents: 1500,
      outstandingDepositsCount: 1,
    });
    expect(view.available).toBe(true);
    if (!view.available) return;
    expect(view.collectedTodayCents).toBe(12500);
    expect(view.outstandingInvoicesCents).toBe(4000);
    expect(view.outstandingDepositsCents).toBe(1500);
  });
});

describe("Command Centre Summer grounding", () => {
  it("emits only snapshot-backed facts and never AI-employee theater", () => {
    const facts = buildSummerFacts({
      setupComplete: true,
      appointmentsToday: 2,
      nextAppointmentClock: "2:00 PM",
      pendingConfirmations: 1,
      outstandingCount: 3,
      attentionCount: 2,
    });
    expect(facts.length).toBeGreaterThan(0);
    expect(facts.length).toBeLessThanOrEqual(3);
    const blob = facts.map((f) => f.text).join(" ");
    expect(blob).toContain("2 appointments today");
    expect(blob).toContain("2:00 PM");
    expect(blob.toLowerCase()).not.toMatch(/sophia|leo|maya|alex/);
    expect(blob.toLowerCase()).not.toMatch(/predicted|utilization|outreach/);
    expect(blob.toLowerCase()).not.toContain("revenue");
  });

  it("can say nothing urgent without inventing work", () => {
    const facts = buildSummerFacts({
      setupComplete: true,
      appointmentsToday: 1,
      nextAppointmentClock: null,
      pendingConfirmations: 0,
      outstandingCount: 0,
      attentionCount: 0,
    });
    expect(facts.some((f) => f.id === "clear")).toBe(true);
    expect(facts.some((f) => f.text.includes("Nothing urgent"))).toBe(true);
  });
});

describe("Command Centre location-scope labels", () => {
  it("labels all-locations vs a named location", () => {
    expect(appointmentScopeLabel({ mode: "all" })).toBe("All locations");
    expect(
      appointmentScopeLabel({ mode: "single", locationName: "Harbour" }),
    ).toBe("Harbour");
    expect(appointmentScopeLabel({ mode: "single", locationName: "  " })).toBe(
      "This location",
    );
  });

  it("states that payments remain business-wide when appointments are location-scoped", () => {
    expect(moneyScopeCaption("all")).toBe(
      "Payments are for the whole business.",
    );
    expect(moneyScopeCaption("single")).toBe(
      "Payments are for the whole business, not this location only.",
    );
  });
});

describe("Command Centre copy helpers", () => {
  it("keeps the daily summary operational and setup-aware", () => {
    expect(
      buildDailySummary({
        setupComplete: false,
        businessName: "Harbour Studio",
        appointmentsToday: 4,
        attentionCount: 2,
      }),
    ).toContain("Finish setup");
    expect(
      buildDailySummary({
        setupComplete: true,
        businessName: "Harbour Studio",
        appointmentsToday: 0,
        attentionCount: 0,
      }),
    ).toContain("Nothing urgent");
  });

  it("builds Reception links with day view and optional appointment context", () => {
    expect(receptionHref({ dateYmd: "2026-08-25", appointmentId: "appt-1" })).toBe(
      "/dashboard/calendar?view=day&date=2026-08-25&appointment=appt-1",
    );
  });

  it("includes setup gaps in attention when setup is incomplete", () => {
    const items = buildAttentionItems({
      pendingConfirmations: 0,
      cancellationsToday: 0,
      money: moneyReady,
      setupComplete: false,
      nextSetupStep: setupStep,
    });
    expect(items[0]?.id).toBe("setup");
    expect(items[0]?.href).toBe("/dashboard/business");
  });
});
