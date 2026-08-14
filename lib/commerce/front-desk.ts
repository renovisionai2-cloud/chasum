/**
 * Phase 6.1 — front-desk payments operating helpers.
 * Does not change the money contract or ledger. Maps stamps + display fields
 * into human collect-payment context (no internal IDs as user input).
 */

import {
  appointmentCollectibleMoneyFromStamps,
  type AppointmentMoneyStamps,
} from "@/lib/commerce/money-contract";
import {
  APPOINTMENT_PAYMENT_STATUS_LABELS,
  type AppointmentPaymentStatus,
  type TransactionKind,
  type TransactionStatus,
} from "@/lib/commerce/types";

export type FrontDeskAppointmentOption = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  serviceName: string;
  startTime: string;
  whenLabel: string;
  locationName: string | null;
  staffName: string | null;
  appointmentStatus: string;
  paymentStatus: AppointmentPaymentStatus;
  paymentStatusLabel: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  refundedCents: number;
  remainingCents: number;
  depositRequiredCents: number;
  depositDueNowCents: number;
  isCollectible: boolean;
};

export type FrontDeskQueueRow = FrontDeskAppointmentOption;

export function formatFrontDeskWhen(
  iso: string,
  timeZone: string,
): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ledgerKindLabel(kind: string): string {
  if (kind === "refund") return "Refund";
  if (kind === "deposit") return "Deposit";
  if (kind === "gift_card") return "Gift card";
  if (kind === "store_credit") return "Store credit";
  if (kind === "adjustment") return "Adjustment";
  if (kind === "void") return "Void";
  return "Payment";
}

export function ledgerReasonLabel(
  description: string | null | undefined,
): string {
  const raw = description?.trim() ?? "";
  if (!raw) return "";
  return raw.replace(/^Refund:\s*/i, "Reason: ");
}

export function transactionStatusLabel(status: string): string {
  const labels: Record<TransactionStatus, string> = {
    pending: "Pending",
    requires_action: "Needs action",
    succeeded: "Succeeded",
    failed: "Didn't go through",
    canceled: "Canceled",
    refunded: "Refunded",
    partially_refunded: "Partially refunded",
  };
  return (
    labels[status as TransactionStatus] ??
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function appointmentPaymentFacingLabel(
  status: AppointmentPaymentStatus,
): string {
  if (status === "unpaid") return "Outstanding balance";
  if (status === "deposit_required") return "Deposit due";
  return APPOINTMENT_PAYMENT_STATUS_LABELS[status];
}

export function assertCollectiblePaymentAmount(input: {
  amountCents: number;
  remainingCents: number;
}): { ok: true } | { ok: false; error: string } {
  if (input.amountCents <= 0) {
    return { ok: false, error: "Enter a payment amount greater than zero." };
  }
  if (input.remainingCents <= 0) {
    return {
      ok: false,
      error: "This appointment has no remaining balance.",
    };
  }
  if (input.amountCents > input.remainingCents) {
    return {
      ok: false,
      error: "The payment amount is greater than the amount due.",
    };
  }
  return { ok: true };
}

export function sortFrontDeskAppointments(
  rows: FrontDeskAppointmentOption[],
): FrontDeskAppointmentOption[] {
  return [...rows].sort((a, b) => {
    if (a.remainingCents !== b.remainingCents) {
      return b.remainingCents - a.remainingCents;
    }
    if (a.depositDueNowCents !== b.depositDueNowCents) {
      return b.depositDueNowCents - a.depositDueNowCents;
    }
    return a.startTime.localeCompare(b.startTime);
  });
}

export function mapFrontDeskAppointment(input: {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string | null;
  serviceName: string;
  startTime: string;
  timeZone: string;
  locationName?: string | null;
  staffName?: string | null;
  appointmentStatus: string;
  stamps: AppointmentMoneyStamps;
}): FrontDeskAppointmentOption {
  const money = appointmentCollectibleMoneyFromStamps({
    ...input.stamps,
    status: input.appointmentStatus,
  });
  return {
    id: input.id,
    customerId: input.customerId,
    customerName: input.customerName,
    customerEmail: input.customerEmail?.trim() || null,
    serviceName: input.serviceName,
    startTime: input.startTime,
    whenLabel: formatFrontDeskWhen(input.startTime, input.timeZone),
    locationName: input.locationName?.trim() || null,
    staffName: input.staffName?.trim() || null,
    appointmentStatus: input.appointmentStatus,
    paymentStatus: money.paymentStatus,
    paymentStatusLabel: appointmentPaymentFacingLabel(money.paymentStatus),
    subtotalCents: money.subtotalCents,
    taxCents: money.taxCents,
    totalCents: money.totalCents,
    paidCents: money.grossPaidCents,
    refundedCents: money.refundedCents,
    remainingCents: money.collectibleRemainingBalanceCents,
    depositRequiredCents: money.depositRequiredCents,
    depositDueNowCents: money.collectibleDepositDueNowCents,
    isCollectible: money.isCollectible,
  };
}

export function humanizePaymentError(
  message: string | null | undefined,
): string {
  const raw = (message ?? "").trim();
  if (!raw) return "This payment could not be recorded.";
  if (/no remaining balance/i.test(raw)) {
    return "This appointment has no remaining balance.";
  }
  if (/greater than the amount due/i.test(raw)) {
    return "The payment amount is greater than the amount due.";
  }
  if (/no email/i.test(raw)) {
    return "The customer has no email address for a receipt.";
  }
  if (/schema cache|does not exist|column/i.test(raw)) {
    return "This payment could not be recorded.";
  }
  if (raw.length > 180) return "This payment could not be recorded.";
  return raw;
}

export function isVisibleLedgerKind(kind: TransactionKind | string): boolean {
  return [
    "payment",
    "deposit",
    "refund",
    "gift_card",
    "store_credit",
    "adjustment",
    "void",
  ].includes(kind);
}
