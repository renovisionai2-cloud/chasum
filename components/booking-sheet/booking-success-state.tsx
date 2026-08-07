"use client";

import { Button } from "@/components/ui/button";
import type { BookingNotificationStatusItem } from "@/lib/types/booking";
import { formatMoneyCents } from "@/lib/commerce/money";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";

export type BookingSuccessInfo = {
  appointmentId: string;
  serviceName: string | null;
  customerName: string | null;
  startIso: string;
  durationMinutes: number | null;
  paymentAmountCents: number;
  paymentStatus?: "recorded" | "failed" | "skipped";
  receiptStatus?: string | null;
  notifications?: BookingNotificationStatusItem[];
  currency?: string | null;
};

function statusMark(
  item: BookingNotificationStatusItem | undefined,
  fallback: "—",
): string {
  if (!item) return fallback;
  if (item.status === "sent") return "Sent ✓";
  if (item.status === "pending") return "Pending";
  if (item.status === "failed") return "Failed";
  if (item.status === "not_requested" || item.status === "skipped") return "—";
  return item.label || item.status;
}

export function BookingSuccessState({
  info,
  onViewAppointment,
  onBookAnother,
  onDone,
}: {
  info: BookingSuccessInfo;
  onViewAppointment?: (id: string) => void;
  onBookAnother: () => void;
  onDone: () => void;
}) {
  const end =
    info.durationMinutes != null
      ? new Date(
          parseISO(info.startIso).getTime() + info.durationMinutes * 60_000,
        )
      : null;
  const customerEmail = info.notifications?.find(
    (n) => n.channel === "customer_email",
  );
  const businessEmail = info.notifications?.find(
    (n) => n.channel === "business_email",
  );
  const receipt = info.notifications?.find(
    (n) => n.channel === "payment_receipt",
  );

  return (
    <div
      className="space-y-4 rounded-[var(--radius-md)] border border-success/30 bg-success/5 px-4 py-5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <CheckCircle2
          className="mt-0.5 size-5 shrink-0 text-success"
          aria-hidden
        />
        <div>
          <p className="text-base font-semibold tracking-tight">
            Appointment booked ✓
          </p>
          <p className="mt-1 text-sm font-medium">
            {info.serviceName ?? "Appointment"}
          </p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {format(parseISO(info.startIso), "EEEE, MMM d")}
            {" · "}
            {formatTime(parseISO(info.startIso))}
            {end ? ` – ${formatTime(end)}` : ""}
          </p>
          {info.customerName ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {info.customerName}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="space-y-1 text-sm text-muted-foreground">
        <li>
          Customer confirmation{" "}
          <span className="text-foreground">
            {statusMark(customerEmail, "—")}
          </span>
        </li>
        <li>
          Business notification{" "}
          <span className="text-foreground">
            {statusMark(businessEmail, "—")}
          </span>
        </li>
        {info.paymentAmountCents > 0 ? (
          <li>
            Deposit{" "}
            <span className="text-foreground">
              {info.paymentStatus === "recorded"
                ? `${formatMoneyCents(info.paymentAmountCents, info.currency)} recorded ✓`
                : info.paymentStatus === "failed"
                  ? "Failed"
                  : formatMoneyCents(info.paymentAmountCents, info.currency)}
            </span>
          </li>
        ) : null}
        {info.paymentAmountCents > 0 ? (
          <li>
            Receipt{" "}
            <span className="text-foreground">
              {receipt
                ? statusMark(receipt, "—")
                : info.receiptStatus === "sent"
                  ? "Sent ✓"
                  : info.receiptStatus === "failed"
                    ? "Failed"
                    : "—"}
            </span>
          </li>
        ) : null}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        {onViewAppointment ? (
          <Button
            type="button"
            className="min-h-11 flex-1"
            onClick={() => onViewAppointment(info.appointmentId)}
          >
            View appointment
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="min-h-11 flex-1"
          onClick={onBookAnother}
        >
          Book another
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 flex-1"
          onClick={onDone}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
