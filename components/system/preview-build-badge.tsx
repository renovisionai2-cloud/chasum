"use client";

import { useEffect, useState } from "react";

/** Quiet, verified non-Production identity within the existing dashboard flow. */
export function PreviewBuildBadge() {
  const [info, setInfo] = useState<{
    commitShort: string;
    env: "preview" | "development";
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/build-info")
      .then(async (response) => {
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (!data || typeof data !== "object" || Array.isArray(data)) return;
        const identity = data as Record<string, unknown>;
        // A short label is trustworthy only when it agrees with the full SHA.
        if (
          cancelled ||
          identity.production !== false ||
          (identity.env !== "preview" && identity.env !== "development") ||
          typeof identity.commit !== "string" ||
          !/^[a-f0-9]{40}$/i.test(identity.commit) ||
          identity.commitShort !== identity.commit.slice(0, 7)
        ) return;
        setInfo({ commitShort: identity.commit.slice(0, 7), env: identity.env });
      })
      .catch(() => {
        // Unavailable identity stays hidden; never invent a local build label.
      });
    return () => { cancelled = true; };
  }, []);

  if (!info) return null;

  return (
    <footer
      aria-label="Build information"
      className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-2 text-xs text-muted-foreground md:mb-[calc(2rem+env(safe-area-inset-bottom))] lg:mb-0"
    >
      <p>
        {info.env === "preview" ? "Preview" : "Development"} ·{" "}
        <span className="font-mono">{info.commitShort}</span> · {info.env}
      </p>
      <a
        href="/api/build-info"
        className="ds-focus-ring inline-flex min-h-11 shrink-0 items-center rounded-md px-2 font-medium text-foreground underline underline-offset-4"
      >
        Build details
      </a>
    </footer>
  );
}
