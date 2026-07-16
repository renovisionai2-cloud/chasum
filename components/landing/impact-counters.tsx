"use client";

import { AnimatedNumber } from "@/components/landing/animated-number";
import { Reveal } from "@/components/landing/reveal";
import { IMPACT_STATS } from "@/lib/marketing/homepage";

export function ImpactCounters() {
  return (
    <section
      id="impact"
      className="scroll-mt-20 border-y border-border bg-muted/25 px-6 py-20 md:py-28"
      aria-labelledby="impact-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Momentum
            </p>
            <h2
              id="impact-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              Built to scale service businesses
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Early-platform outcomes that show why operators choose Chasum —
              updated as public metrics grow.
            </p>
          </div>
        </Reveal>

        <dl className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {IMPACT_STATS.map((stat, index) => (
            <Reveal key={stat.label} delayMs={index * 70}>
              <div className="marketing-card-lift rounded-[var(--radius-lg)] border border-border/70 bg-card px-5 py-8 text-center">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  <AnimatedNumber
                    value={stat.value}
                    suffix={stat.suffix}
                    prefix={"prefix" in stat ? stat.prefix : ""}
                    decimals={"decimals" in stat ? stat.decimals : 0}
                    durationMs={1400}
                  />
                </dd>
                <p className="mt-2 text-xs text-muted-foreground">{stat.hint}</p>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
