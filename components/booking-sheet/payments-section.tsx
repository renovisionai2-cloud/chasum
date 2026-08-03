"use client";

import type { TaxRate } from "@/lib/business/types";
import { computeBookingPricing } from "@/lib/commerce/booking-pricing";
import { formatMoneyCents } from "@/lib/commerce/money";
import type { AppointmentWithRelations, Service } from "@/lib/types/booking";
import {
  APPOINTMENT_PAYMENT_STATUS_LABELS,
  type AppointmentPaymentStatus,
} from "@/lib/commerce/types";
import Link from "next/link";

type PaymentsSectionProps = {
  service: Service | undefined;
  appointment: AppointmentWithRelations | null | undefined;
  currency?: string | null;
  taxRates?: TaxRate[];
};

function deriveStatus(input: {
  totalCents: number;
  depositCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  paymentStatus?: string | null;
  depositRequired: boolean;
}): AppointmentPaymentStatus | "no_payment_due" {
  if (input.totalCents <= 0) {
    return "no_payment_due";
  }
  if (
    input.paymentStatus &&
    input.paymentStatus in APPOINTMENT_PAYMENT_STATUS_LABELS
  ) {
    return input.paymentStatus as AppointmentPaymentStatus;
  }
  const net = Math.max(0, input.amountPaidCents - input.amountRefundedCents);
  if (input.amountRefundedCents > 0 && net <= 0) return "refunded";
  if (net >= input.totalCents && input.totalCents > 0) return "fully_paid";
  if (input.depositRequired && net <= 0) return "deposit_required";
  if (
    input.depositRequired &&
    net >= input.depositCents &&
    net < input.totalCents
  ) {
    return "deposit_paid";
  }
  if (net > 0 && net < input.totalCents) return "partially_paid";
  return "unpaid";
}

export function PaymentsSection({
  service,
  appointment,
  currency = "usd",
  taxRates = [],
}: PaymentsSectionProps) {
  const subtotalCents =
    appointment?.price_cents != null
      ? Number(appointment.price_cents)
      : service
        ? Math.round(Number(service.price) * 100)
        : 0;
  const taxFromAppointment =
    appointment?.tax_cents != null ? Number(appointment.tax_cents) : null;
  const pricing =
    taxFromAppointment != null
      ? {
          subtotalCents,
          taxCents: taxFromAppointment,
          totalCents: subtotalCents + taxFromAppointment,
        }
      : computeBookingPricing({
          subtotalCents,
          serviceTaxRateBps: service?.tax_rate_bps ?? 0,
          taxRates,
          currency,
        });

  const depositCents = Number(
    appointment?.deposit_cents ?? service?.deposit_cents ?? 0,
  );
  const amountPaid = Number(
    appointment?.amount_paid_cents ?? 0,
  );
  const amountRefunded = Number(appointment?.amount_refunded_cents ?? 0);
  const depositRequired =
    Boolean(service?.deposit_required) || depositCents > 0;
  const netPaid = Math.max(0, amountPaid - amountRefunded);
  const outstandingTotal = Math.max(0, pricing.totalCents - netPaid);
  const remainingAfterDeposit = Math.max(
    0,
    pricing.totalCents - Math.max(depositCents, netPaid),
  );
  const status = deriveStatus({
    totalCents: pricing.totalCents,
    depositCents,
    amountPaidCents: amountPaid,
    amountRefundedCents: amountRefunded,
    paymentStatus: appointment?.payment_status,
    depositRequired,
  });

  if (status === "no_payment_due") {
    return (
      <section className="space-y-1" aria-labelledby="bs-pay-heading">
        <h3 id="bs-pay-heading" className="text-sm font-semibold tracking-tight">
          Balance
        </h3>
        <p className="text-sm text-muted-foreground">No payment due.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3" aria-labelledby="bs-pay-heading">
      <div>
        <h3 id="bs-pay-heading" className="text-sm font-semibold tracking-tight">
          Balance
        </h3>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border/80 bg-muted/15 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <p className="text-sm font-semibold">
              {APPOINTMENT_PAYMENT_STATUS_LABELS[status]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Outstanding
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {formatMoneyCents(outstandingTotal, currency)}
            </p>
          </div>
        </div>
        <dl className="mt-3 space-y-1.5 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Appointment total</dt>
            <dd className="font-medium tabular-nums">
              {formatMoneyCents(pricing.totalCents, currency)}
            </dd>
          </div>
          {pricing.taxCents > 0 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">
                Includes tax ({formatMoneyCents(pricing.taxCents, currency)})
              </dt>
              <dd className="tabular-nums text-muted-foreground">
                Subtotal {formatMoneyCents(pricing.subtotalCents, currency)}
              </dd>
            </div>
          ) : null}
          {depositRequired ? (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Deposit due now</dt>
                <dd className="font-medium tabular-nums">
                  {formatMoneyCents(depositCents, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Remaining after deposit</dt>
                <dd className="tabular-nums">
                  {formatMoneyCents(remainingAfterDeposit, currency)}
                </dd>
              </div>
            </>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Paid</dt>
            <dd className="font-medium tabular-nums">
              {formatMoneyCents(amountPaid, currency)}
            </dd>
          </div>
        </dl>
      </div>

      <p className="text-xs text-muted-foreground">
        <Link
          href="/dashboard/payments"
          className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open Payments
        </Link>
        {appointment?.invoice_number
          ? ` · Invoice #${appointment.invoice_number}`
          : null}
      </p>
    </section>
  );
}
