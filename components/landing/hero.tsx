"use client";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_START_WITH_SUMMER_LABEL,
  MEET_SUMMER_HREF,
} from "@/lib/marketing/alpha";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * Front Door hero — split composition, ~800ms coordinated entrance.
 * Polish 1: stronger headline rhythm, product depth, CTA spacing.
 */
export function Hero() {
  return (
    <section
      className="fd-hero relative isolate overflow-x-clip px-5 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-14 lg:px-8 lg:pt-16"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 fd-hero-ambient" aria-hidden />

      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 xl:gap-16">
        <div className="fd-hero-copy max-w-xl lg:max-w-none">
          <p className="fd-hero-enter text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            AI Business Operating System
          </p>

          <h1
            id="hero-heading"
            className="fd-hero-enter fd-hero-enter-delay-1 mt-5 text-[2.35rem] font-semibold leading-[1.1] tracking-[-0.045em] text-foreground sm:text-5xl sm:leading-[1.08] md:text-[3.25rem] lg:text-[3.5rem]"
          >
            Your business already works.
            <br />
            <span className="bg-gradient-to-br from-primary via-primary to-spark bg-clip-text text-transparent">
              Now it can
              <br className="hidden sm:block" />
              {" "}
              understand itself.
            </span>
          </h1>

          <div className="fd-hero-enter fd-hero-enter-delay-2 mt-6 max-w-lg space-y-3 text-base leading-relaxed text-muted-foreground md:text-lg">
            <p className="font-medium text-foreground/85">
              Businesses don&apos;t need more software. They need software that
              understands how the business works.
            </p>
            <p>
              Chasum connects scheduling, customers, communication, payments,
              reporting and AI in one intelligent operating system built for
              service businesses.
            </p>
          </div>

          <div className="fd-hero-enter fd-hero-enter-delay-3 mt-8 flex flex-col items-stretch gap-5 sm:flex-row sm:items-center sm:gap-7">
            <Link href={MEET_SUMMER_HREF} className="group">
              <span className="marketing-hero-btn-primary inline-flex h-12 min-h-11 w-full items-center justify-center gap-2 rounded-full px-8 text-[15px] font-semibold text-primary-foreground transition-[transform,box-shadow] duration-300 sm:w-auto">
                {CTA_START_WITH_SUMMER_LABEL}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link
              href={APPLY_HREF}
              className="marketing-focus-ring inline-flex h-12 min-h-11 items-center justify-center gap-1 px-2 text-[15px] font-semibold text-foreground/80 transition-colors hover:text-foreground"
            >
              {CTA_APPLY_LABEL}
              <span aria-hidden className="text-muted-foreground">
                ›
              </span>
            </Link>
          </div>
        </div>

        <div className="fd-hero-enter fd-hero-enter-delay-2 fd-hero-visual relative min-w-0">
          <div
            className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.25rem] bg-gradient-to-br from-primary/22 via-primary/8 to-spark/14 blur-3xl"
            aria-hidden
          />
          <div className="fd-product-frame overflow-hidden rounded-2xl border border-border/55 bg-card/85 backdrop-blur-sm">
            <DashboardPreview
              variant="overview"
              animated
              live
              hero
              className="min-h-[280px] border-0 shadow-none sm:min-h-[340px] lg:min-h-[400px]"
            />
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Illustrative demo data · not a live tenant
          </p>
        </div>
      </div>
    </section>
  );
}
