"use client";

import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { PLATFORM_CONCLUSION } from "@/lib/marketing/platform-page";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * Platform page close — one lasting operating-system message + clear CTAs.
 */
export function PlatformConclusion() {
  const { primaryCta, secondaryCta, tertiaryCta } = PLATFORM_CONCLUSION;

  return (
    <section
      id="platform-conclusion"
      className="marketing-section-contain scroll-mt-24 overflow-hidden px-5 py-20 sm:px-6 md:py-28 lg:px-8"
      aria-labelledby="platform-conclusion-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="marketing-eyebrow">{PLATFORM_CONCLUSION.eyebrow}</p>
          <h2
            id="platform-conclusion-heading"
            className="marketing-h2-xl text-balance"
          >
            {PLATFORM_CONCLUSION.headline}
          </h2>
          <p className="marketing-lede mx-auto mt-5">
            {PLATFORM_CONCLUSION.body}
          </p>
        </Reveal>

        <Reveal delayMs={70}>
          <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium tracking-tight text-muted-foreground md:text-base">
            {PLATFORM_CONCLUSION.pillars.map((pillar) => (
              <li key={pillar} className="text-foreground/85">
                {pillar}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-3 sm:flex-row sm:justify-center sm:flex-wrap">
            <Link href={primaryCta.href}>
              <Button size="lg" className="h-12 min-h-11 rounded-full px-8">
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={secondaryCta.href}>
              <Button
                variant="outline"
                size="lg"
                className="h-12 min-h-11 rounded-full px-8"
              >
                {secondaryCta.label}
              </Button>
            </Link>
            <Link href={tertiaryCta.href}>
              <Button
                variant="ghost"
                size="lg"
                className="h-12 min-h-11 rounded-full px-8 text-muted-foreground hover:text-foreground"
              >
                {tertiaryCta.label}
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
