"use client";

import { Reveal } from "@/components/landing/reveal";

const LAYERS = [
  "Scheduling.",
  "Customers.",
  "Communication.",
  "Payments.",
  "Reporting.",
  "AI.",
] as const;

/**
 * Platform page intro — one operating system framing.
 */
export function PlatformOverview() {
  return (
    <section
      id="platform"
      className="marketing-section-contain scroll-mt-24 overflow-hidden px-6 py-20 md:py-28"
      aria-labelledby="platform-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="marketing-eyebrow">Platform</p>
          <h1
            id="platform-heading"
            className="text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl md:text-5xl"
          >
            Everything works together.
          </h1>
          <p className="marketing-lede mx-auto mt-5">
            Scheduling, customers, communication, payments, reporting and AI in
            one operating system—explore each department below.
          </p>
        </Reveal>

        <ul className="mt-12 flex flex-col items-center gap-3 md:gap-4">
          {LAYERS.map((layer, index) => (
            <Reveal key={layer} delayMs={Math.min(index * 55, 280)}>
              <li className="text-2xl font-medium tracking-tight text-foreground/90 md:text-3xl">
                {layer}
              </li>
            </Reveal>
          ))}
        </ul>

        <Reveal delayMs={360}>
          <p className="mt-12 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            One operating system.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
