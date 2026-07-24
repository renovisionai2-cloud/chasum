"use client";

import { SummerOrb } from "@/components/marketing/flagship-summer/summer-orb";
import { buildThinkingCues } from "@/lib/marketing/meet-summer-intelligence";
import {
  FS_REASONING_STEPS,
  FS_THINKING_STEPS,
} from "@/lib/marketing/flagship-summer";
import type { SessionMemory } from "@/lib/website-concierge/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/**
 * Live thinking sequence — one calm step at a time; completed steps check off.
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

  const steps = useMemo(
    () =>
      cues.length >= 3
        ? cues.map((c) => c.label)
        : midConversation
          ? [...FS_REASONING_STEPS]
          : [...FS_THINKING_STEPS],
    [cues, midConversation],
  );

  // activeIndex: step currently animating; steps before it are complete
  const [activeIndex, setActiveIndex] = useState(0);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (!pending) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex(0);
    setRunId((n) => n + 1);
  }, [pending, steps.join("|")]);

  useEffect(() => {
    if (!pending || reducedMotion) {
      if (pending && reducedMotion) setActiveIndex(steps.length);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setActiveIndex(Math.min(i, steps.length));
      if (i >= steps.length) window.clearInterval(id);
    }, 720);
    return () => window.clearInterval(id);
  }, [pending, reducedMotion, runId, steps.length]);

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

      <div
        className={cn(
          "fs-thinking-layout",
          compact && "fs-thinking-layout-compact",
        )}
      >
        {!compact ? <SummerOrb size="xl" active={pending} /> : null}
        <ul className="fs-think-list">
          {steps.map((step, i) => {
            const done = i < activeIndex;
            const active = pending && i === activeIndex && activeIndex < steps.length;
            return (
              <li
                key={`${runId}-${step}`}
                className={cn(
                  "fs-think-item",
                  done && "fs-think-item-done",
                  active && "fs-think-item-live",
                )}
              >
                <span className="fs-think-mark" aria-hidden>
                  {done ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : active ? (
                    <span className="fs-think-pulse" />
                  ) : null}
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
