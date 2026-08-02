"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

type BookingSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** When true, section starts collapsed and can expand. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  badge?: string;
};

export function BookingSection({
  title,
  description,
  children,
  className,
  collapsible = false,
  defaultOpen = true,
  badge,
}: BookingSectionProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <section className={cn("space-y-3", className)} aria-labelledby={id}>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 id={id} className="text-sm font-semibold tracking-tight">
              {title}
            </h3>
            {badge ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {badge}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </section>
    );
  }

  return (
    <section className={cn("space-y-2", className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] px-0.5 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <span id={id} className="block text-sm font-semibold tracking-tight">
            {title}
          </span>
          {description && !open ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={`${id}-panel`}
          className="space-y-3 motion-safe:animate-fade-in-up"
        >
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
          {children}
        </div>
      ) : null}
    </section>
  );
}
