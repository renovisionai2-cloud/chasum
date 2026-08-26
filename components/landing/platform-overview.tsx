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
      className="marketing-section-contain scroll-mt-24 overflow-hidden px-6 pt-20 pb-12 md:pt-28 md:pb-16"
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

        <Reveal delayMs={80}>
          <ul className="mx-auto mt-10 grid max-w-lg grid-cols-2 gap-x-8 gap-y-3 sm:max-w-xl sm:gap-x-14 md:mt-12 md:gap-x-16 md:gap-y-3.5">
            {PLATFORM_STORY.layers.map((layer) => (
              <li
                key={layer}
                className="text-center text-lg font-medium tracking-[-0.03em] text-foreground/88 sm:text-xl md:text-2xl md:leading-snug"
              >
                {layer}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delayMs={140}>
          <p className="mt-10 text-xl font-semibold tracking-tight text-foreground md:mt-12 md:text-2xl">
            {PLATFORM_STORY.close}
          </p>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground md:mt-4 md:text-lg">
            {PLATFORM_STORY.bridgeToShowcase}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
