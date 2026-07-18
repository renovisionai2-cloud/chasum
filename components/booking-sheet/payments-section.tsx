"use client";

import type { AppointmentWithRelations, Service } from "@/lib/types/booking";
import { Banknote, CreditCard, FileText, Info } from "lucide-react";

type PaymentsSectionProps = {
  service: Service | undefined;
  appointment: AppointmentWithRelations | null | undefined;
};

export function PaymentsSection({ service, appointment }: PaymentsSectionProps) {
  const price =
    appointment?.price_cents != null
      ? Number(appointment.price_cents) / 100
      : service
        ? Number(service.price)
        : null;
  const depositCents = Number(
    appointment?.deposit_cents ?? service?.deposit_cents ?? 0,
  );
  const depositRequired =
    Boolean(service?.deposit_required) || depositCents > 0;
  const taxCents = Number(appointment?.tax_cents ?? 0);
  const outstanding =
    price != null
      ? Math.max(0, price - depositCents / 100)
      : null;

  return (
    <section className="space-y-3" aria-labelledby="bs-pay-heading">
      <div>
        <h3 id="bs-pay-heading" className="text-sm font-semibold tracking-tight">
          Payments
        </h3>
        <p className="text-xs text-muted-foreground">
          Deposit and balance — Stripe collection ships in a later release
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-[var(--radius-md)] border border-border px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Price
          </p>
          <p className="text-sm font-semibold tabular-nums">
            {price != null ? `$${price.toFixed(2)}` : "—"}
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
            ${(depositCents / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Outstanding
          </p>
          <p className="text-sm font-semibold tabular-nums">
            {outstanding != null ? `$${outstanding.toFixed(2)}` : "—"}
          </p>
        </div>
      </div>

      <ul className="space-y-2 text-xs text-muted-foreground">
        <li className="flex items-start gap-2">
          <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Invoice{" "}
          {appointment?.invoice_number
            ? `#${appointment.invoice_number}`
            : "will generate on completion"}
        </li>
        <li className="flex items-start gap-2">
          <CreditCard className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Payment method / Stripe status — future support
        </li>
        <li className="flex items-start gap-2">
          <Banknote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Collect Payment from quick actions when ready
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
