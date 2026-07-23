"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  cancelAppointment,
} from "@/lib/actions/appointments";
import { formatTime, parseISO } from "@/lib/calendar/utils";
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
import { useEffect, useId, useRef, useTransition } from "react";

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

  if (!open || !appointment) return null;

  const locationName =
    appointment.location?.name ??
    locations.find((l) => l.id === appointment.location_id)?.name ??
    "—";
  const start = parseISO(appointment.start_time);
  const end = parseISO(appointment.end_time);
  const deposit = Number(appointment.deposit_cents ?? 0);
  const priceCents = appointment.price_cents;

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

          <Section title="Timeline">
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
              <li className="text-muted-foreground">
                History &amp; forms expand in a later release
              </li>
            </ol>
          </Section>

          <Section title="Notes">
            <p className="rounded-[var(--radius-md)] border border-border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap">
              {appointment.notes?.trim() || "No notes yet."}
            </p>
          </Section>

          <Section title="Payments">
            <p className="text-sm">
              {priceCents != null
                ? `$${(priceCents / 100).toFixed(2)}`
                : "Price from service"}
              {deposit > 0 ? (
                <span className="ml-2 text-xs text-muted-foreground">
                  Deposit ${(deposit / 100).toFixed(2)}
                </span>
              ) : null}
            </p>
          </Section>

          <Section title="Communication">
            <p className="text-xs text-muted-foreground">
              Message tools stay on the customer record. AI recommendations will
              appear here.
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
