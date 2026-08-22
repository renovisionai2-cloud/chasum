"use client";

import { Reveal } from "@/components/landing/reveal";
import { PricingWorkflow } from "@/components/landing/pricing-workflow";
import { PricingBillingToggle } from "@/components/marketing/pricing-billing-toggle";
import { PricingPlanCards } from "@/components/marketing/pricing-plan-cards";
import { Button } from "@/components/ui/button";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
} from "@/lib/marketing/alpha";
import {
  PRICING_ALPHA_BODY,
  PRICING_ALPHA_CTA,
  PRICING_ALPHA_EYEBROW,
  PRICING_ALPHA_HEADLINE,
  PRICING_ALPHA_HREF,
  PRICING_COMPARE_HEADLINE,
  PRICING_COMPARE_LEDE,
  PRICING_COMPARISON_SECTIONS,
  PRICING_EYEBROW,
  PRICING_FAQ_ITEMS,
  PRICING_FINAL_BODY,
  PRICING_FINAL_HEADLINE,
  PRICING_FINAL_PRIMARY_CTA,
  PRICING_HEADLINE,
  PRICING_NOTE,
  PRICING_PLANS,
  PRICING_SUBHEADING,
  type BillingPeriod,
  type FeatureValue,
} from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Minus } from "lucide-react";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";

function Cell({ value }: { value: FeatureValue }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-foreground">{value}</span>;
  }
  return value ? (
    <Check className="mx-auto h-4 w-4 text-primary" aria-label="Included" />
  ) : (
    <Minus
      className="mx-auto h-4 w-4 text-muted-foreground/45"
      aria-label="Not included"
    />
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

function PricingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section
      id="pricing-faq"
      className="scroll-mt-24 px-6 py-24 md:py-32"
      aria-labelledby="pricing-faq-heading"
    >
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="text-center">
            <p className="marketing-eyebrow">FAQ</p>
            <h2 id="pricing-faq-heading" className="marketing-h2-xl">
              Frequently asked questions
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 space-y-3 md:mt-16">
          {PRICING_FAQ_ITEMS.map((item, index) => {
            const open = openIndex === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;
            return (
              <Reveal key={item.q} delayMs={Math.min(index * 30, 150)}>
                <div
                  className={cn(
                    "rounded-[1.15rem] border bg-card px-5 py-1.5 md:px-6",
                    open ? "border-primary/25" : "border-border/60",
                  )}
                >
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={open}
                      aria-controls={panelId}
                      className="marketing-focus-ring flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left text-base font-semibold tracking-tight text-foreground"
                      onClick={() => setOpenIndex(open ? null : index)}
                    >
                      {item.q}
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-lg leading-none text-muted-foreground"
                        aria-hidden
                      >
                        {open ? "−" : "+"}
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!open}
                  >
                    <p className="max-w-2xl pb-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                      {item.a}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Finalized Pricing page — Private Alpha, Product Truth aligned.
 */
export function Pricing() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <>
      <section
        id="pricing"
        className="scroll-mt-24 px-6 pb-16 pt-24 md:pb-20 md:pt-32"
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

          <Reveal delayMs={60}>
            <div className="mt-10 md:mt-12">
              <PricingBillingToggle value={period} onChange={setPeriod} />
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <div className="mt-12 md:mt-14">
              <PricingPlanCards period={period} />
            </div>
          </Reveal>
        </div>
      </section>

      <PricingWorkflow />

      <section
        id="compare-plans"
        className="scroll-mt-24 px-6 py-24 md:py-32"
        aria-labelledby="compare-plans-heading"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="marketing-eyebrow">Details</p>
              <h2 id="compare-plans-heading" className="marketing-h2-xl">
                {PRICING_COMPARE_HEADLINE}
              </h2>
              <p className="marketing-lede">{PRICING_COMPARE_LEDE}</p>
            </div>
          </Reveal>

          <Reveal delayMs={80}>
            <div className="marketing-elevate mt-12 overflow-x-auto rounded-[1.35rem] border border-border/70 bg-card md:mt-14">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="sticky top-0 z-[1] border-b border-border bg-muted/50 text-xs text-muted-foreground backdrop-blur">
                  <tr>
                    <th scope="col" className="px-4 py-4 font-medium">
                      Feature
                    </th>
                    {PRICING_PLANS.map((plan) => (
                      <th
                        key={plan.id}
                        scope="col"
                        className={cn(
                          "px-4 py-4 text-center font-medium",
                          plan.highlighted && "bg-primary/10 text-primary",
                        )}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PRICING_COMPARISON_SECTIONS.map((section) => (
                    <FragmentSection key={section.title} title={section.title}>
                      {section.rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-border/70 last:border-b-0"
                        >
                          <th
                            scope="row"
                            className="px-4 py-3.5 text-left font-medium text-foreground"
                          >
                            <span>{row.name}</span>
                            {row.note ? (
                              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                                {row.note}
                              </span>
                            ) : null}
                          </th>
                          <td className="px-4 py-3.5 text-center">
                            <Cell value={row.free} />
                          </td>
                          <td className="bg-primary/[0.03] px-4 py-3.5 text-center">
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
          </Reveal>
        </div>
      </section>

      <section
        id="private-alpha"
        className="scroll-mt-24 bg-primary/[0.04] px-6 py-20 md:py-28"
        aria-labelledby="private-alpha-heading"
      >
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="marketing-eyebrow">{PRICING_ALPHA_EYEBROW}</p>
            <h2 id="private-alpha-heading" className="marketing-h2-xl">
              {PRICING_ALPHA_HEADLINE}
            </h2>
            <p className="marketing-lede mx-auto">{PRICING_ALPHA_BODY}</p>
            <div className="mt-10">
              <Link href={PRICING_ALPHA_HREF}>
                <Button size="lg" className="h-12 rounded-full px-8">
                  {PRICING_ALPHA_CTA}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <PricingFaq />

      <section
        id="pricing-cta"
        className="scroll-mt-24 px-6 py-20 md:py-28"
        aria-labelledby="pricing-cta-heading"
      >
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 id="pricing-cta-heading" className="marketing-h2-xl">
              {PRICING_FINAL_HEADLINE}
            </h2>
            <p className="marketing-lede">{PRICING_FINAL_BODY}</p>
          </Reveal>
          <Reveal delayMs={80}>
            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Link href={APPLY_HREF} className="sm:w-auto">
                <Button
                  size="lg"
                  className="h-12 w-full rounded-full px-8 sm:w-auto"
                >
                  {PRICING_FINAL_PRIMARY_CTA}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={APPLY_HREF} className="sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 w-full rounded-full px-8 sm:w-auto"
                >
                  {CTA_APPLY_LABEL}
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
