"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type UserAccountMenuProps = {
  email?: string;
  className?: string;
};

export function UserAccountMenu({ email, className }: UserAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const initial = email?.charAt(0).toUpperCase() ?? "?";

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
      <button
        type="button"
        className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-transparent px-1.5 py-1 transition-colors hover:border-border hover:bg-muted/40 ds-focus-ring"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-foreground">
            Account
          </p>
          <p className="max-w-[160px] truncate text-[11px] text-muted-foreground">
            {email}
          </p>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20"
          aria-hidden="true"
        >
          {initial}
        </div>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 min-w-[13rem] rounded-[var(--radius-md)] border border-border bg-card p-1 shadow-lg"
        >
          {email ? (
            <p className="truncate px-2.5 py-2 text-xs text-muted-foreground">
              {email}
            </p>
          ) : null}
          <Link
            href="/dashboard/settings"
            role="menuitem"
            className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm hover:bg-muted ds-focus-ring"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Account &amp; billing
          </Link>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              role="menuitem"
              className="h-auto w-full justify-start gap-2 px-2.5 py-2 text-sm font-normal"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Sign out
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
