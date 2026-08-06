"use client";

import { Button } from "@/components/ui/button";
import { QUICK_CREATE_ACTIONS } from "@/lib/dashboard/quick-create";
import { cn } from "@/lib/utils";
import {
  Banknote,
  CalendarPlus,
  Plus,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

const ICONS = {
  "calendar-plus": CalendarPlus,
  "user-plus": UserPlus,
  banknote: Banknote,
} as const;

type QuickCreateMenuProps = {
  className?: string;
};

export function QuickCreateMenu({ className }: QuickCreateMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 min-h-[var(--touch-min)] gap-1.5 px-2.5"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        aria-label="New — create booking, customer, or payment"
        onClick={() => setOpen((v) => !v)}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">New</span>
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Quick create"
          className="absolute right-0 top-full z-[var(--z-overlay)] mt-1.5 min-w-[12.5rem] rounded-[var(--radius-md)] border border-border bg-card p-1 shadow-lg"
        >
          {QUICK_CREATE_ACTIONS.map((action) => {
            const Icon = ICONS[action.icon];
            return (
              <Link
                key={action.href}
                href={action.href}
                role="menuitem"
                className="flex min-h-[var(--touch-min)] items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted ds-focus-ring"
                onClick={() => setOpen(false)}
              >
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {action.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
