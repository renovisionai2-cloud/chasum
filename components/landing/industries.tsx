"use client";

import { Reveal } from "@/components/landing/reveal";
import { INDUSTRIES } from "@/lib/marketing/homepage";
import { cn } from "@/lib/utils";
import {
  BriefcaseBusiness,
  Camera,
  Car,
  Dumbbell,
  Hammer,
  PawPrint,
  Scissors,
  Sparkles,
  SprayCan,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  "Medical Clinics": Stethoscope,
  Salons: Scissors,
  Spas: Sparkles,
  Gyms: Dumbbell,
  Automotive: Car,
  "Home & Field Services": Hammer,
  "Photography & Creative": Camera,
  "Pet Services": PawPrint,
  Cleaning: SprayCan,
  "Professional Services": BriefcaseBusiness,
};

/**
 * Industries — workflows shaped with real operators; notes when present.
 */
export function Industries() {
  const [active, setActive] = useState<string>(INDUSTRIES[0]?.name ?? "");
  const current =
    INDUSTRIES.find((industry) => industry.name === active) ?? INDUSTRIES[0];
  const Icon = current
    ? (INDUSTRY_ICONS[current.name] ?? BriefcaseBusiness)
    : BriefcaseBusiness;

  if (!current) return null;

  return (
    <section
      id="industries"
      className="marketing-section-contain marketing-surface-tint marketing-hairline-y scroll-mt-24 px-6 py-24 md:py-36"
      aria-labelledby="industries-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">Solutions</p>
            <h2 id="industries-heading" className="marketing-h2-xl">
              Built around the way service businesses actually work.
            </h2>
            <p className="marketing-lede">
              Service businesses share the need to understand their day—but
              workflows are not identical. Chasum is shaped with real operators
              so each business can configure around how it works.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <Reveal>
            <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {INDUSTRIES.map((industry) => {
                const ItemIcon =
                  INDUSTRY_ICONS[industry.name] ?? BriefcaseBusiness;
                const selected = industry.name === active;
                return (
                  <li key={industry.name} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActive(industry.name)}
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-250",
                        selected
                          ? "border-primary/25 bg-card shadow-md shadow-foreground/[0.04]"
                          : "border-transparent hover:bg-card/70",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        <ItemIcon className="h-4 w-4" />
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          selected ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {industry.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal delayMs={80}>
            <article
              key={current.name}
              className="marketing-tour-transition marketing-elevate-lg rounded-[1.75rem] border border-border/60 bg-card p-8 md:p-10 lg:p-12"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    {current.name}
                  </h3>
                  {"status" in current && current.status ? (
                    <p className="mt-2 text-xs font-medium text-muted-foreground">
                      {current.status}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-10 grid gap-8 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    What makes the workflow unique
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-foreground/85 md:text-lg">
                    {current.problem}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    How Chasum supports the operation
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-foreground/85 md:text-lg">
                    {current.solution}
                  </p>
                </div>
              </div>

              <div className="mt-10 border-t border-border/60 pt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Recommended product foundations
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {current.modules.map((mod) => (
                    <li
                      key={mod}
                      className="rounded-full bg-muted px-3.5 py-1.5 text-sm font-medium text-foreground"
                    >
                      {mod}
                    </li>
                  ))}
                </ul>
              </div>

              {"note" in current && current.note ? (
                <p className="mt-8 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  {current.note}
                </p>
              ) : null}
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
