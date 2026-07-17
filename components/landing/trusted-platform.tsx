"use client";

import { Reveal } from "@/components/landing/reveal";
import { AnimatedNumber } from "@/components/landing/animated-number";
import { TRUSTED_STATS } from "@/lib/marketing/homepage";

export function TrustedPlatform() {
  return (
    <section
      id="trusted"
      className="scroll-mt-20 border-y border-border bg-muted/25 px-6 py-24 md:py-32"
      aria-labelledby="trusted-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="trusted-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl md:leading-[1.1]"
            >
              A trusted operating platform
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg md:leading-relaxed">
              Built for real multi-tenant operations — not a single booking widget.
            </p>
          </div>
        </Reveal>

        <dl className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-5 lg:gap-6">
          {TRUSTED_STATS.map((stat, index) => (
            <Reveal key={stat.label} delayMs={index * 70}>
              <div className="marketing-card-lift flex h-full flex-col items-center justify-center rounded-[var(--radius-lg)] border border-border/60 bg-card px-5 py-8 text-center md:py-10">
                <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </dd>
                <p className="mt-3 text-sm text-muted-foreground">{stat.hint}</p>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
