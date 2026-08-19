"use client";

import { invoiceWorkspacePath } from "@/lib/commerce/document-paths";
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from "@/lib/types/booking";
import Link from "next/link";

export type AppointmentOperatingViewProps = {
  customerName: string | null;
  customerHref?: string | null;
  status: AppointmentStatus;
  serviceName: string | null;
  employeeName: string | null;
  locationName: string | null;
  whenLabel: string | null;
  subtotalLabel: string;
  taxLabel: string | null;
  taxAmountLabel: string | null;
  appointmentTotalLabel: string;
  amountPaidLabel: string;
  remainingCents: number;
  remainingLabel: string;
  paymentStatusLabel: string;
  refundedLabel?: string | null;
  netRetainedLabel?: string | null;
  invoiceNumber?: string | null;
  currency?: string | null;
};

/**
 * Read-first existing-appointment operating workspace.
 * Editing belongs behind an explicit Edit action — not this surface.
 */
export function AppointmentOperatingView({
  customerName,
  customerHref,
  status,
  serviceName,
  employeeName,
  locationName,
  whenLabel,
  subtotalLabel,
  taxLabel,
  taxAmountLabel,
  appointmentTotalLabel,
  amountPaidLabel,
  remainingCents,
  remainingLabel,
  paymentStatusLabel,
  refundedLabel,
  netRetainedLabel,
  invoiceNumber,
}: AppointmentOperatingViewProps) {
  const appointmentStatus = APPOINTMENT_STATUS_LABELS[status] ?? status;

  return (
    <section
      className="space-y-4 rounded-[var(--radius-md)] border border-border/70 bg-card px-4 py-4"
      aria-label="Appointment overview"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Appointment
          </p>
          <p className="mt-0.5 text-base font-semibold tracking-tight">
            {customerName ?? "Appointment"}
          </p>
        </div>
        <span className="inline-flex min-h-8 items-center rounded-full bg-muted px-2.5 text-xs font-medium">
          {appointmentStatus}
        </span>
      </div>

      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Customer</dt>
          <dd className="font-medium text-right">
            {customerHref ? (
              <Link
                href={customerHref}
                className="underline-offset-4 hover:underline"
              >
                {customerName ?? "—"}
              </Link>
            ) : (
              (customerName ?? "—")
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Service</dt>
          <dd className="font-medium text-right">{serviceName ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Employee</dt>
          <dd className="text-right">{employeeName ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Location</dt>
          <dd className="text-right">{locationName ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">When</dt>
          <dd className="tabular-nums text-right">{whenLabel ?? "—"}</dd>
        </div>
      </dl>

      <dl className="space-y-1.5 border-t border-border/70 pt-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{subtotalLabel}</dd>
        </div>
        {taxAmountLabel ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{taxLabel ?? "Tax"}</dt>
            <dd className="tabular-nums">{taxAmountLabel}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="font-medium">Appointment total</dt>
          <dd className="font-semibold tabular-nums">{appointmentTotalLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Amount paid</dt>
          <dd className="tabular-nums">{amountPaidLabel}</dd>
        </div>
        {refundedLabel ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Refunded</dt>
            <dd className="tabular-nums">{refundedLabel}</dd>
          </div>
        ) : null}
        {netRetainedLabel ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Net retained</dt>
            <dd className="tabular-nums">{netRetainedLabel}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Remaining</dt>
          <dd
            className="font-medium tabular-nums"
            data-amount-due={remainingCents}
          >
            {remainingLabel}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Payment</dt>
          <dd className="text-right">{paymentStatusLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Invoice</dt>
          <dd className="text-right">
            {invoiceNumber ? (
              <Link
                href={invoiceWorkspacePath(invoiceNumber)}
                className="font-medium underline-offset-4 hover:underline"
              >
                {invoiceNumber}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
