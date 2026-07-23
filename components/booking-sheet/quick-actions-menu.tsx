"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  Copy,
  Ellipsis,
  MessageSquare,
  Printer,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type QuickActionsMenuProps = {
  isEditing: boolean;
  customerId?: string | null;
  disabled?: boolean;
  onCheckIn: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  onDuplicate: () => void;
  onCollectPayment: () => void;
  onPrint: () => void;
  onMessage: () => void;
};

export function QuickActionsMenu({
  isEditing,
  customerId,
  disabled,
  onCheckIn,
  onComplete,
  onCancel,
  onReschedule,
  onDuplicate,
  onCollectPayment,
  onPrint,
  onMessage,
}: QuickActionsMenuProps) {
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

  const items = [
    {
      label: "Arrived",
      icon: CheckCircle2,
      onClick: onCheckIn,
      show: isEditing,
    },
    {
      label: "Complete",
      icon: CheckCircle2,
      onClick: onComplete,
      show: isEditing,
    },
    {
      label: "Reschedule",
      icon: CalendarClock,
      onClick: onReschedule,
      show: true,
    },
    {
      label: "Duplicate",
      icon: Copy,
      onClick: onDuplicate,
      show: isEditing,
    },
    {
      label: "Collect Payment",
      icon: Banknote,
      onClick: onCollectPayment,
      show: true,
    },
    {
      label: "Print",
      icon: Printer,
      onClick: onPrint,
      show: true,
    },
    {
      label: "Message Customer",
      icon: MessageSquare,
      onClick: onMessage,
      show: true,
    },
    {
      label: "Cancel",
      icon: XCircle,
      onClick: onCancel,
      show: isEditing,
      danger: true,
    },
  ] as const;

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="Quick actions"
      >
        <Ellipsis className="size-4" />
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-[var(--radius-md)] border border-border bg-card py-1 shadow-lg",
          )}
        >
          {items
            .filter((i) => i.show)
            .map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60",
                  "danger" in item && item.danger && "text-destructive",
                )}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                <item.icon className="size-3.5 shrink-0" aria-hidden />
                {item.label}
              </button>
            ))}
          {customerId ? (
            <Link
              href={`/dashboard/clients/${customerId}`}
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60"
              onClick={() => setOpen(false)}
            >
              <UserRound className="size-3.5" aria-hidden />
              Open CRM
            </Link>
          ) : null}
          <Link
            href="/dashboard/ai-workforce"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60"
            onClick={() => setOpen(false)}
          >
            <Sparkles className="size-3.5 text-spark" aria-hidden />
            Ask Summer
          </Link>
        </div>
      ) : null}
    </div>
  );
}
