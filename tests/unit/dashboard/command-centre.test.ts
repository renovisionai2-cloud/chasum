import { describe, expect, it } from "vitest";
import {
  buildAttentionItems,
  buildDailySummary,
  buildSummerFacts,
  firstNameFromUser,
  greetingForHour,
  scopeLabel,
  sortScheduleByStart,
} from "@/lib/dashboard/command-centre";

describe("Command Centre greeting", () => {
  it("uses morning / afternoon / evening windows", () => {
    expect(greetingForHour(5)).toBe("Good morning");
    expect(greetingForHour(11)).toBe("Good morning");
    expect(greetingForHour(12)).toBe("Good afternoon");
    expect(greetingForHour(16)).toBe("Good afternoon");
    expect(greetingForHour(17)).toBe("Good evening");
    expect(greetingForHour(0)).toBe("Good evening");
    expect(greetingForHour(4)).toBe("Good evening");
  });

  it("normalizes out-of-range hours", () => {
    // 25 ≡ 1 → evening window; -1 ≡ 23 → evening
    expect(greetingForHour(25)).toBe("Good evening");
    expect(greetingForHour(-1)).toBe("Good evening");
    expect(greetingForHour(29)).toBe("Good morning");
  });
});

describe("Command Centre identity helpers", () => {
  it("prefers first name from full name", () => {
    expect(firstNameFromUser({ fullName: "Alex Rivera", email: "x@y.com" })).toBe(
      "Alex",
    );
  });

  it("falls back to email local-part", () => {
    expect(firstNameFromUser({ email: "jordan.lee@example.com" })).toBe("Jordan");
  });

  it("labels location scope clearly", () => {
    expect(scopeLabel({ mode: "all" })).toBe("All locations");
    expect(
      scopeLabel({ mode: "single", locationName: "Downtown" }),
    ).toBe("Downtown");
    expect(scopeLabel({ mode: "single", locationName: null })).toBeNull();
  });
});

describe("Command Centre daily summary", () => {
  it("prioritizes setup when incomplete", () => {
    expect(
      buildDailySummary({
        setupComplete: false,
        businessName: "GVM",
        appointmentsToday: 4,
        attentionCount: 0,
      }),
    ).toMatch(/Finish setup/);
  });

  it("states appointments and attention counts", () => {
    expect(
      buildDailySummary({
        setupComplete: true,
        businessName: "GVM",
        appointmentsToday: 2,
        attentionCount: 1,
      }),
    ).toBe("2 appointments today. 1 item needs attention.");
  });
});

describe("Command Centre schedule ordering", () => {
  it("sorts chronologically by start_time", () => {
    const sorted = sortScheduleByStart([
      { start_time: "2026-08-05T18:00:00.000Z", id: "b" },
      { start_time: "2026-08-05T14:00:00.000Z", id: "a" },
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("Command Centre attention items", () => {
  it("surfaces unassigned and failed communication alerts", () => {
    const items = buildAttentionItems({
      setupComplete: true,
      failedCommunicationsToday: 1,
      outstandingDepositsCount: 0,
      outstandingInvoicesCount: 0,
      unassignedTodayCount: 2,
      pendingConfirmations: 0,
      cancelledTodayCount: 0,
      commerceSchemaReady: true,
    });
    expect(items.map((i) => i.id)).toEqual(["failed-comms", "unassigned"]);
    expect(items[0]?.href).toBe("/dashboard/notifications");
    expect(items[1]?.href).toBe("/dashboard/calendar?view=day");
  });

  it("omits failed communications when count is unavailable", () => {
    const items = buildAttentionItems({
      setupComplete: true,
      failedCommunicationsToday: null,
      outstandingDepositsCount: 0,
      outstandingInvoicesCount: 0,
      unassignedTodayCount: 0,
      pendingConfirmations: 0,
      cancelledTodayCount: 0,
      commerceSchemaReady: true,
    });
    expect(items).toHaveLength(0);
  });

  it("does not invent payment alerts when commerce schema is not ready", () => {
    const items = buildAttentionItems({
      setupComplete: true,
      failedCommunicationsToday: 0,
      outstandingDepositsCount: 5,
      outstandingInvoicesCount: 3,
      unassignedTodayCount: 0,
      pendingConfirmations: 0,
      cancelledTodayCount: 0,
      commerceSchemaReady: false,
    });
    expect(items.find((i) => i.id.startsWith("outstanding"))).toBeUndefined();
  });

  it("separates outstanding deposits from appointment balances and real invoices", () => {
    const items = buildAttentionItems({
      setupComplete: true,
      failedCommunicationsToday: 0,
      outstandingDepositsCount: 2,
      outstandingInvoicesCount: 1,
      outstandingAppointmentBalancesCount: 4,
      unassignedTodayCount: 0,
      pendingConfirmations: 0,
      cancelledTodayCount: 0,
      commerceSchemaReady: true,
    });
    expect(items.map((i) => i.id)).toEqual([
      "outstanding-deposits",
      "outstanding-appointment-balances",
      "outstanding-invoices",
    ]);
    expect(items[0]?.title).toBe("2 outstanding deposits");
    expect(items[0]?.why).toMatch(/Required deposits still due now/);
    expect(items[1]?.title).toBe("4 outstanding appointment balances");
    expect(items[2]?.title).toBe("1 open invoice");
    expect(items[2]?.why).toMatch(/not unpaid bookings/);
  });
});

describe("Command Centre Summer facts", () => {
  it("emits only factual appointment and balance statements", () => {
    const facts = buildSummerFacts({
      appointmentsToday: 4,
      outstandingBalanceCount: 2,
      failedCommunicationsToday: 1,
      nextAppointmentClock: "2:00 PM",
      pendingConfirmations: 1,
    });
    expect(facts.some((f) => f.text.includes("4 appointments"))).toBe(true);
    expect(facts.some((f) => f.text.includes("2:00 PM"))).toBe(true);
    expect(facts.some((f) => f.text.includes("outstanding balances"))).toBe(
      true,
    );
    expect(facts.some((f) => f.kind === "suggestion")).toBe(true);
    expect(
      facts.every(
        (f) =>
          !/confidence|predict|forecast|recommend investing/i.test(f.text),
      ),
    ).toBe(true);
  });

  it("skips appointment facts when count is unavailable", () => {
    const facts = buildSummerFacts({
      appointmentsToday: null,
      outstandingBalanceCount: 0,
      failedCommunicationsToday: null,
      nextAppointmentClock: null,
      pendingConfirmations: 0,
    });
    expect(facts).toHaveLength(0);
  });
});

describe("Command Centre quick-action routes", () => {
  it("keeps supported operational destinations", () => {
    const routes = [
      "/dashboard/calendar?view=day&book=1",
      "/dashboard/clients",
      "/dashboard/payments",
      "/dashboard/calendar?view=day",
      "/dashboard/ai-workforce/summer",
      "/dashboard/notifications",
      "/dashboard/business",
    ];
    for (const href of routes) {
      expect(href.startsWith("/dashboard")).toBe(true);
    }
  });
});
