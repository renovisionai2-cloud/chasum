"use client";

import { useEffect, useState } from "react";

/**
 * Highly visible Preview commit fingerprint for authenticated portal testing.
 * Hidden in production.
 */
export function PreviewBuildBadge() {
  const [info, setInfo] = useState<{
    commitShort: string | null;
    env: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/build-info")
      .then((r) => r.json())
      .then(
        (data: {
          env?: string;
          commitShort?: string | null;
          production?: boolean;
        }) => {
          if (cancelled) return;
          if (data.production || data.env === "production") {
            setInfo(null);
            return;
          }
          setInfo({
            commitShort: data.commitShort ?? null,
            env: data.env ?? "preview",
          });
        },
      )
      .catch(() => {
        if (!cancelled) {
          setInfo({ commitShort: null, env: "development" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!info) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-3 left-3 z-[80] max-w-[min(100vw-1.5rem,20rem)] rounded-md border border-amber-400/50 bg-amber-950 px-3 py-2 shadow-lg"
      role="status"
      aria-label="Preview build identity"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200">
        Preview build
      </p>
      <p className="mt-0.5 font-mono text-xs font-bold text-white">
        {info.commitShort ?? "local"} · {info.env}
      </p>
      <p className="mt-0.5 text-[10px] text-amber-100/80">
        Confirm /api/build-info matches this commit before testing.
      </p>
    </div>
  );
}
