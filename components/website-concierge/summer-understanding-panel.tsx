"use client";

import { buildUnderstandingFields } from "@/lib/marketing/meet-summer-intelligence";
import type { SessionMemory } from "@/lib/website-concierge/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/**
 * Live Business Understanding panel — animates as Discovery fills Session Memory.
 */
export function SummerUnderstandingPanel({
  memory,
  reducedMotion,
  className,
}: {
  memory: SessionMemory;
  reducedMotion: boolean;
  className?: string;
}) {
  const fields = buildUnderstandingFields(memory);
  const discoveredCount = fields.filter((f) => f.discovered).length;

  return (
    <aside
      className={cn("meet-summer-understand", className)}
      aria-label="Business understanding"
    >
      <header className="border-b border-white/10 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/90">
          Business Understanding
        </p>
        <p className="mt-1 text-sm text-white/55">
          {discoveredCount === 0
            ? "Summer is ready to learn about your business."
            : `${discoveredCount} signal${discoveredCount === 1 ? "" : "s"} grounded this session.`}
        </p>
      </header>

      <ul className="space-y-0 px-2 py-2 sm:px-3">
        {fields.map((field) => (
          <li
            key={field.id}
            className={cn(
              "rounded-xl px-3 py-3 transition-colors",
              field.discovered ? "bg-white/[0.04]" : "opacity-55",
              field.discovered && !reducedMotion && "meet-summer-understand-pop",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
                  {field.label}
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm font-medium leading-snug",
                    field.discovered ? "text-white/90" : "text-white/35",
                  )}
                >
                  {field.discovered ? field.value : "Listening…"}
                </p>
              </div>
              {field.discovered ? (
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/25 text-primary">
                  <Check className="size-3" strokeWidth={2.5} aria-hidden />
                  <span className="sr-only">Discovered</span>
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
