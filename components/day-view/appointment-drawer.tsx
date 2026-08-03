"use client";

import { AppointmentFinancialActivityList } from "@/components/booking/appointment-financial-activity";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadAppointmentFinancialActivity } from "@/lib/actions/appointment-activity";
import {
  cancelAppointment,
} from "@/lib/actions/appointments";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import type { AppointmentFinancialActivity } from "@/lib/commerce/appointment-financial-activity";
import {
  APPOINTMENT_PAYMENT_STATUS_LABELS,
} from "@/lib/commerce/types";
import { formatMoneyCents } from "@/lib/commerce/money";
import type {
  AppointmentStatus,
  AppointmentWithRelations,
  Location,
} from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { useToast } from "@/providers/toast-provider";
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";

type AppointmentDrawerProps = {
  open: boolean;
  appointment: AppointmentWithRelations | null;
  locations: Location[];
  onClose: () => void;
  onEdit: (appointment: AppointmentWithRelations) => void;
  onStatusChange: (
    appointment: AppointmentWithRelations,
    status: AppointmentStatus,
  ) => Promise<void>;
  onRescheduleRequest: (appointment: AppointmentWithRelations) => void;
  onRefresh: () => void;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function AppointmentDrawer({
  open,
  appointment,
  locations,
  onClose,
  onEdit,
  onStatusChange,
  onRescheduleRequest,
  onRefresh,
}: AppointmentDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [financialActivity, setFinancialActivity] =
    useState<AppointmentFinancialActivity | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("button, [href], input")
        ?.focus();
    }, 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !appointment?.id) {
      setFinancialActivity(null);
      return;
    }
    let cancelled = false;
    setFinancialLoading(true);
    loadAppointmentFinancialActivity(appointment.id)
      .then((data) => {
        if (!cancelled) setFinancialActivity(data);
      })
      .catch(() => {
        if (!cancelled) setFinancialActivity(null);
      })
      .finally(() => {
        if (!cancelled) setFinancialLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, appointment?.id]);

  if (!open || !appointment) return null;

  const locationName =
    appointment.location?.name ??
    locations.find((l) => l.id === appointment.location_id)?.name ??
    "—";
  const start = parseISO(appointment.start_time);
  const end = parseISO(appointment.end_time);
  const deposit = Number(appointment.deposit_cents ?? 0);
  const priceCents = Number(appointment.price_cents ?? 0);
  const taxCents = Number(appointment.tax_cents ?? 0);
  const appointmentTotal = priceCents + taxCents;
  const amountPaid = Number(appointment.amount_paid_cents ?? 0);
  const amountRefunded = Number(appointment.amount_refunded_cents ?? 0);
  const netPaid = Math.max(0, amountPaid - amountRefunded);
  const remaining = Math.max(0, appointmentTotal - netPaid);
  const paymentStatus = String(appointment.payment_status ?? "unpaid");
  const paymentStatusLabel =
    paymentStatus in APPOINTMENT_PAYMENT_STATUS_LABELS
      ? APPOINTMENT_PAYMENT_STATUS_LABELS[
          paymentStatus as keyof typeof APPOINTMENT_PAYMENT_STATUS_LABELS
        ]
      : paymentStatus;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
        aria-label="Close appointment drawer"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-xl",
          "motion-safe:transition-transform",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Appointment
            </p>
            <h2 id={titleId} className="truncate text-lg font-semibold">
              {appointment.customer.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={appointment.status} />
              <span className="text-xs text-muted-foreground">
                {formatTime(start)} – {formatTime(end)}
              </span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <Section title="Customer">
            <p className="text-sm font-medium">{appointment.customer.name}</p>
            <p className="text-xs text-muted-foreground">
              {[appointment.customer.email, appointment.customer.phone]
                .filter(Boolean)
                .join(" · ") || "No contact on file"}
            </p>
          </Section>

          <Section title="Service & team">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-[11px] text-muted-foreground">Service</dt>
                <dd className="font-medium">{appointment.service.name}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Employee</dt>
                <dd className="font-medium">{appointment.staff?.name ?? "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] text-muted-foreground">Location</dt>
                <dd className="font-medium">{locationName}</dd>
              </div>
            </dl>
          </Section>

          <Section title="Appointment activity">
            <ol className="space-y-2 border-l border-border pl-3 text-xs">
              <li>
                <span className="font-medium">Scheduled</span>
                <span className="ml-2 text-muted-foreground">
                  {start.toLocaleString()}
                </span>
              </li>
              <li>
                <span className="font-medium">Status</span>
                <span className="ml-2 text-muted-foreground capitalize">
                  {appointment.status.replace("_", " ")}
                </span>
              </li>
            </ol>
          </Section>

          <Section title="Financial activity">
            <AppointmentFinancialActivityList
              activity={financialActivity}
              loading={financialLoading}
              variant="drawer"
            />
          </Section>

          <Section title="Notes">
            <p className="rounded-[var(--radius-md)] border border-border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap">
              {appointment.notes?.trim() || "No notes yet."}
            </p>
          </Section>

          <Section title="Payment summary">
            {appointmentTotal > 0 ? (
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium">{paymentStatusLabel}</dd>
                </div>
                {taxCents > 0 ? (
                  <>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Subtotal before tax</dt>
                      <dd className="tabular-nums">
                        {formatMoneyCents(priceCents)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Tax</dt>
                      <dd className="tabular-nums">
                        {formatMoneyCents(taxCents)}
                      </dd>
                    </div>
                  </>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Appointment total</dt>
                  <dd className="tabular-nums">
                    {formatMoneyCents(appointmentTotal)}
                  </dd>
                </div>
                {deposit > 0 ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Deposit required</dt>
                    <dd className="tabular-nums">
                      {formatMoneyCents(deposit)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Paid</dt>
                  <dd className="tabular-nums">{formatMoneyCents(netPaid)}</dd>
                </div>
                <div className="flex justify-between gap-3 font-medium">
                  <dt>Balance remaining</dt>
                  <dd className="tabular-nums">
                    {formatMoneyCents(remaining)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No payment due.</p>
            )}
          </Section>

          <Section title="Communication">
            <p className="text-xs text-muted-foreground">
              No messages have been sent for this appointment.
            </p>
          </Section>
        </div>

        <footer className="space-y-2 border-t border-border p-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || appointment.status === "cancelled"}
              onClick={() =>
                startTransition(() =>
                  onStatusChange(appointment, "arrived"),
                )
              }
            >
              <CheckCircle2 className="size-3.5" />
              Arrived
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || appointment.status === "cancelled"}
              onClick={() =>
                startTransition(() =>
                  onStatusChange(appointment, "completed"),
                )
              }
            >
              <CheckCircle2 className="size-3.5" />
              Complete
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams();
                if (appointment.customer_id) {
                  params.set("customer", appointment.customer_id);
                }
                params.set("appointment", appointment.id);
                window.location.href = `/dashboard/payments?${params.toString()}`;
              }}
            >
              <Banknote className="size-3.5" />
              Collect payment
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onRescheduleRequest(appointment)}
            >
              <CalendarClock className="size-3.5" />
              Reschedule
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || appointment.status === "cancelled"}
              onClick={() => {
                startTransition(async () => {
                  const result = await cancelAppointment(appointment.id);
                  if (result.error) toast(result.error, "error");
                  else {
                    toast(result.success ?? "Cancelled.", "success");
                    onRefresh();
                    onClose();
                  }
                });
              }}
            >
              <XCircle className="size-3.5" />
              Cancel
            </Button>
            <Link href={`/dashboard/clients/${appointment.customer_id}`}>
              <Button type="button" size="sm" variant="outline" className="w-full">
                <UserRound className="size-3.5" />
                Open CRM
              </Button>
            </Link>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                toast("Compose message from the customer profile.", "info")
              }
            >
              <MessageSquare className="size-3.5" />
              Message
            </Button>
            <Link href="/dashboard/ai-workforce">
              <Button type="button" size="sm" variant="outline" className="w-full">
                <Sparkles className="size-3.5" />
                Ask Summer
              </Button>
            </Link>
          </div>
          <Button
            type="button"
            className="w-full"
            size="sm"
            onClick={() => onEdit(appointment)}
          >
            Edit full details
          </Button>
        </footer>
      </aside>
    </div>
  );
}
