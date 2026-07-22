"use client";

import type { AppointmentWithRelations, Service } from "@/lib/types/booking";
import {
  APPOINTMENT_PAYMENT_STATUS_LABELS,
  type AppointmentPaymentStatus,
} from "@/lib/commerce/types";
import { Banknote, CreditCard, FileText, Info } from "lucide-react";
import Link from "next/link";

type PaymentsSectionProps = {
  service: Service | undefined;
  appointment: AppointmentWithRelations | null | undefined;
};

function deriveStatus(input: {
  priceCents: number;
  depositCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  paymentStatus?: string | null;
  depositRequired: boolean;
}): AppointmentPaymentStatus {
  if (
    input.paymentStatus &&
    input.paymentStatus in APPOINTMENT_PAYMENT_STATUS_LABELS
  ) {
    return input.paymentStatus as AppointmentPaymentStatus;
  }
  const net = Math.max(0, input.amountPaidCents - input.amountRefundedCents);
  if (input.amountRefundedCents > 0 && net <= 0) return "refunded";
  if (net >= input.priceCents && input.priceCents > 0) return "fully_paid";
  if (input.depositRequired && net <= 0) return "deposit_required";
  if (input.depositRequired && net >= input.depositCents && net < input.priceCents) {
    return "deposit_paid";
  }
  if (net > 0 && net < input.priceCents) return "partially_paid";
  return "unpaid";
}

export function PaymentsSection({ service, appointment }: PaymentsSectionProps) {
  const priceCents =
    appointment?.price_cents != null
      ? Number(appointment.price_cents)
      : service
        ? Math.round(Number(service.price) * 100)
        : 0;
  const depositCents = Number(
    appointment?.deposit_cents ?? service?.deposit_cents ?? 0,
  );
  const amountPaid = Number(
    appointment?.amount_paid_cents ?? appointment?.deposit_cents ?? 0,
  );
  const amountRefunded = Number(appointment?.amount_refunded_cents ?? 0);
  const depositRequired =
    Boolean(service?.deposit_required) || depositCents > 0;
  const taxCents = Number(appointment?.tax_cents ?? 0);
  const outstanding = Math.max(0, priceCents - (amountPaid - amountRefunded));
  const status = deriveStatus({
    priceCents,
    depositCents,
    amountPaidCents: amountPaid,
    amountRefundedCents: amountRefunded,
    paymentStatus: appointment?.payment_status,
    depositRequired,
  });

  return (
    <section className="space-y-3" aria-labelledby="bs-pay-heading">
      <div>
        <h3 id="bs-pay-heading" className="text-sm font-semibold tracking-tight">
          Balance & deposits
        </h3>
        <p className="text-xs text-muted-foreground">
          See what&apos;s owed and collect payment without leaving the booking.
        </p>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border px-3 py-2">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Status
        </p>
        <p className="text-sm font-semibold">
          {APPOINTMENT_PAYMENT_STATUS_LABELS[status]}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-[var(--radius-md)] border border-border px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Price
          </p>
          <p className="text-sm font-semibold tabular-nums">
            ${(priceCents / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Deposit
          </p>
          <p className="text-sm font-semibold tabular-nums">
            {depositRequired
              ? `$${(depositCents / 100).toFixed(2)}`
              : "Not required"}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Paid
          </p>
          <p className="text-sm font-semibold tabular-nums">
            ${(amountPaid / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Outstanding
          </p>
          <p className="text-sm font-semibold tabular-nums">
            ${(outstanding / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <ul className="space-y-2 text-xs text-muted-foreground">
        <li className="flex items-start gap-2">
          <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {appointment?.invoice_number
            ? `Invoice #${appointment.invoice_number}`
            : "Invoice creates automatically when you collect payment"}
        </li>
        <li className="flex items-start gap-2">
          <CreditCard className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Cash, card, e-transfer, gift card, and store credit supported
        </li>
        <li className="flex items-start gap-2">
          <Banknote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <Link
            href="/dashboard/payments"
            className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open Payments
          </Link>{" "}
          to collect, refund, or download a receipt
        </li>
        {taxCents > 0 || (service?.tax_rate_bps ?? 0) > 0 ? (
          <li className="flex items-start gap-2">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Taxes{" "}
            {taxCents > 0
              ? `$${(taxCents / 100).toFixed(2)}`
              : `${((service?.tax_rate_bps ?? 0) / 100).toFixed(1)}% rate`}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
