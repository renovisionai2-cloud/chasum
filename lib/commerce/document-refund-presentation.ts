/**
 * Phase 6.2B — invoice/receipt refund read-model.
 *
 * Does not rewrite cash, receipts, or invoice totals.
 * A refund is a separate commerce event — not a new invoice and not an
 * automatic "reopen for collection" signal on the invoice document.
 *
 * Appointment collectible remaining remains the money-contract SoT for Collect.
 * Stored commerce_invoices.balance_cents may still follow total − (paid − refunded);
 * presentation must not treat that column as "customer now owes this again"
 * merely because a refund posted.
 */

import { INVOICE_STATUS_UI, isGrossCollectionStatus } from "@/lib/commerce/money-contract";

export function invoiceNetPaidCents(
  amountPaidCents: number,
  amountRefundedCents: number,
): number {
  return Math.max(0, amountPaidCents - Math.max(0, amountRefundedCents));
}

export function invoiceStatusPresentation(input: {
  storedStatus: string;
  amountPaidCents: number;
  amountRefundedCents: number;
}): string {
  const paid = Math.max(0, input.amountPaidCents);
  const refunded = Math.max(0, input.amountRefundedCents);
  const net = invoiceNetPaidCents(paid, refunded);
  if (input.storedStatus === "void") return INVOICE_STATUS_UI.void;
  if (input.storedStatus === "draft") return INVOICE_STATUS_UI.draft;
  if (refunded > 0 && net <= 0 && paid > 0) return INVOICE_STATUS_UI.refunded;
  if (refunded > 0 && net > 0) return "Partially refunded";
  return INVOICE_STATUS_UI[input.storedStatus as keyof typeof INVOICE_STATUS_UI]
    ?? input.storedStatus;
}

export function invoiceRefundPresentation(input: {
  totalCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  storedBalanceCents: number;
  storedStatus: string;
  collectibleRemainingCents: number;
}): {
  invoiceTotalCents: number;
  paymentsReceivedCents: number;
  refundedCents: number;
  netPaidCents: number;
  storedLedgerBalanceCents: number;
  collectibleRemainingCents: number;
  statusLabel: string;
  dueOnInvoiceCents: number;
  refundReopensInvoiceDebt: false;
} {
  const paymentsReceivedCents = Math.max(0, input.amountPaidCents);
  const refundedCents = Math.max(0, input.amountRefundedCents);
  const netPaidCents = invoiceNetPaidCents(paymentsReceivedCents, refundedCents);
  return {
    invoiceTotalCents: Math.max(0, input.totalCents),
    paymentsReceivedCents,
    refundedCents,
    netPaidCents,
    storedLedgerBalanceCents: Math.max(0, input.storedBalanceCents),
    collectibleRemainingCents: Math.max(0, input.collectibleRemainingCents),
    statusLabel: invoiceStatusPresentation({
      storedStatus: input.storedStatus,
      amountPaidCents: paymentsReceivedCents,
      amountRefundedCents: refundedCents,
    }),
    // Invoice document due amount is not auto-reopened by refunds.
    dueOnInvoiceCents: 0,
    refundReopensInvoiceDebt: false,
  };
}

export function receiptRefundPresentation(input: {
  originalPaymentCents: number;
  refundedFromThisPaymentCents: number;
}): {
  originalPaymentCents: number;
  refundedFromThisPaymentCents: number;
  netRetainedCents: number;
} {
  const original = Math.max(0, input.originalPaymentCents);
  const refunded = Math.min(original, Math.max(0, input.refundedFromThisPaymentCents));
  return {
    originalPaymentCents: original,
    refundedFromThisPaymentCents: refunded,
    netRetainedCents: Math.max(0, original - refunded),
  };
}

/** Running cash-in after a specific payment/deposit (historical; ignores later refunds). */
export function runningCashInAfterTransaction(
  txs: Array<{
    id: string;
    status: string;
    kind: string;
    amountCents: number;
    occurredAt: string;
  }>,
  targetTransactionId: string,
): { paidAfterCents: number; found: boolean } {
  const ordered = [...txs].sort((a, b) => {
    if (a.occurredAt < b.occurredAt) return -1;
    if (a.occurredAt > b.occurredAt) return 1;
    return a.id.localeCompare(b.id);
  });
  let running = 0;
  for (const tx of ordered) {
    if (!isGrossCollectionStatus(tx.status)) continue;
    if (tx.kind !== "payment" && tx.kind !== "deposit") continue;
    running += Math.max(0, tx.amountCents);
    if (tx.id === targetTransactionId) {
      return { paidAfterCents: running, found: true };
    }
  }
  return { paidAfterCents: running, found: false };
}
