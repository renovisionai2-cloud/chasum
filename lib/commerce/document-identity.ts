/**
 * Phase 6.2B — strongest app-level document identity without schema changes.
 *
 * Invoice: prefer the earliest commerce_invoices row for an appointment.
 * Receipt: prefer the earliest commerce_receipts row for a payment transaction.
 *
 * Duplicate rows are not deleted. Canonical selection is read-model only.
 * True one-row identity requires unique(appointment_id) / unique(transaction_id).
 */

export function pickCanonicalRow<T>(
  rows: T[],
  createdAt: (row: T) => string,
  id: (row: T) => string,
): T | null {
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => {
    const ta = createdAt(a);
    const tb = createdAt(b);
    if (ta < tb) return -1;
    if (ta > tb) return 1;
    return id(a).localeCompare(id(b));
  })[0] ?? null;
}

export function isCanonicalRow<T>(
  rows: T[],
  candidate: T,
  createdAt: (row: T) => string,
  id: (row: T) => string,
): boolean {
  const canonical = pickCanonicalRow(rows, createdAt, id);
  if (!canonical) return false;
  return id(canonical) === id(candidate);
}

export type AppointmentInvoiceLifecycle =
  | "none"
  | "open"
  | "paid"
  | "refunded_or_adjusted"
  | "cancelled_with_invoice";

export function appointmentInvoiceLifecycle(input: {
  hasInvoice: boolean;
  invoiceStatus: string | null;
  amountRefundedCents: number;
  appointmentStatus: string | null;
}): AppointmentInvoiceLifecycle {
  if (!input.hasInvoice) return "none";
  const cancelled = String(input.appointmentStatus ?? "") === "cancelled";
  if (cancelled) return "cancelled_with_invoice";
  if (input.amountRefundedCents > 0 || input.invoiceStatus === "refunded") {
    return "refunded_or_adjusted";
  }
  if (input.invoiceStatus === "paid") return "paid";
  return "open";
}
