"use client";

import {
  buildThinkingCues,
  type ThinkingCue,
} from "@/lib/marketing/meet-summer-intelligence";
import type { SessionMemory } from "@/lib/website-concierge/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/**
 * Visualizes genuine reasoning steps from Discovery / Session Memory while pending.
 */
export function SummerThinkingViz({
  memory,
  pending,
  reducedMotion,
  className,
}: {
  memory: SessionMemory;
  pending: boolean;
  reducedMotion: boolean;
  className?: string;
}) {
  const cues = buildThinkingCues(memory);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!pending || reducedMotion || cues.length <= 1) return;
    const id = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 1400);
    return () => window.clearInterval(id);
  }, [pending, reducedMotion, cues.length]);

  if (!pending) return null;

  const index = reducedMotion ? 0 : tick % cues.length;
  const active: ThinkingCue = cues[index]!;

  return (
    <div
      className={cn("meet-summer-intel-viz", className)}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Summer is reasoning: {active.label}</span>
      <div className="flex items-start gap-3">
        <span className="meet-summer-intel-pulse" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/90">
            Reasoning
          </p>
          <p
            key={active.id}
            className={cn(
              "mt-1.5 text-sm font-medium text-white/85",
              !reducedMotion && "meet-summer-msg-enter",
            )}
          >
            {active.label}
          </p>
          <ul className="mt-3 space-y-1.5" aria-hidden>
            {cues.map((cue, i) => (
              <li
                key={cue.id}
                className={cn(
                  "text-xs transition-colors duration-300",
                  i === index ? "text-white/70" : "text-white/30",
                )}
              >
                {cue.label.replace(/…$/, "")}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
