"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarPlus,
  Plus,
  UserPlus,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

const ACTIONS = [
  {
    href: "/dashboard/calendar?view=day&book=1",
    label: "Book appointment",
    icon: CalendarPlus,
  },
  {
    href: "/dashboard/clients",
    label: "Add customer",
    icon: UserPlus,
  },
  {
    href: "/dashboard/payments",
    label: "Record payment",
    icon: Banknote,
  },
] as const;

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
        className="h-9 gap-1.5 px-2.5"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
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
          className="absolute right-0 top-full z-50 mt-1.5 min-w-[12.5rem] rounded-[var(--radius-md)] border border-border bg-card p-1 shadow-lg"
        >
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                role="menuitem"
                className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted ds-focus-ring"
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
