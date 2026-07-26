"use client";

import { Reveal } from "@/components/landing/reveal";

const OUTCOMES = [
  {
    title: "Run the day.",
    body: "Know what deserves attention before it becomes a problem.",
    accent: "from-primary/15 to-transparent",
  },
  {
    title: "Understand what matters.",
    body: "See connected activity and meaningful patterns instead of disconnected records.",
    accent: "from-emerald-500/15 to-transparent",
  },
  {
    title: "Grow with confidence.",
    body: "Make better-informed decisions using the context of how your business actually operates.",
    accent: "from-violet-500/15 to-transparent",
  },
] as const;

/**
 * Business outcomes — results, not modules.
 */
export function BusinessOutcomes() {
  return (
    <section
      id="outcomes"
      className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28 lg:px-8"
      aria-labelledby="outcomes-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <p
            id="outcomes-heading"
            className="mx-auto max-w-3xl text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
          >
            What changes when your business understands itself?
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
          {OUTCOMES.map((item, index) => (
            <Reveal key={item.title} delayMs={index * 70}>
              <li className="relative h-full overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-7 shadow-sm md:p-8">
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${item.accent}`}
                  aria-hidden
                />
                <h3 className="relative text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                  {item.title}
                </h3>
                <p className="relative mt-4 text-base leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
