"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Sticky footer (actions) */
  footer?: React.ReactNode;
  /** Header trailing actions (menus) */
  headerActions?: React.ReactNode;
  className?: string;
  /** Desktop side; mobile always bottom */
  side?: "right" | "left";
};

/**
 * Unified sheet shell — right drawer on desktop, bottom sheet on mobile.
 * Focus trap + Escape close. Honors prefers-reduced-motion via CSS.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  headerActions,
  className,
  side = "right",
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      const preferred = panelRef.current?.querySelector<HTMLElement>(
        "[data-sheet-autofocus]",
      );
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (preferred ?? first)?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        "items-end justify-center",
        "md:items-stretch",
        side === "right" ? "md:justify-end" : "md:justify-start",
      )}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px] motion-safe:transition-opacity"
        aria-label="Close booking sheet"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative z-10 flex w-full flex-col border-border bg-card shadow-xl",
          "max-h-[92vh] rounded-t-[var(--radius-lg)] border",
          "md:h-full md:max-h-none md:w-[min(34rem,100%)] md:rounded-none",
          side === "right" ? "md:border-l md:border-y-0 md:border-r-0" : "md:border-r md:border-y-0 md:border-l-0",
          className,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Booking Sheet
            </p>
            <h2 id={titleId} className="truncate text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {headerActions}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-4" />
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>

        {footer ? (
          <footer className="sticky bottom-0 shrink-0 border-t border-border bg-card/95 px-5 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
