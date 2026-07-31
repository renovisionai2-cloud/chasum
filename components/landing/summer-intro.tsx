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
      className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28 lg:px-8"
      aria-labelledby="summer-intro-heading"
    >
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 xl:gap-16">
        <Reveal>
          <div className="relative flex min-h-[200px] items-center justify-center lg:min-h-[300px]">
            <div
              className="pointer-events-none absolute inset-[12%] rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-spark/20 blur-3xl"
              aria-hidden
            />
            <SummerOrb size="xl" active cinematic label="Summer" />
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="mx-auto max-w-xl lg:mx-0">
            <p className="marketing-eyebrow">Your AI Business Manager</p>
            <h2
              id="summer-intro-heading"
              className="mt-4 text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl md:text-5xl"
            >
              Meet Summer, the AI Business Manager behind Chasum.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              She helps businesses discover Chasum, get set up, answer customer
              questions, manage appointments, support staff, automate repetitive
              work, and grow every day.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Early Access · grounded in verified product information
            </p>
            <div className="mt-8 flex justify-center lg:justify-start">
              <Link href={MEET_SUMMER_HREF} className="group inline-flex">
                <span className="marketing-hero-btn-primary inline-flex h-12 min-h-11 items-center gap-2 rounded-full px-8 text-[15px] font-semibold text-primary-foreground">
                  {CTA_START_WITH_SUMMER_LABEL}
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
