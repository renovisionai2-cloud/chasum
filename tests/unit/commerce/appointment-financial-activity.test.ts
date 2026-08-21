import { describe, expect, it } from "vitest";
import {
  classifyPaymentKind,
  mapTransactionsToFinancialActivity,
} from "@/lib/commerce/appointment-financial-activity";
import type { CommerceTransaction } from "@/lib/commerce/types";

function tx(
  overrides: Partial<CommerceTransaction> & Pick<CommerceTransaction, "id">,
): CommerceTransaction {
  return {
    businessId: "biz",
    customerId: "cust",
    appointmentId: "appt",
    invoiceId: null,
    kind: "deposit",
    status: "succeeded",
    method: "e_transfer",
    amountCents: 5000,
    currency: "CAD",
    provider: "manual",
    providerReference: null,
    providerPaymentIntentId: null,
    description: "booking:idem-1",
    occurredAt: "2026-08-03T20:00:00.000Z",
    createdAt: "2026-08-03T20:00:00.000Z",
    ...overrides,
  };
}

describe("appointment financial activity", () => {
  it("maps a deposit into a readable drawer entry", () => {
    const activity = mapTransactionsToFinancialActivity({
      appointmentId: "appt",
      timezone: "America/Toronto",
      appointmentTotalCents: 23600,
      transactions: [tx({ id: "tx-1" })],
      changeLogByTransactionId: {
        "tx-1": { source: "booking_confirm" },
      },
    });

    expect(activity.items).toHaveLength(1);
    const item = activity.items[0]!;
    expect(item.title).toBe("Deposit recorded");
    expect(item.amountLabel).toContain("50");
    expect(item.methodLabel).toBe("E-Transfer");
    expect(item.paymentType).toBe("deposit");
    expect(item.sourceLabel).toBe("Recorded from Reception");
    expect(item.note).toBeNull();
    expect(item.occurredAtLabel.length).toBeGreaterThan(4);
  });

  it("dedupes by transaction id", () => {
    const activity = mapTransactionsToFinancialActivity({
      appointmentId: "appt",
      timezone: "UTC",
      transactions: [tx({ id: "tx-1" }), tx({ id: "tx-1" })],
    });
    expect(activity.items).toHaveLength(1);
  });

  it("classifies full vs partial payments", () => {
    expect(classifyPaymentKind("payment", 23600, 23600)).toBe("full_payment");
    expect(classifyPaymentKind("payment", 5000, 23600)).toBe(
      "partial_payment",
    );
    expect(classifyPaymentKind("refund", 5000, 23600)).toBe("refund");
  });

  it("returns empty list when no successful payments", () => {
    const activity = mapTransactionsToFinancialActivity({
      appointmentId: "appt",
      timezone: "UTC",
      transactions: [tx({ id: "tx-fail", status: "failed" })],
    });
    expect(activity.items).toHaveLength(0);
  });
});
