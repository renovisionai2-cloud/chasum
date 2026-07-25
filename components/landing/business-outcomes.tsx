"use client";

import { Reveal } from "@/components/landing/reveal";

const OUTCOMES = [
  {
    title: "Run the day.",
    body: "Your team works from one connected record—schedules, customers and conversations in the same place.",
  },
  {
    title: "Understand what matters.",
    body: "Payments, activity and reports reflect the same operational truth, so attention goes where it should.",
  },
  {
    title: "Grow with confidence.",
    body: "When the business understands itself, decisions get clearer—and the next step is easier to see.",
  },
] as const;

/**
 * Business outcomes — results, not modules.
 */
export function BusinessOutcomes() {
  return (
    <section
      id="outcomes"
      className="scroll-mt-24 px-6 py-24 md:py-36"
      aria-labelledby="outcomes-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2
            id="outcomes-heading"
            className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl md:text-5xl"
          >
            What changes when your business understands itself?
          </h2>
        </Reveal>

        <ul className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
          {OUTCOMES.map((item, index) => (
            <Reveal key={item.title} delayMs={index * 70}>
              <li className="h-full rounded-2xl border border-border/60 bg-card/50 p-7 md:p-8">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
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
