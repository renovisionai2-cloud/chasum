"use client";

import { Button } from "@/components/ui/button";
import { createSupportReference } from "@/lib/observability/correlation";
import { captureException } from "@/lib/observability/sentry";
import { useEffect, useState } from "react";

function supportReference(): string | null {
  try {
    return createSupportReference();
  } catch {
    return null;
  }
}

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
  const [referenceId] = useState(supportReference);

  useEffect(() => {
    captureException(error, {
      domain: "ui",
      scope: "calendar_error_boundary",
      digest: error.digest,
      referenceId,
    });
  }, [error, referenceId]);

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
        {referenceId ? (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Support reference {referenceId}
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
