"use client";

import { Reveal } from "@/components/landing/reveal";
import { buildUnderstandingFields } from "@/lib/marketing/meet-summer-intelligence";
import type { SessionMemory } from "@/lib/website-concierge/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function FlagshipUnderstanding({ memory }: { memory: SessionMemory }) {
  const fields = buildUnderstandingFields(memory);
  const any = fields.some((f) => f.discovered);
  if (!any) return null;

  return (
    <section className="fs-scene" aria-labelledby="fs-understand-title">
      <Reveal>
        <p className="fs-scene-kicker">Business understanding</p>
        <h2 id="fs-understand-title" className="fs-scene-title">
          What Summer has learned.
        </h2>
      </Reveal>

      <ul className="fs-profile-grid">
        {fields.map((field, i) => (
          <Reveal key={field.id} delayMs={i * 50}>
            <li
              className={cn(
                "fs-profile-card",
                field.discovered ? "fs-profile-card-live" : "fs-profile-card-muted",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="fs-profile-label">{field.label}</p>
                  <p className="fs-profile-value">
                    {field.discovered ? field.value : "—"}
                  </p>
                </div>
                {field.discovered ? (
                  <span className="fs-profile-check" aria-hidden>
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                ) : null}
              </div>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
