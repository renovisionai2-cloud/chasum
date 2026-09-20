"use client";

import { Logo } from "@/components/brand/logo";
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

export default function DashboardError({
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
      scope: "dashboard_error_boundary",
      digest: error.digest,
      referenceId,
    });
  }, [error, referenceId]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo href={null} size="lg" />
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        We could not load this page. Please try again.
      </p>
      {referenceId ? (
        <p className="font-mono text-xs text-muted-foreground">
          Support reference {referenceId}
        </p>
      ) : null}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
