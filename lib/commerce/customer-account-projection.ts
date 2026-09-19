import { resolveDepositDueNowCents } from "@/lib/commerce/booking-financials";
import type {
  CommerceInvoice,
  CommerceTransaction,
  InvoiceStatus,
} from "@/lib/commerce/types";

/** Tenant columns the customer-account I/O layer must keep on every query. */
export const CUSTOMER_ACCOUNT_TENANT_SCOPE = {
  businessId: "business_id",
  customerId: "customer_id",
} as const;

const OPEN_INVOICE_STATUSES: InvoiceStatus[] = ["open", "partial", "overdue"];

export type CustomerAccountAppointmentRow = {
  status?: string | null;
  price_cents?: number | null;
  tax_cents?: number | null;
  deposit_cents?: number | null;
  amount_paid_cents?: number | null;
  amount_refunded_cents?: number | null;
  payment_status?: string | null;
  services?: { price?: number } | { price?: number }[] | null;
  service?: { price?: number } | null;
};

export type CustomerAccountTotals = {
  appointmentOutstandingCents: number;
  appointmentDepositsCents: number;
  appointmentPaidCents: number;
  invoiceOutstandingCents: number;
  depositsCents: number;
  totalPaidCents: number;
  outstandingBalanceCents: number;
};

function serviceListPriceCents(
  appt: CustomerAccountAppointmentRow,
): number {
  const nested = appt.services ?? appt.service ?? null;
  const row = Array.isArray(nested) ? nested[0] : nested;
  return Math.round(Number(row?.price ?? 0) * 100);
}

/** Exclusive subtotal: stored price_cents when present, including 0. */
export function appointmentExclusiveSubtotalCents(
  appt: CustomerAccountAppointmentRow,
): number {
  const stored = appt.price_cents;
  if (stored != null) {
    return Math.max(0, Math.round(Number(stored)));
  }
  return serviceListPriceCents(appt);
}

/** Stored tax only — never recomputed from today's catalog. */
export function appointmentStoredTaxCents(
  appt: CustomerAccountAppointmentRow,
): number {
  return Math.max(0, Number(appt.tax_cents ?? 0));
}

export function appointmentTotalCents(
  appt: CustomerAccountAppointmentRow,
): number {
  return (
    appointmentExclusiveSubtotalCents(appt) + appointmentStoredTaxCents(appt)
  );
}

export function appointmentNetPaidCents(
  appt: CustomerAccountAppointmentRow,
): number {
  const paid = Number(appt.amount_paid_cents ?? appt.deposit_cents ?? 0);
  const refunded = Number(appt.amount_refunded_cents ?? 0);
  return Math.max(0, paid - refunded);
}

/**
 * Deposit applied from a configured appointment deposit.
 *
 * A legitimate numeric zero must stay zero. `0 || netPaid` is the defect
 * that counted ordinary payments as deposits.
 */
export function appointmentDepositAppliedCents(
  appt: CustomerAccountAppointmentRow,
): number {
  const configured = Math.max(0, Number(appt.deposit_cents ?? 0));
  return resolveDepositDueNowCents({
    depositRequiredCents: configured,
    netPaidCents: appointmentNetPaidCents(appt),
  }).amountPaidTowardDepositCents;
}

export function appointmentOutstandingCents(
  appt: CustomerAccountAppointmentRow,
): number {
  if (appt.status === "cancelled") return 0;
  return Math.max(
    0,
    appointmentTotalCents(appt) - appointmentNetPaidCents(appt),
  );
}

export function appointmentHasBalanceDue(
  appt: CustomerAccountAppointmentRow,
): boolean {
  return appointmentOutstandingCents(appt) > 0;
}

export function countUpcomingAppointmentsWithBalanceDue(
  appointments: CustomerAccountAppointmentRow[],
): number {
  return appointments.filter(appointmentHasBalanceDue).length;
}

export function customerBalanceChipLabel(count: number): string {
  return count > 0 ? `${count} due` : "Clear";
}

export function invoiceOutstandingCents(
  invoices: Array<Pick<CommerceInvoice, "status" | "balanceCents">>,
): number {
  return invoices
    .filter((invoice) => OPEN_INVOICE_STATUSES.includes(invoice.status))
    .reduce((sum, invoice) => sum + invoice.balanceCents, 0);
}

export function ledgerSpendCents(
  timeline: Array<
    Pick<CommerceTransaction, "status" | "kind" | "method" | "amountCents">
  >,
): number {
  return timeline
    .filter(
      (t) =>
        t.status === "succeeded" &&
        (t.kind === "payment" ||
          t.kind === "deposit" ||
          t.kind === "gift_card" ||
          t.method === "gift_card"),
    )
    .reduce((sum, t) => sum + t.amountCents, 0);
}

export function ledgerDepositCents(
  timeline: Array<Pick<CommerceTransaction, "status" | "kind" | "amountCents">>,
): number {
  return timeline
    .filter((t) => t.kind === "deposit" && t.status === "succeeded")
    .reduce((sum, t) => sum + t.amountCents, 0);
}

export function projectCustomerAccountTotals(input: {
  appointments: CustomerAccountAppointmentRow[];
  invoices: Array<Pick<CommerceInvoice, "status" | "balanceCents">>;
  timeline: Array<
    Pick<CommerceTransaction, "status" | "kind" | "method" | "amountCents">
  >;
}): CustomerAccountTotals {
  let appointmentOutstanding = 0;
  let appointmentDeposits = 0;
  let appointmentPaid = 0;

  for (const appt of input.appointments) {
    if (appt.status === "cancelled") continue;
    appointmentPaid += appointmentNetPaidCents(appt);
    appointmentDeposits += appointmentDepositAppliedCents(appt);
    appointmentOutstanding += appointmentOutstandingCents(appt);
  }

  const invoiceOutstanding = invoiceOutstandingCents(input.invoices);
  const depositsCents = Math.max(
    ledgerDepositCents(input.timeline),
    appointmentDeposits,
  );
  const totalPaidCents = Math.max(
    ledgerSpendCents(input.timeline),
    appointmentPaid,
  );
  const outstandingBalanceCents = Math.max(
    appointmentOutstanding,
    invoiceOutstanding,
  );

  return {
    appointmentOutstandingCents: appointmentOutstanding,
    appointmentDepositsCents: appointmentDeposits,
    appointmentPaidCents: appointmentPaid,
    invoiceOutstandingCents: invoiceOutstanding,
    depositsCents,
    totalPaidCents,
    outstandingBalanceCents,
  };
}
