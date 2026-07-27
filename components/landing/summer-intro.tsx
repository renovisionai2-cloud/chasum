"use client";

import { Reveal } from "@/components/landing/reveal";
import { SummerOrb } from "@/components/marketing/flagship-summer/summer-orb";
import {
  CTA_START_WITH_SUMMER_LABEL,
  MEET_SUMMER_HREF,
} from "@/lib/marketing/alpha";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * Meet the intelligence — curiosity first; explanation on /meet-summer.
 */
export function SummerIntro() {
  return (
    <section
      id="meet-the-intelligence"
      className="scroll-mt-24 px-5 py-20 pb-28 sm:px-6 md:py-28 md:pb-40 lg:px-8"
      aria-labelledby="summer-intro-heading"
    >
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <Reveal>
          <div className="relative flex min-h-[220px] items-center justify-center py-8 lg:min-h-[320px]">
            <div
              className="pointer-events-none absolute inset-[12%] rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-spark/20 blur-3xl"
              aria-hidden
            />
            <SummerOrb size="xl" active cinematic label="Summer" />
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="max-w-xl">
            <p className="marketing-eyebrow">Meet the intelligence</p>
            <h2
              id="summer-intro-heading"
              className="mt-4 text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl md:text-5xl"
            >
              Meet the intelligence behind Chasum.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Summer is the intelligence customers meet first. She helps people
              explore Chasum, understand relevant workflows and begin
              discovering how the platform can support their business.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Early Access · grounded in verified product information
            </p>
            <div className="mt-8">
              <Link href={MEET_SUMMER_HREF} className="group inline-flex">
                <span className="marketing-hero-btn-primary inline-flex h-12 min-h-11 items-center gap-2 rounded-full px-8 text-[15px] font-semibold text-primary-foreground">
                  {CTA_START_WITH_SUMMER_LABEL}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
