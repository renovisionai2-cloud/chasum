"use client";

import { Reveal } from "@/components/landing/reveal";
import { INDUSTRIES } from "@/lib/marketing/homepage";
import { getIndustryImage } from "@/lib/marketing/industryImages";
import { cn } from "@/lib/utils";
import {
  BriefcaseBusiness,
  Camera,
  Car,
  Dumbbell,
  Hammer,
  PawPrint,
  Scale,
  Scissors,
  Sparkles,
  SprayCan,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  "Medical Clinics": Stethoscope,
  "Legal Services": Scale,
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
  const visual = current ? getIndustryImage(current.name) : undefined;

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
            <p className="marketing-eyebrow">Industries</p>
            <h1 id="industries-heading" className="marketing-h2-xl">
              Built around the way service businesses actually work.
            </h1>
            <p className="marketing-lede">
              Service businesses share the need to understand their day—but
              workflows are not identical. Chasum is shaped with real operators
              so each business can configure around how it works.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <Reveal>
            <ul
              className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="listbox"
              aria-label="Industries"
            >
              {INDUSTRIES.map((industry) => {
                const ItemIcon =
                  INDUSTRY_ICONS[industry.name] ?? BriefcaseBusiness;
                const selected = industry.name === active;
                return (
                  <li key={industry.name} className="shrink-0" role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
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
                        <ItemIcon className="h-4 w-4" aria-hidden />
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
              className="marketing-elevate-lg rounded-[1.75rem] border border-border/60 bg-card p-8 md:p-10 lg:p-12"
              aria-live="polite"
            >
              <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(200px,40%)] md:items-start">
                <div className="min-w-0">
                  <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h3
                    key={`title-${current.name}`}
                    className="industry-detail-fade text-3xl font-semibold tracking-tight md:text-4xl"
                  >
                    {current.name}
                  </h3>
                  {"status" in current && current.status ? (
                    <p
                      key={`status-${current.name}`}
                      className="industry-detail-fade mt-2 text-xs font-medium text-muted-foreground"
                    >
                      {current.status}
                    </p>
                  ) : null}
                  {"intro" in current && current.intro ? (
                    <p
                      key={`intro-${current.name}`}
                      className="industry-detail-fade mt-5 max-w-xl text-base leading-relaxed text-foreground/85 md:text-lg"
                    >
                      {current.intro}
                    </p>
                  ) : null}
                </div>

                {visual ? (
                  <div className="industry-detail-hero relative overflow-hidden rounded-2xl bg-muted/40 shadow-[0_14px_32px_-18px_rgba(15,23,42,0.38)]">
                    <Image
                      key={visual.id}
                      src={visual.hero}
                      alt={visual.alt}
                      width={visual.heroWidth}
                      height={visual.heroHeight}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 420px"
                      className="industry-detail-fade h-full w-full object-cover"
                      style={
                        visual.objectPosition
                          ? { objectPosition: visual.objectPosition }
                          : undefined
                      }
                      priority={current.name === INDUSTRIES[0].name}
                    />
                  </div>
                ) : null}
              </div>

              <div
                key={`body-${current.name}`}
                className="industry-detail-fade mt-10 grid gap-8 md:grid-cols-2"
              >
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

              {"types" in current && current.types?.length ? (
                <div
                  key={`types-${current.name}`}
                  className="industry-detail-fade mt-10 border-t border-border/60 pt-8"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Representative practice areas
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {current.types.map((type) => (
                      <li
                        key={type}
                        className="rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-sm font-medium text-foreground/90"
                      >
                        {type}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div
                key={`modules-${current.name}`}
                className="industry-detail-fade mt-10 border-t border-border/60 pt-8"
              >
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
                <p
                  key={`note-${current.name}`}
                  className="industry-detail-fade mt-8 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
                >
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
