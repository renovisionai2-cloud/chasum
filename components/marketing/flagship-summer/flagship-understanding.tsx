"use client";

import { buildUnderstandingFields } from "@/lib/marketing/meet-summer-intelligence";
import type { SessionMemory } from "@/lib/website-concierge/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/**
 * Live Business Profile — populates gradually from Session Memory.
 * Never dumps every field at once; undiscovered fields stay as ellipsis.
 */
export function FlagshipUnderstanding({
  memory,
  industryLabel,
  live = false,
}: {
  memory: SessionMemory;
  /** Preferred business label from category selection (before memory settles) */
  industryLabel?: string | null;
  /** Compact side-panel presentation beside conversation */
  live?: boolean;
}) {
  const fields = buildUnderstandingFields(memory, {
    businessOverride: industryLabel ?? null,
    showPending: live,
  });

  const any = fields.some((f) => f.discovered);
  if (!live && !any) return null;

  return (
    <aside
      className={cn("fs-profile", live && "fs-profile-live")}
      aria-labelledby="fs-understand-title"
    >
      <p className="fs-scene-kicker">Business profile</p>
      <h2 id="fs-understand-title" className="fs-profile-title">
        What Summer has learned
      </h2>

      <ul className={cn(live ? "fs-profile-stack" : "fs-profile-grid")}>
        {fields.map((field) => (
          <li
            key={field.id}
            className={cn(
              "fs-profile-card",
              field.discovered ? "fs-profile-card-live" : "fs-profile-card-muted",
              field.discovered && "fs-profile-card-reveal",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="fs-profile-label">{field.label}</p>
                <p className="fs-profile-value">
                  {field.discovered ? field.value : "…"}
                </p>
              </div>
              {field.discovered ? (
                <span className="fs-profile-check" aria-hidden>
                  <Check className="size-3.5" strokeWidth={2.5} />
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
