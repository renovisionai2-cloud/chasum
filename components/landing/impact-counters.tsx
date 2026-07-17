"use client";

import { AnimatedNumber } from "@/components/landing/animated-number";
import { Reveal } from "@/components/landing/reveal";
import { IMPACT_STATS } from "@/lib/marketing/homepage";

export function ImpactCounters() {
  return (
    <section
      id="impact"
      className="marketing-v3-dark scroll-mt-24 px-6 py-20 md:py-28"
      aria-labelledby="impact-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">Momentum</p>
            <h2 id="impact-heading" className="marketing-h2-xl">
              Built to scale service businesses
            </h2>
            <p className="marketing-lede">
              Early-platform outcomes that show why operators choose Chasum —
              updated as public metrics grow.
            </p>
          </div>
        </Reveal>

        <dl className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {IMPACT_STATS.map((stat, index) => (
            <Reveal key={stat.label} delayMs={index * 60}>
              <div className="text-center lg:text-left">
                <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
                  {stat.label}
                </dt>
                <dd className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  <AnimatedNumber
                    value={stat.value}
                    suffix={stat.suffix}
                    prefix={"prefix" in stat ? stat.prefix : ""}
                    decimals={"decimals" in stat ? stat.decimals : 0}
                    durationMs={1400}
                  />
                </dd>
                <p className="mt-2 text-sm text-white/50">{stat.hint}</p>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
