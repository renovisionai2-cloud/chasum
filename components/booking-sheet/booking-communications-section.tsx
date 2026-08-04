"use client";

import { Button } from "@/components/ui/button";
import {
  loadAppointmentCommunicationsAction,
  retryAppointmentNotification,
} from "@/lib/actions/notification-retry";
import { formatNotificationStatus } from "@/lib/notifications/status-labels";
import type { BookingNotificationItem } from "@/lib/notifications/booking-delivery";
import type { ActionState } from "@/lib/types/booking";
import { useActionState, useEffect, useState, useTransition } from "react";

type Props = {
  appointmentId: string;
  /** When true, scroll into view (from three-dot menu). */
  focusSignal?: number;
};

function tone(status: BookingNotificationItem["status"]): string {
  switch (status) {
    case "sent":
      return "text-success";
    case "failed":
      return "text-destructive";
    case "pending":
      return "text-amber-700 dark:text-amber-300";
    default:
      return "text-muted-foreground";
  }
}

function resendLabel(channel: BookingNotificationItem["channel"]): string {
  switch (channel) {
    case "customer_email":
      return "Resend confirmation";
    case "business_email":
      return "Resend business notification";
    case "payment_receipt":
      return "Resend payment receipt";
    case "staff_email":
      return "Resend staff notification";
    case "customer_sms":
      return "Resend SMS";
    default:
      return "Resend";
  }
}

export function BookingCommunicationsSection({
  appointmentId,
  focusSignal = 0,
}: Props) {
  const [items, setItems] = useState<BookingNotificationItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, startLoad] = useTransition();
  const [state, action, pending] = useActionState(
    retryAppointmentNotification,
    {} as ActionState,
  );

  function refresh() {
    startLoad(async () => {
      const result = await loadAppointmentCommunicationsAction(appointmentId);
      setItems(result.items);
      setLoadError(result.error ?? null);
    });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when appointment changes
  }, [appointmentId]);

  useEffect(() => {
    if (state.notifications) {
      setItems((prev) => {
        const map = new Map(prev.map((item) => [item.channel, item]));
        for (const item of state.notifications ?? []) {
          map.set(item.channel, item as BookingNotificationItem);
        }
        const order = [
          "customer_email",
          "business_email",
          "payment_receipt",
          "staff_email",
          "customer_sms",
        ] as const;
        return [...map.values()].sort((a, b) => {
          const ai = order.indexOf(a.channel as (typeof order)[number]);
          const bi = order.indexOf(b.channel as (typeof order)[number]);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
      });
    }
  }, [state.notifications]);

  useEffect(() => {
    if (!focusSignal) return;
    const el = document.getElementById("bs-communications");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusSignal]);

  return (
    <section
      id="bs-communications"
      className="scroll-mt-4 space-y-2"
      aria-labelledby="bs-comms-heading"
    >
      <div className="flex items-center justify-between gap-2">
        <h3
          id="bs-comms-heading"
          className="text-sm font-semibold tracking-tight"
        >
          Communications
        </h3>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-[11px]"
          disabled={loading || pending}
          onClick={() => refresh()}
        >
          Refresh
        </Button>
      </div>

      {loading && !items.length ? (
        <p className="text-xs text-muted-foreground">Loading delivery status…</p>
      ) : null}

      {loadError ? (
        <p className="text-xs text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      <ul className="space-y-2 rounded-[var(--radius-md)] border border-border/80 bg-muted/15 px-3 py-2.5">
        {items.map((item) => (
          <li
            key={item.channel}
            className="flex items-start justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground">{item.label}</p>
              <p className={`text-xs ${tone(item.status)}`}>
                {formatNotificationStatus(item.status)}
              </p>
              {item.detail ? (
                <p className="mt-0.5 break-words text-[11px] text-muted-foreground">
                  {item.detail}
                </p>
              ) : null}
            </div>
            {item.canRetry ? (
              <form action={action}>
                <input
                  type="hidden"
                  name="appointment_id"
                  value={appointmentId}
                />
                <input type="hidden" name="channel" value={item.channel} />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  className="h-8 shrink-0 text-[11px]"
                >
                  {resendLabel(item.channel)}
                </Button>
              </form>
            ) : null}
          </li>
        ))}
        {!loading && !items.length && !loadError ? (
          <li className="text-xs text-muted-foreground">
            No communication channels available for this appointment.
          </li>
        ) : null}
      </ul>

      {state.error ? (
        <p className="text-[11px] text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-[11px] text-success" role="status">
          {state.success}
        </p>
      ) : null}
    </section>
  );
}
