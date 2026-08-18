import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatStaffFacingInstant } from "@/lib/business/datetime";
import {
  deliveryStatusLabel,
  isRecordedSent,
  recordedDeliveryStatus,
} from "@/lib/commerce/document-delivery-truth";
import {
  appointmentInvoiceLifecycle,
  isCanonicalRow,
  pickCanonicalRow,
} from "@/lib/commerce/document-identity";
import {
  claimOptimisticSequenceNumber,
  countPlusOneRisk,
  formatPaddedDocumentNumber,
  nextPaddedDocumentNumber,
  parsePaddedDocumentNumber,
} from "@/lib/commerce/document-numbering";
import {
  invoiceRefundPresentation,
  invoiceStatusPresentation,
  receiptRefundPresentation,
  runningCashInAfterTransaction,
} from "@/lib/commerce/document-refund-presentation";
import { formatCommerceCivilDate } from "@/lib/commerce/document-dates";
import {
  documentCurrencyMismatch,
  formatDocumentMoneyCents,
} from "@/lib/commerce/document-currency";
import {
  invoiceWorkspacePath,
  receiptWorkspacePath,
} from "@/lib/commerce/document-paths";
import { isUniqueViolation } from "@/lib/supabase/errors";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const GVM = {
  subtotal: 23600,
  tax: 3068,
  total: 26668,
  deposit: 5000,
  remainder: 21668,
};

describe("Phase 6.2B — numbering integrity", () => {
  it("formats and parses INV/RCT padded numbers", () => {
    expect(formatPaddedDocumentNumber("INV", 33)).toBe("INV-0033");
    expect(formatPaddedDocumentNumber("RCT", 6)).toBe("RCT-0006");
    expect(parsePaddedDocumentNumber("RCT-0006", "RCT")).toBe(6);
    expect(parsePaddedDocumentNumber("INV-0033", "INV")).toBe(33);
  });

  it("allocates the next receipt number from max, not count(*)+1", () => {
    expect(
      nextPaddedDocumentNumber(
        ["RCT-0001", "RCT-0002", "RCT-0006"],
        "RCT",
      ),
    ).toBe("RCT-0007");
    const reuse = countPlusOneRisk({
      remainingCount: 5,
      maxExistingNumber: 6,
    });
    expect(reuse.wouldReuse).toBe(true);
    expect(reuse.countPlusOne).toBe(6);
    expect(reuse.maxPlusOne).toBe(7);
  });

  it("does not reuse a number after a deleted earlier receipt when using max+1", () => {
    expect(
      nextPaddedDocumentNumber(["RCT-0001", "RCT-0006"], "RCT"),
    ).toBe("RCT-0007");
  });

  it("lost sequence CAS must retry and must not emit the same n", () => {
    expect(
      claimOptimisticSequenceNumber({ observedNext: 6, updatedRows: 0 }),
    ).toEqual({ claimed: null, retry: true });
    expect(
      claimOptimisticSequenceNumber({ observedNext: 6, updatedRows: 1 }),
    ).toEqual({ claimed: 6, retry: false });
  });

  it("invoice allocate uses CAS on next_number; receipt allocate no longer uses count(*)", () => {
    const invoices = read("lib/commerce/invoices.ts");
    const receipts = read("lib/commerce/receipts.ts");
    expect(invoices).toContain('.eq("next_number", n)');
    expect(invoices).toContain("isUniqueViolation");
    expect(receipts).not.toContain('count: "exact"');
    expect(receipts).toContain("nextPaddedDocumentNumber");
    expect(receipts).toContain("isUniqueViolation");
  });

  it("does not rewrite historical RCT-0001 / RCT-0002 / RCT-0006", () => {
    const receipts = read("lib/commerce/receipts.ts");
    expect(receipts).not.toContain("RCT-0001");
    expect(receipts).not.toContain("RCT-0006");
  });
});

describe("Phase 6.2B — document identity", () => {
  it("picks the earliest invoice/receipt as canonical and does not delete extras", () => {
    const rows = [
      { id: "later", created_at: "2026-08-18T18:00:00.000Z" },
      { id: "earlier", created_at: "2026-08-18T17:00:00.000Z" },
    ];
    const canonical = pickCanonicalRow(
      rows,
      (r) => r.created_at,
      (r) => r.id,
    );
    expect(canonical?.id).toBe("earlier");
    expect(
      isCanonicalRow(rows, rows[0], (r) => r.created_at, (r) => r.id),
    ).toBe(false);
    expect(read("lib/commerce/invoices.ts")).not.toContain(".delete(");
    expect(read("lib/commerce/receipts.ts")).not.toMatch(
      /from\("commerce_receipts"\)[\s\S]{0,80}\.delete\(/,
    );
  });

  it("repeated create looks up existing appointment invoices and payment receipts", () => {
    expect(read("lib/commerce/invoices.ts")).toContain(
      "loadInvoicesForAppointment",
    );
    expect(read("lib/commerce/receipts.ts")).toContain(
      "loadReceiptsForTransaction",
    );
  });

  it("classifies appointment → invoice lifecycle without voiding or deleting", () => {
    expect(
      appointmentInvoiceLifecycle({
        hasInvoice: false,
        invoiceStatus: null,
        amountRefundedCents: 0,
        appointmentStatus: "confirmed",
      }),
    ).toBe("none");
    expect(
      appointmentInvoiceLifecycle({
        hasInvoice: true,
        invoiceStatus: "open",
        amountRefundedCents: 0,
        appointmentStatus: "confirmed",
      }),
    ).toBe("open");
    expect(
      appointmentInvoiceLifecycle({
        hasInvoice: true,
        invoiceStatus: "paid",
        amountRefundedCents: 0,
        appointmentStatus: "confirmed",
      }),
    ).toBe("paid");
    expect(
      appointmentInvoiceLifecycle({
        hasInvoice: true,
        invoiceStatus: "paid",
        amountRefundedCents: 2500,
        appointmentStatus: "confirmed",
      }),
    ).toBe("refunded_or_adjusted");
    expect(
      appointmentInvoiceLifecycle({
        hasInvoice: true,
        invoiceStatus: "paid",
        amountRefundedCents: 0,
        appointmentStatus: "cancelled",
      }),
    ).toBe("cancelled_with_invoice");
  });
});

describe("Phase 6.2B — refund presentation", () => {
  it("partial $25 refund shows net paid without implying retained full cash", () => {
    const view = invoiceRefundPresentation({
      totalCents: GVM.total,
      amountPaidCents: GVM.total,
      amountRefundedCents: 2500,
      storedBalanceCents: 2500,
      storedStatus: "partial",
      collectibleRemainingCents: 2500,
    });
    expect(view.invoiceTotalCents).toBe(26668);
    expect(view.paymentsReceivedCents).toBe(26668);
    expect(view.refundedCents).toBe(2500);
    expect(view.netPaidCents).toBe(24168);
    expect(view.dueOnInvoiceCents).toBe(0);
    expect(view.refundReopensInvoiceDebt).toBe(false);
    expect(view.statusLabel).toBe("Partially refunded");
  });

  it("full $266.68 refund keeps invoice total and does not invent a new invoice debt", () => {
    const view = invoiceRefundPresentation({
      totalCents: GVM.total,
      amountPaidCents: GVM.total,
      amountRefundedCents: GVM.total,
      storedBalanceCents: GVM.total,
      storedStatus: "refunded",
      collectibleRemainingCents: 0,
    });
    expect(view.netPaidCents).toBe(0);
    expect(view.refundedCents).toBe(26668);
    expect(view.statusLabel).toBe("Refunded");
    expect(view.dueOnInvoiceCents).toBe(0);
    expect(view.refundReopensInvoiceDebt).toBe(false);
  });

  it("deposit-only refund and final-payment refund stay distinct cash events", () => {
    expect(GVM.deposit + GVM.remainder).toBe(GVM.total);
    const afterDepositRefund = invoiceRefundPresentation({
      totalCents: GVM.total,
      amountPaidCents: GVM.total,
      amountRefundedCents: GVM.deposit,
      storedBalanceCents: GVM.deposit,
      storedStatus: "partial",
      collectibleRemainingCents: GVM.deposit,
    });
    expect(afterDepositRefund.netPaidCents).toBe(GVM.remainder);
    const afterFinalRefund = invoiceRefundPresentation({
      totalCents: GVM.total,
      amountPaidCents: GVM.total,
      amountRefundedCents: GVM.remainder,
      storedBalanceCents: GVM.remainder,
      storedStatus: "partial",
      collectibleRemainingCents: GVM.remainder,
    });
    expect(afterFinalRefund.netPaidCents).toBe(GVM.deposit);
  });

  it("original receipt amounts stay historical after a later refund", () => {
    const rec = receiptRefundPresentation({
      originalPaymentCents: GVM.remainder,
      refundedFromThisPaymentCents: 2500,
    });
    expect(rec.originalPaymentCents).toBe(21668);
    expect(rec.refundedFromThisPaymentCents).toBe(2500);
    expect(rec.netRetainedCents).toBe(19168);
    const full = receiptRefundPresentation({
      originalPaymentCents: GVM.remainder,
      refundedFromThisPaymentCents: GVM.remainder,
    });
    expect(full.originalPaymentCents).toBe(21668);
    expect(full.netRetainedCents).toBe(0);
  });

  it("historical running cash-in ignores later refunds", () => {
    const running = runningCashInAfterTransaction(
      [
        {
          id: "dep",
          status: "succeeded",
          kind: "deposit",
          amountCents: 5000,
          occurredAt: "2026-08-18T12:00:00.000Z",
        },
        {
          id: "final",
          status: "succeeded",
          kind: "payment",
          amountCents: 21668,
          occurredAt: "2026-08-18T13:00:00.000Z",
        },
        {
          id: "ref",
          status: "succeeded",
          kind: "refund",
          amountCents: 2500,
          occurredAt: "2026-08-18T14:00:00.000Z",
        },
      ],
      "final",
    );
    expect(running.found).toBe(true);
    expect(running.paidAfterCents).toBe(26668);
  });

  it("paid-in-full invoice status becomes Partially refunded after a partial refund, not Paid", () => {
    expect(
      invoiceStatusPresentation({
        storedStatus: "paid",
        amountPaidCents: 26668,
        amountRefundedCents: 2500,
      }),
    ).toBe("Partially refunded");
  });
});

describe("Phase 6.2B — currency, dates, print, navigation, delivery", () => {
  it("keeps historical USD mismatch labeled and CAD normal", () => {
    expect(documentCurrencyMismatch("usd", "cad")).toBe(true);
    expect(formatDocumentMoneyCents(24860, "usd", "cad")).toContain("USD");
    expect(formatDocumentMoneyCents(26668, "cad", "cad")).not.toContain("USD");
    expect(formatDocumentMoneyCents(26668, "cad", "cad")).toContain("266.68");
  });

  it("formats civil invoice dates from YYYY-MM-DD parts", () => {
    expect(formatCommerceCivilDate("2026-08-18")).toBe("Aug 18, 2026");
    expect(
      formatStaffFacingInstant("2026-08-18T16:00:00.000Z", "America/Toronto"),
    ).toContain("12:00 PM");
  });

  it("print contract still hides chrome and keeps one-page helpers", () => {
    const css = read("app/globals.css");
    const inv = read("components/commerce/invoice-document.tsx");
    const rec = read("components/commerce/receipt-document.tsx");
    const shell = read("components/dashboard/shell.tsx");
    expect(css).toContain("size: letter");
    expect(inv).toContain("commerce-print-keep");
    expect(inv).toContain("print:hidden");
    expect(inv).toContain("break-words");
    expect(rec).toContain("print:hidden");
    expect(rec).toContain("break-words");
    expect(shell).toContain("print:hidden");
  });

  it("staff navigation uses INV-/RCT- not raw document UUIDs", () => {
    expect(invoiceWorkspacePath("INV-0033")).toContain("INV-0033");
    expect(receiptWorkspacePath("RCT-0006")).toContain("RCT-0006");
    expect(invoiceWorkspacePath("INV-0033")).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i,
    );
    const dash = read("components/commerce/payments-dashboard.tsx");
    const billing = read("components/commerce/customer-commerce-panel.tsx");
    const appt = read("components/booking-sheet/appointment-operating-view.tsx");
    expect(dash).toContain("invoiceWorkspacePath");
    expect(dash).toContain("receiptWorkspacePath");
    expect(billing).toContain("invoiceWorkspacePath");
    expect(billing).toContain("receiptWorkspacePath");
    expect(appt).toContain("invoiceWorkspacePath");
  });

  it("never labels queued or failed delivery as Sent", () => {
    expect(
      recordedDeliveryStatus({ hasRecipient: true, logStatus: "queued" }),
    ).toBe("never_sent");
    expect(
      recordedDeliveryStatus({
        hasRecipient: true,
        rowEmailStatus: "queued",
      }),
    ).toBe("queued");
    expect(
      isRecordedSent(
        recordedDeliveryStatus({
          hasRecipient: true,
          rowEmailStatus: "queued",
        }),
      ),
    ).toBe(false);
    expect(
      recordedDeliveryStatus({
        hasRecipient: true,
        logStatus: "failed",
      }),
    ).toBe("failed");
    expect(
      recordedDeliveryStatus({
        hasRecipient: false,
        rowEmailStatus: "not_sent",
      }),
    ).toBe("no_recipient");
    expect(
      isRecordedSent(
        recordedDeliveryStatus({
          hasRecipient: true,
          logStatus: "sent",
        }),
      ),
    ).toBe(true);
    expect(deliveryStatusLabel("queued")).toBe("Queued");
    expect(deliveryStatusLabel("sent")).toBe("Sent");
  });

  it("detects unique violations without treating them as schema gaps", () => {
    expect(isUniqueViolation({ code: "23505", message: "duplicate key" })).toBe(
      true,
    );
    expect(isUniqueViolation({ message: "unique constraint" })).toBe(true);
    expect(isUniqueViolation({ message: "schema cache" })).toBe(false);
  });

  it("invoice email failure still does not write money columns", () => {
    const src = read("lib/commerce/invoice-email.ts");
    expect(src).not.toContain("amount_paid_cents");
    expect(src).not.toContain(".update(");
  });
});
