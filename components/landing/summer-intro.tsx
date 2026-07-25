"use client";

import { Reveal } from "@/components/landing/reveal";
import {
  CTA_START_WITH_SUMMER_LABEL,
  MEET_SUMMER_HREF,
} from "@/lib/marketing/alpha";
import Link from "next/link";

/**
 * Meet the intelligence — curiosity only. Summer explains herself on /meet-summer.
 */
export function SummerIntro() {
  return (
    <section
      id="meet-the-intelligence"
      className="scroll-mt-24 px-6 py-24 md:py-36"
      aria-labelledby="summer-intro-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <h2
            id="summer-intro-heading"
            className="text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl md:text-5xl"
          >
            Meet the intelligence behind Chasum.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Behind every recommendation, every workflow and every future AI
            employee is one intelligence designed to help businesses understand
            what matters next.
          </p>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="mt-10">
            <Link
              href={MEET_SUMMER_HREF}
              className="marketing-focus-ring inline-flex h-12 items-center rounded-full bg-primary px-8 text-[15px] font-semibold text-primary-foreground"
            >
              {CTA_START_WITH_SUMMER_LABEL}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
