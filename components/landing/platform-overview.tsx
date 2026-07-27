"use client";

import { Reveal } from "@/components/landing/reveal";
import { PLATFORM_STORY } from "@/lib/marketing/platform-page";

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
          <p className="marketing-eyebrow">{PLATFORM_STORY.eyebrow}</p>
          <h1
            id="platform-heading"
            className="text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl md:text-5xl"
          >
            {PLATFORM_STORY.headline}
          </h1>
          <p className="marketing-lede mx-auto mt-5">{PLATFORM_STORY.lede}</p>
        </Reveal>

        <ul className="mt-12 flex flex-col items-center gap-3 md:gap-4">
          {PLATFORM_STORY.layers.map((layer, index) => (
            <Reveal key={layer} delayMs={Math.min(index * 55, 280)}>
              <li className="text-2xl font-medium tracking-tight text-foreground/90 md:text-3xl">
                {layer}
              </li>
            </Reveal>
          ))}
        </ul>

        <Reveal delayMs={360}>
          <p className="mt-12 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            {PLATFORM_STORY.close}
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            {PLATFORM_STORY.bridgeToShowcase}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
