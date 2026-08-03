"use client";

import { useEffect, useState } from "react";

/**
 * Preview-only commit fingerprint so testers can confirm which build is live.
 * Hidden in production.
 */
export function PreviewBuildBadge() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/build-info")
      .then((r) => r.json())
      .then((data: { env?: string; commitShort?: string | null }) => {
        if (cancelled) return;
        if (data.env === "production") {
          setLabel(null);
          return;
        }
        if (data.commitShort) {
          setLabel(`Preview · ${data.commitShort}`);
        } else if (data.env === "preview" || data.env === "development") {
          setLabel(`Preview · local`);
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!label) return null;

  return (
    <p
      className="pointer-events-none fixed bottom-2 left-2 z-[60] rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-white/90"
      aria-hidden
    >
      {label}
    </p>
  );
}
