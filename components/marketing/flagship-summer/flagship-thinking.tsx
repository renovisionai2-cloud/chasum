"use client";

import { SummerOrb } from "@/components/marketing/flagship-summer/summer-orb";
import { buildThinkingCues } from "@/lib/marketing/meet-summer-intelligence";
import { FS_REASONING_STEPS, FS_THINKING_STEPS } from "@/lib/marketing/flagship-summer";
import type { SessionMemory } from "@/lib/website-concierge/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Visible intelligence — checklist reasoning, never a spinner.
 * Uses Session Memory cues when available; otherwise calm defaults.
 */
export function FlagshipThinking({
  memory,
  pending,
  reducedMotion,
  compact = false,
}: {
  memory: SessionMemory;
  pending: boolean;
  reducedMotion: boolean;
  compact?: boolean;
}) {
  const cues = buildThinkingCues(memory);
  const midConversation =
    memory.businessType !== "unknown" &&
    (memory.challenges.length > 0 ||
      memory.goals.length > 0 ||
      !!memory.employeeCount ||
      !!memory.currentSoftware);

  const steps =
    cues.length >= 3
      ? cues.map((c) => c.label)
      : midConversation
        ? [...FS_REASONING_STEPS]
        : [...FS_THINKING_STEPS];

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!pending || reducedMotion) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 850);
    return () => window.clearInterval(id);
  }, [pending, reducedMotion]);

  const completed = pending
    ? Math.min(steps.length, 1 + (tick % steps.length))
    : memory.businessType !== "unknown"
      ? steps.length
      : 0;

  // Compact mode only surfaces while Summer is actively reasoning
  if (compact && !pending) return null;
  if (!compact && !pending && memory.businessType === "unknown") return null;

  return (
    <div
      className={cn("fs-thinking", compact && "fs-thinking-compact")}
      aria-live="polite"
    >
      {!compact ? (
        <>
          <p className="fs-scene-kicker">Visible intelligence</p>
          <h2 className="fs-scene-title">Summer is thinking.</h2>
        </>
      ) : (
        <p className="fs-thinking-compact-label">Summer is reasoning…</p>
      )}

      <div className={cn("fs-thinking-layout", compact && "fs-thinking-layout-compact")}>
        {!compact ? <SummerOrb size="xl" active={pending} /> : null}
        <ul className="fs-think-list">
          {steps.map((step, i) => {
            const done = i < completed;
            return (
              <li
                key={step}
                className={cn("fs-think-item", done && "fs-think-item-done")}
              >
                <span className="fs-think-mark" aria-hidden>
                  {done ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                </span>
                <span>{step}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
