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
 * Platform — one idea. Everything works together.
 */
export function PlatformOverview() {
  return (
    <section
      id="platform"
      className="marketing-section-contain scroll-mt-24 overflow-hidden px-6 py-24 md:py-36"
      aria-labelledby="platform-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <h2
            id="platform-heading"
            className="text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl md:text-5xl"
          >
            Everything works together.
          </h2>
        </Reveal>

        <ul className="mt-14 flex flex-col items-center gap-3 md:gap-4">
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
