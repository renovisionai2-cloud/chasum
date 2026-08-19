"use client";

import { Button } from "@/components/ui/button";
import { retryAppointmentNotification } from "@/lib/actions/notification-retry";
import { formatNotificationStatus } from "@/lib/notifications/status-labels";
import type {
  ActionState,
  BookingNotificationStatusItem,
} from "@/lib/types/booking";
import { useActionState, useEffect, useState } from "react";

type Props = {
  appointmentId: string;
  initial: BookingNotificationStatusItem[];
};

function tone(status: BookingNotificationStatusItem["status"]): string {
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

export function BookingNotificationStatus({ appointmentId, initial }: Props) {
  const [items, setItems] = useState(initial);
  const [state, action, pending] = useActionState(
    retryAppointmentNotification,
    {} as ActionState,
  );

  useEffect(() => {
    if (state.notifications) {
      // Merge retry action results into the loaded channel list.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- action state is an external system
      setItems((prev) => {
        const map = new Map(prev.map((item) => [item.channel, item]));
        for (const item of state.notifications ?? []) {
          map.set(item.channel, item);
        }
        // Preserve a stable channel order when possible.
        const order = [
          "customer_email",
          "business_email",
          "payment_receipt",
          "customer_refund_email",
          "business_refund_email",
          "customer_sms",
          "staff_email",
        ] as const;
        const merged = [...map.values()];
        merged.sort((a, b) => {
          const ai = order.indexOf(
            a.channel as (typeof order)[number],
          );
          const bi = order.indexOf(
            b.channel as (typeof order)[number],
          );
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
        return merged;
      });
    }
  }, [state.notifications]);

  if (!items.length) return null;

  return (
    <div className="rounded-[var(--radius-md)] border border-border/70 bg-card/60 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Notifications
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li
            key={item.channel}
            className="flex items-start justify-between gap-2 text-xs"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{item.label}</p>
              <p className={tone(item.status)}>
                {formatNotificationStatus(item.status)}
                {item.detail ? (
                  <span className="block text-muted-foreground">{item.detail}</span>
                ) : null}
              </p>
            </div>
            {item.canRetry &&
            (item.status === "failed" ||
              item.status === "skipped" ||
              item.status === "sent" ||
              item.status === "not_requested") ? (
              <form action={action}>
                <input type="hidden" name="appointment_id" value={appointmentId} />
                <input type="hidden" name="channel" value={item.channel} />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  className="h-8 shrink-0 text-[11px]"
                >
                  {item.status === "sent" ? "Resend" : "Retry"}
                </Button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
      {state.error ? (
        <p className="mt-2 text-[11px] text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
