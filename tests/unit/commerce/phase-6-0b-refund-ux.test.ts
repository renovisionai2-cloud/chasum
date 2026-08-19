import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  alreadyRefundedCents,
  humanizeRefundError,
  isRefundableTransaction,
  remainingRefundableCents,
} from "@/lib/commerce/refundability";
import type { CommerceRefund, CommerceTransaction } from "@/lib/commerce/types";
import { isGrossCollectionTransaction } from "@/lib/commerce/money-contract";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function tx(
  overrides: Partial<CommerceTransaction> = {},
): CommerceTransaction {
  return {
    id: "tx-1",
    businessId: "biz",
    customerId: "cust",
    appointmentId: "appt-1",
    invoiceId: null,
    kind: "payment",
    status: "succeeded",
    method: "cash",
    amountCents: 10000,
    currency: "cad",
    provider: "manual",
    providerReference: null,
    providerPaymentIntentId: null,
    description: null,
    occurredAt: "2026-08-12T12:00:00.000Z",
    createdAt: "2026-08-12T12:00:00.000Z",
    ...overrides,
  };
}

function refund(
  overrides: Partial<CommerceRefund> = {},
): CommerceRefund {
  return {
    id: "rf-1",
    businessId: "biz",
    customerId: "cust",
    transactionId: "tx-1",
    invoiceId: null,
    appointmentId: "appt-1",
    amountCents: 2500,
    currency: "cad",
    reason: "Customer request",
    refundType: "partial",
    approvalStatus: "approved",
    status: "succeeded",
    providerReference: null,
    createdAt: "2026-08-12T13:00:00.000Z",
    ...overrides,
  };
}

describe("Phase 6.0B transaction-linked refund", () => {
  it("refundable payment/deposit exposes refundability", () => {
    expect(isRefundableTransaction(tx())).toBe(true);
    expect(isRefundableTransaction(tx({ kind: "deposit" }))).toBe(true);
    expect(isRefundableTransaction(tx({ kind: "refund" }))).toBe(false);
    expect(isRefundableTransaction(tx({ status: "refunded" }))).toBe(false);
  });

  it("Payments UI opens refund from transaction row without raw ID input", () => {
    const dash = read("components/commerce/payments-dashboard.tsx");
    const sheet = read("components/commerce/refund-transaction-sheet.tsx");
    expect(dash).toContain("RefundTransactionSheet");
    expect(dash).toContain("setRefundTarget(tx)");
    expect(dash).toMatch(/>\s*Refund\s*</);
    expect(dash).not.toMatch(/placeholder="Transaction ID"/);
    expect(sheet).toContain('name="transaction_id"');
    expect(sheet).toContain("type=\"hidden\"");
    expect(sheet).toContain("Confirm refund");
  });

  it("full refund uses remaining refundable amount", () => {
    expect(remainingRefundableCents(tx(), [])).toBe(10000);
  });

  it("partial refund reduces remaining", () => {
    expect(remainingRefundableCents(tx(), [refund({ amountCents: 4000 })])).toBe(
      6000,
    );
  });

  it("second partial stays within remaining", () => {
    const refunds = [
      refund({ id: "a", amountCents: 4000 }),
      refund({ id: "b", amountCents: 3000 }),
    ];
    expect(remainingRefundableCents(tx(), refunds)).toBe(3000);
    expect(alreadyRefundedCents("tx-1", refunds)).toBe(7000);
  });

  it("over-refund is blocked by remaining 0", () => {
    expect(
      remainingRefundableCents(tx(), [refund({ amountCents: 10000 })]),
    ).toBe(0);
  });

  it("fully refunded transaction is not refundable", () => {
    const fully = tx({ status: "refunded" });
    expect(isRefundableTransaction(fully)).toBe(false);
  });

  it("multiple payments stay distinct selectable rows", () => {
    const a = tx({ id: "tx-a", amountCents: 5000, method: "credit_card" });
    const b = tx({ id: "tx-b", amountCents: 10000, method: "cash" });
    expect(remainingRefundableCents(a, [])).toBe(5000);
    expect(remainingRefundableCents(b, [])).toBe(10000);
    expect(a.id).not.toBe(b.id);
  });

  it("cancelled appointment payment can still be refundable", () => {
    // Collectibility is separate — refundability is transaction-status based.
    expect(
      isRefundableTransaction(
        tx({ appointmentId: "cancelled-appt", status: "succeeded" }),
      ),
    ).toBe(true);
  });

  it("gross collection semantics unchanged by refund ledger rows", () => {
    expect(isGrossCollectionTransaction(tx())).toBe(true);
    expect(
      isGrossCollectionTransaction(tx({ kind: "refund", status: "succeeded" })),
    ).toBe(false);
  });

  it("humanizes refund errors for operators", () => {
    expect(humanizeRefundError("Refund exceeds remaining amount ($0.00).")).toBe(
      "This payment has already been fully refunded.",
    );
    expect(
      humanizeRefundError("Refund amount exceeds the remaining refundable amount."),
    ).toBe("Refund amount exceeds the remaining refundable amount.");
    expect(humanizeRefundError("relation commerce_refunds does not exist")).toBe(
      "The refund could not be completed.",
    );
  });

  it("engine still powers refundPaymentAction", () => {
    const action = read("lib/actions/commerce.ts");
    expect(action).toContain("processCommerceRefund");
    expect(action).toContain("humanizeRefundError");
    expect(action).toContain("Refunded");
  });

  it("history labels Refund · Succeeded, not Payment with Refund: cancelled", () => {
    const dash = read("components/commerce/payments-dashboard.tsx");
    expect(dash).toContain("ledgerKindLabel");
    expect(dash).toContain("ledgerReasonLabel");
    const helpers = read("lib/commerce/front-desk.ts");
    expect(helpers).toContain('if (kind === "refund") return "Refund"');
    expect(helpers).toContain("Appointment cancelled");
    expect(helpers).toContain("sanitizeStaffFacingText");
    const refunds = read("lib/commerce/refunds.ts");
    expect(refunds).toContain("`Reason: ${reason}`");
    expect(refunds).not.toContain("`Refund: ${input.reason.trim()}`");
  });

  it("appointment-native refund deferred (Payments path first)", () => {
    const activity = read(
      "components/booking/appointment-financial-activity.tsx",
    );
    expect(activity).not.toContain("Confirm refund");
  });
});
