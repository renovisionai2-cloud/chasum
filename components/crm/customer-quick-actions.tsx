"use client";

import { Button } from "@/components/ui/button";
import {
  CalendarPlus,
  CircleDollarSign,
  Mail,
  MessageSquare,
  MoreHorizontal,
  CalendarClock,
  CalendarX2,
  Printer,
  History,
  Sparkles,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type CustomerQuickActionsProps = {
  hasUpcoming: boolean;
  hasOutstanding?: boolean;
  onBook: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onCollectPayment: () => void;
  onMessage: () => void;
  onEmail: () => void;
  onPrint: () => void;
  onOpenTimeline: () => void;
  onAskSummer: () => void;
  busy?: boolean;
};

export function CustomerQuickActions(props: CustomerQuickActionsProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const secondary = [
    {
      key: "reschedule",
      label: "Reschedule",
      icon: CalendarClock,
      onClick: props.onReschedule,
      disabled: !props.hasUpcoming,
    },
    {
      key: "cancel",
      label: "Cancel next",
      icon: CalendarX2,
      onClick: props.onCancel,
      disabled: !props.hasUpcoming,
    },
    {
      key: "email",
      label: "Email",
      icon: Mail,
      onClick: props.onEmail,
      disabled: false,
    },
    {
      key: "print",
      label: "Print",
      icon: Printer,
      onClick: props.onPrint,
      disabled: false,
    },
    {
      key: "timeline",
      label: "Timeline",
      icon: History,
      onClick: props.onOpenTimeline,
      disabled: false,
    },
    {
      key: "summer",
      label: "Ask Summer",
      icon: Sparkles,
      onClick: props.onAskSummer,
      disabled: false,
    },
  ] as const;

  return (
    <div
      ref={rootRef}
      className="relative flex flex-wrap gap-1.5 print:hidden"
      role="toolbar"
      aria-label="Customer quick actions"
    >
      <Button
        type="button"
        size="sm"
        className="min-h-11 gap-1.5"
        disabled={props.busy}
        onClick={props.onBook}
      >
        <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
        Book
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-11 gap-1.5"
        disabled={props.busy}
        onClick={props.onMessage}
      >
        <MessageSquare className="h-3.5 w-3.5" aria-hidden />
        Message
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-11 gap-1.5"
        disabled={props.busy}
        onClick={props.onCollectPayment}
      >
        <CircleDollarSign className="h-3.5 w-3.5" aria-hidden />
        Collect payment
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-11 gap-1.5"
        disabled={props.busy}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
        More
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-full z-20 mt-1 min-w-[11rem] rounded-[var(--radius-md)] border border-border bg-card p-1 shadow-md"
        >
          {secondary.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                disabled={props.busy || item.disabled}
                className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm hover:bg-muted disabled:opacity-40 ds-focus-ring"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
