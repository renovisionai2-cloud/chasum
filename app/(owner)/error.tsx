"use client";

import { OwnerErrorState } from "@/components/owner/page-frame";
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

export default function OwnerError({
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
      scope: "owner_error_boundary",
      digest: error.digest,
      referenceId,
    });
  }, [error, referenceId]);

  return (
    <div className="ds-page">
      <OwnerErrorState message="Something went wrong in Platform Admin." />
      {referenceId ? (
        <p className="text-center font-mono text-xs text-muted-foreground">
          Support reference {referenceId}
        </p>
      ) : null}
      <div className="flex justify-center">
        <Button type="button" variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
