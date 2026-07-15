"use client";

import { OwnerErrorState } from "@/components/owner/page-frame";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function OwnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[owner]", error);
  }, [error]);

  return (
    <div className="ds-page">
      <OwnerErrorState message={error.message || "Something went wrong."} />
      <div className="flex justify-center">
        <Button type="button" variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
