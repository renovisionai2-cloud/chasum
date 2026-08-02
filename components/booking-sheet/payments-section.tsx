"use client";

import type { AppointmentWithRelations, Service } from "@/lib/types/booking";
import {
  APPOINTMENT_PAYMENT_STATUS_LABELS,
  type AppointmentPaymentStatus,
} from "@/lib/commerce/types";
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
          Balance
        </h3>
        <p className="text-xs text-muted-foreground">
          Collect payment without leaving this booking.
        </p>
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
              ${(outstanding / 100).toFixed(2)}
            </p>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Price</dt>
            <dd className="font-medium tabular-nums">
              ${(priceCents / 100).toFixed(2)}
            </dd>
          </div>
          {depositRequired ? (
            <div>
              <dt className="text-muted-foreground">Deposit</dt>
              <dd className="font-medium tabular-nums">
                ${(depositCents / 100).toFixed(2)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-foreground">Paid</dt>
            <dd className="font-medium tabular-nums">
              ${(amountPaid / 100).toFixed(2)}
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
          : " · Invoice creates when you collect payment"}
      </p>
    </section>
  );
}
