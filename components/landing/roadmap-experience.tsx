"use client";

import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  PRIVATE_ALPHA_HREF,
} from "@/lib/marketing/alpha";
import {
  ROADMAP_EYEBROW,
  ROADMAP_HEADLINE,
  ROADMAP_LAST_REVIEWED,
  ROADMAP_LEDE,
  ROADMAP_PHASES,
  type RoadmapPhase,
} from "@/lib/marketing/roadmap";
import { cn } from "@/lib/utils";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

function phaseAccent(id: RoadmapPhase["id"]) {
  switch (id) {
    case "completed":
      return {
        dot: "bg-success",
        badge: "bg-success/15 text-success",
        rail: "bg-success/40",
      };
    case "in_progress":
      return {
        dot: "bg-primary",
        badge: "bg-primary/15 text-primary",
        rail: "bg-primary/35",
      };
    case "upcoming":
      return {
        dot: "bg-spark",
        badge: "bg-spark-muted text-spark",
        rail: "bg-spark/30",
      };
    case "future":
      return {
        dot: "bg-muted-foreground/50",
        badge: "bg-muted text-muted-foreground",
        rail: "bg-border",
      };
  }
}

function RoadmapPhaseBlock({
  phase,
  index,
  isLast,
}: {
  phase: RoadmapPhase;
  index: number;
  isLast: boolean;
}) {
  const accent = phaseAccent(phase.id);

  return (
    <Reveal delayMs={Math.min(index * 60, 180)}>
      <article className="relative grid gap-6 md:grid-cols-[7.5rem_minmax(0,1fr)] md:gap-10">
        {/* Timeline rail */}
        <div className="relative hidden md:block">
          <div
            className={cn(
              "absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full ring-4 ring-background",
              accent.dot,
            )}
            aria-hidden
          />
          {!isLast ? (
            <div
              className={cn(
                "absolute left-1/2 top-6 bottom-[-2.5rem] w-px -translate-x-1/2",
                accent.rail,
              )}
              aria-hidden
            />
          ) : null}
          <p className="pt-10 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {phase.truthLabel}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-border/60 bg-card/70 px-6 py-7 md:px-8 md:py-8">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex md:hidden h-2.5 w-2.5 rounded-full",
                accent.dot,
              )}
              aria-hidden
            />
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-[1.65rem]">
              {phase.title}
            </h2>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                accent.badge,
              )}
            >
              {phase.badge}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:hidden">
              {phase.truthLabel}
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {phase.summary}
          </p>

          <ul className="mt-7 space-y-5">
            {phase.items.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span
                  className={cn(
                    "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    phase.id === "completed"
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {phase.id === "completed" ? (
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </Reveal>
  );
}

/**
 * Public Roadmap — premium vertical timeline for Private Alpha honesty.
 */
export function RoadmapExperience() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_65%)]"
        aria-hidden
      />

      <section
        className="relative scroll-mt-24 px-6 pb-16 pt-24 md:pb-20 md:pt-32"
        aria-labelledby="roadmap-heading"
      >
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="marketing-eyebrow">{ROADMAP_EYEBROW}</p>
              <h1 id="roadmap-heading" className="marketing-h2-xl">
                {ROADMAP_HEADLINE}
              </h1>
              <p className="marketing-lede">{ROADMAP_LEDE}</p>
              <p className="mt-5 text-sm text-muted-foreground">
                Last reviewed: {ROADMAP_LAST_REVIEWED}
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={60}>
            <p className="mx-auto mt-10 max-w-2xl rounded-[1.15rem] border border-border/70 bg-muted/30 px-5 py-4 text-center text-sm leading-relaxed text-muted-foreground md:mt-12">
              Priorities may shift as we learn from design partners. Labels
              describe availability — not delivery dates.{" "}
              <Link
                href={PRIVATE_ALPHA_HREF}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Why Private Alpha?
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section
        className="relative px-6 pb-24 md:pb-32"
        aria-label="Roadmap phases"
      >
        <div className="mx-auto max-w-4xl space-y-10 md:space-y-12">
          {ROADMAP_PHASES.map((phase, index) => (
            <RoadmapPhaseBlock
              key={phase.id}
              phase={phase}
              index={index}
              isLast={index === ROADMAP_PHASES.length - 1}
            />
          ))}
        </div>

        <Reveal delayMs={80}>
          <div className="mx-auto mt-16 max-w-xl text-center md:mt-20">
            <p className="text-base leading-relaxed text-muted-foreground">
              Ready to help shape what comes next?
            </p>
            <div className="mt-6">
              <Link href={APPLY_HREF}>
                <Button
                  size="lg"
                  className="marketing-cta-button h-12 rounded-full px-8"
                >
                  {CTA_APPLY_LABEL}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-10 text-sm text-muted-foreground">
              <Link
                href="/"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                ← Back to home
              </Link>
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
