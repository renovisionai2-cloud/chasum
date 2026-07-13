"use client";

import { Button } from "@/components/ui/button";
import {
  dispatchOpenCommandPalette,
  dispatchReceptionAction,
  type ReceptionQuickAction,
} from "@/lib/reception/workflow-events";
import {
  CalendarPlus,
  Clock,
  Footprints,
  StickyNote,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const ACTIONS: {
  action: ReceptionQuickAction;
  label: string;
  shortcut: string;
  icon: typeof UserPlus;
}[] = [
  { action: "new-customer", label: "New Customer", shortcut: "N", icon: UserPlus },
  {
    action: "book-appointment",
    label: "Book Appointment",
    shortcut: "B",
    icon: CalendarPlus,
  },
  { action: "walk-in", label: "Walk-In", shortcut: "W", icon: Footprints },
  { action: "block-time", label: "Block Time", shortcut: "T", icon: Clock },
  {
    action: "add-note",
    label: "Add Internal Note",
    shortcut: "I",
    icon: StickyNote,
  },
];
export function QuickActionsFab() {
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

  function run(action: ReceptionQuickAction) {
    setOpen(false);
    dispatchReceptionAction(action);
  }

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6"
    >
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Quick actions"
          className="pointer-events-auto flex w-56 flex-col gap-1 rounded-[var(--radius-lg)] border border-border bg-card p-2 shadow-lg"
        >
          {ACTIONS.map(({ action, label, shortcut, icon: Icon }) => (
            <button
              key={action}
              type="button"
              role="menuitem"
              className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => run(action)}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{label}</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {shortcut}
              </kbd>
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              setOpen(false);
              dispatchReceptionAction("focus-customer-search");
            }}
          >
            Search customer
            <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
              /
            </kbd>
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              setOpen(false);
              dispatchOpenCommandPalette();
            }}
          >
            <Zap className="h-4 w-4" />
            Command palette
            <span className="ml-auto text-[10px]">⌘K</span>
          </button>
        </div>
      )}

      <Button
        type="button"
        size="lg"
        className="pointer-events-auto h-12 w-12 rounded-full p-0 shadow-lg"
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
      </Button>
    </div>
  );
}
