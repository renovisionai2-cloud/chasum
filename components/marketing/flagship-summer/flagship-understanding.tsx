"use client";

import { buildUnderstandingFields } from "@/lib/marketing/meet-summer-intelligence";
import type { SessionMemory } from "@/lib/website-concierge/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/**
 * Business understanding woven into the consultation — grows as Summer learns.
 * Not a separate dashboard panel.
 */
export function FlagshipUnderstanding({
  memory,
  industryLabel,
  live = false,
}: {
  memory: SessionMemory;
  industryLabel?: string | null;
  live?: boolean;
}) {
  const fields = buildUnderstandingFields(memory, {
    businessOverride: industryLabel ?? null,
    showPending: live,
  });

  const discovered = fields.filter((f) => f.discovered);
  const learning = fields.filter((f) => !f.discovered).slice(0, 2);

  if (!live && discovered.length === 0) return null;

  if (live) {
    const woven = [...discovered, ...learning];
    if (woven.length === 0) return null;

    return (
      <aside
        className="fs-learned"
        aria-labelledby="fs-understand-title"
      >
        <p className="fs-learned-kicker" id="fs-understand-title">
          What Summer has learned
        </p>
        <ul className="fs-learned-flow">
          {woven.map((field) => (
            <li
              key={field.id}
              className={cn(
                "fs-learned-chip",
                field.discovered
                  ? "fs-learned-chip-known"
                  : "fs-learned-chip-learning",
                field.discovered && "fs-learned-chip-in",
              )}
            >
              <span className="fs-learned-label">{field.label}</span>
              <span className="fs-learned-value">
                {field.discovered ? field.value : "Learning…"}
              </span>
              {field.discovered ? (
                <Check className="size-3 opacity-70" strokeWidth={2.5} aria-hidden />
              ) : null}
            </li>
          ))}
        </ul>
      </aside>
    );
  }

  return (
    <aside
      className="fs-profile"
      aria-labelledby="fs-understand-title"
    >
      <p className="fs-scene-kicker">Business profile</p>
      <h2 id="fs-understand-title" className="fs-profile-title">
        What Summer has learned
      </h2>

      <ul className="fs-profile-grid">
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
                  {field.discovered ? field.value : "Learning…"}
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
