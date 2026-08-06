"use client";

import { dispatchOpenCommandPalette } from "@/lib/reception/workflow-events";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useState } from "react";

type CommandTriggerProps = {
  className?: string;
  /** Compact icon-only for mobile header. */
  compact?: boolean;
};

function resolveModHint(): string {
  if (typeof navigator === "undefined") return "Ctrl";
  return /Mac|iPhone|iPad/i.test(navigator.platform) ? "⌘" : "Ctrl";
}

export function CommandTrigger({ className, compact = false }: CommandTriggerProps) {
  const [modHint] = useState(resolveModHint);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => dispatchOpenCommandPalette()}
        className={cn(
          "inline-flex h-10 w-10 min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-[var(--radius-md)] border border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted hover:text-foreground ds-focus-ring",
          className,
        )}
        aria-label="Open search and commands"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => dispatchOpenCommandPalette()}
      className={cn(
        "flex min-h-[var(--touch-min)] min-w-0 max-w-md flex-1 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted hover:text-foreground ds-focus-ring",
        className,
      )}
      aria-label="Open search and commands"
    >
      <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">Search or jump to…</span>
      <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
        {modHint === "⌘" ? "⌘K" : "Ctrl+K"}
      </kbd>
    </button>
  );
}
