import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  containsInternalIdentifier,
  ledgerKindLabel,
  ledgerReasonLabel,
  sanitizeStaffFacingText,
} from "@/lib/commerce/front-desk";
import {
  collectibleRemainingBalanceCents,
  isCommerceInvoiceRecord,
  isGrossCollectionTransaction,
  isGrossDepositTransaction,
  sumGrossPaymentsCollectedCents,
} from "@/lib/commerce/money-contract";
import { appointmentRecognizedCents } from "@/lib/commerce/recognize";
import { buildFinancial } from "@/lib/reports/compute";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Phase 6.1A financial semantics", () => {
  it("gross collected is succeeded payment + deposit cash-in", () => {
    const txs = [
      { status: "succeeded", kind: "payment", amountCents: 20000 },
      { status: "succeeded", kind: "deposit", amountCents: 5000 },
      { status: "succeeded", kind: "refund", amountCents: 5000 },
      { status: "failed", kind: "payment", amountCents: 999 },
    ];
    expect(sumGrossPaymentsCollectedCents(txs)).toBe(25000);
    expect(isGrossCollectionTransaction(txs[2])).toBe(false);
  });

  it("refunds do not reduce gross collected", () => {
    const before = sumGrossPaymentsCollectedCents([
      { status: "succeeded", kind: "payment", amountCents: 10000 },
    ]);
    const after = sumGrossPaymentsCollectedCents([
      { status: "succeeded", kind: "payment", amountCents: 10000 },
      { status: "succeeded", kind: "refund", amountCents: 10000 },
    ]);
    expect(after).toBe(before);
  });

  it("cancelled appointments do not create collectible balance", () => {
    expect(
      collectibleRemainingBalanceCents({
        price_cents: 20000,
        tax_cents: 0,
        amount_paid_cents: 0,
        payment_status: "unpaid",
        status: "cancelled",
      }),
    ).toBe(0);
  });

  it("deposit due now uses collectible helper in dashboard and queues", () => {
    const dash = read("lib/commerce/dashboard.ts");
    const queues = read("lib/commerce/front-desk-queries.ts");
    expect(dash).toContain("collectibleDepositDueNowCents");
    expect(queues).toContain("depositDueNowCents > 0");
  });

  it("outstanding invoices use commerce invoices only", () => {
    expect(isCommerceInvoiceRecord("appt:abc")).toBe(false);
    expect(isCommerceInvoiceRecord("11111111-1111-4111-8111-111111111111")).toBe(
      true,
    );
    expect(read("lib/commerce/dashboard.ts")).toContain("isCommerceInvoiceRecord");
  });

  it("Payments and Reports Executive monthly gross share commerce snapshot", () => {
    const reports = read("lib/actions/reports.ts");
    expect(reports).toContain("getCommerceDashboardSnapshot");
    expect(reports).toContain(
      "paymentsMonthDollars = commerceSnap.revenueMonthCents / 100",
    );
    expect(read("lib/commerce/dashboard.ts")).toContain("startOfBusinessMonth");
  });

  it("customer balances due counts customers; payments counts appointments", () => {
    expect(read("lib/crm/customer-health.ts")).toContain("withBalances");
    expect(read("components/crm/customer-overview-panel.tsx")).toContain(
      "Customers with balances due",
    );
    expect(read("components/commerce/payments-dashboard.tsx")).toContain(
      "appointments",
    );
  });

  it("queues do not mix invoices into appointment balances", () => {
    const dash = read("components/commerce/payments-dashboard.tsx");
    expect(dash).toContain("Outstanding appointment balances");
    expect(dash).toContain("Commerce invoices only");
  });

  it("recognized revenue stays distinct from gross collected", () => {
    expect(
      appointmentRecognizedCents({
        status: "completed",
        price_cents: 10000,
        amount_paid_cents: 0,
      }),
    ).toBe(10000);
    expect(
      isGrossCollectionTransaction({
        status: "succeeded",
        kind: "payment",
      }),
    ).toBe(true);
    const hub = read("components/reports/reports-hub.tsx");
    expect(hub).toContain("Recognized appointment value");
    expect(hub).toContain("not Gross payments collected");
  });

  it("financial overlay treats deposits as a subset of payments collected", () => {
    const report = buildFinancial([], [], new Date("2026-08-14T12:00:00Z"), {
      paymentsCollectedMonthCents: 26668,
      depositsCollectedMonthCents: 5000,
      refundsMonthCents: 5000,
      outstandingAppointmentBalancesCents: 1000,
      outstandingInvoicesCents: 2000,
    });
    expect(report.paymentsIncludeDeposits).toBe(true);
    expect(report.paymentsCents).toBe(26668);
    expect(report.depositsCents).toBe(5000);
    expect(report.depositsCents).toBeLessThan(report.paymentsCents);
    expect(report.invoicesCents).toBe(2000);
    expect(report.outstandingCents).toBe(1000);
    expect(report.invoicesAreOutstandingCommerce).toBe(true);
    expect(report.outstandingAreAppointmentBalances).toBe(true);
  });

  it("deposits are a subset of gross collection", () => {
    expect(
      isGrossDepositTransaction({ status: "succeeded", kind: "deposit" }),
    ).toBe(true);
    expect(
      isGrossCollectionTransaction({ status: "succeeded", kind: "deposit" }),
    ).toBe(true);
  });
});

describe("Phase 6.1A transaction UX", () => {
  it("strips booking refs and UUIDs from staff-facing text", () => {
    expect(
      sanitizeStaffFacingText("booking:bs-123-abc · paid"),
    ).toBe("paid");
    expect(
      containsInternalIdentifier("booking:bs-123-abc"),
    ).toBe(true);
    expect(
      containsInternalIdentifier(
        "11111111-1111-4111-8111-111111111111",
      ),
    ).toBe(true);
    expect(sanitizeStaffFacingText("Elite Package")).toBe("Elite Package");
  });

  it("Payments rows do not render raw booking IDs or UUIDs as labels", () => {
    const dash = read("components/commerce/payments-dashboard.tsx");
    expect(dash).toContain("staffFacingContextLabel");
    expect(dash).not.toContain("booking:bs-");
    expect(dash).toContain("ledgerKindLabel(tx.kind)");
    expect(dash).toContain("PAYMENT_METHOD_LABELS[tx.method]");
    expect(dash).toContain("Refundable");
    expect(dash).toContain("−${money(tx.amountCents)}");
  });

  it("refund reason is distinct from refund status", () => {
    expect(ledgerKindLabel("refund")).toBe("Refund");
    expect(ledgerReasonLabel("Refund: cancelled")).toBe("Appointment cancelled");
    expect(ledgerReasonLabel("booking:bs-xyz")).toBe("");
  });

  it("kind is distinct from method", () => {
    expect(ledgerKindLabel("payment")).toBe("Payment");
    expect(ledgerKindLabel("e_transfer")).toBe("Payment");
  });

  it("filters Payments vs Refunds by kind", () => {
    const dash = read("components/commerce/payments-dashboard.tsx");
    expect(dash).toContain('filter === "payment" && tx.kind !== "payment"');
    expect(dash).toContain('filter === "refund" && tx.kind !== "refund"');
    expect(dash).toContain("Payments and Deposits exclude refunds");
  });

  it("appointment financial activity hides transaction refs", () => {
    const src = read("lib/commerce/appointment-financial-activity.ts");
    expect(src).toContain("const ref = null");
  });
});

describe("Phase 6.1A workflow regression locks", () => {
  it("preserves Collect Payment workspace entry points", () => {
    expect(read("components/commerce/payments-dashboard.tsx")).toContain(
      "CollectPaymentWorkspace",
    );
    expect(read("components/booking-sheet/booking-sheet.tsx")).toContain(
      "CollectPaymentWorkspace",
    );
    expect(read("components/crm/customer-profile.tsx")).toContain(
      "CollectPaymentWorkspace",
    );
    expect(read("components/booking-sheet/payments-section.tsx")).toContain(
      "RefundTransactionSheet",
    );
  });

  it("record payment still sends receipt without reversing on email failure", () => {
    const action = read("lib/actions/commerce.ts");
    expect(action).toContain("sendPaymentReceiptNow");
    expect(action).toContain("assertCollectiblePaymentAmount");
  });

  it("Preview badge stays hidden in production", () => {
    const badge = read("components/system/preview-build-badge.tsx");
    expect(badge).toContain('data.env === "production"');
    expect(badge).toContain("Preview build");
  });
});
