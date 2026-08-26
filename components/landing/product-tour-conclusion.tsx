"use client";

import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { PRODUCT_TOUR_CONCLUSION } from "@/lib/marketing/product-tour-page";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * Product Tour close — desire for the OS + Private Alpha / Meet Summer CTAs.
 */
export function ProductTourConclusion() {
  const { primaryCta, secondaryCta } = PRODUCT_TOUR_CONCLUSION;

  return (
    <section
      id="product-tour-conclusion"
      className="marketing-section-contain scroll-mt-24 overflow-hidden px-5 py-16 sm:px-6 md:py-20 lg:px-8"
      aria-labelledby="product-tour-conclusion-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="marketing-eyebrow">{PRODUCT_TOUR_CONCLUSION.eyebrow}</p>
          <h2
            id="product-tour-conclusion-heading"
            className="marketing-h2-xl text-balance"
          >
            {PRODUCT_TOUR_CONCLUSION.headline}
          </h2>
          <p className="marketing-lede mx-auto mt-5">
            {PRODUCT_TOUR_CONCLUSION.body}
          </p>
          <p className="mx-auto mt-6 max-w-xl text-lg font-medium tracking-tight text-foreground md:text-xl">
            {PRODUCT_TOUR_CONCLUSION.desire}
          </p>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-3 sm:flex-row sm:justify-center">
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
          </div>
        </Reveal>
      </div>
    </section>
  );
}
