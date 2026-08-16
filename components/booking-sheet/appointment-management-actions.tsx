"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Banknote,
  CalendarClock,
  MessageSquare,
  Pencil,
} from "lucide-react";
import type { ReactNode } from "react";

type AppointmentManagementActionsProps = {
  onEditFocus?: () => void;
  onReschedule: () => void;
  onCollectPayment: () => void;
  canCollectPayment?: boolean;
  showPaidInFull?: boolean;
  onMessage: () => void;
  moreMenu?: ReactNode;
  disabled?: boolean;
  className?: string;
};

/**
 * Sticky high-frequency actions for existing appointment management.
 */
export function AppointmentManagementActions({
  onEditFocus,
  onReschedule,
  onCollectPayment,
  canCollectPayment = false,
  showPaidInFull = false,
  onMessage,
  moreMenu,
  disabled,
  className,
}: AppointmentManagementActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className,
      )}
      role="toolbar"
      aria-label="Appointment actions"
    >
      {onEditFocus ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="min-h-10 gap-1.5"
          disabled={disabled}
          onClick={onEditFocus}
        >
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-10 gap-1.5"
        disabled={disabled}
        onClick={onReschedule}
      >
        <CalendarClock className="size-3.5" aria-hidden />
        Reschedule
      </Button>
      {canCollectPayment ? (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-10 gap-1.5"
        disabled={disabled}
        onClick={onCollectPayment}
      >
        <Banknote className="size-3.5" aria-hidden />
        Collect
      </Button>
      ) : showPaidInFull ? (
        <span
          className="inline-flex min-h-10 items-center rounded-full bg-emerald-500/15 px-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          Paid in full
        </span>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-10 gap-1.5"
        disabled={disabled}
        onClick={onMessage}
      >
        <MessageSquare className="size-3.5" aria-hidden />
        Message
      </Button>
      {moreMenu}
    </div>
  );
}
