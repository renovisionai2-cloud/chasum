"use client";

import { Reveal } from "@/components/landing/reveal";
import {
  COMPARISON_COLUMNS,
  COMPARISON_ROWS,
  type ComparisonValue,
} from "@/lib/marketing/homepage";
import { cn } from "@/lib/utils";
import { useState } from "react";

const LABELS: Record<ComparisonValue, string> = {
  yes: "Yes",
  partial: "Partial",
  roadmap: "Roadmap",
  varies: "Varies",
};

const TONE: Record<ComparisonValue, string> = {
  yes: "bg-primary/10 text-primary border-primary/20",
  partial: "bg-muted text-foreground border-border/60",
  roadmap: "bg-spark-muted text-spark border-spark/20",
  varies: "bg-transparent text-muted-foreground border-border/50",
};

/**
 * V3 Comparison — visual, interactive, not a spreadsheet.
 */
export function Comparison() {
  const competitors = COMPARISON_COLUMNS.filter((col) => col !== "Chasum");
  const [active, setActive] = useState<(typeof competitors)[number]>(
    competitors[0] ?? "Picktime",
  );

  return (
    <section
      id="compare"
      className="marketing-section-contain marketing-surface-tint marketing-hairline-y scroll-mt-24 px-6 py-24 md:py-36"
      aria-labelledby="compare-heading"
    >
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">Compare</p>
            <h2 id="compare-heading" className="marketing-h2-xl">
              How Chasum Compares
            </h2>
            <p className="marketing-lede">
              Structured for honesty. Competitor capabilities vary by plan —
              use this as a starting checklist, not a final verdict.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={60}>
          <div
            className="mt-12 flex flex-wrap justify-center gap-2"
            role="tablist"
            aria-label="Competitors"
          >
            {competitors.map((col) => (
              <button
                key={col}
                type="button"
                role="tab"
                aria-selected={active === col}
                onClick={() => setActive(col)}
                data-active={active === col}
                className={cn(
                  "marketing-compare-pill rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                  active === col
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                vs {col}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="marketing-elevate-lg mt-10 overflow-hidden rounded-[1.5rem] border border-border/60 bg-card">
            <div className="grid grid-cols-[1fr_auto_auto] gap-px border-b border-border/60 bg-border/50">
              <div className="bg-card px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Capability
              </div>
              <div className="bg-primary/10 px-6 py-4 text-center text-sm font-semibold text-primary">
                Chasum
              </div>
              <div className="min-w-[8.5rem] bg-card px-6 py-4 text-center text-sm font-semibold text-foreground">
                {active}
              </div>
            </div>

            <ul className="divide-y divide-border/60">
              {COMPARISON_ROWS.map((row) => (
                <li
                  key={row.feature}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-px transition-colors hover:bg-muted/20"
                >
                  <div className="px-5 py-5">
                    <p className="text-sm font-medium text-foreground">
                      {row.feature}
                    </p>
                    {row.note ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex justify-center bg-primary/[0.03] px-6 py-5">
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        TONE[row.values.Chasum],
                      )}
                    >
                      {LABELS[row.values.Chasum]}
                    </span>
                  </div>
                  <div className="flex min-w-[8.5rem] justify-center px-6 py-5">
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        TONE[row.values[active]],
                      )}
                    >
                      {LABELS[row.values[active]]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Comparison cells are data-driven — update as capabilities ship.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
