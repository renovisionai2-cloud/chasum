"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

/**
 * Calendar-route error boundary — keeps Reception failures from blanking
 * the entire dashboard when a view fails after navigation.
 */
export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[calendar]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Calendar could not load
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong loading this view. Your bookings are safe —
          try again or switch to another day.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Ref {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <a
          href="/dashboard/calendar?view=day"
          className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-border bg-card/60 px-5 text-sm font-medium shadow-xs transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open day view
        </a>
      </div>
    </div>
  );
}
