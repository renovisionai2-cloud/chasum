"use client";

import { AnimatedNumber } from "@/components/landing/animated-number";
import { Reveal } from "@/components/landing/reveal";
import { TRUSTED_STATS } from "@/lib/marketing/homepage";

export function TrustedPlatform() {
  return (
    <section
      id="trusted"
      className="scroll-mt-24 px-6 py-20 md:py-28"
      aria-labelledby="trusted-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <p className="marketing-eyebrow">There must be a better way</p>
              <h2 id="trusted-heading" className="marketing-h2-xl max-w-xl">
                A trusted operating platform
              </h2>
            </div>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground lg:pb-2">
              Built for real multi-tenant operations — not a single booking
              widget. Meet Chasum: one system for the entire business.
            </p>
          </div>
        </Reveal>

        <dl className="mt-14 grid gap-px overflow-hidden rounded-[1.35rem] border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-5">
          {TRUSTED_STATS.map((stat, index) => (
            <Reveal key={stat.label} delayMs={index * 50}>
              <div className="flex h-full flex-col justify-between bg-card px-5 py-8 md:px-6 md:py-10">
                <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="mt-6 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
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
