import { Reveal } from "@/components/landing/reveal";
import { PricingPlatformStory } from "@/components/landing/pricing-platform-story";
import { PlanCards } from "@/components/marketing/plan-cards";
import { Button } from "@/components/ui/button";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_DEMO_LABEL,
  DEMO_HREF,
} from "@/lib/marketing/alpha";
import {
  MARKETING_PLANS,
  PRICING_COMPARISON_SECTIONS,
  PRICING_COMPARE_HEADLINE,
  PRICING_COMPARE_LEDE,
  PRICING_CTA_BODY,
  PRICING_CTA_EYEBROW,
  PRICING_CTA_HEADLINE,
  PRICING_EYEBROW,
  PRICING_FOUNDER_BODY,
  PRICING_FOUNDER_EYEBROW,
  PRICING_FOUNDER_HEADLINE,
  PRICING_HEADLINE,
  PRICING_NOTE,
  PRICING_SUBHEADING,
} from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Minus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-foreground">{value}</span>;
  }
  return value ? (
    <Check className="mx-auto h-4 w-4 text-primary" aria-label="Included" />
  ) : (
    <Minus
      className="mx-auto h-4 w-4 text-muted-foreground/50"
      aria-label="Not included"
    />
  );
}

/**
 * Pricing — clear plans, included capabilities, and next-step CTAs.
 */
export function Pricing() {
  return (
    <>
      <section
        id="pricing"
        className="marketing-section-contain scroll-mt-24 px-6 py-24 md:py-36"
        aria-labelledby="pricing-heading"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="marketing-eyebrow">{PRICING_EYEBROW}</p>
              <h1 id="pricing-heading" className="marketing-h2-xl">
                {PRICING_HEADLINE}
              </h1>
              <p className="marketing-lede">{PRICING_SUBHEADING}</p>
              <p className="mt-4 text-sm text-muted-foreground">{PRICING_NOTE}</p>
            </div>
          </Reveal>

          <Reveal delayMs={80}>
            <div className="mt-16 md:mt-20">
              <PlanCards />
            </div>
          </Reveal>

          <div
            id="one-platform"
            className="mt-28 overflow-visible md:mt-32"
            aria-labelledby="pricing-platform-heading"
          >
            <PricingPlatformStory />
          </div>

          <Reveal delayMs={120}>
            <div className="mt-24 md:mt-28">
              <div className="mx-auto max-w-2xl text-center">
                <p className="marketing-eyebrow">Compare plans</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  {PRICING_COMPARE_HEADLINE}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {PRICING_COMPARE_LEDE}
                </p>
              </div>

              <div className="marketing-elevate mt-10 overflow-x-auto rounded-[1.35rem] border border-border/70 bg-card md:mt-12">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-4 font-medium">Included</th>
                      {MARKETING_PLANS.map((plan) => (
                        <th
                          key={plan.id}
                          className={cn(
                            "px-4 py-4 text-center font-medium",
                            plan.highlighted && "bg-primary/10 text-primary",
                          )}
                        >
                          {plan.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PRICING_COMPARISON_SECTIONS.map((section) => (
                      <FragmentSection key={section.title} title={section.title}>
                        {section.rows.map((row) => (
                          <tr
                            key={row.name}
                            className="border-b border-border/70 last:border-b-0"
                          >
                            <th className="px-4 py-3.5 text-left font-medium text-foreground">
                              {row.name}
                            </th>
                            <td className="px-4 py-3.5 text-center">
                              <Cell value={row.free} />
                            </td>
                            <td className="bg-primary/[0.04] px-4 py-3.5 text-center">
                              <Cell value={row.professional} />
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Cell value={row.business} />
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Cell value={row.enterprise} />
                            </td>
                          </tr>
                        ))}
                      </FragmentSection>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        id="founders-promise"
        className="marketing-surface-tint marketing-hairline-y scroll-mt-24 px-6 py-20 md:py-28"
        aria-labelledby="founders-promise-heading"
      >
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="text-center">
              <p className="marketing-eyebrow">{PRICING_FOUNDER_EYEBROW}</p>
              <h2
                id="founders-promise-heading"
                className="marketing-h2-xl"
              >
                {PRICING_FOUNDER_HEADLINE}
              </h2>
              <p className="marketing-lede mx-auto">{PRICING_FOUNDER_BODY}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        id="pricing-cta"
        className="scroll-mt-24 px-6 py-20 md:py-28"
        aria-labelledby="pricing-cta-heading"
      >
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="marketing-eyebrow">{PRICING_CTA_EYEBROW}</p>
            <h2 id="pricing-cta-heading" className="marketing-h2-xl">
              {PRICING_CTA_HEADLINE}
            </h2>
            <p className="marketing-lede">{PRICING_CTA_BODY}</p>
          </Reveal>

          <Reveal delayMs={80}>
            <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href={APPLY_HREF}>
                <Button size="lg" className="h-12 min-h-11 rounded-full px-8">
                  {CTA_APPLY_LABEL}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={DEMO_HREF}>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 min-h-11 rounded-full px-8"
                >
                  {CTA_DEMO_LABEL}
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function FragmentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <tr className="border-b border-border/80 bg-muted/30">
        <th
          colSpan={5}
          className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          {title}
        </th>
      </tr>
      {children}
    </>
  );
}
