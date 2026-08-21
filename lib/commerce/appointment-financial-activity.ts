/**
 * Appointment-scoped financial activity for drawer / timeline surfaces.
 * Built from commerce_transactions (authoritative) plus optional change-log
 * payment markers — no schema migration required.
 */

import { formatMoneyCents } from "@/lib/commerce/money";
import type {
  CommerceTransaction,
  TransactionKind,
} from "@/lib/commerce/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/commerce/types";

export type FinancialActivityPaymentType =
  | "deposit"
  | "full_payment"
  | "partial_payment"
  | "refund"
  | "other";

export type AppointmentFinancialActivityItem = {
  id: string;
  /** Stable dedupe key (transaction id preferred). */
  dedupeKey: string;
  title: string;
  amountLabel: string;
  methodLabel: string;
  paymentType: FinancialActivityPaymentType;
  paymentTypeLabel: string;
  sourceLabel: string | null;
  note: string | null;
  transactionRef: string | null;
  occurredAt: string;
  occurredAtLabel: string;
};

export type AppointmentFinancialActivity = {
  appointmentId: string;
  timezone: string;
  items: AppointmentFinancialActivityItem[];
};

function formatInBusinessTimezone(
  iso: string,
  timeZone: string,
): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

function paymentTypeForTransaction(
  tx: CommerceTransaction,
  appointmentTotalCents: number,
): FinancialActivityPaymentType {
  if (tx.kind === "refund") return "refund";
  if (tx.kind === "deposit") return "deposit";
  if (tx.kind === "payment") {
    if (
      appointmentTotalCents > 0 &&
      tx.amountCents >= appointmentTotalCents
    ) {
      return "full_payment";
    }
    return "partial_payment";
  }
  return "other";
}

function titleForType(type: FinancialActivityPaymentType): string {
  switch (type) {
    case "deposit":
      return "Deposit recorded";
    case "full_payment":
      return "Payment recorded";
    case "partial_payment":
      return "Partial payment recorded";
    case "refund":
      return "Refund recorded";
    default:
      return "Financial activity";
  }
}

function paymentTypeLabel(type: FinancialActivityPaymentType): string {
  switch (type) {
    case "deposit":
      return "Deposit";
    case "full_payment":
      return "Full payment";
    case "partial_payment":
      return "Partial payment";
    case "refund":
      return "Refund";
    default:
      return "Other";
  }
}

function sourceLabelFromTransaction(
  tx: CommerceTransaction,
  changeSource?: string | null,
): string | null {
  if (changeSource === "booking_confirm") return "Recorded from Reception";
  if (changeSource === "payments_dashboard") return "Recorded from Payments";
  const desc = (tx.description ?? "").toLowerCase();
  if (desc.includes("booking:")) return "Recorded from Reception";
  if (tx.provider === "manual") return "Recorded manually";
  return null;
}

function sanitizeNote(description: string | null): string | null {
  if (!description?.trim()) return null;
  // Strip internal idempotency markers from display.
  const cleaned = description
    .replace(/\bbooking:[^\s·]+/gi, "")
    .replace(/\s*[·|]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

/**
 * Map succeeded commerce transactions into readable financial activity rows.
 */
export function mapTransactionsToFinancialActivity(input: {
  appointmentId: string;
  timezone: string;
  transactions: CommerceTransaction[];
  appointmentTotalCents?: number;
  /** Optional change-log after_state keyed by transactionId for source enrichment. */
  changeLogByTransactionId?: Record<
    string,
    { source?: string | null; summary?: string | null }
  >;
}): AppointmentFinancialActivity {
  const total = Math.max(0, input.appointmentTotalCents ?? 0);
  const seen = new Set<string>();
  const items: AppointmentFinancialActivityItem[] = [];

  const sorted = [...input.transactions].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  for (const tx of sorted) {
    if (tx.status !== "succeeded" && tx.status !== "refunded") continue;
    const dedupeKey = `tx:${tx.id}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const paymentType = paymentTypeForTransaction(tx, total);
    const methodLabel =
      PAYMENT_METHOD_LABELS[tx.method] ?? String(tx.method);
    const changeMeta = input.changeLogByTransactionId?.[tx.id];
    const amountLabel = formatMoneyCents(tx.amountCents, tx.currency);
    const ref =
      tx.providerReference?.trim() ||
      (tx.id ? tx.id.slice(0, 8).toUpperCase() : null);

    items.push({
      id: tx.id,
      dedupeKey,
      title: titleForType(paymentType),
      amountLabel,
      methodLabel,
      paymentType,
      paymentTypeLabel: paymentTypeLabel(paymentType),
      sourceLabel: sourceLabelFromTransaction(tx, changeMeta?.source),
      note: sanitizeNote(tx.description),
      transactionRef: ref,
      occurredAt: tx.occurredAt,
      occurredAtLabel: formatInBusinessTimezone(
        tx.occurredAt,
        input.timezone,
      ),
    });
  }

  return {
    appointmentId: input.appointmentId,
    timezone: input.timezone,
    items,
  };
}

/** Pure helpers exported for unit tests. */
export function classifyPaymentKind(
  kind: TransactionKind,
  amountCents: number,
  appointmentTotalCents: number,
): FinancialActivityPaymentType {
  return paymentTypeForTransaction(
    {
      id: "",
      businessId: "",
      customerId: "",
      appointmentId: null,
      invoiceId: null,
      kind,
      status: "succeeded",
      method: "cash",
      amountCents,
      currency: "CAD",
      provider: "manual",
      providerReference: null,
      providerPaymentIntentId: null,
      description: null,
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    appointmentTotalCents,
  );
}
