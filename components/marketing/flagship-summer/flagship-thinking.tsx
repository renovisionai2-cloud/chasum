"use client";

import { SummerOrb } from "@/components/marketing/flagship-summer/summer-orb";
import { Reveal } from "@/components/landing/reveal";
import { buildThinkingCues } from "@/lib/marketing/meet-summer-intelligence";
import { FS_THINKING_STEPS } from "@/lib/marketing/flagship-summer";
import type { SessionMemory } from "@/lib/website-concierge/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

export function FlagshipThinking({
  memory,
  pending,
  reducedMotion,
}: {
  memory: SessionMemory;
  pending: boolean;
  reducedMotion: boolean;
}) {
  const cues = buildThinkingCues(memory);
  const steps =
    cues.length >= 3
      ? cues.map((c) => c.label)
      : [...FS_THINKING_STEPS];
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!pending || reducedMotion) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 900);
    return () => window.clearInterval(id);
  }, [pending, reducedMotion]);

  const completed = pending
    ? Math.min(steps.length, 1 + (tick % steps.length))
    : memory.businessType !== "unknown"
      ? steps.length
      : 0;

  if (!pending && memory.businessType === "unknown") return null;

  return (
    <section
      className="fs-scene fs-thinking"
      aria-labelledby="fs-thinking-title"
      aria-live="polite"
    >
      <Reveal>
        <p className="fs-scene-kicker">Visible intelligence</p>
        <h2 id="fs-thinking-title" className="fs-scene-title">
          Summer is thinking.
        </h2>
      </Reveal>

      <div className="fs-thinking-layout">
        <SummerOrb size="xl" active={pending} />
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
    </section>
  );
}
