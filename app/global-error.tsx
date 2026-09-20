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

export default function GlobalError({
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
      scope: "global_error_boundary",
      digest: error.digest,
      referenceId,
    });
  }, [error, referenceId]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
        <Logo href={null} size="lg" />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="max-w-md text-muted-foreground">
            An unexpected error occurred. You can try again or return home.
          </p>
          {referenceId ? (
            <p className="font-mono text-xs text-muted-foreground">
              Support reference {referenceId}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Back home
          </Button>
        </div>
      </body>
    </html>
  );
}
