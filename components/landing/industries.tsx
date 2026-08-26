"use client";

import { Reveal } from "@/components/landing/reveal";
import {
  INDUSTRIES,
  INDUSTRIES_HERO,
  INDUSTRY_GROWING_STATEMENT,
  INDUSTRY_SUMMER_LINE,
  INDUSTRY_TYPES_PREVIEW,
} from "@/lib/marketing/industries-page";
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
import { useState, type KeyboardEvent } from "react";

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  "Medical Clinics": Stethoscope,
  "Legal Services": Scale,
  Salons: Scissors,
  Spas: Sparkles,
  Gyms: Dumbbell,
  Automotive: Car,
  "Automotive Services": Car,
  "Home & Field Services": Hammer,
  "Photography & Creative": Camera,
  "Pet Services": PawPrint,
  Cleaning: SprayCan,
  "Professional Services": BriefcaseBusiness,
};

/**
 * Industries — one operating system, different business rhythm.
 */
export function Industries() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [typesExpanded, setTypesExpanded] = useState(false);
  const last = INDUSTRIES.length - 1;
  const current = INDUSTRIES[activeIndex] ?? INDUSTRIES[0];
  const Icon = current
    ? (INDUSTRY_ICONS[current.name] ?? BriefcaseBusiness)
    : BriefcaseBusiness;
  const visual = current ? getIndustryImage(current.name) : undefined;
  const hiddenTypeCount = current
    ? Math.max(0, current.types.length - INDUSTRY_TYPES_PREVIEW)
    : 0;
  const visibleTypes =
    current && (typesExpanded || hiddenTypeCount === 0)
      ? current.types
      : (current?.types.slice(0, INDUSTRY_TYPES_PREVIEW) ?? []);

  function select(index: number) {
    const next = Math.min(last, Math.max(0, index));
    setActiveIndex(next);
    setTypesExpanded(false);
    document
      .getElementById(`industries-tab-${slug(INDUSTRIES[next]!.name)}`)
      ?.focus();
  }

  function onSelectorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      select(activeIndex + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      select(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(last);
    }
  }

  if (!current) return null;

  return (
    <section
      id="industries"
      className="industries-page marketing-section-contain marketing-surface-tint marketing-hairline-y scroll-mt-24 px-6 py-16 md:py-24"
      aria-labelledby="industries-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">{INDUSTRIES_HERO.eyebrow}</p>
            <h1 id="industries-heading" className="marketing-h2-xl">
              {INDUSTRIES_HERO.headline}
            </h1>
            <p className="marketing-lede">{INDUSTRIES_HERO.lede}</p>
            <p className="industries-os-bridge mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {INDUSTRIES_HERO.bridge}
            </p>
          </div>
        </Reveal>

        <div className="industries-layout mt-12 grid gap-6 lg:mt-14 lg:grid-cols-[minmax(0,16.5rem)_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <Reveal>
            <div
              role="tablist"
              aria-label="Industries"
              className="industries-selector"
              onKeyDown={onSelectorKeyDown}
            >
              {INDUSTRIES.map((industry, index) => {
                const ItemIcon =
                  INDUSTRY_ICONS[industry.name] ?? BriefcaseBusiness;
                const selected = index === activeIndex;
                const tabId = `industries-tab-${slug(industry.name)}`;
                return (
                  <button
                    key={industry.name}
                    type="button"
                    role="tab"
                    id={tabId}
                    aria-selected={selected}
                    aria-controls="industries-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => select(index)}
                    className={cn(
                      "industries-selector-item",
                      selected && "industries-selector-item-active",
                    )}
                  >
                    <span className="industries-selector-icon" aria-hidden>
                      <ItemIcon className="h-4 w-4" />
                    </span>
                    <span className="industries-selector-label">
                      {industry.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal delayMs={80}>
            <article
              id="industries-panel"
              role="tabpanel"
              aria-labelledby={`industries-tab-${slug(current.name)}`}
              className="industries-card marketing-elevate-lg rounded-[1.75rem] border border-border/60 bg-card p-6 md:p-8 lg:p-10"
            >
              <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(200px,40%)] md:items-start md:gap-8">
                <div className="min-w-0">
                  <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h2
                    key={`title-${current.name}`}
                    className="industry-detail-fade text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl"
                  >
                    {current.name}
                  </h2>
                  <p className="industry-detail-fade mt-1.5 text-xs font-medium text-muted-foreground">
                    {current.status}
                  </p>
                  <p
                    key={`intro-${current.name}`}
                    className="industry-detail-fade mt-4 max-w-xl text-base leading-relaxed text-foreground md:text-lg"
                  >
                    {current.intro}
                  </p>
                </div>

                {visual ? (
                  <div className="industry-detail-hero relative overflow-hidden rounded-2xl bg-muted/40 shadow-[0_14px_32px_-18px_rgba(15,23,42,0.38)]">
                    <Image
                      key={visual.id}
                      src={visual.hero}
                      alt={visual.alt}
                      width={visual.heroWidth}
                      height={visual.heroHeight}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 380px"
                      className="industry-detail-fade h-full w-full object-cover"
                      style={
                        visual.objectPosition
                          ? { objectPosition: visual.objectPosition }
                          : undefined
                      }
                      priority={activeIndex === 0}
                    />
                  </div>
                ) : null}
              </div>

              <div
                key={`body-${current.name}`}
                className="industry-detail-fade mt-8 grid gap-6 md:mt-9 md:grid-cols-2 md:gap-8"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                    What makes this business different
                  </p>
                  <p className="mt-2.5 text-base leading-relaxed text-foreground/90">
                    {current.distinction}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                    How Chasum helps connect it
                  </p>
                  <p className="mt-2.5 text-base leading-relaxed text-foreground/90">
                    {current.solution}
                  </p>
                </div>
              </div>

              <div
                key={`types-${current.name}`}
                className="industry-detail-fade mt-8 border-t border-border/50 pt-6"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {current.name === "Legal Services"
                    ? "Representative practice areas"
                    : "Representative business types"}
                </p>
                <ul
                  id={`industries-types-${slug(current.name)}`}
                  className="mt-3 flex flex-wrap gap-1.5"
                >
                  {visibleTypes.map((type) => (
                    <li
                      key={type}
                      className="rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {type}
                    </li>
                  ))}
                  {hiddenTypeCount > 0 ? (
                    <li>
                      <button
                        type="button"
                        className="industries-types-more"
                        aria-expanded={typesExpanded}
                        aria-controls={`industries-types-${slug(current.name)}`}
                        onClick={() => setTypesExpanded((open) => !open)}
                      >
                        {typesExpanded
                          ? "Show fewer"
                          : `+ ${hiddenTypeCount} more`}
                      </button>
                    </li>
                  ) : null}
                </ul>
              </div>

              <div
                key={`modules-${current.name}`}
                className="industry-detail-fade mt-6"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Most relevant capabilities
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {current.modules.map((mod) => (
                    <li
                      key={mod}
                      className="rounded-full border border-border/40 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                      {mod}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>
        </div>

        <Reveal delayMs={120}>
          <div className="industries-growth mx-auto mt-12 max-w-2xl text-center md:mt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Growing with your business
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
              {INDUSTRY_GROWING_STATEMENT}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {INDUSTRY_SUMMER_LINE}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
