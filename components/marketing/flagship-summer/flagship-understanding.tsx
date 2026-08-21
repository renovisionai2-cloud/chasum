"use client";

import { buildUnderstandingFields } from "@/lib/marketing/meet-summer-intelligence";
import type { SessionMemory } from "@/lib/website-concierge/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * What I've Learned — Summer's working memory for the consultation.
 * Learning → completed uses a calm glow, never celebration.
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
  const knownIds = discovered.map((f) => f.id).join("|");
  const prevKnownRef = useRef<Set<string>>(new Set());
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prev = prevKnownRef.current;
    const next = new Set(
      knownIds ? knownIds.split("|").filter(Boolean) : [],
    );
    const gained: string[] = [];
    for (const id of next) {
      if (!prev.has(id)) gained.push(id);
    }
    prevKnownRef.current = next;
    if (gained.length === 0) return;

    const glow = window.setTimeout(() => {
      setJustCompleted(new Set(gained));
    }, 16);
    const clear = window.setTimeout(() => {
      setJustCompleted(new Set());
    }, 1050);

    return () => {
      window.clearTimeout(glow);
      window.clearTimeout(clear);
    };
  }, [knownIds]);

  if (!live && discovered.length === 0) return null;

  if (live) {
    return (
      <aside
        className="fs-memory"
        aria-labelledby="fs-understand-title"
      >
        <p className="fs-memory-kicker" id="fs-understand-title">
          What I&apos;ve Learned
        </p>
        <ul className="fs-memory-list">
          {fields.map((field) => {
            const isJust = justCompleted.has(field.id);
            return (
              <li
                key={field.id}
                className={cn(
                  "fs-memory-row",
                  field.discovered
                    ? "fs-memory-row-known"
                    : "fs-memory-row-learning",
                  field.discovered && "fs-memory-row-in",
                  isJust && "fs-memory-row-just",
                )}
              >
                <span
                  className={cn(
                    "fs-memory-mark",
                    field.discovered && "fs-memory-mark-check",
                    isJust && "fs-memory-mark-just",
                  )}
                  aria-hidden
                >
                  {field.discovered ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    <span className="fs-memory-dot" />
                  )}
                </span>
                <span className="fs-memory-label">{field.label}</span>
                <span className="fs-memory-value">
                  {field.discovered
                    ? field.value
                    : (field.pendingLabel ?? "Learning…")}
                </span>
              </li>
            );
          })}
        </ul>
      </aside>
    );
  }

  return (
    <aside
      className="fs-profile"
      aria-labelledby="fs-understand-title"
    >
      <p className="fs-scene-kicker">What I&apos;ve Learned</p>
      <h2 id="fs-understand-title" className="fs-profile-title">
        What Summer has learned
      </h2>

      <ul className="fs-profile-grid">
        {fields
          .filter((f) => f.id !== "recommendations" || f.discovered)
          .map((field) => (
            <li
              key={field.id}
              className={cn(
                "fs-profile-card",
                field.discovered
                  ? "fs-profile-card-live"
                  : "fs-profile-card-muted",
                field.discovered && "fs-profile-card-reveal",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="fs-profile-label">{field.label}</p>
                  <p className="fs-profile-value">
                    {field.discovered
                      ? field.value
                      : (field.pendingLabel ?? "Learning…")}
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
