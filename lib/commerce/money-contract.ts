/**
 * Chapter 6 Phase 6.0 / 6.0A — customer-money contract.
 *
 * price_cents = exclusive subtotal
 * tax_cents = tax
 * appointment total = price_cents + tax_cents
 *
 * commerce_transactions is the cash-movement ledger.
 * Appointment columns are operational stamps, not a second ledger.
 * Invoices are documents. Receipts are transaction-bound evidence.
 *
 * Collected (ledger cash-in) ≠ recognized revenue (recognize.ts).
 * Arithmetic remaining ≠ current collectible obligation (Phase 6.0A).
 */

import {
  resolveConfiguredDepositCents,
  resolveDepositDueNowCents,
} from "@/lib/commerce/booking-financials";
import { deriveAppointmentPaymentStatus } from "@/lib/commerce/mappers";
import type {
  AppointmentPaymentStatus,
  CommerceTransaction,
  InvoiceStatus,
  TransactionKind,
  TransactionStatus,
} from "@/lib/commerce/types";

export type AppointmentMoneyStamps = {
  price_cents?: number | null;
  tax_cents?: number | null;
  deposit_cents?: number | null;
  amount_paid_cents?: number | null;
  amount_refunded_cents?: number | null;
  payment_status?: string | null;
  status?: string | null;
  services?: unknown;
  service?: unknown;
};

export type AppointmentMoney = {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  grossPaidCents: number;
  refundedCents: number;
  netPaidCents: number;
  remainingBalanceCents: number;
  depositRequiredCents: number;
  depositCollectedCents: number;
  depositDueNowCents: number;
  paymentStatus: AppointmentPaymentStatus;
};

function asServiceRow(value: unknown): {
  price?: number | null;
  deposit_cents?: number | null;
  deposit_required?: boolean | null;
} | null {
  if (!value) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  return row as {
    price?: number | null;
    deposit_cents?: number | null;
    deposit_required?: boolean | null;
  };
}

function cents(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

/** Exclusive subtotal. Catalog dollars are a fallback when stamps are missing. */
export function appointmentSubtotalCents(
  stamps: AppointmentMoneyStamps,
): number {
  const stamped = cents(stamps.price_cents);
  if (stamped > 0) return stamped;
  const service = asServiceRow(stamps.services ?? stamps.service);
  return Math.round(Number(service?.price ?? 0) * 100) || 0;
}

export function appointmentTaxCents(stamps: AppointmentMoneyStamps): number {
  return cents(stamps.tax_cents);
}

/** Appointment total = exclusive subtotal + tax. Never treat price_cents as total. */
export function appointmentTotalCents(stamps: AppointmentMoneyStamps): number {
  return appointmentSubtotalCents(stamps) + appointmentTaxCents(stamps);
}

export function grossPaidCents(stamps: AppointmentMoneyStamps): number {
  return cents(stamps.amount_paid_cents);
}

export function refundedCents(stamps: AppointmentMoneyStamps): number {
  return cents(stamps.amount_refunded_cents);
}

export function netPaidCents(stamps: AppointmentMoneyStamps): number {
  return Math.max(0, grossPaidCents(stamps) - refundedCents(stamps));
}

export function remainingBalanceCents(stamps: AppointmentMoneyStamps): number {
  return Math.max(0, appointmentTotalCents(stamps) - netPaidCents(stamps));
}

export function depositRequiredCents(stamps: AppointmentMoneyStamps): number {
  const service = asServiceRow(stamps.services ?? stamps.service);
  return resolveConfiguredDepositCents({
    appointmentDepositCents: stamps.deposit_cents,
    serviceDepositCents: service?.deposit_cents,
    serviceDepositRequired: service?.deposit_required,
    appointmentTotalCents: appointmentTotalCents(stamps),
  });
}

export function depositCollectedCents(stamps: AppointmentMoneyStamps): number {
  const required = depositRequiredCents(stamps);
  return resolveDepositDueNowCents({
    depositRequiredCents: required,
    netPaidCents: netPaidCents(stamps),
  }).amountPaidTowardDepositCents;
}

export function depositDueNowCents(stamps: AppointmentMoneyStamps): number {
  const required = depositRequiredCents(stamps);
  return resolveDepositDueNowCents({
    depositRequiredCents: required,
    netPaidCents: netPaidCents(stamps),
  }).depositDueNowCents;
}

export function appointmentMoneyFromStamps(
  stamps: AppointmentMoneyStamps,
): AppointmentMoney {
  const subtotalCents = appointmentSubtotalCents(stamps);
  const taxCents = appointmentTaxCents(stamps);
  const totalCents = subtotalCents + taxCents;
  const paid = grossPaidCents(stamps);
  const refunded = refundedCents(stamps);
  const net = Math.max(0, paid - refunded);
  const required = depositRequiredCents(stamps);
  const due = resolveDepositDueNowCents({
    depositRequiredCents: required,
    netPaidCents: net,
  });
  return {
    subtotalCents,
    taxCents,
    totalCents,
    grossPaidCents: paid,
    refundedCents: refunded,
    netPaidCents: net,
    remainingBalanceCents: Math.max(0, totalCents - net),
    depositRequiredCents: required,
    depositCollectedCents: due.amountPaidTowardDepositCents,
    depositDueNowCents: due.depositDueNowCents,
    paymentStatus: deriveAppointmentPaymentStatus({
      priceCents: totalCents,
      depositRequiredCents: required,
      amountPaidCents: paid,
      amountRefundedCents: refunded,
    }),
  };
}

/**
 * Phase 6.0A — lifecycle collectibility.
 * Arithmetic remaining/deposit helpers stay amount-truth.
 * Cancelled appointments are not collectible (no cancellation-fee policy yet).
 * No-show collectibility is unchanged until an explicit PO decision.
 * paymentStatus may be supplied for future policy; cancelled short-circuits first.
 */
export function isAppointmentCollectible(
  status?: string | null,
  paymentStatus?: string | null,
): boolean {
  // paymentStatus reserved for future cancellation/no-show fee policy.
  void paymentStatus;
  if (status === "cancelled") return false;
  return true;
}

/** Current collectible remaining balance (0 when not collectible). */
export function collectibleRemainingBalanceCents(
  stamps: AppointmentMoneyStamps,
): number {
  if (!isAppointmentCollectible(stamps.status, stamps.payment_status)) {
    return 0;
  }
  return remainingBalanceCents(stamps);
}

/** Current collectible deposit due now (0 when not collectible). */
export function collectibleDepositDueNowCents(
  stamps: AppointmentMoneyStamps,
): number {
  if (!isAppointmentCollectible(stamps.status, stamps.payment_status)) {
    return 0;
  }
  return depositDueNowCents(stamps);
}

export type AppointmentCollectibleMoney = AppointmentMoney & {
  collectibleRemainingBalanceCents: number;
  collectibleDepositDueNowCents: number;
  isCollectible: boolean;
};

export function appointmentCollectibleMoneyFromStamps(
  stamps: AppointmentMoneyStamps,
): AppointmentCollectibleMoney {
  const money = appointmentMoneyFromStamps(stamps);
  const isCollectible = isAppointmentCollectible(
    stamps.status,
    stamps.payment_status,
  );
  return {
    ...money,
    isCollectible,
    collectibleRemainingBalanceCents: isCollectible
      ? money.remainingBalanceCents
      : 0,
    collectibleDepositDueNowCents: isCollectible
      ? money.depositDueNowCents
      : 0,
  };
}

/** Amounts for a newly created commerce invoice from appointment stamps. */
export function invoiceAmountsFromAppointmentStamps(
  stamps: AppointmentMoneyStamps,
): {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  amountPaidCents: number;
  balanceCents: number;
} {
  const money = appointmentMoneyFromStamps(stamps);
  return {
    subtotalCents: money.subtotalCents,
    taxCents: money.taxCents,
    totalCents: money.totalCents,
    amountPaidCents: money.netPaidCents,
    balanceCents: money.remainingBalanceCents,
  };
}

/** Succeeded payment + deposit ledger rows. Refunds are never cash-in. */
export function isGrossCollectionTransaction(
  tx: Pick<CommerceTransaction, "status" | "kind">,
): boolean {
  if (tx.status !== "succeeded") return false;
  return tx.kind === "payment" || tx.kind === "deposit";
}

/** Succeeded deposit ledger rows — a subset of gross payments collected. */
export function isGrossDepositTransaction(
  tx: Pick<CommerceTransaction, "status" | "kind">,
): boolean {
  return tx.status === "succeeded" && tx.kind === "deposit";
}

export function sumGrossPaymentsCollectedCents(
  txs: Array<Pick<CommerceTransaction, "status" | "kind" | "amountCents">>,
): number {
  return txs
    .filter(isGrossCollectionTransaction)
    .reduce((sum, tx) => sum + Math.max(0, tx.amountCents), 0);
}

/** Real commerce invoice ids are UUIDs. Synthetic `appt:` rows are not invoices. */
export function isCommerceInvoiceRecord(id: string): boolean {
  return Boolean(id) && !id.startsWith("appt:");
}

export function isOutstandingInvoiceStatus(status: InvoiceStatus | string): boolean {
  if (["paid", "void", "refunded"].includes(status)) return false;
  return true;
}

export const GROSS_PAYMENTS_COLLECTED_LABEL = "Gross payments collected";

export const APPOINTMENT_PAYMENT_STATUS_UI: Record<
  AppointmentPaymentStatus,
  string
> = {
  unpaid: "Unpaid",
  deposit_required: "Deposit required",
  deposit_paid: "Deposit paid",
  partially_paid: "Outstanding balance",
  fully_paid: "Paid in full",
  refunded: "Refunded",
  voided: "Voided",
};

export const INVOICE_STATUS_UI: Record<InvoiceStatus, string> = {
  draft: "Draft",
  open: "Open",
  partial: "Partially paid",
  paid: "Paid",
  void: "Void",
  refunded: "Refunded",
  overdue: "Overdue",
};

export const TRANSACTION_STATUS_UI: Record<TransactionStatus, string> = {
  pending: "Pending",
  requires_action: "Needs action",
  succeeded: "Succeeded",
  failed: "Didn't go through",
  canceled: "Canceled",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export const TRANSACTION_KIND_UI: Record<TransactionKind, string> = {
  payment: "Payment",
  deposit: "Deposit",
  refund: "Refund",
  void: "Void",
  adjustment: "Adjustment",
  store_credit: "Store credit",
  gift_card: "Gift certificate",
};
